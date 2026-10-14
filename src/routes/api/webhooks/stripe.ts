import { createFileRoute } from "@tanstack/react-router";

/**
 * Stripe-webhook voor Checkout Sessions en PaymentIntents.
 * De handtekening wordt altijd geverifieerd voor er iets verwerkt wordt.
 */
export const Route = createFileRoute("/api/webhooks/stripe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { processStripeWebhook } = await import("@/lib/stripe-webhook.server");
        return processStripeWebhook(request);
      },
    },
  },
});
