/**
 * Server-only helpers voor accountactivatie op uitnodiging.
 *
 * Toegang tot het beheerportaal is strikt whitelist-only: enkel adressen die
 * in `portal_admins` staan (of de vaste super-admin) kunnen een account
 * activeren of een wachtwoord instellen. Er is bewust géén publieke
 * registratie.
 */


/** Staat dit adres op de whitelist (team) of is het de super-admin? */
export async function isWhitelistedEmail(email: string): Promise<boolean> {
  const { isTeamEmail } = await import("./permission-core.server");
  return isTeamEmail(email);
}
