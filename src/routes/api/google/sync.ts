/**
 * POST /api/google/sync — synchroniseert Google Agenda voor de aangemelde
 * gebruiker (met automatische tokenvernieuwing).
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/google/sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { requireRouteAuth } = await import("@/lib/route-auth.server");
        const guard = await requireRouteAuth(request);
        if ("response" in guard) return guard.response;

        const { syncGoogleCalendar, GoogleSyncError } = await import("@/lib/google-sync.server");
        try {
          const result = await syncGoogleCalendar(guard.auth.userId);
          return Response.json(result, { headers: { "Cache-Control": "no-store" } });
        } catch (error) {
          const status = error instanceof GoogleSyncError ? error.status : 500;
          const code = error instanceof GoogleSyncError ? error.code : "unknown";
          const message = error instanceof Error ? error.message : "Onbekende fout";
          console.error(`[google] sync mislukt [${code}]: ${message}`);
          return Response.json({ ok: false, error: message, code }, { status });
        }
      },
    },
  },
});
