import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-middleware";
import { requirePermission } from "@/lib/portal-permissions";
import { normalizeMailLang } from "./email-copy";

/** Bevestigingsmail voor een gift, met gestructureerde betaalreferentie. */
export const sendDonationConfirmation = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        email: z.string().email(),
        naam: z.string().max(120).optional(),
        bedrag_cent: z.number().int().min(100).max(10_000_000),
        doel: z.string().max(120).optional(),
        lang: z.enum(["nl", "fr", "en"]).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await (await import("./email-guard.server")).guardRate("donation", data.email);
    const { sendMail, donationEmail } = await import("./email.server");
    const { structuredCommunication } = await import("./payment-reference");
    const { getOrganisation } = await import("./organisation.server");

    const org = await getOrganisation();
    const referentie = structuredCommunication(9, Math.floor(Math.random() * 9000) + 1000);

    const { subject, html } = donationEmail({
      naam: data.naam,
      bedrag_cent: data.bedrag_cent,
      doel: data.doel,
      referentie,
      iban: org.iban,
      bic: org.bic,
      begunstigde: org.naam,
      lang: normalizeMailLang(data.lang),
    });

    const res = await sendMail({ to: data.email, subject, html, kind: "gift" });
    return { ...res, referentie };
  });

/**
 * Contact- en partneraanvragen.
 * De bestemming wordt server-side uit een vaste lijst gekozen: de browser kan
 * nooit een willekeurig ontvangeradres opgeven.
 */
export const sendContactMessage = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        inbox: z.string().max(40).optional(),
        onderwerp: z.string().min(1).max(120),
        naam: z.string().min(1).max(120),
        email: z.string().email(),
        telefoon: z.string().max(40).optional(),
        organisatie: z.string().max(160).optional(),
        bericht: z.string().min(5).max(5000),
        pagina: z.string().max(160).optional(),
        lang: z.enum(["nl", "fr", "en"]).optional(),
        /** Onzichtbaar spamveld: enkel bots vullen dit in. */
        website_hp: z.string().max(200).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    // 0. Honeypot: bots krijgen een geslaagd antwoord, maar niets wordt bewaard
    //    of verstuurd.
    if (data.website_hp?.trim()) {
      console.warn("[contact] honeypot gevuld — inzending stil genegeerd");
      return { sent: true, reason: undefined as string | undefined };
    }

    // 1. Rate limit: max. 5 inzendingen per 10 minuten per IP én per adres.
    await (await import("./email-guard.server")).guardRate("contact", data.email);

    const { processContactEmail } = await import("./contact-email.server");
    const result = await processContactEmail(data);
    return { sent: result.sent, reason: result.reason };
  });


/**
 * Systeemcheck (enkel voor beheerders): stuurt een volledig opgemaakte
 * testmail. Standaard naar het adres uit de sessie, maar de beheerder mag een
 * ander adres opgeven om de aflevering elders te controleren.
 */
export const sendSystemTestEmail = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) =>
    z
      .object({ to: z.string().trim().email().optional() })
      .partial()
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { claims } = context;
    await requirePermission(context, "manage_rights");

    const to = data?.to?.trim() || (claims.email as string | undefined) || "";
    if (!to) throw new Error("Geen e-mailadres gekoppeld aan dit beheerdersaccount");

    const { sendMail, systemTestEmail, senderIdentity } = await import("./email.server");
    const { smtpConfigStatus } = await import("./smtp.server");
    const { subject, html } = systemTestEmail();
    const startedAt = Date.now();
    const result = await sendMail({ to, subject, html, kind: "systeemtest" });
    const duurMs = Date.now() - startedAt;
    const status = await smtpConfigStatus();

    const log = [
      `afzender: ${await senderIdentity()}`,
      `ontvanger: ${to}`,
      `bron instellingen: ${status.source === "database" ? "beheerpagina" : status.source === "environment" ? "environment variables" : "niet ingesteld"}`,
      `smtp-host: ${status.host || "(niet ingesteld)"}:${status.port ?? "—"} (${status.secure ? "SSL" : "STARTTLS"})`,
      `resultaat: ${result.sent ? "verzonden" : `mislukt (${result.reason ?? "onbekend"})`}`,
      result.error ? `oorzaak: ${result.error}` : "",
      `duur: ${duurMs} ms`,
    ]
      .filter(Boolean)
      .join("\n");

    return {
      sent: result.sent,
      reason: result.reason ?? null,
      error: result.error ?? null,
      to,
      log,
    };
  });

/**
 * Publieke keuzelijst voor het algemene contactformulier: welke onderwerpen
 * bestaan er en hoe heten ze? Adressen blijven server-side.
 */
export const fetchContactTopics = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ key: string; label: string }[]> => {
    const { publicContactTopics } = await import("./contact-routes.server");
    return publicContactTopics();
  },
);
