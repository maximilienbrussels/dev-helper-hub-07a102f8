import { createFileRoute } from "@tanstack/react-router";

/**
 * GET /api/auth/bluesky?handle=alice.bsky.social
 *
 * Gedecentraliseerd: we zoeken de eigen server (PDS) van de bezoeker op en
 * sturen hem naar de authorisatieserver daarvan. Geen centrale registratie
 * nodig — onze app identificeert zich met een publiek metadata-document.
 */
export const Route = createFileRoute("/api/auth/bluesky")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const mod = await import("@/lib/bluesky-oauth.server");
        const { buildState, startRedirect, oauthFailure } = await import(
          "@/lib/social-oauth-flow.server"
        );
        const { cookieHeader, siteOrigin } = await import("@/lib/google-oauth.server");

        const params = new URL(request.url).searchParams;
        const handle = params.get("handle") ?? params.get("instance");

        try {
          const state = buildState(request);
          const { authUrl, flow } = await mod.startBlueskyAuth(request, handle, state);
          const response = startRedirect(request, authUrl, state);
          response.headers.append(
            "Set-Cookie",
            cookieHeader(mod.BLUESKY_FLOW_COOKIE, mod.encodeFlow(flow), {
              maxAge: 600,
              secure: siteOrigin(request).startsWith("https://"),
            }),
          );
          return response;
        } catch (error) {
          console.error("[bluesky-oauth] start mislukt:", handle, error);
          return oauthFailure(request, "bluesky-server-onbereikbaar", "bluesky", error);
        }
      },
    },
  },
});
