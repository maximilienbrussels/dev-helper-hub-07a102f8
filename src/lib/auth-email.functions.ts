import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { emailInput } from "@/lib/validators";
import { requireAuth } from "@/lib/auth-middleware";
import { normalizeMailLang } from "./email-copy";
import { isSuperAdminEmail } from "./superadmin";

const langInput = (d: unknown) => {
  const base = emailInput(d);
  const lang = normalizeMailLang((d as { lang?: unknown } | null)?.lang);
  const nextRaw = (d as { next?: unknown } | null)?.next;
  const next = typeof nextRaw === "string" && nextRaw.startsWith("/") ? nextRaw : "/account";
  return { ...base, lang, next };
};

/** Wachtwoord vergeten (klant): stuurt een herstellink (altijd hetzelfde antwoord). */
export const requestPasswordReset = createServerFn({ method: "POST" })
  .validator(langInput)
  .handler(async ({ data }) => {
    await (await import("./email-guard.server")).guardRate("pwreset", data.email);
    return (await import("./auth-email.server")).sendAuthLink(
      "reset",
      data.email,
      data.naam,
      "/wachtwoord-herstellen",
      data.lang,
    );
  });

/** Bevestigingsmail (opnieuw) versturen na registratie. */
export const requestEmailVerification = createServerFn({ method: "POST" })
  .validator(langInput)
  .handler(async ({ data }) => {
    await (await import("./email-guard.server")).guardRate("verifymail", data.email);
    return (await import("./auth-email.server")).sendAuthLink(
      "verify",
      data.email,
      data.naam,
      "/account",
      data.lang,
    );
  });

/** Inloglink voor klanten (sjabloon 7) — bevestigt tegelijk het e-mailadres. */
export const requestMagicLink = createServerFn({ method: "POST" })
  .validator((d: unknown) => {
    const base = langInput(d);
    const next = (d as { next?: unknown } | null)?.next;
    return { ...base, next: typeof next === "string" && next.startsWith("/") ? next : "/account" };
  })
  .handler(async ({ data }) => {
    await (await import("./email-guard.server")).guardRate("magiclink", data.email);
    return (await import("./auth-email.server")).sendAuthLink(
      "magic",
      data.email,
      data.naam,
      data.next,
      data.lang,
    );
  });

/**
 * Aanmelden met de 6-cijferige code uit de inlogmail. Bij een geldige code
 * geeft de server meteen een sessietoken terug.
 */
export const verifyLoginCode = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        email: z.string().trim().toLowerCase().email().max(254),
        code: z.string().trim().regex(/^\d{6}$/, "Vul de 6-cijferige code in."),
        next: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await (await import("./email-guard.server")).guardRate("logincode", data.email);
    const auth = await import("./local-auth.server");
    const ok = await auth.consumeLoginCode(data.email, data.code);
    if (!ok) throw new Error("Deze code klopt niet of is verlopen.");

    const { user } = await auth.createUser({ email: data.email, emailVerified: true });
    await auth.markEmailVerified(user.id);
    const fresh = (await auth.findUserById(user.id)) ?? user;
    const next = data.next && data.next.startsWith("/") ? data.next : "/account";
    return { ok: true as const, token: await auth.signSession(fresh), user: fresh, next };
  });

/**
 * Wisselt de eenmalige token uit een inloglink of bevestigingsmail in voor een
 * sessietoken (JWT). De browser bewaart die token en is daarmee ingelogd.
 */
export const resolveLoginLink = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({ token: z.string().min(6).max(300), next: z.string().optional() })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const auth = await import("./local-auth.server");
    const session =
      (await auth.sessionFromMagicToken(data.token, "magic")) ??
      (await auth.sessionFromMagicToken(data.token, "verify"));
    if (!session) {
      throw new Error("Deze inloglink is verlopen of al gebruikt. Vraag een nieuwe aan.");
    }
    const fallback = data.next && data.next.startsWith("/") ? data.next : "/account";
    const next = session.redirectTo?.startsWith("/") ? session.redirectTo : fallback;
    return { token: session.token, user: session.user, next };
  });


/** Staat dit adres in het team? Server-only, nooit naar de client. */
async function isStaffEmail(email: string): Promise<boolean> {
  // Eén gedeelde bron: `portal_admins`, de rollenlijst én de vaste eigenaars.
  const { isTeamEmail } = await import("./permission-core.server");
  return isTeamEmail(email);
}

/**
 * Wachtwoord vergeten voor medewerkers (sjabloon 2). Adressen buiten het team
 * krijgen exact hetzelfde antwoord, maar geen mail.
 */
export const requestTeamPasswordReset = createServerFn({ method: "POST" })
  .validator(langInput)
  .handler(async ({ data }) => {
    await (await import("./email-guard.server")).guardRate("team-pwreset", data.email);
    if (!(await isStaffEmail(data.email))) return { ok: true as const };
    return (await import("./auth-email.server")).sendAuthLink(
      "teamReset",
      data.email,
      data.naam,
      "/wachtwoord-herstellen",
      data.lang,
    );
  });

/** Inloglink voor medewerkers (sjabloon 3), uitsluitend voor teamadressen. */
export const requestTeamMagicLink = createServerFn({ method: "POST" })
  .validator(langInput)
  .handler(async ({ data }) => {
    await (await import("./email-guard.server")).guardRate("team-magiclink", data.email);
    if (!(await isStaffEmail(data.email))) return { ok: true as const };
    return (await import("./auth-email.server")).sendAuthLink(
      "teamMagic",
      data.email,
      data.naam,
      await (await import("./auth-email.server")).teamLandingPath(),
      data.lang,
    );
  });

