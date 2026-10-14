/**
 * Isomorfe modusdetectie voor de root-route (beforeLoad).
 * Server: leest hostname + query uit de inkomende request.
 * Browser: leest window.location.
 */
import { createIsomorphicFn } from "@tanstack/react-start";
import {
  detectAppMode,
  isAdminHostname,
  isFieldHostname,
  resolveAppMode,
  type AppMode,
} from "./app-mode";
import { ADMIN_ORIGIN, FIELD_ORIGIN, PUBLIC_ORIGIN } from "./urls";

export const getRequestAppMode = createIsomorphicFn()
  .server(async (): Promise<AppMode> => {
    try {
      const { getRequest } = await import("@tanstack/react-start/server");
      const req = getRequest();
      const url = new URL(req.url);
      const forwarded = req.headers.get("x-forwarded-host");
      const host = (forwarded ?? req.headers.get("host") ?? url.hostname).split(",")[0]?.trim();
      return detectAppMode(host, url.search);
    } catch {
      return detectAppMode(null);
    }
  })
  // In de browser telt ook de bewaarde dev-override, zodat de gekozen omgeving
  // bij client-navigatie (zonder ?mode= in de URL) behouden blijft.
  .client((): AppMode => resolveAppMode());

/** Hostnaam van het huidige verzoek (server) of venster (browser). */
export const getRequestHost = createIsomorphicFn()
  .server(async (): Promise<string | null> => {
    try {
      const { getRequest } = await import("@tanstack/react-start/server");
      const req = getRequest();
      const url = new URL(req.url);
      const forwarded = req.headers.get("x-forwarded-host");
      return (forwarded ?? req.headers.get("host") ?? url.hostname).split(",")[0]?.trim() ?? null;
    } catch {
      return null;
    }
  })
  .client((): string | null => window.location.hostname);

const PUBLIC_HOSTNAME = "maximilien.brussels";

function isProductionHost(host: string | null): boolean {
  if (!host) return false;
  const clean = host.trim().toLowerCase().replace(/:\d+$/, "");
  return (
    isAdminHostname(clean) ||
    isFieldHostname(clean) ||
    clean === PUBLIC_HOSTNAME ||
    clean.endsWith(`.${PUBLIC_HOSTNAME}`)
  );
}

/**
 * Doeladres voor een pad dat bij een andere omgeving hoort.
 * Op de echte domeinen sturen we naar het juiste domein; in preview/dev blijven
 * we op dezelfde host en schakelen we met `?mode=…`.
 */
export function crossModeHref(target: AppMode, pathname: string, host: string | null): string {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (isProductionHost(host)) {
    const origin =
      target === "admin" ? ADMIN_ORIGIN : target === "field" ? FIELD_ORIGIN : PUBLIC_ORIGIN;
    return `${origin}${path}`;
  }
  return `${path}?mode=${target}`;
}
