/**
 * POST /api/infomaniak/sync
 * Server-side proxy: synchroniseert agenda, contacten en nieuwsbrief met
 * Infomaniak. De browser stuurt nooit zelf naar api.infomaniak.com.
 */
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const bodySchema = z.object({
  scopes: z.array(z.enum(["calendar", "contacts", "newsletter"])).min(1).max(3).optional(),
});

export const Route = createFileRoute("/api/infomaniak/sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { requireRouteAdmin } = await import("@/lib/route-auth.server");
        const guard = await requireRouteAdmin(request);
        if ("response" in guard) return guard.response;

        const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
        if (!parsed.success) {
          return Response.json({ error: "Ongeldige aanvraag.", code: "bad_request" }, { status: 400 });
        }

        const { runInfomaniakSync, infomaniakConfigured, InfomaniakError } = await import(
          "@/lib/infomaniak.server"
        );
        if (!infomaniakConfigured()) {
          return Response.json(
            {
              error: "Infomaniak API-sleutel of product-ID ontbreekt.",
              code: "not_configured",
            },
            { status: 503 },
          );
        }

        try {
          const scopes = parsed.data.scopes ?? ["calendar", "contacts", "newsletter"];
          const results = await runInfomaniakSync(scopes);
          const ok = results.every((r) => r.ok);
          return Response.json({ ok, results }, { status: ok ? 200 : 502 });
        } catch (error) {
          const status = error instanceof InfomaniakError ? error.status : 500;
          const code = error instanceof InfomaniakError ? error.code : "unknown";
          const message = error instanceof Error ? error.message : "Onbekende fout";
          console.error(`[infomaniak] sync mislukt [${code}]: ${message}`);
          return Response.json({ error: message, code }, { status });
        }
      },
    },
  },
});
