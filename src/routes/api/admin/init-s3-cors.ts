/**
 * POST /api/admin/init-s3-cors
 *
 * Zet in één klik de CORS-regels op de Scaleway-bucket zodat de browser
 * rechtstreeks kan uploaden met een pre-signed URL. Enkel voor beheerders met
 * het recht `manage_settings`.
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/admin/init-s3-cors")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { guardApiRoute } = await import("@/lib/route-permission.server");
        const guard = await guardApiRoute(request, "manage_settings");
        if ("response" in guard) return guard.response;

        try {
          const { applyBucketCors } = await import("@/lib/s3.server");
          const result = await applyBucketCors();
          return Response.json({ ok: true, ...result });
        } catch (e) {
          const message = e instanceof Error ? e.message : "Onbekende fout";
          console.error("[init-s3-cors]", message);
          return Response.json({ error: message }, { status: 500 });
        }
      },
    },
  },
});
