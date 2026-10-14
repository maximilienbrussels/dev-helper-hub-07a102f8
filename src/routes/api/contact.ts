import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const contactSchema = z.object({
  inbox: z.string().max(40).optional(),
  onderwerp: z.string().min(1).max(120),
  naam: z.string().min(1).max(120),
  email: z.string().email(),
  telefoon: z.string().max(40).optional(),
  organisatie: z.string().max(160).optional(),
  bericht: z.string().min(5).max(5000),
  pagina: z.string().max(160).optional(),
  lang: z.enum(["nl", "fr", "en"]).optional(),
  website_hp: z.string().max(200).optional(),
});

export const Route = createFileRoute("/api/contact")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = contactSchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) {
          return Response.json({ sent: false, error: "invalid_input" }, { status: 400 });
        }
        if (parsed.data.website_hp?.trim()) {
          return Response.json({ sent: true });
        }

        try {
          const { guardRate } = await import("@/lib/email-guard.server");
          await guardRate("contact", parsed.data.email);
        } catch (error) {
          return Response.json(
            { sent: false, error: error instanceof Error ? error.message : "rate_limited" },
            { status: 429 },
          );
        }

        const { processContactEmail } = await import("@/lib/contact-email.server");
        let result;
        try {
          result = await processContactEmail(parsed.data);
        } catch (error) {
          const detail = error instanceof Error ? error.message : String(error);
          console.error("[contact] onverwachte fout:", detail);
          return Response.json({ sent: false, error: "unexpected_error", detail }, { status: 500 });
        }

        if (!result.stored) {
          console.error("[contact] opslag mislukt:", result.reason);
          return Response.json(
            { sent: false, error: result.reason ?? "storage_failed" },
            { status: 503 },
          );
        }

        // Opslag is de succesgrens: fouten bij Brevo/SMTP staan op de bewaarde rij.
        if (result.reason) {
          console.error("[contact] bewaard, maar mail mislukt:", result.reason);
          return Response.json({ sent: true, mailed: false, error: result.reason }, { status: 200 });
        }
        return Response.json({ sent: true, mailed: true }, { status: 200 });

      },
    },
  },
});