/**
 * Registratie: maakt het account rechtstreeks aan in onze eigen
 * Postgres-tabel (wachtwoord met bcrypt gehasht) en stuurt de
 * bevestigingsmail in de huisstijl. Lukt mailen niet, dan blijft het account
 * bestaan en kan de klant meteen inloggen met zijn wachtwoord.
 */
export const registerAccount = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        email: z.string().trim().toLowerCase().email().max(254),
        password: z.string().min(8).max(200),
        naam: z.string().trim().min(1).max(120).optional(),
        lang: z.enum(["nl", "fr", "en"]).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await (await import("./email-guard.server")).guardRate("register", data.email);
    const auth = await import("./local-auth.server");
    const lang = normalizeMailLang(data.lang);
    const { sendAuthLink } = await import("./auth-email.server");

    // Account aanmaken (bestaand adres krijgt geen foutmelding: dat zou
    // verraden welke e-mailadressen geregistreerd zijn).
    await auth.createUser({ email: data.email, password: data.password, name: data.naam });

    try {
      await sendAuthLink("verify", data.email, data.naam, "/account", lang);
      return { ok: true as const, mode: "verify" as const };
    } catch (error) {
      // De mail vertrok niet (bv. mailkoppeling in onderhoud): het account
      // bestaat wel degelijk, dus melden we dat inloggen meteen kan.
      console.error("[register] bevestigingsmail niet verzonden:", error);
      return { ok: true as const, mode: "password" as const };
    }
  });


const notifyInput = (d: unknown) =>
  z.object({ lang: z.enum(["nl", "fr", "en"]).optional() }).parse(d ?? {});

/** Beveiligingsmelding na een geslaagde wachtwoordwijziging (sjabloon 8). */
export const notifyPasswordChanged = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator(notifyInput)
  .handler(async ({ data, context }) => {
    const claims = context.claims as { email?: string; name?: string } | null;
    const email = (claims?.email ?? "").trim();
    if (!email) return { ok: true as const };
    const { sendSecurityNotice } = await import("./auth-email.server");
    await sendSecurityNotice("passwordChanged", email, claims?.name, normalizeMailLang(data.lang));
    return { ok: true as const };
  });

/**
 * Welkomstmail na de eerste bevestigde aanmelding (sjabloon 5). Wordt maximaal
 * één keer per adres verstuurd, ook als de pagina meermaals geopend wordt.
 */
export const notifyWelcome = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator(notifyInput)
  .handler(async ({ data, context }) => {
    const claims = context.claims as { email?: string; name?: string } | null;
    const email = (claims?.email ?? "").trim();
    if (!email) return { ok: true as const };
    const { checkRateLimit } = await import("./rate-limit.server");
    // Eén welkomstmail per adres (venster van een jaar) — dubbele mails uitgesloten.
    const first = await checkRateLimit("welcome-mail", email.toLowerCase(), 1, 365 * 24 * 3600);
    if (!first) return { ok: true as const };
    const { sendSecurityNotice } = await import("./auth-email.server");
    await sendSecurityNotice("welcome", email, claims?.name, normalizeMailLang(data.lang));
    return { ok: true as const };
  });

/**
 * Inlogcode/-link voor medewerkers met terugkoppeling over de verzending.
 * Lukt mailen niet (geen Brevo-sleutel, API-fout), dan geeft de server in
 * preview/dev de code en link mee zodat het team meteen binnen kan.
 */
export const requestTeamLoginCode = createServerFn({ method: "POST" })
  .validator(langInput)
  .handler(async ({ data }) => {
    await (await import("./email-guard.server")).guardRate("team-magiclink", data.email);
    const server = await import("./auth-email.server");
    const preview = await server.isPreviewEnvironment();
    const hasKey = Boolean((await import("./brevo-override.server")).brevoApiKey());

    if (!(await isStaffEmail(data.email))) {
      // Onbekende adressen krijgen exact hetzelfde antwoord, zonder mail.
      return { ok: true as const, delivered: true, preview: false };
    }

    const res = await server.sendTeamLoginCode(data.email, data.naam, data.lang, data.next);
    // Terugval op het scherm: altijd in preview/dev, én in productie voor de
    // vaste hoofdbeheerder zodat die nooit buitengesloten raakt als mail faalt.
    const allowFallback = (preview || isSuperAdminEmail(data.email)) && !res.delivered;
    return {
      ok: true as const,
      delivered: res.delivered,
      reason: res.reason,
      error: res.error,
      brevoMissing: !hasKey,
      preview,
      canDiagnose: isSuperAdminEmail(data.email),
      devCode: allowFallback ? res.code : undefined,
      devUrl: allowFallback ? res.url : undefined,
    };

  });

/** Tijdelijk een Brevo-sleutel instellen om live verzending te testen (preview/dev). */
export const setBrevoKeyForSession = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ key: z.string().trim().min(10).max(300) }).parse(d))
  .handler(async ({ data }) => {
    const server = await import("./auth-email.server");
    if (!(await server.isPreviewEnvironment())) {
      throw new Error("Dit kan enkel in preview of lokale ontwikkeling.");
    }
    const { setBrevoKeyOverride } = await import("./brevo-override.server");
    setBrevoKeyOverride(data.key);
    return { ok: true as const };
  });
