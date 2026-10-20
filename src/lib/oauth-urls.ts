/** Pure URL rules shared by OAuth handlers and regression tests. */
export const PUBLIC_AUTH_ORIGIN = "https://maximilien.brussels";
export const ROUT_CALLBACK_PATH = "/auth/callback/rout";

export function requestSiteOrigin(request: Request): string {
  const url = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (url.hostname === "localhost" && forwardedHost) {
    try {
      const forwarded = new URL(`https://${forwardedHost}`);
      if (forwarded.host === forwardedHost && !forwarded.username && !forwarded.password)
        return forwarded.origin;
    } catch { /* malformed proxy header: use the request URL */ }
  }
  const protocol = forwardedProto === "https" || forwardedProto === "http"
    ? `${forwardedProto}:` : url.protocol;
  return `${protocol}//${url.host}`;
}

/** The callback must remain on the host that owns the attempt cookie. */
export function routCallbackUrl(origin: string, override?: string): string {
  const expected = new URL(ROUT_CALLBACK_PATH, origin);
  if (!override?.trim()) return expected.toString();
  const configured = new URL(override.trim());
  if (configured.origin !== expected.origin || configured.pathname !== ROUT_CALLBACK_PATH ||
      configured.search || configured.hash || configured.username || configured.password) {
    throw new Error("ROUT_REDIRECT_URI moet overeenkomen met het inlogdomein en /auth/callback/rout.");
  }
  return configured.toString();
}