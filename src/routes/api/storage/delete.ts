/**
 * POST/DELETE /api/storage/delete
 * Verwijdert een object uit de Scaleway-bucket (fileKey of volledige publicUrl).
 */
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { deleteObject, fileKeyFromUrl, s3Config } from "@/lib/s3.server";

const bodySchema = z
  .object({
    fileKey: z.string().min(1).max(300).optional(),
    publicUrl: z.string().url().max(600).optional(),
  })
  .refine((v) => Boolean(v.fileKey || v.publicUrl), {
    message: "fileKey of publicUrl is vereist",
  });

async function handler({ request }: { request: Request }) {
  const { guardApiRouteAny } = await import("@/lib/route-permission.server");
  const { UPLOAD_PERMISSIONS } = await import("@/lib/permission-core.server");
  const guard = await guardApiRouteAny(request, UPLOAD_PERMISSIONS);
  if ("response" in guard) return guard.response;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Ongeldige aanvraag." }, { status: 400 });

  try {
    const cfg = s3Config();
    const key = parsed.data.fileKey ?? fileKeyFromUrl(cfg, parsed.data.publicUrl!);
    if (!key) {
      return Response.json(
        { error: "Deze URL hoort niet bij de mediabucket." },
        { status: 400 },
      );
    }
    await deleteObject(key);
    return Response.json({ success: true, message: "File deleted successfully" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Onbekende fout";
    console.error(`S3 delete failed: ${message}`);
    return Response.json({ error: "Verwijderen mislukt." }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/storage/delete")({
  server: { handlers: { POST: handler, DELETE: handler } },
});
