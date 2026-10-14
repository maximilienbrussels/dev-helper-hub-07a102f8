/**
 * OAuth-configuratie en diagnose.
 *
 * Eén plek die controleert of de OAuth-omgevingsvariabelen aanwezig zijn en of
 * het host-adres van het binnenkomende verzoek overeenkomt met de redirect-URI's
 * die bij Google/GitHub geregistreerd staan. Bevat nooit secretwaarden: enkel
 * "aanwezig ja/nee" en verwachte paden.
 */
import { DEFAULT_LANG, LANGS, pathFor, type Lang } from "./routes-i18n";

export type OAuthProviderKey = "google" | "github";

export const OAUTH_CALLBACK_PATHS: Record<OAuthProviderKey, string> = {
  google: "/api/auth/callback/google",
  github: "/api/auth/callback/github",
};

const PROVIDER_ENV: Record<OAuthProviderKey, string[]> = {
  google: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
  github: ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"],
};

/** Hosts waarvoor redirect-URI's geregistreerd zijn bij de providers. */
export function canonicalOrigins(): string[] {
  const extra = (process.env["OAUTH_ALLOWED_ORIGINS"] ?? "")
    .split(",")
    .map((v) => v.trim().replace(/\/$/, ""))
    .filter(Boolean);
  const configured = (process.env["SITE_ORIGIN"] ?? "").trim().replace(/\/$/, "");
  return [...new Set([...(configured ? [configured] : []), "https://maximilien.site", ...extra])];
}

export type ProviderStatus = {
  provider: OAuthProviderKey;
  configured: boolean;
  missing: string[];
  callbackPath: string;
  redirectUri: string;
};

export type AuthConfigReport = {
  origin: string;
  hostRegistered: boolean;
  canonicalOrigins: string[];
  providers: ProviderStatus[];
  warnings: string[];
};

function envPresent(name: string): boolean {
  return Boolean(process.env[name]);
}

/** Status per provider (nooit de waarden zelf). */
export function providerStatus(origin: string): ProviderStatus[] {
  return (Object.keys(PROVIDER_ENV) as OAuthProviderKey[]).map((provider) => {
    const missing = PROVIDER_ENV[provider].filter((name) => !envPresent(name));
    return {
      provider,
      configured: missing.length === 0,
      missing,
      callbackPath: OAUTH_CALLBACK_PATHS[provider],
      redirectUri: `${origin}${OAUTH_CALLBACK_PATHS[provider]}`,
    };
  });
}

/** Volledige configuratiecontrole voor het huidige verzoek-origin. */
export function checkAuthConfig(origin: string): AuthConfigReport {
  const normalized = origin.replace(/\/$/, "");
  const allowed = canonicalOrigins();
  const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalized);
  const hostRegistered = isLocal || allowed.includes(normalized);
  const providers = providerStatus(normalized);
  const warnings: string[] = [];

  for (const p of providers) {
    if (!p.configured) {
      warnings.push(`${p.provider}: ontbrekende omgevingsvariabelen ${p.missing.join(", ")}`);
    }
  }
  if (!hostRegistered) {
    warnings.push(
      `host-mismatch: ${normalized} staat niet in de geregistreerde origins (${allowed.join(", ")}). ` +
        `Registreer ${providers.map((p) => p.redirectUri).join(" en ")} bij de providers.`,
    );
  }
  return { origin: normalized, hostRegistered, canonicalOrigins: allowed, providers, warnings };
}

const logged = new Set<string>();

/**
 * Logt configuratiewaarschuwingen server-side, één keer per origin+provider,
 * zodat de logs bij elke inlogpoging niet vollopen.
 */
export function logAuthConfig(origin: string, provider?: OAuthProviderKey): AuthConfigReport {
  const report = checkAuthConfig(origin);
  const key = `${report.origin}|${provider ?? "all"}`;
  if (report.warnings.length && !logged.has(key)) {
    logged.add(key);
    console.warn("[OAuth Config]", { provider: provider ?? "all", warnings: report.warnings });
  }
  return report;
}

/* ------------------------- gebruikersvriendelijke fout ------------------------- */

function isLang(value: string | undefined): value is Lang {
  return !!value && (LANGS as string[]).includes(value);
}

/** Leest de taalvoorkeur uit de cookie `ferme.lang`, anders NL. */
export function langFromRequest(request: Request): Lang {
  const raw = request.headers.get("cookie") ?? "";
  for (const part of raw.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === "ferme.lang") {
      const value = decodeURIComponent(rest.join("=")).toLowerCase();
      if (isLang(value)) return value;
    }
  }
  return DEFAULT_LANG;
}

/** Vertaalde inlog-URL met een nette foutcode voor de toast. */
export function loginErrorUrl(
  origin: string,
  request: Request,
  reason: string,
  provider?: OAuthProviderKey | string,
): string {
  const lang = langFromRequest(request);
  const url = new URL(pathFor("login", lang), origin);
  url.searchParams.set("error", "oauth_failed");
  url.searchParams.set("reason", reason);
  if (provider) url.searchParams.set("provider", String(provider));
  return url.toString();
}
