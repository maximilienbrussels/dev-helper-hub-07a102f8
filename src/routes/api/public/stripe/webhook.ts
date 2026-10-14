import { createFileRoute } from "@tanstack/react-router";

/**
 * Alias-endpoint `/api/public/stripe/webhook` — zelfde verwerking als
 * `/api/public/webhooks/stripe`, zodat bestaande Stripe-configuraties met dit
 * pad blijven werken. De signature wordt altijd geverifieerd.
 */
export const Route = createFileRoute("/api/public/stripe/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { processStripeWebhook } = await import("@/lib/stripe-webhook.server");
        return processStripeWebhook(request);
      },
    },
  },
});
