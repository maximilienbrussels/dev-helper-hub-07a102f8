/**
 * Serverfuncties voor de eigen authenticatie (Postgres + bcrypt + JWT).
 * De browser praat uitsluitend via deze RPC's met de auth-laag.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-middleware";

const emailSchema = z.string().trim().toLowerCase().email().max(254);
const passwordSchema = z.string().min(8, "Kies een wachtwoord van minstens 8 tekens.").max(200);

const safeNext = (value: unknown, fallback = "/account") =>
  typeof value === "string" && value.startsWith("/") ? value : fallback;

/** Aanmelden met e-mailadres en wachtwoord. */
export const loginWithPassword = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z.object({ email: emailSchema, password: z.string().min(1).max(200) }).parse(d),
  )
  .handler(async ({ data }) => {
    const auth = await import("./local-auth.server");
    const guard = await import("./email-guard.server");
    await guard.guardRate("login", data.email).catch(() => undefined);
    // Eerst de storingscheck: zonder databank bestaat er geen enkel account en
    // zou elke poging onterecht "wachtwoord klopt niet" opleveren.
    if (!(await auth.authBackendReady())) {
      throw new Error(
        "Aanmelden is tijdelijk niet beschikbaar (de accountdatabank is onbereikbaar). Probeer het straks opnieuw.",
      );
    }
    const result = await auth.verifyPassword(data.email, data.password);
    if (!result) {
      throw new Error("E-mailadres of wachtwoord klopt niet.");
    }
    return { token: await auth.signSession(result.user), user: result.user };
  });

/** Huidige sessie ophalen op basis van de bewaarde token. */
export const sessionFromToken = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ token: z.string().min(10).max(4000) }).parse(d))
  .handler(async ({ data }) => {
    const auth = await import("./local-auth.server");
    try {
      const claims = await auth.verifySession(data.token);
      const user = await auth.findUserById(String(claims.sub));
      if (user) return { user };
      // Databank onbereikbaar? De claims volstaan om ingelogd te blijven.
      return {
        user: {
          id: String(claims.sub),
          email: String(claims["email"] ?? ""),
          name: (claims["name"] as string | null) ?? null,
          avatarUrl: null,
          emailVerifiedAt: claims["email_verified"] ? new Date().toISOString() : null,
        },
      };
    } catch {
      return { user: null };
    }
  });

/** Inloglink of bevestigingslink omzetten naar een sessie. */
export const redeemAuthToken = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        token: z.string().min(6).max(300),
        kind: z.enum(["magic", "verify"]).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const auth = await import("./local-auth.server");
    const session =
      (await auth.sessionFromMagicToken(data.token, data.kind ?? "magic")) ??
      (await auth.sessionFromMagicToken(data.token, "verify"));
    if (!session) throw new Error("Deze link is verlopen of al gebruikt. Vraag een nieuwe aan.");
    return { token: session.token, user: session.user, next: safeNext(session.redirectTo) };
  });

/** Nieuw wachtwoord instellen met een herstel-token uit de mail. */
export const resetPasswordWithToken = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z.object({ token: z.string().min(6).max(300), password: passwordSchema }).parse(d),
  )
  .handler(async ({ data }) => {
    const auth = await import("./local-auth.server");
    const consumed = await auth.consumeToken(data.token, "reset");
    if (!consumed) {
      throw new Error("Deze herstellink is verlopen of al gebruikt. Vraag een nieuwe aan.");
    }
    const { user } = await auth.createUser({ email: consumed.email, emailVerified: true });
    await auth.setPassword(user.id, data.password);
    const fresh = (await auth.findUserById(user.id)) ?? user;
    return { token: await auth.signSession(fresh), user: fresh };
  });

/** Wachtwoord wijzigen terwijl je ingelogd bent. */
export const changePassword = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) =>
    z
      .object({ currentPassword: z.string().max(200).optional(), password: passwordSchema })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const auth = await import("./local-auth.server");
    const userId = String(context.userId);
    const user = await auth.findUserById(userId);
    if (!user) throw new Error("Je account werd niet gevonden.");
    if (data.currentPassword) {
      const ok = await auth.verifyPassword(user.email, data.currentPassword);
      if (!ok) throw new Error("Je huidige wachtwoord klopt niet.");
    }
    await auth.setPassword(userId, data.password);
    return { ok: true as const };
  });

/** Naam of avatar bijwerken. */
export const updateOwnProfile = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) =>
    z
      .object({
        name: z.string().trim().max(160).optional(),
        avatarUrl: z.string().trim().max(1000).optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    const auth = await import("./local-auth.server");
    await auth.updateProfile(String(context.userId), {
      name: data.name ?? null,
      avatarUrl: data.avatarUrl ?? null,
    });
    const user = await auth.findUserById(String(context.userId));
    return { user };
  });
