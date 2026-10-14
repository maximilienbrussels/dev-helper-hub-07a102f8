/**
 * Echte hard refresh: caches leegmaken, service workers lossen en de pagina
 * opnieuw ophalen met een cache-bypass. Werkt ook wanneer een oude bundle
 * vastzit in de browsercache.
 */
export async function hardReload(): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    /* cache-API niet beschikbaar: gewoon doorgaan */
  }

  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
  } catch {
    /* geen service workers: doorgaan */
  }

  const url = new URL(window.location.href);
  url.searchParams.set("_r", Date.now().toString(36));
  window.location.replace(url.toString());
}

/** Device- en contextgegevens die bij een foutrapport meegestuurd worden. */
export function collectDeviceInfo() {
  if (typeof window === "undefined") {
    return { route: null, user_agent: null, viewport: null, language: null };
  }
  return {
    route: `${window.location.pathname}${window.location.search}`.slice(0, 300),
    user_agent: navigator.userAgent.slice(0, 400),
    viewport: `${window.innerWidth}x${window.innerHeight} @${window.devicePixelRatio}`,
    language: navigator.language,
  };
}
