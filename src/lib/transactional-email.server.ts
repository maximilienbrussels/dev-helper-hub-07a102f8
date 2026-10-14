/**
 * Transactionele mailservice: rendert het juiste sjabloon, genereert QR-code
 * en/of PDF-factuur, verstuurt via de Brevo API en logt élk resultaat in
 * `public.email_logs`. Mislukte mails blijven met status `failed` staan zodat
 * ze vanuit het beheerdersdashboard opnieuw verstuurd kunnen worden.
 */
import { brevoEnv, brevoReplyTo, brevoSender } from "@/lib/brevo";
import { db } from "@/lib/neon.server";
import { buildInvoicePdfBase64 } from "@/lib/pdf-invoice.server";
import { qrPngBase64 } from "@/lib/qr.server";
import { PUBLIC_SITE_URL } from "@/lib/routes-i18n";
import {
  buildTransactionalEmail,
  type TransactionalInput,
} from "@/lib/transactional-templates";


export type SendTransactionalParams = {
  to: string;
  input: TransactionalInput;
  paymentId?: string | null;
  /** Adres van de klant voor op de factuur. */
  customerAddress?: string;
  /** Hergebruik van een bestaande logregel (resend vanuit het dashboard). */
  logId?: string;
};

export type SendTransactionalResult = {
  sent: boolean;
  logId: string | null;
  status?: number;
  error?: string;
  messageId?: string;
};

function siteUrl(): string {
  return (
    brevoEnv("PUBLIC_SITE_URL") ?? brevoEnv("SITE_URL") ?? PUBLIC_SITE_URL
  ).replace(/\/$/, "");
}

async function logRow(
  params: SendTransactionalParams,
  subject: string,
): Promise<string | null> {
  try {
    const sql = db();
    if (params.logId) {
      const rows = (await sql`
        update public.email_logs
           set status = 'pending', attempts = attempts + 1, error_message = null, updated_at = now()
         where id = ${params.logId}::uuid
         returning id
      `) as { id: string }[];
      return rows[0]?.id ?? params.logId;
    }
    const rows = (await sql`
      insert into public.email_logs (reference, payment_id, template, lang, recipient, subject, status, attempts, payload)
      values (
        ${params.input.reference}, ${params.paymentId ?? null},
        ${params.input.template}, ${params.input.lang}, ${params.to.toLowerCase()},
        ${subject}, 'pending', 1, ${JSON.stringify(params.input)}::jsonb
      )
      returning id
    `) as { id: string }[];
    return rows[0]?.id ?? null;
  } catch (error) {
    console.error("[transactional-email] logregel maken mislukt", error);
    return null;
  }
}

async function finishLog(
  id: string | null,
  ok: boolean,
  detail: { status?: number; error?: string; messageId?: string },
) {
  if (!id) return;
  try {
    const sql = db();
    await sql`
      update public.email_logs
         set status = ${ok ? "sent" : "failed"},
             provider_status = ${detail.status ?? null},
             provider_message_id = ${detail.messageId ?? null},
             error_message = ${detail.error ?? null},
             sent_at = ${ok ? new Date().toISOString() : null},
             updated_at = now()
       where id = ${id}::uuid
    `;
  } catch (error) {
    console.error("[transactional-email] logregel afsluiten mislukt", error);
  }
}

