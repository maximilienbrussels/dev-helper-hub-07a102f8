import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/animals")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { authenticateApiKey } = await import("@/lib/api-keys.server");
        const auth = await authenticateApiKey(request, "read:animals");
        if (auth instanceof Response) return auth;

        const { db } = await import("@/lib/neon.server");
        const rows = await db()`
          select id, name, species, description, image_url from public.animals order by id
        `;
        return Response.json({ animals: rows }, { headers: { "cache-control": "no-store" } });
      },
    },
  },
});
