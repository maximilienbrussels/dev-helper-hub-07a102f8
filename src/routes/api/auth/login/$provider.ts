import { createFileRoute } from "@tanstack/react-router";

/**
 * GET /api/auth/login/:provider
 *
 * Eén gedeelde ingang voor alle aanmeldingen. De browser kent enkel dit pad;
 * welke aanbieder-specifieke startroute erachter zit, is een serverdetail.
 * Zo blijft de client losgekoppeld van de OAuth-implementatie.
 */
const PROVIDERS = ["google", "github", "mastodon", "bluesky", "rout"] as const;

export const Route = createFileRoute("/api/auth/login/$provider")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { siteOrigin } = await import("@/lib/google-oauth.server");
        const provider = String(params.provider || "").toLowerCase();
        const url = new URL(request.url);
        const origin = siteOrigin(request);

        if (!(PROVIDERS as readonly string[]).includes(provider)) {
          const { loginErrorUrl } = await import("@/lib/auth-config");
          return new Response(null, {
            status: 302,
            headers: {
              Location: loginErrorUrl(origin, request, "onbekende-aanbieder"),
              "Cache-Control": "no-store",
            },
          });
        }

        // Query (next, link, instance, handle) blijft ongewijzigd doorgaan.
        const target = new URL(`/api/auth/${provider}`, origin);
        target.search = url.search;
        return new Response(null, {
          status: 302,
          headers: { Location: target.toString(), "Cache-Control": "no-store" },
        });
      },
    },
  },
});
