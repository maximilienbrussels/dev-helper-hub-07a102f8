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
    const { resolveTeamAccess } = await import("@/lib/permission-core.server");
    const access = await resolveTeamAccess({
      userId: context.userId,
      claims: context.claims,
    });
    return {
      allowed: access.allowed,
      email: access.email,
      role: access.role,
      permissions: access.permissions,
      fullAccess: access.fullAccess,
      mfa: access.mfa,
    };
  });
