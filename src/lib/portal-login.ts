import type { PortalAccess } from "./portal-access.functions";

export function portalLoginDestination(access: PortalAccess, next: string): string | null {
  if (access.mfa && !access.allowed) {
    return `/beveiliging?next=${encodeURIComponent(next)}`;
  }
  return access.allowed ? next : null;
}

/** Concurrent auth events share one access check, including its failure. */
export function singleFlight<T>(run: () => Promise<T>): () => Promise<T> {
  let pending: Promise<T> | null = null;
  return () => {
    if (!pending) {
      pending = Promise.resolve().then(run).finally(() => { pending = null; });
    }
    return pending;
  };
}

export const LOGIN_REDIRECT_GUARD_KEY = "auth:auto-redirects";
export const LOGIN_REDIRECT_LIMIT = 3;
export const LOGIN_REDIRECT_WINDOW_MS = 20_000;

type GuardStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/**
 * Records one automatic redirect away from the login page. Returns false when
 * the login page bounced too often in a short window, so the page stops
 * redirecting and the form stays usable instead of rebuilding in a loop.
 */
export function allowAutoRedirect(storage: GuardStorage | null, now = Date.now()): boolean {
  if (!storage) return true;
  let stamps: number[] = [];
  try {
    const parsed: unknown = JSON.parse(storage.getItem(LOGIN_REDIRECT_GUARD_KEY) ?? "[]");
    if (Array.isArray(parsed)) stamps = parsed.filter((n): n is number => typeof n === "number");
  } catch {
    stamps = [];
  }
  stamps = stamps.filter((t) => now - t >= 0 && now - t < LOGIN_REDIRECT_WINDOW_MS);
  if (stamps.length >= LOGIN_REDIRECT_LIMIT) return false;
  stamps.push(now);
  try {
    storage.setItem(LOGIN_REDIRECT_GUARD_KEY, JSON.stringify(stamps));
  } catch {
    /* opslag vol of geblokkeerd: niet blokkeren */
  }
  return true;
}

export function resetAutoRedirectGuard(storage: GuardStorage | null): void {
  try {
    storage?.removeItem(LOGIN_REDIRECT_GUARD_KEY);
  } catch {
    /* negeren */
  }
}
