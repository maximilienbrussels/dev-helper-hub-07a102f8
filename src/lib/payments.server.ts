/**
 * Uniforme betalingsrijen (`public.payments`) voor donaties, tickets,
 * facturen en hoevewinkelbestellingen. Elke rij draagt de unieke,
 * menselijk leesbare referentie die ook in de mail en op de factuur staat.
 */
import { db } from "@/lib/neon.server";
import { generateReference, type TransactionKind } from "@/lib/referenceGenerator";
import type { MailLanguage } from "@/lib/transactional-templates";

export type PaymentRow = {
  id: string;
  kind: TransactionKind;
  reference: string;
  stripe_payment_intent_id: string | null;
  status: "pending" | "paid" | "failed" | "refunded";
  amount_cent: number;
  vat_rate: string | number;
  customer_name: string | null;
  customer_email: string;
  lang: MailLanguage;
  description: string | null;
  metadata: Record<string, unknown>;
  paid_at: string | null;
  confirmation_sent_at: string | null;
  created_at: string;
};

export type CreatePaymentInput = {
  kind: TransactionKind;
  amountCent: number;
  customerEmail: string;
  customerName?: string | null;
  lang?: MailLanguage;
  vatRate?: number;
  description?: string | null;
  metadata?: Record<string, unknown>;
  reference?: string;
};

/** Maakt een `pending` betaling met unieke referentie (retry bij botsing). */
export async function createPendingPayment(input: CreatePaymentInput): Promise<PaymentRow> {
  const sql = db();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const reference = input.reference ?? generateReference(input.kind);
    try {
      const rows = (await sql`
        insert into public.payments
          (kind, reference, amount_cent, vat_rate, customer_email, customer_name, lang, description, metadata)
        values (
          ${input.kind}, ${reference}, ${input.amountCent}, ${input.vatRate ?? 21},
          ${input.customerEmail.toLowerCase()}, ${input.customerName ?? null},
          ${input.lang ?? "nl"}, ${input.description ?? null},
          ${JSON.stringify(input.metadata ?? {})}::jsonb
        )
        returning *
      `) as PaymentRow[];
      if (rows[0]) return rows[0];
    } catch (error) {
      const message = String((error as Error)?.message ?? error);
      if (!/duplicate key|unique/i.test(message) || input.reference) throw error;
    }
  }
  throw new Error("Kon geen unieke referentie genereren.");
}

export async function attachPaymentIntentToPayment(paymentId: string, intentId: string) {
  const sql = db();
  await sql`
    update public.payments
       set stripe_payment_intent_id = ${intentId}, updated_at = now()
     where id = ${paymentId}::uuid
  `;
}

/** Idempotent: geeft enkel een rij terug wanneer die nú naar `paid` ging. */
export async function markPaymentPaid(intentId: string): Promise<PaymentRow | null> {
  const sql = db();
  const rows = (await sql`
    update public.payments
       set status = 'paid', paid_at = coalesce(paid_at, now()), updated_at = now()
     where stripe_payment_intent_id = ${intentId} and status <> 'paid'
     returning *
  `) as PaymentRow[];
  return rows[0] ?? null;
}

export async function markPaymentFailed(intentId: string): Promise<void> {
  const sql = db();
  await sql`
    update public.payments
       set status = 'failed', updated_at = now()
     where stripe_payment_intent_id = ${intentId} and status = 'pending'
  `;
}

export async function markPaymentConfirmationSent(paymentId: string): Promise<void> {
  const sql = db();
  await sql`
    update public.payments
       set confirmation_sent_at = now(), updated_at = now()
     where id = ${paymentId}::uuid
  `;
}

export async function findPaymentByReference(reference: string): Promise<PaymentRow | null> {
  const sql = db();
  const rows = (await sql`
    select * from public.payments where reference = ${reference.toUpperCase()} limit 1
  `) as PaymentRow[];
  return rows[0] ?? null;
}
