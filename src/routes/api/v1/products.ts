import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/products")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { authenticateApiKey } = await import("@/lib/api-keys.server");
        const auth = await authenticateApiKey(request, "read:products");
        if (auth instanceof Response) return auth;

        const { db } = await import("@/lib/neon.server");
        const rows = await db()`
          select id, title, price_cents, stock_quantity, is_catalog, availability, image_url
          from public.products
          where deleted_at is null
          order by id
        `;
        return Response.json({ products: rows }, { headers: { "cache-control": "no-store" } });
      },
    },
  },
});
