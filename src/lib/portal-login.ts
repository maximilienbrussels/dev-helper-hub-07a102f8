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