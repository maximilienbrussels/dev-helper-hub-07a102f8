import { createFileRoute } from "@tanstack/react-router";

/** GET /api/auth/callback/mastodon — wisselt de code in bij de gekozen server. */
export const Route = createFileRoute("/api/auth/callback/mastodon")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const flow = await import("@/lib/social-oauth-flow.server");
        const mod = await import("@/lib/mastodon-oauth.server");
        const { readCookie, cookieHeader, siteOrigin } = await import(
          "@/lib/google-oauth.server"
        );

        const checked = flow.verifyCallback(request, "mastodon");
        if (checked instanceof Response) return checked;

        const cookie = readCookie(request, mod.MASTODON_INSTANCE_COOKIE);
        const instance = mod.normalizeInstance(cookie ? decodeURIComponent(cookie) : null);

        try {
          const profile = await mod.exchangeMastodonCodeOnInstance(
            checked.code,
            instance,
            request,
          );
          const response = checked.link
            ? await flow.completeIdentityLink(request, "mastodon", profile, checked.next)
            : await flow.completeSocialLogin(request, "mastodon", profile, checked.next);
          response.headers.append(
            "Set-Cookie",
            cookieHeader(mod.MASTODON_INSTANCE_COOKIE, "", {
              maxAge: 0,
              secure: siteOrigin(request).startsWith("https://"),
            }),
          );
          return response;
        } catch (error) {
          console.error("[mastodon-oauth] callback mislukt:", instance, error);
          return flow.oauthFailure(request, "mastodon-mislukt");
        }
      },
    },
  },
});
