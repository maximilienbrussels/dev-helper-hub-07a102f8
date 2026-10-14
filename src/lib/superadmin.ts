/**
 * Vaste super-admin(s) van het portaal.
 *
 * Deze adressen krijgen altijd volledige toegang, ook wanneer de databaserijen
 * (portal_admins / user_roles / role_permissions) nog ontbreken. Bij de eerste
 * login worden die rijen automatisch aangemaakt (zie superadmin.server.ts).
 */
export const SUPERADMIN_EMAILS = [
  "desk@delplanche.cloud",
  "hallo@maximilien.site",
  "contact@maximilien.brussels",
] as const;

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return SUPERADMIN_EMAILS.some((e) => e === clean);
}
