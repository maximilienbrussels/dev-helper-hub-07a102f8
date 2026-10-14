import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { normalizeMailLang } from "./email-copy";

const GEEN_TOEGANG = "Geen toegang. Vraag een beheerder om een uitnodiging.";

const emailSchema = z.string().trim().toLowerCase().email().max(254);

/**
 * Stap 1 van de activatie: controleert of het adres op de whitelist staat en
 * verstuurt dan een 6-cijferige activatiecode. Adressen buiten `portal_admins`
 * worden meteen geweigerd — er bestaat geen publieke registratie.
 */
export const requestActivationCode = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        email: emailSchema,
        lang: z.enum(["nl", "fr", "en"]).optional(),
        next: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await (await import("./email-guard.server")).guardRate("activatie", data.email);
    const { isWhitelistedEmail } = await import("./activation.server");
    if (!(await isWhitelistedEmail(data.email))) throw new Error(GEEN_TOEGANG);

    const server = await import("./auth-email.server");
    const preview = await server.isPreviewEnvironment();
    const next = data.next?.startsWith("/") ? data.next : "/account";
    const res = await server.sendTeamLoginCode(
      data.email,
      undefined,
      normalizeMailLang(data.lang),
      next,
    );
    if (!res.code) throw new Error("Activatiecode aanmaken lukte niet. Probeer later opnieuw.");
    const { isSuperAdminEmail } = await import("./superadmin");
    // Hoofdbeheerder raakt nooit buitengesloten: bij mislukte mail toont het
    // scherm de code, ook in productie.
    const allowFallback = (preview || isSuperAdminEmail(data.email)) && !res.delivered;
    return {
      ok: true as const,
      delivered: res.delivered,
      reason: res.reason,
      error: res.error,
      preview,
      canDiagnose: isSuperAdminEmail(data.email),
      devCode: allowFallback ? res.code : undefined,
    };

  });

/**
 * Stap 2: code controleren, wachtwoord instellen en meteen aanmelden.
 * De whitelistcheck gebeurt hier opnieuw, zodat het endpoint op zichzelf veilig is.
 */
export const activateAccount = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        email: emailSchema,
        code: z.string().trim().regex(/^\d{6}$/, "Vul de 6-cijferige code in."),
        password: z.string().min(8, "Minstens 8 tekens").max(72),
        next: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { isWhitelistedEmail } = await import("./activation.server");
    if (!(await isWhitelistedEmail(data.email))) throw new Error(GEEN_TOEGANG);

    const tokens = await import("./auth-token.server");
    if (!(await tokens.consumeLoginCode(data.email, data.code))) {
      throw new Error("Deze code klopt niet of is verlopen.");
    }

    const admin = await import("./neon-auth-admin.server");
    let userId = await tokens.userIdByEmail(data.email);

    if (!userId) {
      const created = await admin.createUser({ email: data.email, password: data.password });
      if (!created.ok && !/already|exists|registered/i.test(created.error ?? "")) {
        throw new Error(created.error ?? "Account aanmaken mislukt.");
      }
      userId = created.userId ?? (await tokens.userIdByEmail(data.email));
    } else {
      const minted = await tokens.mintResetToken(data.email, 900);
      if (!minted) throw new Error("Wachtwoord instellen lukte niet. Probeer later opnieuw.");
      const res = await admin.resetPasswordWithToken(minted.token, data.password);
      if (!res.ok) throw new Error(res.error ?? "Wachtwoord instellen mislukt.");
    }

    // Automatische promotie van de vaste super-admin (rollen + rechten).
    const { isSuperAdminEmail } = await import("./superadmin");
    if (isSuperAdminEmail(data.email)) {
      const { ensureSuperAdmin } = await import("./superadmin.server");
      await ensureSuperAdmin(data.email, userId);
    }

    // Meteen een sessie: inloglink-token dat de browser afhaalt.
    const { magicVerifyUrl, requestOrigin } = await import("./auth-email.server");
    const magic = await tokens.mintMagicToken(data.email, undefined, 600);
    const origin = await requestOrigin();
    const next = data.next?.startsWith("/") ? data.next : "/account";
    const url = magic
      ? await magicVerifyUrl(magic.token, `${origin}${next}`)
      : null;
    return { ok: true as const, url };
  });
