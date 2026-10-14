/**
 * Omgevingsgebaseerde app-modus.
 *
 * Prioriteit:
 *  1. `VITE_APP_MODE` ("public" | "admin" | "field") — vaste bundel in productie.
 *  2. Hostname: `maximilien.site` → "admin", `maximilien.app` → "field".
 *  3. `?mode=admin` / `?mode=public` / `?mode=field` in de URL (preview/dev).
 *  4. localStorage-override (dev toggle), anders "public".
 *
 * SSR-veilig: op de server tellen alleen env, hostname en query (uit de request),
 * zodat de server-HTML deterministisch blijft.
 */
import { isPortalPath } from "./portal-routes";

export type AppMode = "public" | "admin" | "field";

export const APP_MODE_STORAGE_KEY = "app:mode-override";

/** Hostname van het admin-portaal (wordt ook als suffix herkend: www.maximilien.site). */
export const ADMIN_HOSTNAME = "maximilien.site";

/** Hostname van de veld-app (PWA voor medewerkers op het terrein). */
export const FIELD_HOSTNAME = "maximilien.app";

function normalize(value: string | null | undefined): AppMode | null {
  if (value === "public" || value === "admin" || value === "field") return value;
  return null;
}

/** Modus uit de build-time omgeving (undefined in Lovable preview / lokaal). */
export function getEnvAppMode(): AppMode | null {
  return normalize(import.meta.env["VITE_APP_MODE"] as string | undefined);
}

function matchesHost(hostname: string | null | undefined, base: string): boolean {
  if (!hostname) return false;
  const host = hostname.trim().toLowerCase().replace(/:\d+$/, "");
  return host === base || host.endsWith(`.${base}`);
}

/** True voor maximilien.site en alle subdomeinen ervan. */
export function isAdminHostname(hostname: string | null | undefined): boolean {
  return matchesHost(hostname, ADMIN_HOSTNAME);
}

/** True voor maximilien.app en alle subdomeinen ervan. */
export function isFieldHostname(hostname: string | null | undefined): boolean {
  return matchesHost(hostname, FIELD_HOSTNAME);
}

/**
 * Deterministische detectie op basis van env → hostname → query.
 * Wordt zowel op de server (request-URL) als in de browser gebruikt.
 */
export function detectAppMode(hostname: string | null | undefined, search = ""): AppMode {
  const envMode = getEnvAppMode();
  if (envMode) return envMode;
  if (isFieldHostname(hostname)) return "field";
  if (isAdminHostname(hostname)) return "admin";
  const fromQuery = normalize(new URLSearchParams(search).get("mode"));
  if (fromQuery) return fromQuery;
  return "public";
}

/** Deterministische modus voor SSR zonder request-context en voor de eerste client-render. */
export function getServerAppMode(): AppMode {
  return getEnvAppMode() ?? "public";
}

/**
 * Modus die volgt uit het pad zelf. In preview/dev (geen vaste bundel, geen
 * echt domein) is het pad leidend: /auth en /portaal horen bij beheer, /veld
 * bij de veld-app, al de rest is publiek. Zo blijft een bewaarde override
 * nooit "plakken" op publieke pagina's.
 */
export function modeFromPath(pathname: string): AppMode | null {
  const path = pathname || "/";
  if (isFieldOnlyPath(path)) return "field";
  if (isAdminOnlyPath(path)) return "admin";
  if (isFile(path) || path.startsWith("/api")) return null;
  return "public";
}

/** Volledige resolutie, alleen te gebruiken na hydratie. */
export function resolveAppMode(): AppMode {
  const envMode = getEnvAppMode();
  if (envMode) return envMode;
  if (typeof window === "undefined") return "public";

  if (isFieldHostname(window.location.hostname)) return "field";
  if (isAdminHostname(window.location.hostname)) return "admin";

  const fromQuery = normalize(new URLSearchParams(window.location.search).get("mode"));

  // Aanmeldschermen horen bij élke omgeving: hier beslist de query (of de
  // bewaarde keuze), zodat wie vanuit de veld-app inlogt ook in de veld-app
  // terechtkomt en niet in het beheerportaal.
  if (isSharedAuthPath(window.location.pathname)) {
    if (fromQuery) return fromQuery;
    try {
      const stored = normalize(window.localStorage.getItem(APP_MODE_STORAGE_KEY));
      if (stored) return stored;
    } catch {
      /* geen storage beschikbaar */
    }
    return "admin";
  }

  const fromPath = modeFromPath(window.location.pathname);

  // Het pad wint: een publieke pagina blijft publiek, ook met ?mode=admin
  // of een oude override in de opslag.
  if (fromPath) {
    if (fromPath === "public" && fromQuery && fromQuery !== "public") {
      // neutraal pad in preview: laat de query beslissen
      return fromQuery;
    }
    return fromPath;
  }


  if (fromQuery) return fromQuery;

  try {
    const stored = normalize(window.localStorage.getItem(APP_MODE_STORAGE_KEY));
    if (stored) return stored;
  } catch {
    /* geen storage beschikbaar */
  }

  return "public";
}


