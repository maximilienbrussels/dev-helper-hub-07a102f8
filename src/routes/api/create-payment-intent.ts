import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const schema = z.object({
  product: z.enum([
    "zaalverhuur_halve_dag",
    "zaalverhuur_dag",
    "feestje",
    "teambuilding",
    "peterschap_maand",
    "stage_week",
  ]),

  naam: z.string().min(2).max(120),
  email: z.string().email().max(160),
  telefoon: z.string().max(40).optional(),
  datum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slotId: z.string().uuid().optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  personen: z.number().int().min(1).max(200),
  opmerking: z.string().max(2000).optional(),
  lang: z.enum(["nl", "fr", "en"]).default("nl"),
});

export const Route = createFileRoute("/api/create-payment-intent")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { checkRateLimit, clientIdentifier } = await import("@/lib/rate-limit.server");
        const ip = clientIdentifier(request.headers);
        if (!(await checkRateLimit("payment-intent", ip, 12, 3600))) {
          return Response.json({ error: "rate_limited" }, { status: 429 });
        }

        let input: z.infer<typeof schema>;
        try {
          input = schema.parse(await request.json());
        } catch {
          return Response.json({ error: "invalid_input" }, { status: 400 });
        }

        const {
          BOOKING_PRODUCTS,
          createPendingBooking,
          attachPaymentIntent,
          stripeClient,
        } = await import("@/lib/booking-payment.server");
        const { createPendingPayment, attachPaymentIntentToPayment } = await import(
          "@/lib/payments.server"
        );
        const { transactionForProduct } = await import("@/lib/transaction-products");

        const product = BOOKING_PRODUCTS[input.product]!;
        // Bedrag komt uit dezelfde tarieventabel als de publieke pagina's.
        const { bookingAmountCent } = await import("@/lib/booking-payment.server");
        const amountCent = await bookingAmountCent(input.product);
        const tx = transactionForProduct(input.product);

        // Slot vastleggen vóór de betaling: voorkomt dubbele boekingen.
        if (input.slotId) {
          const { reserveSlot } = await import("@/lib/booking-payment.server");
          if (!(await reserveSlot(input.slotId))) {
            return Response.json({ error: "slot_unavailable" }, { status: 409 });
          }
        }

        try {
          const booking = await createPendingBooking(input);

          // Unieke, menselijk leesbare referentie per transactietype
          // (DON-/TKT-/FAC-/ORD-) — verplicht bewaard vóór de PaymentIntent.
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

          const stripe = stripeClient();
          const intent = await stripe.paymentIntents.create({
            amount: amountCent,
            currency: "eur",
            automatic_payment_methods: { enabled: true },
            receipt_email: input.email,
            description: `${product.labelNl} — ${payment.reference}`,
            metadata: {
              booking_id: booking.id,
              booking_reference: booking.reference,
              payment_id: payment.id,
              reference: payment.reference,
              transaction_kind: tx.kind,
              customer_email: input.email,
              customer_name: input.naam,
              product: input.product,
              lang: input.lang,
            },
          });
          await attachPaymentIntent(booking.id, intent.id);
          await attachPaymentIntentToPayment(payment.id, intent.id);

          return Response.json({
            clientSecret: intent.client_secret,
            reference: payment.reference,
            bookingReference: booking.reference,
            amountCent,
            label: product.labelNl,
          });

        } catch (err) {
          console.error("[create-payment-intent]", err);
          return Response.json({ error: "payment_setup_failed" }, { status: 500 });
        }
      },
    },
  },
});
