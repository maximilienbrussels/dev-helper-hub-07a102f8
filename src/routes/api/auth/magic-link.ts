import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/**
 * POST /api/auth/magic-link
 *
 * Maakt een eenmalige inloglink aan (bewaard in Postgres) en mailt die via
 * Brevo. Het antwoord is altijd hetzelfde, ook voor onbekende adressen, zodat
 * niemand kan aftoetsen welke e-mailadressen bestaan. Fouten van de
 * mailprovider (401/403 IP-beperking, 429, 5xx) worden vertaald naar een nette
 * Nederlandse boodschap — nooit ruwe API-JSON.
 */
const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  naam: z.string().trim().max(120).optional(),
  next: z.string().optional(),
  lang: z.enum(["nl", "fr", "en"]).optional(),
});

export const Route = createFileRoute("/api/auth/magic-link")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: unknown;
        try {
          payload = await request.json();
        } catch {
          payload = null;
        }
        const parsed = bodySchema.safeParse(payload);
        if (!parsed.success) {
          return json({ ok: false, message: "Vul een geldig e-mailadres in." }, 400);
        }
        const { email, naam, next, lang } = parsed.data;

        try {
          const { guardRate } = await import("@/lib/email-guard.server");
          await guardRate("magiclink", email);
        } catch (error) {
          return json(
            {
              ok: false,
              message:
                error instanceof Error && error.message
                  ? error.message
                  : "Te veel pogingen. Probeer het over enkele minuten opnieuw.",
            },
            429,
          );
        }

        try {
          const { sendAuthLink } = await import("@/lib/auth-email.server");
          await sendAuthLink(
            "magic",
            email,
            naam,
            next && isSafePath(next) ? next : "/account",
            lang ?? "nl",
          );
          return json({
            ok: true,
            message: "Check je mailbox — we stuurden je een inloglink.",
          });
        } catch (error) {
          console.error("[api/auth/magic-link] versturen mislukt:", error);
          const { friendlyAuthError } = await import("@/lib/auth-errors");
          return json(
            {
              ok: false,
              message: friendlyAuthError(
                error instanceof Error ? error.message : "Onbekende fout",
              ),
            },
            200,
          );
        }
      },
    },
  },
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

/** Enkel paden binnen deze site (geen //andere-site of /\\andere-site). */
const isSafePath = (x: string) => x.startsWith("/") && !x.startsWith("//") && !x.startsWith("/\\");
