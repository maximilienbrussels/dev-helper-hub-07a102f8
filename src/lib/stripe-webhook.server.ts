/**
 * Gedeelde verwerking van Stripe-webhooks voor zowel
 * `/api/public/webhooks/stripe` als `/api/stripe/webhook`.
 *
 * Bij `payment_intent.succeeded`:
 *   1. signature is al gevalideerd door de route,
 *   2. betaling + boeking krijgen status `paid` (idempotent),
 *   3. de juiste transactionele mail (donatie / ticket / factuur / winkel)
 *      vertrekt via Brevo en wordt gelogd in `email_logs`.
 */
import type Stripe from "stripe";
import type { MailLanguage, TransactionalInput } from "@/lib/transactional-templates";
import type { PaymentRow } from "@/lib/payments.server";

function metaString(intent: Stripe.PaymentIntent, key: string): string | undefined {
  const value = intent.metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function buildInput(payment: PaymentRow, intent: Stripe.PaymentIntent): TransactionalInput {
  const meta = (payment.metadata ?? {}) as Record<string, unknown>;
  const lang = (["nl", "fr", "en"].includes(payment.lang) ? payment.lang : "nl") as MailLanguage;
  const base: TransactionalInput = {
    template: payment.kind,
    reference: payment.reference,
    lang,
    amountCent: payment.amount_cent,
    vatRate: Number(payment.vat_rate ?? 21),
  };
  const name = payment.customer_name ?? metaString(intent, "customer_name");
  if (name) base.customerName = name;
  if (payment.description) base.subjectName = payment.description;
  if (typeof meta["date"] === "string") base.eventDate = meta["date"];
  if (typeof meta["participant"] === "string") base.participantName = meta["participant"];
  if (Array.isArray(meta["practicalInfo"])) base.practicalInfo = meta["practicalInfo"] as string[];
  if (Array.isArray(meta["items"])) base.items = meta["items"] as TransactionalInput["items"];
  if (typeof meta["pickupSlot"] === "string") base.pickupSlot = meta["pickupSlot"];
  if (Array.isArray(meta["openingHours"])) base.openingHours = meta["openingHours"] as string[];
  if (payment.kind === "ticket" && !base.participantName && name) base.participantName = name;
  return base;
}

/**
 * Checkout Session afgerond: koppel de PaymentIntent aan de betaling en de
 * boeking, zodat de gewone `payment_intent.succeeded`-verwerking (statussen +
 * bevestigingsmail) haar werk kan doen. Idempotent.
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const meta = session.metadata ?? {};

  // Peter/Meterschap: afronden en certificaat/mail regelen (geen gewone factuur).
  if (meta["kind"] === "sponsorship") {
    const { finalizeSponsorshipForSession } = await import("@/lib/sponsorship.server");
    const subscriptionId =
      typeof session.subscription === "string" ? session.subscription : null;
    await finalizeSponsorshipForSession(session.id, subscriptionId).catch((err) =>
      console.error("[stripe-webhook] sponsorship afronden mislukt", err),
    );
    return;
  }

  // Webshopbestelling: status op `paid`, factuur genereren en mailen.
  if (meta["order_id"]) {
    const orderId = Number(meta["order_id"]);
    if (Number.isFinite(orderId)) {
      const { finalizePaidOrder } = await import("@/lib/order-invoice.server");
      const lang = ["nl", "fr", "en"].includes(String(meta["lang"]))
        ? (meta["lang"] as "nl" | "fr" | "en")
        : "nl";
      const method = session.payment_method_types?.[0] ?? null;
      await finalizePaidOrder({ orderId, paymentMethod: method, lang }).catch((err) =>
        console.error("[stripe-webhook] factuurpijplijn mislukt", err),
      );
    }
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent?.id ?? null);
  if (!paymentIntentId) return;


  if (meta["payment_id"]) {
    const { attachPaymentIntentToPayment } = await import("@/lib/payments.server");
    await attachPaymentIntentToPayment(meta["payment_id"], paymentIntentId).catch((err) =>
      console.error("[stripe-webhook] payment koppelen mislukt", err),
    );
  }
  if (meta["booking_id"]) {
    const { attachPaymentIntent } = await import("@/lib/booking-payment.server");
    await attachPaymentIntent(meta["booking_id"], paymentIntentId).catch((err) =>
      console.error("[stripe-webhook] boeking koppelen mislukt", err),
    );
  }

  const stripe = (await import("@/lib/stripe.server")).stripeServer();
  const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
  await handleStripeEvent({
    type: "payment_intent.succeeded",
    data: { object: intent },
  } as unknown as Stripe.Event);
}

export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status === "paid" || session.status === "complete") {
      await handleCheckoutCompleted(session);
    }
    return;
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as Stripe.PaymentIntent;

    // 0. Webshopbestelling via PaymentElement: status op `paid` + factuur.
    const orderId = Number(intent.metadata?.["order_id"]);
    if (Number.isFinite(orderId) && orderId > 0) {
      const { finalizePaidOrder } = await import("@/lib/order-invoice.server");
      const lang = ["nl", "fr", "en"].includes(String(intent.metadata?.["lang"]))
        ? (intent.metadata["lang"] as "nl" | "fr" | "en")
        : "nl";
      await finalizePaidOrder({
        orderId,
        paymentMethod: intent.payment_method_types?.[0] ?? null,
        lang,
      }).catch((err) => console.error("[stripe-webhook] bestelling afronden mislukt", err));
      return;
    }

    // 1. Boeking op PAID zetten (idempotent).
    const { markBookingPaid, sendBookingConfirmation } = await import(
      "@/lib/booking-payment.server"
    );
    const booking = await markBookingPaid(intent.id).catch((err) => {
      console.error("[stripe-webhook] boeking bijwerken mislukt", err);
      return null;
    });

    // 2. Uniforme betaling → transactionele mail.
    const { markPaymentPaid, markPaymentConfirmationSent } = await import("@/lib/payments.server");
    const payment = await markPaymentPaid(intent.id);
    if (!payment) {
      // Geen payments-rij (oudere flow): val terug op de klassieke mail.
      if (booking) await sendBookingConfirmation(booking);
      return;
    }

    const { sendTransactionalEmail } = await import("@/lib/transactional-email.server");
    const result = await sendTransactionalEmail({
      to: payment.customer_email,
      paymentId: payment.id,
      input: buildInput(payment, intent),
    });
    if (result.sent) await markPaymentConfirmationSent(payment.id);
    else console.error("[stripe-webhook] mail mislukt", payment.reference, result.error);
    return;
  }

  if (event.type === "payment_intent.payment_failed") {
    const intent = event.data.object as Stripe.PaymentIntent;
    const { markBookingFailed } = await import("@/lib/booking-payment.server");
    const { markPaymentFailed } = await import("@/lib/payments.server");
    await markBookingFailed(intent.id).catch(() => undefined);
    await markPaymentFailed(intent.id).catch(() => undefined);
  }
}

/** Valideert de signature en verwerkt het event. */
export async function processStripeWebhook(request: Request): Promise<Response> {
  const secret = process.env["STRIPE_WEBHOOK_SECRET"];
  const signature = request.headers.get("stripe-signature");
  if (!secret) {
    console.error(
      "[stripe-webhook] STRIPE_WEBHOOK_SECRET ontbreekt; het event wordt niet verwerkt.",
    );
    return new Response("webhook secret missing", { status: 500 });
  }
  if (!signature) return new Response("missing signature", { status: 400 });

  const raw = await request.text();
  const { stripeClient } = await import("@/lib/booking-payment.server");
  const StripeLib = (await import("stripe")).default;
  const stripe = stripeClient();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      raw,
      signature,
      secret,
      undefined,
      StripeLib.createSubtleCryptoProvider(),
    );
  } catch (err) {
    console.error("[stripe-webhook] ongeldige signature", err);
    return new Response("invalid signature", { status: 401 });
  }

  try {
    await handleStripeEvent(event);
  } catch (err) {
    console.error("[stripe-webhook] verwerking mislukt", event.type, err);
    return new Response("processing error", { status: 500 });
  }

  return Response.json({ received: true });
}
