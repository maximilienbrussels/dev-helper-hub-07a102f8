import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/bookings/$id/checkin")({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => {
        const { authenticateApiKey } = await import("@/lib/api-keys.server");
        const auth = await authenticateApiKey(request, "write:bookings");
        if (auth instanceof Response) return auth;

        const id = params.id;
        const { db } = await import("@/lib/neon.server");
        const sql = db();
        const rows = await sql`
          update public.bookings set checked_in_at = now(), updated_at = now()
          where id = ${id}::uuid
          returning id, reference, checked_in_at
        `;
        if (rows.length === 0) return Response.json({ error: "Niet gevonden." }, { status: 404 });
        return Response.json({ booking: rows[0] }, { headers: { "cache-control": "no-store" } });
      },
    },
  },
});
