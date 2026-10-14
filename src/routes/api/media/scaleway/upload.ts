/**
 * POST /api/media/scaleway/upload — uploadt een bestand (base64) naar de bucket.
 */
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const MAX_BYTES = 8 * 1024 * 1024;

const schema = z.object({
  folder: z.string().min(1).max(64),
  filename: z.string().min(1).max(256),
  contentType: z.string().regex(/^image\/[a-z0-9.+-]+$/),
  dataBase64: z.string().min(1),
});

export const Route = createFileRoute("/api/media/scaleway/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { guardApiRouteAny } = await import("@/lib/route-permission.server");
        const guard = await guardApiRouteAny(request, ["manage_media"]);
        if ("response" in guard) return guard.response;

        const parsed = schema.safeParse(await request.json().catch(() => ({})));
        if (!parsed.success) {
          return Response.json({ error: "Ongeldige aanvraag.", code: "bad_request" }, { status: 400 });
        }

        const binary = atob(parsed.data.dataBase64);
        if (binary.length > MAX_BYTES) {
          return Response.json(
            { error: "Dit bestand is groter dan 8 MB.", code: "too_large" },
            { status: 413 },
          );
        }
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);

        try {
          const { uploadMediaObject } = await import("@/lib/scaleway-media.server");
          const object = await uploadMediaObject({
            folder: parsed.data.folder,
            fileName: parsed.data.filename,
            contentType: parsed.data.contentType,
            bytes,
          });
          return Response.json({ ok: true, object });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Onbekende fout";
          console.error("[scaleway] upload mislukt:", message);
          return Response.json({ error: message, code: "storage_error" }, { status: 502 });
        }
      },
    },
  },
});
