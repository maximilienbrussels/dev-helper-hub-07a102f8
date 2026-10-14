import { createFileRoute } from "@tanstack/react-router";

/** GET /api/auth/callback/github — wisselt de code in, werkt de gebruiker bij en zet de sessie. */
export const Route = createFileRoute("/api/auth/callback/github")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const flow = await import("@/lib/social-oauth-flow.server");
        const { logAuthConfig } = await import("@/lib/auth-config");
        const { siteOrigin } = await import("@/lib/google-oauth.server");
        logAuthConfig(siteOrigin(request), "github");
        const checked = flow.verifyCallback(request, "github");
        if (checked instanceof Response) return checked;

        try {
          const { exchangeGithubCode } = await import("@/lib/social-oauth.server");
          const profile = await exchangeGithubCode(checked.code, request);
          return checked.link
            ? await flow.completeIdentityLink(request, "github", profile, checked.next)
            : await flow.completeSocialLogin(request, "github", profile, checked.next);
        } catch (error) {
          return flow.oauthFailure(request, "github-mislukt", "github", error);
        }
      },
    },
  },
});
