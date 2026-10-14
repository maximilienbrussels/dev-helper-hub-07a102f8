const KEY = "scos:post-login-redirect";

/** Alleen interne, same-origin paden toestaan (geen open redirect). */
export function safeRedirectPath(value: string | null | undefined, fallback = "/account"): string {
  if (!value) return fallback;
  // "//evil.com" en "http://evil.com" blokkeren
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  if (value.startsWith("/login") || value.startsWith("/register")) return fallback;
  return value;
}

/** Huidige pagina (pad + querystring) als redirect-doel. */
export function currentPath(pathname: string, search?: string): string {
  const qs = !search || search === "?" ? "" : search.startsWith("?") ? search : "?" + search;
  return safeRedirectPath(pathname + qs, "/account");
}

export function stashRedirect(path: string) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(KEY, safeRedirectPath(path));
  } catch {
    /* sessionStorage kan geblokkeerd zijn */
  }
}

export function takeRedirect(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.sessionStorage.getItem(KEY);
    if (v) window.sessionStorage.removeItem(KEY);
    return v ? safeRedirectPath(v) : null;
  } catch {
    return null;
  }
}

/** Terugkeerpad lezen zonder het te wissen (voor weergave op de loginpagina). */
export function peekRedirect(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.sessionStorage.getItem(KEY);
    return v ? safeRedirectPath(v) : null;
  } catch {
    return null;
  }
}
