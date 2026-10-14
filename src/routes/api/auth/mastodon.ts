import { createFileRoute } from "@tanstack/react-router";

/**
 * GET /api/auth/mastodon?instance=fosstodon.org
 *
 * Federatief: de bezoeker geeft zijn eigen Mastodon-server op. Bestaat er nog
 * geen app voor die server, dan registreren we die dynamisch en bewaren we de
 * gegevens. Zonder invoer gebruiken we mastodon.social.
 */
export const Route = createFileRoute("/api/auth/mastodon")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const mod = await import("@/lib/mastodon-oauth.server");
        const { buildState, startRedirect, oauthFailure } = await import(
          "@/lib/social-oauth-flow.server"
        );
        const { cookieHeader, siteOrigin } = await import("@/lib/google-oauth.server");

        const params = new URL(request.url).searchParams;
        const instance = mod.normalizeInstance(
          params.get("instance") ?? params.get("handle") ?? null,
        );
        const redirectUri = mod.mastodonRedirectUri(request);

        try {
          const app = await mod.getOrRegisterApp(instance, redirectUri);
          const state = buildState(request);

          const authUrl = new URL(`${instance}/oauth/authorize`);
          authUrl.searchParams.set("client_id", app.clientId);
          authUrl.searchParams.set("redirect_uri", redirectUri);
          authUrl.searchParams.set("response_type", "code");
          authUrl.searchParams.set("scope", mod.MASTODON_SCOPE);
          authUrl.searchParams.set("state", state);

          const response = startRedirect(request, authUrl, state);
          response.headers.append(
            "Set-Cookie",
            cookieHeader(mod.MASTODON_INSTANCE_COOKIE, encodeURIComponent(instance), {
              maxAge: 600,
              secure: siteOrigin(request).startsWith("https://"),
            }),
          );
          return response;
        } catch (error) {
          console.error("[mastodon-oauth] start mislukt:", instance, error);
          return oauthFailure(request, "mastodon-server-onbereikbaar");
        }
      },
    },
  },
});
