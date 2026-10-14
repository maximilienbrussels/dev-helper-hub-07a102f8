import { createFileRoute } from "@tanstack/react-router";

/** GET /api/auth/github — start de GitHub-aanmelding (scope `user:email`). */
export const Route = createFileRoute("/api/auth/github")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { githubCredentials, callbackUrl } = await import("@/lib/social-oauth.server");
        const { buildState, startRedirect, oauthFailure } = await import(
          "@/lib/social-oauth-flow.server"
        );

        const { logAuthConfig } = await import("@/lib/auth-config");
        const { siteOrigin } = await import("@/lib/google-oauth.server");
        logAuthConfig(siteOrigin(request), "github");

        const creds = githubCredentials();
        if (!creds) return oauthFailure(request, "github-niet-geconfigureerd", "github");

        const state = buildState(request);
        const authUrl = new URL("https://github.com/login/oauth/authorize");
        authUrl.searchParams.set("client_id", creds.clientId);
        authUrl.searchParams.set("redirect_uri", callbackUrl(request, "github"));
        authUrl.searchParams.set("scope", "user:email");
        authUrl.searchParams.set("state", state);
        authUrl.searchParams.set("allow_signup", "true");

        return startRedirect(request, authUrl, state);
      },
    },
  },
});
