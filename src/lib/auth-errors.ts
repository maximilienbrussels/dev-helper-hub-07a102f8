/**
 * Vertaalt technische auth- en mailfouten naar begrijpelijke Nederlandse
 * boodschappen. Nooit ruwe JSON of HTTP-statussen naar de gebruiker.
 */
export function friendlyAuthError(message: string): string {
  const m = (message ?? "").toLowerCase();

  // ── Mailverzending (Brevo) ────────────────────────────────────────────────
  if (
    m.includes("unrecognised ip") ||
    m.includes("unrecognized ip") ||
    m.includes("ip address") ||
    m.includes("brevo 401") ||
    m.includes("brevo 403") ||
    m.includes("unauthorized") ||
    m.includes("mail_unauthorized")
  )
    return "We kunnen momenteel geen e-mail versturen: de mailkoppeling wordt hersteld. Probeer het over enkele minuten opnieuw.";
  if (m.includes("brevo 429") || m.includes("mail_rate_limited"))
    return "Er zijn net te veel mails verstuurd. Probeer het over enkele minuten opnieuw.";
  if (m.includes("brevo") || m.includes("mailverzending") || m.includes("missing_smtp"))
    return "Verzenden van de e-mail lukte niet. Probeer het straks opnieuw of contacteer ons.";

  // ── Neon Auth ─────────────────────────────────────────────────────────────
  if (m.includes("niet geconfigureerd") || m.includes("not configured"))
    return "Aanmelden met wachtwoord is tijdelijk niet beschikbaar. Gebruik de inloglink via e-mail.";
  if (
    m.includes("provider") &&
    (m.includes("not supported") || m.includes("not enabled") || m.includes("disabled"))
  )
    return "Inloggen via die provider is momenteel niet geconfigureerd. Gebruik e-mail of passkey.";
  if (m.includes("invalid login") || m.includes("invalid credentials") || m.includes("invalid_email_or_password"))
    return "E-mailadres of wachtwoord is onjuist.";
  if (m.includes("email not confirmed") || m.includes("not verified"))
    return "Bevestig eerst je e-mailadres — check je mailbox voor de bevestigingslink.";
  if (m.includes("already registered") || m.includes("user already") || m.includes("already exists"))
    return "Dit e-mailadres is al in gebruik. Probeer in te loggen of vraag een inloglink aan.";
  if (m.includes("password") && (m.includes("short") || m.includes("length") || m.includes("8")))
    return "Je wachtwoord moet minstens 8 tekens bevatten.";
  if (m.includes("rate") || m.includes("too many") || m.includes("429"))
    return "Even geduld — te veel pogingen. Probeer opnieuw over enkele minuten.";
  if (m.includes("valid email") || m.includes("invalid email"))
    return "Vul een geldig e-mailadres in.";
  if (m.includes("fetch") || m.includes("network") || m.includes("timeout"))
    return "We konden de aanmeldservice niet bereiken. Controleer je verbinding en probeer opnieuw.";

  // Ruwe JSON of HTTP-ruis nooit tonen.
  if (/^[[{]/.test(message.trim()) || /http\s?\d{3}/i.test(message))
    return "Er ging iets mis bij het aanmelden. Probeer het opnieuw.";
  return message || "Er ging iets mis. Probeer het opnieuw.";
}

/**
 * Vertaalt de technische faalreden van de mailer naar één begrijpelijke zin.
 * Client-veilig: bevat geen sleutels of hostnamen.
 */
export function deliveryReasonMessage(reason?: string | null): string {
  switch (reason) {
    case "no_database":
      return "De accountdatabank is onbereikbaar. Probeer het straks opnieuw.";
    case "missing_brevo_key":
    case "missing_smtp_config":
    case "missing_from_address":
      return "De mailverzending is op dit adres nog niet ingesteld. Verwittig een beheerder.";
    case "mail_unauthorized":
      return "We kunnen momenteel geen e-mail versturen: de mailkoppeling wordt hersteld. Probeer het over enkele minuten opnieuw.";
    case "mail_rate_limited":
      return "Er zijn net te veel mails verstuurd. Probeer het over enkele minuten opnieuw.";
    case "missing_recipient":
      return "Vul een geldig e-mailadres in.";
    default:
      return "Versturen van de e-mail lukte niet. Probeer het straks opnieuw.";
  }
}