/** Bouwt bijlagen: QR-ticket (PNG) en/of officiële factuur (PDF). */
async function buildAttachments(params: SendTransactionalParams) {
  const attachment: { name: string; content: string }[] = [];
  const { input } = params;

  if (input.template === "ticket") {
    const payload = input.qrUrl ?? `${siteUrl()}/checkin/${input.reference}`;
    const png = await qrPngBase64(payload);
    if (png) attachment.push({ name: "ticket-qr.png", content: png });
  }

  if (input.template === "donation") {
    const png = await qrPngBase64(input.qrUrl ?? `${siteUrl()}/steun/${input.reference}`);
    if (png) attachment.push({ name: "donatiebewijs-qr.png", content: png });
  }

  if (input.template === "invoice") {
    const { getOrganisation } = await import("@/lib/organisation.server");
    const org = await getOrganisation().catch(() => null);
    const pdf = await buildInvoicePdfBase64({
      reference: input.reference,
      issuedAt: new Date(),
      customerName: input.customerName ?? "",
      customerEmail: params.to,
      ...(params.customerAddress ? { customerAddress: params.customerAddress } : {}),
      lines: [
        {
          description: input.subjectName ?? "Zaalverhuur / teambuilding",
          amountCent: input.amountCent,
        },
      ],
      vatRate: input.vatRate ?? 21,
      lang: input.lang,
      ...(org?.iban ? { iban: org.iban } : {}),
      ...(org?.bic ? { bic: org.bic } : {}),
    });
    if (pdf) attachment.push({ name: `factuur-${input.reference}.pdf`, content: pdf });
  }

  return attachment;
}

/** Verstuurt één transactionele mail en logt het resultaat. */
export async function sendTransactionalEmail(
  params: SendTransactionalParams,
): Promise<SendTransactionalResult> {
  const { subject, html } = buildTransactionalEmail(params.input);
  const logId = await logRow(params, subject);

  const apiKey = brevoEnv("BREVO_API_KEY");
  if (!apiKey) {
    const error = "BREVO_API_KEY ontbreekt in deze omgeving.";
    await finishLog(logId, false, { error });
    return { sent: false, logId, error };
  }

  try {
    const attachment = await buildAttachments(params);
    const { brevoRoute } = await import("@/lib/brevo");
    const route = brevoRoute(apiKey, brevoEnv("LOVABLE_API_KEY"));
    const response = await fetch(route.url("smtp/email"), {
      method: "POST",
      headers: route.headers,
      body: JSON.stringify({
        sender: brevoSender(),
        replyTo: brevoReplyTo(),
        to: [{ email: params.to, ...(params.input.customerName ? { name: params.input.customerName } : {}) }],
        subject,
        htmlContent: html,
        tags: [`transactional:${params.input.template}`, params.input.reference],
        ...(attachment.length ? { attachment } : {}),
      }),
    });

    const text = await response.text();
    if (!response.ok) {
      const error = `Brevo ${response.status} via ${route.label}: ${text.slice(0, 500)}`;
      console.error("[transactional-email]", error);
      await finishLog(logId, false, { status: response.status, error });
      return { sent: false, logId, status: response.status, error };
    }

    let messageId: string | undefined;
    try {
      messageId = (JSON.parse(text) as { messageId?: string }).messageId;
    } catch {
      messageId = undefined;
    }
    console.info(
      `[transactional-email] sjabloon=${params.input.template} taal=${params.input.lang} route=${route.label} status=${response.status} id=${messageId ?? "—"}`,
    );

    await finishLog(logId, true, {
      status: response.status,
      ...(messageId ? { messageId } : {}),
    });
    return {
      sent: true,
      logId,
      status: response.status,
      ...(messageId ? { messageId } : {}),
    };
  } catch (error) {
    const message = String((error as Error)?.message ?? error);
    await finishLog(logId, false, { error: message });
    return { sent: false, logId, error: message };
  }
}

/** Herverstuurt een mislukte mail op basis van de bewaarde payload. */
export async function resendEmailLog(logId: string): Promise<SendTransactionalResult> {
  const sql = db();
  const rows = (await sql`
    select id, recipient, payment_id, payload from public.email_logs where id = ${logId}::uuid limit 1
  `) as { id: string; recipient: string; payment_id: string | null; payload: TransactionalInput }[];
  const row = rows[0];
  if (!row) throw new Error("Onbekende logregel.");
  return sendTransactionalEmail({
    to: row.recipient,
    input: row.payload,
    paymentId: row.payment_id,
    logId: row.id,
  });
}
