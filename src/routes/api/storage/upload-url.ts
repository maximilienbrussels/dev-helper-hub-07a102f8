/**
 * POST /api/storage/upload-url
 * Geeft een pre-signed upload-URL (60 s) voor de Europese Scaleway-bucket.
 * Enkel voor medewerkers met een beheerrecht (eigenaars altijd).
 */
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { createUploadUrl } from "@/lib/s3.server";

const bodySchema = z.object({
  fileName: z.string().min(1).max(200),
  fileType: z.string().min(3).max(100),
  folder: z.string().min(1).max(40),
});

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

async function requireUser(request: Request): Promise<Response | null> {
  const { guardApiRouteAny } = await import("@/lib/route-permission.server");
  const { UPLOAD_PERMISSIONS } = await import("@/lib/permission-core.server");
  const guard = await guardApiRouteAny(request, UPLOAD_PERMISSIONS);
  return "response" in guard ? guard.response : null;
}

export const Route = createFileRoute("/api/storage/upload-url")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauthorized = await requireUser(request);
        if (unauthorized) return unauthorized;

        const parsed = bodySchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) {
          return Response.json({ error: "Ongeldige aanvraag." }, { status: 400 });
        }
        if (!ALLOWED.includes(parsed.data.fileType)) {
          return Response.json(
            { error: "Enkel JPG, PNG, WebP, AVIF of GIF worden ondersteund." },
            { status: 400 },
          );
        }
        try {
          return Response.json(await createUploadUrl(parsed.data));
        } catch (e) {
          const message = e instanceof Error ? e.message : "Onbekende fout";
          console.error(`S3 upload-url failed: ${message}`);
          return Response.json({ error: message }, { status: 500 });
        }
      },
    },
  },
});
