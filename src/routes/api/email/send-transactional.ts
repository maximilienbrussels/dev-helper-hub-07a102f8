/**
 * Interne endpoint om een transactionele mail (donatie, ticket, factuur,
 * hoevewinkel) te versturen. Enkel bereikbaar met de interne servertoken —
 * de browser mag nooit zelf een ontvanger of sjabloon kiezen.
 */
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const itemSchema = z.object({
  name: z.string().min(1).max(200),
  quantity: z.number().int().positive().max(999).optional(),
  amountCent: z.number().int().min(0).max(10_000_000).optional(),
});

const bodySchema = z.object({
  to: z.string().email(),
  template: z.enum(["donation", "ticket", "invoice", "shop"]),
  reference: z.string().min(4).max(40),
  lang: z.enum(["nl", "fr", "en"]).default("nl"),
  customerName: z.string().max(200).optional(),
  amountCent: z.number().int().min(0).max(10_000_000),
  vatRate: z.number().min(0).max(25).optional(),
  subjectName: z.string().max(200).optional(),
  eventDate: z.string().max(100).optional(),
  participantName: z.string().max(200).optional(),
  practicalInfo: z.array(z.string().max(300)).max(20).optional(),
  items: z.array(itemSchema).max(100).optional(),
  pickupSlot: z.string().max(120).optional(),
  openingHours: z.array(z.string().max(120)).max(20).optional(),
  qrUrl: z.string().url().optional(),
  paymentId: z.string().uuid().optional(),
  customerAddress: z.string().max(300).optional(),
});

function authorized(request: Request): boolean {
  const secret = process.env["LOVABLE_CRON_SECRET"] || process.env["INTERNAL_API_SECRET"];
  if (!secret) return false;
  const header =
    request.headers.get("x-internal-secret") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    "";
  return header.length > 0 && header === secret;
}

export const Route = createFileRoute("/api/email/send-transactional")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!authorized(request)) {
          return new Response(JSON.stringify({ error: "unauthorized" }), {
            status: 401,
            headers: { "content-type": "application/json" },
          });
        }

        let parsed;
        try {
          parsed = bodySchema.parse(await request.json());
        } catch (error) {
          return new Response(
            JSON.stringify({ error: "invalid_body", detail: String((error as Error).message) }),
            { status: 400, headers: { "content-type": "application/json" } },
          );
        }

        const { sendTransactionalEmail } = await import("@/lib/transactional-email.server");
        const { to, paymentId, customerAddress, ...input } = parsed;
        const result = await sendTransactionalEmail({
          to,
          paymentId: paymentId ?? null,
          ...(customerAddress ? { customerAddress } : {}),
          input,
        });

        return new Response(JSON.stringify(result), {
          status: result.sent ? 200 : 502,
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
