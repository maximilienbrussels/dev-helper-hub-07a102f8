/**
 * Preview-endpoint dat alle SQL-migraties in `neon/migrations/` uitvoert
 * tegen de live Neon-databank en de superadmin hydrateert.
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/dev/run-migrations")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { isPreviewEnvironment } = await import("@/lib/auth-email.server");
        if (!(await isPreviewEnvironment())) return new Response("Not found", { status: 404 });
        const { requireRouteAdmin } = await import("@/lib/route-auth.server");
        const guard = await requireRouteAdmin(request);
        if ("response" in guard) return guard.response;
        const { runMigrations } = await import("@/lib/dev-migrations.server");
        const report = await runMigrations();
        return new Response(JSON.stringify(report, null, 2), {
          status: report.connection === "SUCCESS" ? 200 : 500,
          headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
        });
      },
    },
  },
});
