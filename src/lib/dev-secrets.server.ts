/**
 * Tijdelijke secret-overrides voor preview/dev (server-only, in geheugen).
 *
 * De Dev Tools-modal kan ontbrekende sleutels invullen om live tegen Neon en
 * Brevo te testen. Waarden blijven in het geheugen van de serverinstantie en
 * worden nooit teruggestuurd naar de browser of gelogd.
 */
import { setBrevoKeyOverride } from "./brevo-override.server";

export const DEV_SECRET_KEYS = [
  "DATABASE_URL",
  "DATABASE_URL_POOLED",
  "NEON_API_KEY",
  "BREVO_API_KEY",
  "BREVO_SENDER_EMAIL",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_FROM",
  "INFOMANIAK_AI_API_KEY",
  "INFOMANIAK_PRODUCT_ID",
  "STRIPE_SECRET_KEY",
  "STRIPE_PUBLISHABLE_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "JWT_SECRET",
] as const;

export type DevSecretKey = (typeof DEV_SECRET_KEYS)[number];

const overrides = new Map<DevSecretKey, string>();

export function setDevSecretOverride(key: DevSecretKey, value: string | null) {
  const clean = value?.trim() ?? "";
  if (!clean) {
    overrides.delete(key);
  } else {
    overrides.set(key, clean);
    // Zodat bestaande code die process.env leest de sleutel ook ziet.
    process.env[key] = clean;
  }
  if (key === "BREVO_API_KEY") setBrevoKeyOverride(clean || null);
  if (key === "DATABASE_URL" || key === "DATABASE_URL_POOLED") {
    // De Neon-client cachet de verbinding: opnieuw opbouwen met de nieuwe URL.
    void import("./neon.server").then((m) => m.resetDb());
  }
}

export function devSecret(key: DevSecretKey): string | undefined {
  const fromEnv = process.env[key];
  return (fromEnv && fromEnv.trim()) || overrides.get(key);
}

/** Statusmatrix: enkel of een sleutel aanwezig is en waar hij vandaan komt. */
export function devSecretStatus() {
  return DEV_SECRET_KEYS.map((key) => {
    const env = process.env[key];
    const fromEnv = Boolean(env && env.trim()) && !overrides.has(key);
    return {
      key,
      present: Boolean(devSecret(key)),
      source: fromEnv ? ("secret" as const) : overrides.has(key) ? ("override" as const) : ("missing" as const),
    };
  });
}
