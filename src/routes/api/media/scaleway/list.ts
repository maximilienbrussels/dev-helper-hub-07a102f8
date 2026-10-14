/**
 * GET /api/media/scaleway/list?prefix=products&token=...
 * Bladert door de mediabucket (mappen + beelden, gepagineerd).
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/media/scaleway/list")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { guardApiRouteAny } = await import("@/lib/route-permission.server");
        const { UPLOAD_PERMISSIONS } = await import("@/lib/permission-core.server");
        const guard = await guardApiRouteAny(request, ["view_media", ...UPLOAD_PERMISSIONS]);
        if ("response" in guard) return guard.response;

        const params = new URL(request.url).searchParams;
        try {
          const { listMedia } = await import("@/lib/scaleway-media.server");
          const listing = await listMedia({
            prefix: params.get("prefix") ?? "",
            token: params.get("token"),
            limit: Number(params.get("limit") ?? 100),
          });
          return Response.json(listing, { headers: { "Cache-Control": "no-store" } });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Onbekende fout";
          console.error("[scaleway] lijst mislukt:", message);
          return Response.json({ error: "Opslag is tijdelijk niet beschikbaar.", code: "storage_error" }, { status: 502 });
        }
      },
    },
  },
});
