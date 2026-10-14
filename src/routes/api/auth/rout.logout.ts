import { createFileRoute } from "@tanstack/react-router";

/** GET /api/auth/rout/logout — wist de sessie en meldt ook bij ROUT af (indien ondersteund). */
export const Route = createFileRoute("/api/auth/rout/logout")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { SESSION_COOKIE, cookieHeader, siteOrigin } = await import("@/lib/google-oauth.server");
        const rout = await import("@/lib/rout-oidc.server");
        const origin = siteOrigin(request);
        const secure = origin.startsWith("https://");
        let location = new URL("/", origin).toString();
        try {
          const doc = await rout.discovery();
          if (doc.end_session_endpoint) {
            const u = new URL(doc.end_session_endpoint);
            u.searchParams.set("client_id", rout.ROUT_CLIENT_ID);
            u.searchParams.set("post_logout_redirect_uri", location);
            location = u.toString();
          }
        } catch {
          /* ROUT onbereikbaar: lokaal afmelden volstaat */
        }
        const headers = new Headers({ Location: location, "Cache-Control": "no-store" });
        headers.append("Set-Cookie", cookieHeader(SESSION_COOKIE, "", { maxAge: 0, secure }));
        headers.append("Set-Cookie", cookieHeader(rout.ROUT_COOKIE, "", { maxAge: 0, secure }));
        return new Response(null, { status: 302, headers });
      },
    },
  },
});
