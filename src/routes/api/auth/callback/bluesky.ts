import { createFileRoute } from "@tanstack/react-router";

/** GET /api/auth/callback/bluesky — wisselt de code in bij de eigen server (DPoP). */
export const Route = createFileRoute("/api/auth/callback/bluesky")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const flow = await import("@/lib/social-oauth-flow.server");
        const mod = await import("@/lib/bluesky-oauth.server");
        const { readCookie, cookieHeader, siteOrigin } = await import(
          "@/lib/google-oauth.server"
        );

        const checked = flow.verifyCallback(request, "bluesky");
        if (checked instanceof Response) return checked;

        const stored = mod.decodeFlow(readCookie(request, mod.BLUESKY_FLOW_COOKIE));
        if (!stored) return flow.oauthFailure(request, "bluesky-sessie-verlopen", "bluesky");

        try {
          const profile = await mod.exchangeBlueskyCode(request, checked.code, stored);
          const response = checked.link
            ? await flow.completeIdentityLink(request, "bluesky", profile, checked.next)
            : await flow.completeSocialLogin(request, "bluesky", profile, checked.next);
          response.headers.append(
            "Set-Cookie",
            cookieHeader(mod.BLUESKY_FLOW_COOKIE, "", {
              maxAge: 0,
              secure: siteOrigin(request).startsWith("https://"),
            }),
          );
          return response;
        } catch (error) {
          console.error("[bluesky-oauth] callback mislukt:", error);
          return flow.oauthFailure(request, "bluesky-mislukt", "bluesky", error);
        }
      },
    },
  },
});
