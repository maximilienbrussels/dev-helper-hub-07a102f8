import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/**
 * PaymentIntent voor een reeds geplaatste webshopbestelling.
 *
 * Het bedrag wordt server-side herberekend uit de bestellijnen in de databank
 * (nooit uit de browser). `automatic_payment_methods` laat Stripe zelf
 * Bancontact, kaart, Apple Pay/Google Pay en iDEAL tonen in het PaymentElement.
 */
const schema = z.object({
  order_id: z.number().int().positive(),
  pay_token: z.string().length(64),
  lang: z.enum(["nl", "fr", "en"]).default("nl"),
});

export const Route = createFileRoute("/api/stripe/create-payment-intent")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { checkRateLimit, clientIdentifier } = await import("@/lib/rate-limit.server");
        const ip = clientIdentifier(request.headers);
        if (!(await checkRateLimit("order-payment-intent", ip, 20, 3600))) {
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

        const { stripeConfigured, stripeServer } = await import("@/lib/stripe.server");
        if (!stripeConfigured()) {
          return Response.json({ error: "stripe_not_configured" }, { status: 503 });
        }

        const { dbAdmin } = await import("@/lib/db-admin.server");
        const { data: order, error } = await dbAdmin
          .from("orders")
          .select(
            "id, order_reference, total_price_cents, customer_email, customer_name, payment_status, payment_method, structured_communication, stripe_payment_intent_id",
          )
          .eq("id", input.order_id)
          .single();
        if (error || !order) return Response.json({ error: "unknown_order" }, { status: 404 });
        if (order.payment_status === "paid" || order.payment_status === "collected") {
          return Response.json({ error: "already_paid" }, { status: 409 });
        }
        if (order.payment_method === "on_pickup" || order.payment_status === "pending_pickup") {
          return Response.json({ error: "pay_on_pickup_order" }, { status: 409 });
        }

        // Totaal server-side hercontroleren: lijnen + verpakkingstoeslag.
        const { data: rows } = await dbAdmin
          .from("order_items")
          .select("quantity, price_at_purchase_cents")
          .eq("order_id", order.id);
        const itemsTotal = (rows ?? []).reduce(
          (sum, l) => sum + l.price_at_purchase_cents * l.quantity,
          0,
        );
        const amount = Math.max(order.total_price_cents, itemsTotal);
        if (amount < 50) return Response.json({ error: "amount_too_low" }, { status: 400 });

        const stripe = stripeServer();
        try {
          // Bestaande intent hergebruiken (klant herlaadt de pagina).
          if (order.stripe_payment_intent_id) {
            const existing = await stripe.paymentIntents.retrieve(order.stripe_payment_intent_id);
            if (
              existing.amount === amount &&
              existing.client_secret &&
              !["succeeded", "canceled"].includes(existing.status)
            ) {
              return Response.json({ clientSecret: existing.client_secret, amountCent: amount });
            }
          }

          const intent = await stripe.paymentIntents.create({
            amount,
            currency: "eur",
            automatic_payment_methods: { enabled: true },
            ...(order.customer_email ? { receipt_email: order.customer_email } : {}),
            description: `Bestelling ${order.order_reference ?? order.id} — La Ferme du parc Maximilien`,
            metadata: {
              order_id: String(order.id),
              order_reference: String(order.order_reference ?? ""),
              customer_email: String(order.customer_email ?? ""),
              communication: String(order.structured_communication ?? ""),
              lang: input.lang,
            },
          });
          await dbAdmin
            .from("orders")
            .update({ stripe_payment_intent_id: intent.id })
            .eq("id", order.id);

          return Response.json({ clientSecret: intent.client_secret, amountCent: amount });
        } catch (err) {
          console.error("[stripe/create-payment-intent]", err);
          return Response.json({ error: "payment_setup_failed" }, { status: 500 });
        }
      },
    },
  },
});
