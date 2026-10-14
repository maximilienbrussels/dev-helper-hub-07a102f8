import { createFileRoute } from "@tanstack/react-router";

/** Publiceerbare Stripe-sleutel voor de browser (geen geheim). */
export const Route = createFileRoute("/api/stripe-config")({
  server: {
    handlers: {
      GET: async () => {
        const key = process.env["STRIPE_PUBLISHABLE_KEY"] ?? null;
        return Response.json(
          { publishableKey: key },
          { headers: { "cache-control": "private, max-age=300" } },
        );
      },
    },
  },
});
