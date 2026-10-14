/**
 * Dubbele verzendlijn voor élke formuliermail (contact, verhuur, webshop, academie).
 *
 * Werking, in deze vaste volgorde:
 *   1. De inzending staat al in `form_submissions` (status `pending`) — de
 *      bezoeker krijgt altijd meteen een geslaagde melding te zien.
 *   2. Bestemming opzoeken: de categorie uit `contact_routes` / `email_settings`,
 *      met terugval op BREVO_SENDER_EMAIL of contact@maximilien.brussels.
 *   3. Verzending: uitsluitend via de Brevo REST API v3 (transactionele HTTP-API).
 *   4. Mislukt Brevo (timeout, 4xx, 5xx, ontbrekende sleutel), dan krijgt de rij
 *      status `failed` met de exacte fout in `error_log`, zodat een beheerder ze
 *      in het portaal kan herversturen.
 *
 * Server-only: dit bestand eindigt op `.server.ts` en komt nooit in de browser.
 */
import { CONTACT_EMAIL } from "./contact-emails";

export type DispatchStatus = "pending" | "sent_brevo" | "sent_smtp_fallback" | "failed";

export type MailBody = { subject: string; html: string; text?: string };

export type DispatchResult = {
  status: DispatchStatus;
  recipients: string[];
  transport: string | null;
  error?: string;
};

/** Bestemmingsadres(sen) voor een categorie; nooit leeg. */
export async function categoryRecipients(category?: string): Promise<string[]> {
  try {
    const { recipientsFor } = await import("./contact-routes.server");
    const found = await recipientsFor(category);
    if (found.length) return found;
  } catch (err) {
    console.warn(`[email-service] categorie niet leesbaar: ${(err as Error).message}`);
  }
  const sender = process.env["BREVO_SENDER_EMAIL"]?.trim();
  return [sender || CONTACT_EMAIL];
}

/**
 * Verstuurt één mail via de Brevo HTTP-API. Er is bewust géén SMTP-terugval
 * meer: één route betekent één duidelijke foutmelding in het logboek.
 */
export async function sendDual(opts: {
  to: string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  kind: string;
}): Promise<{ status: DispatchStatus; transport: string | null; error?: string }> {
  const { sendMail } = await import("./email.server");
  const recipients = opts.to.map((a) => a.trim()).filter(Boolean);
  if (!recipients.length) {
    return { status: "failed", transport: null, error: "geen ontvanger" };
  }

  const base = {
    to: recipients,
    subject: opts.subject,
    html: opts.html,
    ...(opts.text ? { text: opts.text } : {}),
    ...(opts.replyTo ? { replyTo: opts.replyTo } : {}),
  };

  let brevoError = "";
  try {
    const res = await sendMail({ ...base, kind: `${opts.kind}:brevo`, transport: "brevo" });
    if (res.sent) {
      return { status: "sent_brevo", transport: res.transport ?? "brevo-api" };
    }
    brevoError = res.error || res.reason || "onbekende Brevo-fout";
  } catch (err) {
    brevoError = (err as Error).message;
  }

  console.error(`[email-service] Brevo mislukt (${opts.kind}): ${brevoError}`);
  return { status: "failed", transport: null, error: `Brevo: ${brevoError}` };
}

/**
 * Volledige afhandeling van één inzending: bestemming opzoeken, beide mails
 * (beheerder + klant) versturen via de dubbele lijn en de status in de databank
 * bijwerken. Werpt nooit: de bezoeker mag hier nooit een fout van zien.
 */
export async function dispatchSubmission(opts: {
  submissionId: string | null;
  category?: string;
  /** Melding voor de juiste inbox. */
  admin: MailBody;
  /** Ontvangstbevestiging voor de bezoeker (optioneel). */
  customer?: MailBody & { to: string };
  replyTo?: string;
  kind: string;
}): Promise<DispatchResult> {
  const { markSubmission } = await import("./email-settings.server");
  try {
    const recipients = await categoryRecipients(opts.category);

    const adminOut = await sendDual({
      to: recipients,
      subject: opts.admin.subject,
      html: opts.admin.html,
      ...(opts.admin.text ? { text: opts.admin.text } : {}),
      ...(opts.replyTo ? { replyTo: opts.replyTo } : {}),
      kind: `${opts.kind}-admin`,
    });

    let customerError = "";
    if (opts.customer?.to) {
      const out = await sendDual({
        to: [opts.customer.to],
        subject: opts.customer.subject,
        html: opts.customer.html,
        ...(opts.customer.text ? { text: opts.customer.text } : {}),
        kind: `${opts.kind}-klant`,
      });
      if (out.status === "failed") customerError = `ontvangstbevestiging: ${out.error ?? "mislukt"}`;
    }

    const error = [adminOut.error, customerError].filter(Boolean).join(" | ") || undefined;
    await markSubmission(opts.submissionId, adminOut.status, {
      recipients,
      error: error ?? null,
      transport: adminOut.transport,
    });
    return {
      status: adminOut.status,
      recipients,
      transport: adminOut.transport,
      ...(error ? { error } : {}),
    };
  } catch (err) {
    const error = (err as Error).message;
    console.error(`[email-service] verzendlijn onderbroken (${opts.kind}): ${error}`);
    await markSubmission(opts.submissionId, "failed", { error });
    return { status: "failed", recipients: [], transport: null, error };
  }
}
