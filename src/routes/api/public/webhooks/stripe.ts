import { createFileRoute } from "@tanstack/react-router";

/**
 * Stripe-webhook: enkel verzoeken met een geldige signature worden verwerkt.
 * `payment_intent.succeeded` zet betaling + boeking op PAID en stuurt de
 * juiste transactionele mail (donatie, ticket, factuur of hoevewinkel).
 */
export const Route = createFileRoute("/api/public/webhooks/stripe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { processStripeWebhook } = await import("@/lib/stripe-webhook.server");
        return processStripeWebhook(request);
      },
    },
  },
});
