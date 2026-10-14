/**
 * Interne endpoint om de vier mailsjablonen (afhaalbon, boekingsbevestiging,
 * inlogcode, mededeling) in NL/FR/EN naar een testadres te sturen — enkel
 * bereikbaar met het gedeelde servergeheim (geen browsersessie nodig, bv.
 * voor smoke tests vanuit een CI-run).
 */
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const TEMPLATES = ["pickup_ticket", "booking_confirmation", "auth_code", "general_notice"] as const;
const LANGS = ["nl", "fr", "en"] as const;

const bodySchema = z.object({
  to: z.string().email(),
  templates: z.array(z.enum(TEMPLATES)).min(1).default([...TEMPLATES]),
  langs: z.array(z.enum(LANGS)).min(1).default([...LANGS]),
});

function authorized(request: Request): boolean {
  const secret = process.env["LOVABLE_CRON_SECRET"] || process.env["INTERNAL_API_SECRET"];
  if (!secret) return false;
  const header =
    request.headers.get("x-internal-secret") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    "";
  return header.length > 0 && header === secret;
}

function sampleData(template: (typeof TEMPLATES)[number]): Record<string, unknown> {
  switch (template) {
    case "pickup_ticket":
      return {
        naam: "Test Bezoeker",
        ordernummer: "TEST-0001",
        code: "AB12CD",
        afhaalmoment: "Zaterdag 10:00 – 12:00",
        totaal_cent: 1250,
        lijnen: [{ naam: "Testproduct", aantal: 1, prijs_cent: 1250 }],
      };
    case "booking_confirmation":
      return {
        naam: "Test Klant",
        referentie: "BOEK-TEST-01",
        formule: "Teambuilding",
        datum: new Date().toISOString().slice(0, 10),
        personen: 12,
        bedrag_cent: 45000,
      };
    case "auth_code":
      return { naam: "Test Gebruiker", code: "123456", url: "https://maximilien.site/auth" };
    default:
      return {
        naam: "Test Gebruiker",
        title: "Testmededeling",
        message: "Dit is een testbericht vanuit /api/email/test-templates.",
      };
  }
}

export const Route = createFileRoute("/api/email/test-templates")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!authorized(request)) {
          return new Response(JSON.stringify({ error: "unauthorized" }), {
            status: 401,
            headers: { "content-type": "application/json" },
          });
        }

        let parsed;
        try {
          parsed = bodySchema.parse(await request.json().catch(() => ({})));
        } catch (error) {
          return new Response(
            JSON.stringify({ error: "invalid_body", detail: String((error as Error).message) }),
            { status: 400, headers: { "content-type": "application/json" } },
          );
        }

        const { sendTemplateMail } = await import("@/lib/email-engine.server");
        const results = [];
        for (const template of parsed.templates) {
          for (const lang of parsed.langs) {
            try {
              const res = await sendTemplateMail({
                to: { email: parsed.to, name: "Test" },
                templateType: template,
                data: sampleData(template),
                lang,
              });
              results.push({ template, lang, sent: res.sent, error: res.error, messageId: res.messageId });
            } catch (error) {
              results.push({ template, lang, sent: false, error: (error as Error).message });
            }
          }
        }

        return new Response(JSON.stringify({ results }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
