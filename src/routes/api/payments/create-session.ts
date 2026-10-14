import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/**
 * Maakt een Stripe Checkout Session (embedded) voor boekingen, tickets en
 * zaalverhuur. Het bedrag komt uit de serverzijdige productlijst; de browser
 * stuurt enkel de productcode mee.
 */
const schema = z.object({
  product: z.string().min(2).max(60),
  naam: z.string().min(2).max(120),
  email: z.string().email().max(160),
  telefoon: z.string().max(40).optional(),
  datum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  personen: z.number().int().min(1).max(200),
  opmerking: z.string().max(2000).optional(),
  lang: z.enum(["nl", "fr", "en"]).default("nl"),
  uiMode: z.enum(["embedded", "hosted"]).default("embedded"),
});

/** Vrije gift: het bedrag komt van de bezoeker, binnen veilige grenzen. */
const donationSchema = z.object({
  product: z.literal("gift"),
  naam: z.string().min(2).max(120),
  email: z.string().email().max(160),
  amountCent: z.number().int().min(100).max(500000),
  lang: z.enum(["nl", "fr", "en"]).default("nl"),
  uiMode: z.enum(["embedded", "hosted"]).default("embedded"),
});

const DONATION_LABEL = { nl: "Gift", fr: "Don", en: "Donation" } as const;


export const Route = createFileRoute("/api/payments/create-session")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { checkRateLimit, clientIdentifier } = await import("@/lib/rate-limit.server");
        const ip = clientIdentifier(request.headers);
        if (!(await checkRateLimit("checkout-session", ip, 12, 3600))) {
          return Response.json({ error: "rate_limited" }, { status: 429 });
        }

        const body: unknown = await request.json().catch(() => null);

        const { stripeConfigured, createCheckoutSession } = await import("@/lib/stripe.server");
        if (!stripeConfigured()) {
          return Response.json({ error: "stripe_not_configured" }, { status: 503 });
        }

        // Vrije gift: geen boeking, enkel een betaling met een eigen bedrag.
        const gift = donationSchema.safeParse(body);
        if (gift.success) {
          const g = gift.data;
          try {
            const { createPendingPayment } = await import("@/lib/payments.server");
            const label = DONATION_LABEL[g.lang];
            const payment = await createPendingPayment({
              kind: "donation",
              amountCent: g.amountCent,
              customerEmail: g.email,
              customerName: g.naam,
              lang: g.lang,
              vatRate: 0,
              description: label,
              metadata: { product: "gift" },
            });
            const session = await createCheckoutSession({
              amount: g.amountCent,
              description: `${label} — ${payment.reference}`,
              customerEmail: g.email,
              locale: g.lang,
              uiMode: g.uiMode,
              metadata: {
                payment_id: payment.id,
                reference: payment.reference,
                ticket_type: "donation",
                product: "gift",
                customer_email: g.email,
                customer_name: g.naam,
                lang: g.lang,
              },
            });
            return Response.json({
              clientSecret: session.clientSecret,
              sessionId: session.sessionId,
              url: session.url,
              reference: payment.reference,
              amountCent: g.amountCent,
              label,
            });
          } catch (err) {
            console.error("[create-session:gift]", err);
            return Response.json({ error: "payment_setup_failed" }, { status: 500 });
          }
        }

        let input: z.infer<typeof schema>;
        try {
          input = schema.parse(body);
        } catch {
          return Response.json({ error: "invalid_input" }, { status: 400 });
        }


        const { BOOKING_PRODUCTS, createPendingBooking } = await import(
          "@/lib/booking-payment.server"
        );
        const product = BOOKING_PRODUCTS[input.product];
        if (!product) return Response.json({ error: "unknown_product" }, { status: 400 });
        const { bookingAmountCent } = await import("@/lib/booking-payment.server");
        const amountCent = await bookingAmountCent(input.product);

        const { createPendingPayment } = await import("@/lib/payments.server");
        const { transactionForProduct } = await import("@/lib/transaction-products");
        const tx = transactionForProduct(input.product);

        try {
          const booking = await createPendingBooking({
            product: input.product,
            naam: input.naam,
            email: input.email,
            ...(input.telefoon ? { telefoon: input.telefoon } : {}),
            datum: input.datum,
            personen: input.personen,
            ...(input.opmerking ? { opmerking: input.opmerking } : {}),
            lang: input.lang,
          });

          const payment = await createPendingPayment({
            kind: tx.kind,
            amountCent,
            customerEmail: input.email,
            customerName: input.naam,
            lang: input.lang,
            vatRate: tx.vatRate,
            description: product.labelNl,
            metadata: {
              booking_id: booking.id,
              booking_reference: booking.reference,
              product: input.product,
              date: input.datum,
              people: input.personen,
              note: input.opmerking ?? null,
            },
          });

          const session = await createCheckoutSession({
            amount: amountCent,
            description: `${product.labelNl} — ${payment.reference}`,
            customerEmail: input.email,
            locale: input.lang,
            uiMode: input.uiMode,
            metadata: {
              booking_id: booking.id,
              booking_reference: booking.reference,
              payment_id: payment.id,
              reference: payment.reference,
              ticket_type: tx.kind,
              product: input.product,
              customer_email: input.email,
              customer_name: input.naam,
              lang: input.lang,
            },
          });

          return Response.json({
            clientSecret: session.clientSecret,
            sessionId: session.sessionId,
            url: session.url,
            reference: payment.reference,
            bookingReference: booking.reference,
            amountCent,
            label: product.labelNl,
          });
        } catch (err) {
          console.error("[create-session]", err);
          return Response.json({ error: "payment_setup_failed" }, { status: 500 });
        }
      },
    },
  },
});