/** Auth-flows moeten in élke modus kunnen renderen (mail-links, herstel …). */
const AUTH_PATH_PREFIXES = [
  "/auth",
  "/api",
  "/wachtwoord-herstellen",
  "/wachtwoord-vergeten",
  "/reset-password",
  "/inloglink",
  "/bevestigen",
];

/** True voor gedeelde aanmeldschermen (geen eigen omgeving). */
export function isSharedAuthPath(pathname: string): boolean {
  const path = pathname || "/";
  if (path.startsWith("/api")) return false;
  return AUTH_PATH_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

/**
 * Paden die in admin-modus mogen renderen. Alles daarbuiten (publieke
 * marketingroutes zoals /nl, /fr, /webshop …) wordt naar /auth gestuurd.
 */
const ADMIN_PATH_PREFIXES = [
  ...AUTH_PATH_PREFIXES,
  "/portaal",
  "/vandaag",
  "/aanvragen",
  "/kalender",
  "/diensten",
  "/team",
  "/foutmeldingen",
];

/** Paden van de veld-app (maximilien.app). */
const FIELD_PATH_PREFIXES = [...AUTH_PATH_PREFIXES, "/veld"];

function isFile(path: string): boolean {
  // Bestanden (sitemap.xml, manifest.json, …) laten we met rust.
  return /\.[a-z0-9]+$/i.test(path);
}

export function isAdminPath(pathname: string): boolean {
  const path = pathname || "/";
  if (isFile(path)) return true;
  if (isPortalPath(path)) return true;
  return ADMIN_PATH_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

/** True wanneer het pad tot de veld-app hoort. */
export function isFieldPath(pathname: string): boolean {
  const path = pathname || "/";
  if (isFile(path)) return true;
  return FIELD_PATH_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

/**
 * Paden die uitsluitend bij het beheerportaal horen. Deze mogen nooit op de
 * publieke bezoekerssite of in de veld-app renderen (bezoekers melden zich aan
 * via /login, medewerkers op het terrein via de veld-app).
 */
const ADMIN_ONLY_PREFIXES = [
  "/auth",
  "/admin",
  "/portaal",
  "/vandaag",
  "/aanvragen",
  "/kalender",
  "/diensten",
  "/team",
  "/foutmeldingen",
];

/** Paden die uitsluitend bij de veld-app horen. */
const FIELD_ONLY_PREFIXES = ["/veld", "/field"];

const startsWithAny = (path: string, prefixes: string[]) =>
  prefixes.some((p) => path === p || path.startsWith(`${p}/`));

/** True voor paden van het beheerportaal (inclusief de portaalpagina's per taal). */
export function isAdminOnlyPath(pathname: string): boolean {
  const path = pathname || "/";
  if (isFile(path) || path.startsWith("/api")) return false;
  return isPortalPath(path) || startsWithAny(path, ADMIN_ONLY_PREFIXES);
}

/** True voor paden van de veld-app. */
export function isFieldOnlyPath(pathname: string): boolean {
  const path = pathname || "/";
  if (isFile(path) || path.startsWith("/api")) return false;
  return startsWithAny(path, FIELD_ONLY_PREFIXES);
}


/** Startpad per modus (waar een verdwaalde bezoeker naartoe gaat). */
export function homePathFor(mode: AppMode): string {
  if (mode === "field") return "/veld";
  if (mode === "admin") return "/auth";
  return "/";
}

/** Bestemming na een geslaagde aanmelding. */
export function postLoginPathFor(mode: AppMode): string {
  if (mode === "field") return "/veld";
  if (mode === "admin") return "/nl/vandaag";
  return "/account";
}

/**
 * Pad met `?mode=…` wanneer de modus niet vastligt via omgeving of hostname
 * (Lovable-voorvertoning en lokale dev). Zo blijft de veld-app in beeld
 * wanneer we naar /auth doorsturen; in productie blijft het pad ongewijzigd.
 */
export function pathWithMode(path: string, mode: AppMode): string {
  if (getEnvAppMode() !== null) return path;
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (isAdminHostname(host) || isFieldHostname(host)) return path;
  }
  const [base = "/", hash = ""] = path.split("#");
  const [pathname = "/", query = ""] = base.split("?");
  const params = new URLSearchParams(query);
  params.set("mode", mode);
  return `${pathname}?${params.toString()}${hash ? `#${hash}` : ""}`;
}

/** Zet de dev-override en herlaadt zodat de juiste bundel geladen wordt. */
export function setAppModeOverride(mode: AppMode) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(APP_MODE_STORAGE_KEY, mode);
  } catch {
    /* negeren */
  }
  const url = new URL(window.location.href);
  url.searchParams.set("mode", mode);
  // Publieke paden bestaan niet in admin-/veld-modus: start dan op de juiste plek.
  if (mode === "admin" && !isAdminPath(url.pathname)) url.pathname = "/auth";
  if (mode === "field" && !isFieldPath(url.pathname)) url.pathname = "/veld";
  window.location.replace(url.toString());
}

/** True wanneer de modus niet vastligt in de omgeving of hostname (preview/dev). */
export function isAppModeSwitchable(): boolean {
  if (getEnvAppMode() !== null || !import.meta.env.DEV) return false;
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (isAdminHostname(host) || isFieldHostname(host)) return false;
  }
  return true;
}
