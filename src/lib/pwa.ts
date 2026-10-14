/**
 * Registratie van de service worker voor de veld-app (maximilien.app).
 *
 * Bewust één bewaakte plek: nooit registreren in dev, in een iframe of in de
 * Lovable-voorvertoning, zodat je daar nooit een verouderd scherm ziet.
 * `?sw=off` werkt als noodrem en verwijdert een bestaande registratie.
 */
const SW_URL = "/sw.js";

function blockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return (
    host.startsWith("id-preview--") ||
    host.startsWith("preview--") ||
    host === "lovableproject.com" ||
    host.endsWith(".lovableproject.com") ||
    host === "lovableproject-dev.com" ||
    host.endsWith(".lovableproject-dev.com") ||
    host === "beta.lovable.dev" ||
    host.endsWith(".beta.lovable.dev")
  );
}

async function unregisterExisting(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations().catch(() => []);
  await Promise.allSettled(
    registrations
      .filter((r) => (r.active?.scriptURL ?? r.installing?.scriptURL ?? "").endsWith(SW_URL))
      .map((r) => r.unregister()),
  );
}

export async function registerFieldServiceWorker(): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  const refuse =
    !import.meta.env.PROD ||
    window.self !== window.top ||
    blockedHostname(window.location.hostname) ||
    new URLSearchParams(window.location.search).get("sw") === "off";

  if (refuse) {
    await unregisterExisting();
    return;
  }

  try {
    await navigator.serviceWorker.register(SW_URL, { scope: "/veld/" });
  } catch {
    /* offline-ondersteuning is optioneel; nooit de app blokkeren */
  }
}
