/**
 * GET /api/infomaniak/status
 * Statuscheck van het Infomaniak-token + domeinkoppeling (beheerders).
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/infomaniak/status")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { requireRouteAdmin } = await import("@/lib/route-auth.server");
        const guard = await requireRouteAdmin(request);
        if ("response" in guard) return guard.response;

        const { infomaniakStatus, readSyncState } = await import("@/lib/infomaniak.server");
        const [status, state] = await Promise.all([infomaniakStatus(), readSyncState()]);
        return Response.json({ ...status, scopes: state }, { headers: { "Cache-Control": "no-store" } });
      },
    },
  },
});
