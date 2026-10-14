/**
 * Eén canoniek publiek adres voor de hele site.
 *
 * Certificaten (QR + verificatielink) en e-mails moeten jaren later nog
 * werken, dus die wijzen bewust naar één vast adres in plaats van naar het
 * toevallige domein van het verzoek (preview-URL's verdwijnen). Wisselt de
 * organisatie van domein, dan volstaat één instelling:
 *
 *   VITE_PUBLIC_SITE_URL  (build-time, ook beschikbaar in de browser)
 *   PUBLIC_SITE_URL       (server)
 *
 * Sessiegebonden zaken (inloggen, OAuth-redirects, WebAuthn) blijven wél het
 * domein van het verzoek gebruiken; die zijn kortstondig en moeten meebewegen.
 */

const FALLBACK = "https://maximilien.brussels";

function readEnv(): string | undefined {
  const viteEnv =
    typeof import.meta !== "undefined"
      ? (import.meta as { env?: Record<string, string | undefined> }).env
      : undefined;
  const fromVite = viteEnv?.["VITE_PUBLIC_SITE_URL"];
  if (fromVite) return fromVite;
  if (typeof process !== "undefined") {
    return process.env?.["PUBLIC_SITE_URL"] || process.env?.["SITE_URL"] || undefined;
  }
  return undefined;
}

function normalize(raw: string | undefined): string {
  const base = (raw || "").trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(base)) return FALLBACK;
  try {
    // Valideer: enkel een echt geldige absolute URL wordt aanvaard.
    new URL(base);
    return base;
  } catch {
    return FALLBACK;
  }
}

/** Canoniek publiek adres, zonder slash op het einde. */
export const CANONICAL_SITE_URL = normalize(readEnv());

/** Hostname van het canonieke adres (bv. "maximilien.brussels"). */
export const CANONICAL_SITE_HOST = (() => {
  try {
    return new URL(CANONICAL_SITE_URL).hostname;
  } catch {
    return "maximilien.brussels";
  }
})();

/** True wanneer een absolute URL op het canonieke domein (of subdomein) staat. */
export function isCanonicalHost(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host === CANONICAL_SITE_HOST || host.endsWith(`.${CANONICAL_SITE_HOST}`);
  } catch {
    return false;
  }
}
