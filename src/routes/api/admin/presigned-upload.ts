/**
 * POST /api/admin/presigned-upload
 *
 * Geeft een pre-signed PUT-URL (60 s) voor de Europese Scaleway-bucket. Enkel
 * voor medewerkers met een geldige sessie (JWT) én een beheerrecht (zie UPLOAD_PERMISSIONS).
 * De bytes gaan rechtstreeks van de browser naar Scaleway.
 */
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const bodySchema = z.object({
  fileName: z.string().min(1).max(200),
  fileType: z.enum(["image/png", "image/jpeg", "image/webp", "image/avif"]),
  folder: z.enum(["heroes", "animals", "products", "co-pilot", "media"]),
});

export const Route = createFileRoute("/api/admin/presigned-upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { guardApiRouteAny } = await import("@/lib/route-permission.server");
        const { UPLOAD_PERMISSIONS } = await import("@/lib/permission-core.server");
        const guard = await guardApiRouteAny(request, UPLOAD_PERMISSIONS);
        if ("response" in guard) return guard.response;

        const parsed = bodySchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ error: "Ongeldige aanvraag." }, { status: 400 });

        try {
          const { createUploadUrl } = await import("@/lib/s3.server");
          const { uploadUrl, publicUrl, fileKey, headers } = await createUploadUrl(parsed.data);
          return Response.json({ uploadUrl, publicUrl, fileKey, headers });
        } catch (e) {
          const message = e instanceof Error ? e.message : "Onbekende fout";
          console.error("[presigned-upload]", message);
          return Response.json({ error: message }, { status: 500 });
        }
      },
    },
  },
});
