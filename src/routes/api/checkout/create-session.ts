import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/**
 * Stripe Hosted Checkout voor de hoevewinkel.
 *
 * De site toont nooit zelf kaartvelden: de klant gaat naar de betaalpagina van
 * Stripe (Bancontact, Visa, Mastercard, Apple Pay). Bedragen komen uit de
 * database, nooit uit de browser, en er is geen enkele toeslag (PSD2).
 */
const schema = z.object({
  order_id: z.number().int().positive(),
  pay_token: z.string().length(64),
  lang: z.enum(["nl", "fr", "en"]).default("nl"),
});

export const Route = createFileRoute("/api/checkout/create-session")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { checkRateLimit, clientIdentifier } = await import("@/lib/rate-limit.server");
        const ip = clientIdentifier(request.headers);
        if (!(await checkRateLimit("checkout-session", ip, 20, 3600))) {
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
            "id, order_reference, total_price_cents, customer_email, payment_status, structured_communication",
          )
          .eq("id", input.order_id)
          .single();
        if (error || !order) return Response.json({ error: "unknown_order" }, { status: 404 });

        if (order.payment_status === "paid") {
          return Response.json({ error: "already_paid" }, { status: 409 });
        }

        const { data: rows } = await dbAdmin
          .from("order_items")
          .select("quantity, price_at_purchase_cents, product_id")
          .eq("order_id", order.id);
        const lines = rows ?? [];
        const ids = [...new Set(lines.map((l) => l.product_id).filter(Boolean))] as number[];
        const { data: products } = ids.length
          ? await dbAdmin.from("products").select("id, title").in("id", ids)
          : { data: [] as { id: number; title: string }[] };

        const lineItems = lines.map((line) => ({
          quantity: line.quantity,
          price_data: {
            currency: "eur" as const,
            unit_amount: line.price_at_purchase_cents,
            product_data: {
              name: products?.find((p) => p.id === line.product_id)?.title ?? "Hoevewinkelproduct",
            },
          },
        }));
        const itemsTotal = lines.reduce(
          (sum, l) => sum + l.price_at_purchase_cents * l.quantity,
          0,
        );
        const extra = order.total_price_cents - itemsTotal;
        if (extra > 0) {
          lineItems.push({
            quantity: 1,
            price_data: {
              currency: "eur" as const,
              unit_amount: extra,
              product_data: { name: "Verpakking" },
            },
          });
        }
        if (!lineItems.length) return Response.json({ error: "empty_order" }, { status: 400 });

        // Embedded Checkout blijft op onze eigen site: de klant wordt na de
        // betaling teruggestuurd naar de bedanktpagina met de sessie-id.
        const origin = (() => {
          const raw = request.headers.get("origin") ?? request.headers.get("referer");
          try {
            if (raw) return new URL(raw).origin;
          } catch {
            /* val terug op het productiedomein */
          }
          return "https://maximilien.brussels";
        })();
        const returnUrl = `${origin}/webshop/bedankt?session_id={CHECKOUT_SESSION_ID}&ref=${encodeURIComponent(String(order.order_reference ?? ""))}`;

        try {
          const session = await stripeServer().checkout.sessions.create({
            mode: "payment",
            ui_mode: "embedded",
            customer_email: order.customer_email ?? undefined,
            locale: input.lang,
            line_items: lineItems,
            metadata: {
              order_id: String(order.id),
              order_reference: String(order.order_reference ?? ""),
              customer_email: String(order.customer_email ?? ""),
              lang: input.lang,
              communication: String(order.structured_communication ?? ""),
            },
            payment_intent_data: {
              description: `Bestelling ${order.order_reference ?? order.id} — La Ferme du parc Maximilien`,
              metadata: {
                order_id: String(order.id),
                order_reference: String(order.order_reference ?? ""),
              },
              ...(order.customer_email ? { receipt_email: order.customer_email } : {}),
            },
            return_url: returnUrl,
          });
          return Response.json({
            clientSecret: session.client_secret,
            sessionId: session.id,
            orderReference: order.order_reference ?? null,
          });



        } catch (err) {
          console.error("[checkout] sessie aanmaken mislukt", err);
          return Response.json(
            { error: err instanceof Error ? err.message : "stripe_error" },
            { status: 500 },
          );
        }
      },
    },
  },
});
