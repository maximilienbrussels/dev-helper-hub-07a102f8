/**
 * Gedeelde WebAuthn-hulpjes.
 *
 * Passkeys werken alleen in een veilige context (https of localhost) én in
 * browsers met `PublicKeyCredential`. We controleren dat vooraf, zodat we
 * nooit een knop tonen die tot een harde fout leidt.
 */

/** Ondersteunt dit toestel/deze browser passkeys? Veilig tijdens SSR. */
export function isPasskeySupported(): boolean {
  if (typeof window === "undefined") return false;
  if (!window.isSecureContext) return false;
  return typeof window.PublicKeyCredential !== "undefined";
}

/** Heeft de gebruiker de systeemprompt weggeklikt? Dan tonen we geen fout. */
export function isPasskeyCancelled(error: unknown): boolean {
  const name = error instanceof Error ? error.name : "";
  const message = error instanceof Error ? error.message : "";
  return (
    name === "NotAllowedError" ||
    name === "AbortError" ||
    /notallowederror|cancel|geannuleerd|abort/i.test(message)
  );
}

/**
 * Vertaalt een WebAuthn-fout naar een korte, menselijke zin.
 * Geeft `null` terug wanneer de gebruiker zelf annuleerde: dan hoort er geen
 * foutmelding te verschijnen, enkel de laadtoestand resetten.
 */
export function passkeyErrorMessage(error: unknown): string | null {
  if (isPasskeyCancelled(error)) return null;
  const name = error instanceof Error ? error.name : "";
  if (name === "InvalidStateError") return "Deze passkey bestaat al op dit toestel.";
  if (name === "SecurityError") return "Passkeys werken enkel op een beveiligde verbinding (https).";
  if (error instanceof Error && error.message) return error.message;
  return "Passkey niet beschikbaar op dit toestel.";
}
