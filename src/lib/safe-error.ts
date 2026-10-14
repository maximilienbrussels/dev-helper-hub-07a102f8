/**
 * Zet een technische fout om in een nette boodschap voor de medewerker.
 * De ruwe fout blijft in het serverlog staan; de gebruiker ziet nooit SQL,
 * tabelnamen of stack traces.
 */
export function safeError(error: unknown, fallback = "Er ging iets mis. Probeer het opnieuw."): Error {
  const message = error instanceof Error ? error.message : String(error);
  console.error("[portaal]", message);

  // Boodschappen die we zelf schreven mogen wél door.
  if (error instanceof Error && (error as { userSafe?: boolean }).userSafe) return error;
  if (/^(Unauthorized|Je hebt geen rechten)/i.test(message)) {
    return userError("Je hebt geen rechten voor deze actie.");
  }
  if (/duplicate key|unique constraint/i.test(message)) {
    return userError("Dit bestaat al. Kies een andere naam of waarde.");
  }
  if (/foreign key|violates/i.test(message)) {
    return userError("Deze actie kan niet: er hangen nog andere gegevens aan vast.");
  }
  return userError(fallback);
}

/** Maakt een fout die letterlijk aan de gebruiker getoond mag worden. */
export function userError(message: string): Error {
  const error = new Error(message) as Error & { userSafe?: boolean };
  error.userSafe = true;
  return error;
}
