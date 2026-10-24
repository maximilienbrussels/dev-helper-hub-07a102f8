import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/lib/auth-middleware";

export type PortalAccess = {
  allowed: boolean;
  email: string | null;
  role: "admin" | "team" | null;
  /** Rechten uit de rechtenmatrix; leeg bij volledige toegang (dan mag alles). */
  permissions: string[];
  fullAccess: boolean;
  /** Tweede stap nodig: eerst instellen ("setup") of bevestigen ("verify"). */
  mfa: "setup" | "verify" | null;
  /** Waarom er (nog) geen toegang is, voor een duidelijke melding. */
  reason: "ok" | "mfa_setup" | "mfa_verify" | "unverified" | "not_member";
};

/**
 * Toegangscontrole voor élke omgeving: het desktopbeheer (maximilien.site) en
 * de veld-app (maximilien.app) gebruiken exact dezelfde controle, zodat een
 * medewerker nooit op het ene adres binnen kan en op het andere geweigerd wordt.
 *
 * Toegang geldt voor vaste eigenaars, actieve rijen in `portal_admins`, rollen
 * in `user_roles` en iedereen met minstens één recht uit de rechtenmatrix.
 */
export const checkPortalAccess = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<PortalAccess> => {
    // Databank onbereikbaar = storing, nooit "geen rechten".
    const { db, hasDatabase } = await import("@/lib/neon.server");
    if (!hasDatabase()) throw new Error("De toegangscontrole is tijdelijk niet beschikbaar.");
    try {
      await db()`select 1`;
    } catch {
      throw new Error("De toegangscontrole is tijdelijk niet beschikbaar.");
    }
    const { resolveTeamAccess, resolveAccessRaw } = await import("@/lib/permission-core.server");
    const ctx = { userId: context.userId, claims: context.claims };
    const access = await resolveTeamAccess(ctx);
    let reason: PortalAccess["reason"] = "ok";
    if (access.mfa) reason = access.mfa === "verify" ? "mfa_verify" : "mfa_setup";
    else if (!access.allowed) {
      const raw = await resolveAccessRaw(ctx);
      reason = raw.email && !raw.emailVerified ? "unverified" : "not_member";
    }
    return {
      allowed: access.allowed,
      email: access.email,
      role: access.role,
      permissions: access.permissions,
      fullAccess: access.fullAccess,
      mfa: access.mfa,
      reason,
    };
  });
