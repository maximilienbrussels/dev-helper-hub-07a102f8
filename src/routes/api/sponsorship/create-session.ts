import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/**
 * Peter/Meterschap: maakt een Stripe Checkout Session (subscription) aan.
 * Het bedrag komt altijd uit SPONSOR_TIERS op de server, nooit uit de browser.
 */
const schema = z.object({
  animalId: z.number().int().positive().nullable(),
  animalName: z.string().min(1).max(120),
  tierId: z.string().min(1).max(40),
  sponsorName: z.string().min(2).max(120),
  sponsorEmail: z.string().email().max(160),
  lang: z.enum(["nl", "fr", "en"]).default("nl"),
});

export const Route = createFileRoute("/api/sponsorship/create-session")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { checkRateLimit, clientIdentifier } = await import("@/lib/rate-limit.server");
        const ip = clientIdentifier(request.headers);
        if (!(await checkRateLimit("sponsorship-session", ip, 15, 3600))) {
          return Response.json({ error: "rate_limited" }, { status: 429 });
        }

        let input: z.infer<typeof schema>;
        try {
          input = schema.parse(await request.json());
        } catch {
          return Response.json({ error: "invalid_input" }, { status: 400 });
        }

        const { stripeConfigured, stripeServer } = await import("@/lib/stripe.server");
        if (!stripeConfigured()) {
          return Response.json({ error: "stripe_not_configured" }, { status: 503 });
        }

        const { tierById, createPendingSponsorship, attachSessionToSponsorship } = await import(
          "@/lib/sponsorship.server"
        );
        const tier = tierById(input.tierId);
        if (!tier) return Response.json({ error: "unknown_tier" }, { status: 400 });

        const { pathFor, subPathFor } = await import("@/lib/routes-i18n");
        const origin = (() => {
          const raw = request.headers.get("origin") ?? request.headers.get("referer");
          try {
            if (raw) return new URL(raw).origin;
          } catch {
            /* val terug op het productiedomein */
          }
          return "https://maximilien.brussels";
        })();
        const pagePath = subPathFor("support", input.lang, "sponsor") || pathFor("support", input.lang);

        try {
          const sponsorship = await createPendingSponsorship({
            animalId: input.animalId,
            animalName: input.animalName,
            tier,
            sponsorName: input.sponsorName,
            sponsorEmail: input.sponsorEmail,
            lang: input.lang,
          });

          const successUrl = `${origin}${pagePath}?status=success&session_id={CHECKOUT_SESSION_ID}`;
          const cancelUrl = `${origin}${pagePath}?status=cancelled`;

          const session = await stripeServer().checkout.sessions.create({
            mode: "subscription",
            customer_email: input.sponsorEmail,
            locale: input.lang,
            line_items: [
              {
                quantity: 1,
                price_data: {
                  currency: "eur",
                  unit_amount: tier.amountCents,
                  recurring: { interval: tier.interval },
                  product_data: {
                    name: `Peter/Meterschap — ${input.animalName}`,
                    description: tier.label[input.lang],
                  },
                },
              },
            ],
            metadata: {
              kind: "sponsorship",
              sponsorship_id: sponsorship.id,
              animal_name: input.animalName,
              tier: tier.id,
              lang: input.lang,
            },
            subscription_data: {
              metadata: {
                kind: "sponsorship",
                sponsorship_id: sponsorship.id,
              },
            },
            success_url: successUrl,
            cancel_url: cancelUrl,
          });

          await attachSessionToSponsorship(sponsorship.id, session.id);

          return Response.json({ url: session.url, sessionId: session.id });
        } catch (err) {
          console.error("[sponsorship] sessie aanmaken mislukt", err);
          return Response.json(
            { error: err instanceof Error ? err.message : "stripe_error" },
            { status: 500 },
          );
        }
      },
    },
  },
});
