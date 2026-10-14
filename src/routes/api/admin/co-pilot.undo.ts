import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/admin/co-pilot/undo")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { guardApiRoute } = await import("@/lib/route-permission.server");
        const guard = await guardApiRoute(request, "manage_settings");
        if ("response" in guard) return guard.response;

        const body = (await request.json().catch(() => null)) as { actionId?: string } | null;
        if (!body?.actionId) return Response.json({ error: "actionId required" }, { status: 400 });

        try {
          const { undoCoPilotAction } = await import("@/lib/co-pilot-tools.server");
          const result = await undoCoPilotAction(body.actionId);
          return Response.json(result);
        } catch (err) {
          return Response.json({ error: err instanceof Error ? err.message : "Onbekende fout" }, { status: 400 });
        }
      },
    },
  },
});
