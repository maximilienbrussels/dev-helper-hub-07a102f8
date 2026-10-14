import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const bodySchema = z.object({
  title: z.string().trim().min(1).max(255),
  body: z.string().trim().max(5000).default(""),
  starts_at: z.string().datetime().optional(),
  ends_at: z.string().datetime().optional(),
});

export const Route = createFileRoute("/api/v1/maxim/announcements")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { authenticateApiKey } = await import("@/lib/api-keys.server");
        const auth = await authenticateApiKey(request, "write:maxim");
        if (auth instanceof Response) return auth;

        const parsed = bodySchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) {
          return Response.json({ error: "Ongeldige aanvraag." }, { status: 400 });
        }
        const { title, body, starts_at, ends_at } = parsed.data;

        const { db } = await import("@/lib/neon.server");
        const rows = await db()`
          insert into public.maxim_announcements (title, body, starts_at, ends_at)
          values (${title}, ${body}, ${starts_at ?? null}, ${ends_at ?? null})
          returning id, title, body, starts_at, ends_at, created_at
        `;
        return Response.json(
          { announcement: rows[0] },
          { status: 201, headers: { "cache-control": "no-store" } },
        );
      },
    },
  },
});
