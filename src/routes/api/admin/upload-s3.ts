import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const bodySchema = z.object({
  fileName: z.string().min(1).max(200),
  fileType: z.enum(["image/png", "image/jpeg", "image/webp"]),
});

export const Route = createFileRoute("/api/admin/upload-s3")({
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
          const result = await createUploadUrl({ ...parsed.data, folder: "co-pilot" });
          return Response.json(result);
        } catch (e) {
          return Response.json({ error: e instanceof Error ? e.message : "Onbekende fout" }, { status: 500 });
        }
      },
    },
  },
});
