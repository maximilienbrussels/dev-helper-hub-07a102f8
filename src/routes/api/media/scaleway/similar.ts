/**
 * POST /api/media/scaleway/similar
 * Zoekt gelijkaardige of dubbele beelden in de bucket.
 */
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const schema = z.object({
  key: z.string().max(512).optional(),
  filename: z.string().max(256).optional(),
  size: z.number().int().nonnegative().optional(),
  width: z.number().int().positive().nullable().optional(),
  height: z.number().int().positive().nullable().optional(),
  prefix: z.string().max(128).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export const Route = createFileRoute("/api/media/scaleway/similar")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { guardApiRouteAny } = await import("@/lib/route-permission.server");
        const { UPLOAD_PERMISSIONS } = await import("@/lib/permission-core.server");
        const guard = await guardApiRouteAny(request, ["view_media", ...UPLOAD_PERMISSIONS]);
        if ("response" in guard) return guard.response;

        const parsed = schema.safeParse(await request.json().catch(() => ({})));
        if (!parsed.success || (!parsed.data.key && !parsed.data.filename)) {
          return Response.json({ error: "Ongeldige aanvraag.", code: "bad_request" }, { status: 400 });
        }
        try {
          const { findSimilarMedia } = await import("@/lib/scaleway-media.server");
          const result = await findSimilarMedia(parsed.data);
          return Response.json(result, { headers: { "Cache-Control": "no-store" } });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Onbekende fout";
          console.error("[scaleway] gelijkaardig zoeken mislukt:", message);
          return Response.json({ error: message, code: "storage_error" }, { status: 502 });
        }
      },
    },
  },
});
