import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/**
 * Maakt een Stripe Checkout Session voor een reeds geplaatste webshopbestelling.
 * Het bedrag en de betaalmethode komen uit de database — nooit uit de browser —
 * en er wordt geen enkele toeslag toegevoegd (PSD2).
 */
const schema = z.object({
  order_id: z.number().int().positive(),
  pay_token: z.string().length(64),
  lang: z.enum(["nl", "fr", "en"]).default("nl"),
});

export const Route = createFileRoute("/api/payments/order-session")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { checkRateLimit, clientIdentifier } = await import("@/lib/rate-limit.server");
        const ip = clientIdentifier(request.headers);
        if (!(await checkRateLimit("order-session", ip, 20, 3600))) {
          return Response.json({ error: "rate_limited" }, { status: 429 });
        }

        let input: z.infer<typeof schema>;
        try {
          input = schema.parse(await request.json());
        } catch {
          return Response.json({ error: "invalid_input" }, { status: 400 });
        }
        const { verifyOrderPayToken } = await import("@/lib/order-pay-token.server");
        if (!(await verifyOrderPayToken(input.order_id, input.pay_token))) {
          return Response.json({ error: "unknown_order" }, { status: 404 });
        }

        const { stripeConfigured, createCheckoutSession } = await import("@/lib/stripe.server");
        if (!stripeConfigured()) {
          return Response.json({ error: "stripe_not_configured" }, { status: 503 });
        }

        const { dbAdmin } = await import("@/lib/db-admin.server");
        const { data: order, error } = await dbAdmin
          .from("orders")
          .select(
            "id, total_price_cents, customer_email, payment_method, structured_communication, payment_status",
          )
          .eq("id", input.order_id)
          .single();
        if (error || !order) return Response.json({ error: "unknown_order" }, { status: 404 });
        if (order.payment_status === "paid") {
          return Response.json({ error: "already_paid" }, { status: 409 });
        }

        const { PAYMENT_CHOICES: choices } = await import("@/lib/payment-methods");
        const stored = String(order.payment_method ?? "");
        const methodChoice = (choices as readonly string[]).includes(stored)
          ? (stored as (typeof choices)[number])
          : "card";

        try {
          const session = await createCheckoutSession({
            amount: order.total_price_cents,
            description: `Bestelling ${order.id} — La Ferme du parc Maximilien`,
            customerEmail: order.customer_email,
            locale: input.lang,
            uiMode: "hosted",
            returnPath: "/webshop/bevestiging",
            methodChoice,
            metadata: {
              order_id: String(order.id),
              communication: String(order.structured_communication ?? ""),
            },
          });
          return Response.json({ url: session.url, sessionId: session.sessionId });
        } catch (err) {
          return Response.json(
            { error: err instanceof Error ? err.message : "stripe_error" },
            { status: 500 },
          );
        }
      },
    },
  },
});
