import { createFileRoute } from "@tanstack/react-router";

/** Statusopvraging voor de bedanktpagina (polling tot het webhook binnen is). */
export const Route = createFileRoute("/api/sponsorship/status")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const sessionId = new URL(request.url).searchParams.get("session_id");
        if (!sessionId) return Response.json({ error: "missing_session_id" }, { status: 400 });

        const { sponsorshipBySessionId, finalizeSponsorshipForSession } = await import(
          "@/lib/sponsorship.server"
        );
        let row = await sponsorshipBySessionId(sessionId);

        // Vangnet: webhook nog niet binnen? Vraag Stripe zelf even na.
        if (row && row.status !== "paid") {
          const { stripeConfigured, stripeServer } = await import("@/lib/stripe.server");
          if (stripeConfigured()) {
            try {
              const session = await stripeServer().checkout.sessions.retrieve(sessionId);
              if (session.status === "complete" && session.payment_status === "paid") {
                const subId =
                  typeof session.subscription === "string" ? session.subscription : null;
                row = await finalizeSponsorshipForSession(sessionId, subId);
              }
            } catch {
              /* Stripe niet bereikbaar: gewoon "pending" tonen */
            }
          }
        }

        if (!row) return Response.json({ status: "unknown" });
        return Response.json({
          status: row.status,
          animalName: row.animal_name,
          tier: row.tier,
          certificateId: row.certificate_id,
        });
      },
    },
  },
});
