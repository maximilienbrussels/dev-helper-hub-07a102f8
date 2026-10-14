import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/bookings")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { authenticateApiKey } = await import("@/lib/api-keys.server");
        const auth = await authenticateApiKey(request, "read:bookings");
        if (auth instanceof Response) return auth;

        const { db } = await import("@/lib/neon.server");
        const rows = await db()`
          select id, reference, type, status, client_name, client_email, event_date,
                 start_time, end_time, guests_count, checked_in_at
          from public.bookings
          where deleted_at is null
          order by event_date desc
          limit 200
        `;
        return Response.json({ bookings: rows }, { headers: { "cache-control": "no-store" } });
      },
    },
  },
});
