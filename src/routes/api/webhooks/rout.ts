import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const eventSchema = z.object({
  id: z.string().min(1).max(200),
  type: z.string().min(1).max(100),
  created_at: z.string().optional(),
  client_id: z.string().optional(),
  data: z
    .object({ sub: z.string().min(1).max(200), previous_handle: z.string().nullish(), rout_handle: z.string().min(1).max(64) })
    .partial({ previous_handle: true }),
});

/** POST /api/webhooks/rout — ondertekende events van ROUT (bv. user.handle.updated). */
export const Route = createFileRoute("/api/webhooks/rout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { verifyRoutSignature } = await import("@/lib/rout-shared");
        const secret = process.env["ROUT_WEBHOOK_SECRET"];
        if (!secret) return new Response("not configured", { status: 503 });
        const raw = await request.text();
        const check = await verifyRoutSignature(secret, request.headers.get("x-rout-signature"), raw);
        if (!check.ok) return new Response("invalid signature", { status: 401 });

        let event: z.infer<typeof eventSchema>;
        try {
          event = eventSchema.parse(JSON.parse(raw));
        } catch {
          return new Response("bad payload", { status: 400 });
        }
        const { ROUT_CLIENT_ID } = await import("@/lib/rout-oidc.server");
        if (event.client_id && event.client_id !== ROUT_CLIENT_ID) return Response.json({ ignored: true });

        const extras = await import("@/lib/rout-extras.server");
        if (!(await extras.claimWebhookEvent(event.id, event.type))) return Response.json({ duplicate: true });
        if (event.type === "user.handle.updated") {
          await extras.syncRoutHandle(event.data.sub, event.data.rout_handle);
        }
        return Response.json({ ok: true });
      },
    },
  },
});
