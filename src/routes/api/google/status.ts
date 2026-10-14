/**
 * GET /api/google/status — koppelingsstatus van Google voor de beheerder.
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/google/status")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { requireRouteAuth } = await import("@/lib/route-auth.server");
        const guard = await requireRouteAuth(request);
        if ("response" in guard) return guard.response;

        const { googleStatus } = await import("@/lib/google-sync.server");
        const { siteOrigin } = await import("@/lib/google-oauth.server");
        const status = await googleStatus(guard.auth.userId, siteOrigin(request));
        return Response.json(status, { headers: { "Cache-Control": "no-store" } });
      },
    },
  },
});
