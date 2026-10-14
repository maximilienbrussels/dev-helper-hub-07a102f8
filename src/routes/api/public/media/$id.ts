/**
 * Publieke uitlevering van mediabestanden: /api/public/media/<uuid>
 * De URL blijft stabiel wanneer een beeld vervangen wordt.
 */
import { createFileRoute } from "@tanstack/react-router";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Row = {
  mime_type: string;
  data_base64: string | null;
  storage_url: string | null;
  updated_at: string | Date;
};

export const Route = createFileRoute("/api/public/media/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const id = String(params.id ?? "");
        if (!UUID.test(id)) return new Response("Not found", { status: 404 });

        const { db } = await import("@/lib/neon.server");
        const rows = (await db()`
          select mime_type, data_base64, storage_url, updated_at from media_assets where id = ${id}
        `) as unknown as Row[];
        const row = rows[0];
        if (!row) return new Response("Not found", { status: 404 });

        // Alle nieuwe bestanden staan in de Scaleway-bucket: stuur door naar de S3-URL.
        if (row.storage_url) {
          return new Response(null, {
            status: 302,
            headers: {
              location: row.storage_url,
              "cache-control": "public, max-age=300, stale-while-revalidate=86400",
            },
          });
        }

        if (!row.data_base64) return new Response("Not found", { status: 404 });

        const binary = atob(row.data_base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

        return new Response(bytes, {
          headers: {
            "content-type": row.mime_type,
            "cache-control": "public, max-age=300, stale-while-revalidate=86400",
            "last-modified": new Date(row.updated_at).toUTCString(),
          },
        });
      },
    },
  },
});
