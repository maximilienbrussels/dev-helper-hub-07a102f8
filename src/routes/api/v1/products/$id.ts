import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const bodySchema = z
  .object({
    title: z.string().trim().min(1).max(255).optional(),
    price_cents: z.number().int().min(0).optional(),
    stock: z.number().int().min(0).optional(),
    active: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "Geen velden om bij te werken." });

export const Route = createFileRoute("/api/v1/products/$id")({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => {
        const { authenticateApiKey } = await import("@/lib/api-keys.server");
        const auth = await authenticateApiKey(request, "write:products");
        if (auth instanceof Response) return auth;

        const id = Number(params.id);
        if (!Number.isInteger(id)) {
          return Response.json({ error: "Ongeldig product-id." }, { status: 400 });
        }
        const parsed = bodySchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) {
          return Response.json({ error: "Ongeldige aanvraag." }, { status: 400 });
        }
        const { title, price_cents, stock, active } = parsed.data;

        const { db } = await import("@/lib/neon.server");
        const sql = db();
        if (title !== undefined) await sql`update public.products set title = ${title} where id = ${id}`;
        if (price_cents !== undefined)
          await sql`update public.products set price_cents = ${price_cents} where id = ${id}`;
        if (stock !== undefined)
          await sql`update public.products set stock_quantity = ${stock} where id = ${id}`;
        if (active !== undefined)
          await sql`update public.products set is_catalog = ${active} where id = ${id}`;

        const rows = await sql`
          select id, title, price_cents, stock_quantity, is_catalog, availability, image_url
          from public.products where id = ${id}
        `;
        if (rows.length === 0) return Response.json({ error: "Niet gevonden." }, { status: 404 });
        return Response.json({ product: rows[0] }, { headers: { "cache-control": "no-store" } });
      },
    },
  },
});
