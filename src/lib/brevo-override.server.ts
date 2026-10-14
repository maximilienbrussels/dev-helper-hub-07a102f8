import { brevoEnv } from "./brevo";

/**
 * Tijdelijke Brevo-sleutel (alleen preview/dev).
 *
 * Wanneer `BREVO_API_KEY` nog niet als secret bestaat, kan een beheerder in de
 * dev-banner op /auth een sleutel plakken om live verzending te testen. De
 * waarde blijft uitsluitend in het geheugen van de serverinstantie staan en
 * wordt nooit gelogd of naar de browser teruggestuurd.
 */
let override: string | null = null;

export function setBrevoKeyOverride(key: string | null) {
  override = key && key.trim() ? key.trim() : null;
}

export function getBrevoKeyOverride(): string | undefined {
  return override ?? undefined;
}

/** De sleutel die de mailer moet gebruiken: secret eerst, dan de tijdelijke. */
export function brevoApiKey(): string | undefined {
  return brevoEnv("BREVO_API_KEY") || getBrevoKeyOverride();
}


