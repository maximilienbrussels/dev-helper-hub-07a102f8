/**
 * Eén bron van waarheid voor de Neon Auth-basis-URL.
 *
 * De server las vroeger enkel `NEON_AUTH_URL` uit de omgeving. Stond die niet
 * gezet (preview, of enkel de VITE-variant in de browser), dan gaf elke
 * registratie "Neon Auth is niet geconfigureerd." Door dezelfde standaard
 * hier te delen, gebruiken browser én server altijd dezelfde endpoint.
 */
export const DEFAULT_NEON_AUTH_URL =
  "https://ep-empty-lab-b1x7lf0p.neonauth.c-5.eu-central-1.aws.neon.tech/neondb/auth";
