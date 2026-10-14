import { createFileRoute } from "@tanstack/react-router";

/**
 * GET /api/auth/rout — start "Login met ROUT" (OIDC + PKCE S256).
 * `?silent=1` probeert stil aan te melden (prompt=none).
 */
export const Route = createFileRoute("/api/auth/rout")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const rout = await import("@/lib/rout-oidc.server");
        const { oauthFailure } = await import("@/lib/social-oauth-flow.server");
        if (!rout.routConfigured()) return oauthFailure(request, "rout-niet-geconfigureerd");
        const params = new URL(request.url).searchParams;
        const requested = params.get("next") ?? "";
        const next =
          requested.startsWith("/") && !requested.startsWith("//") && !requested.startsWith("/\\")
            ? requested
            : "";
        try {
          return await rout.startAuthorization(request, {
            next,
            link: params.get("link") === "1",
            silent: params.get("silent") === "1",
          });
        } catch (error) {
          return oauthFailure(request, "rout-onbereikbaar", undefined, error);
        }
      },
    },
  },
});
