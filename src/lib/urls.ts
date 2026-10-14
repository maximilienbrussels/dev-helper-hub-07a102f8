/**
 * Cross-domain URL helpers.
 *
 * In productie wijzen publieke en admin-links naar hun eigen domein
 * (maximilien.brussels ↔ maximilien.site). In lokale preview/dev blijven het
 * relatieve paden met `?mode=…`, zodat de client-side router gewoon werkt.
 *
 * De uitkomst hangt alleen af van build-time signalen (env + DEV/PROD), zodat
 * server- en client-HTML identiek zijn.
 */
import { getEnvAppMode, type AppMode } from "./app-mode";

export const PUBLIC_ORIGIN = "https://maximilien.brussels";
export const ADMIN_ORIGIN = "https://maximilien.site";
export const FIELD_ORIGIN = "https://maximilien.app";

function normalizePath(path: string): string {
  if (!path) return "/";
  if (/^https?:\/\//i.test(path)) return path;
  return path.startsWith("/") ? path : `/${path}`;
}

function withModeParam(path: string, mode: AppMode): string {
  const [base, hash = ""] = path.split("#");
  const [pathname, query = ""] = (base ?? "/").split("?");
  const params = new URLSearchParams(query);
  params.set("mode", mode);
  return `${pathname}?${params.toString()}${hash ? `#${hash}` : ""}`;
}

function buildUrl(target: AppMode, path: string): string {
  const normalized = normalizePath(path);
  if (/^https?:\/\//i.test(normalized)) return normalized;

  const envMode = getEnvAppMode();
  if (envMode === target) return normalized; // zelfde bundel → relatief

  // Lokale preview/dev zonder vaste modus: zelfde host, modus via query.
  if (!envMode && import.meta.env.DEV) return withModeParam(normalized, target);

  // Productie (met of zonder VITE_APP_MODE): altijd het juiste domein.
  const origin =
    target === "admin" ? ADMIN_ORIGIN : target === "field" ? FIELD_ORIGIN : PUBLIC_ORIGIN;
  return `${origin}${normalized}`;
}

/** URL naar de publieke bezoekerssite (maximilien.brussels). */
export function getPublicUrl(path = "/"): string {
  return buildUrl("public", path);
}

/** URL naar het admin-portaal (maximilien.site). */
export function getAdminUrl(path = "/"): string {
  return buildUrl("admin", path);
}

/** URL naar de veld-app (maximilien.app). */
export function getFieldUrl(path = "/veld"): string {
  return buildUrl("field", path);
}

/** True wanneer de link het huidige domein verlaat (voor target="_blank" / rel). */
export function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}
