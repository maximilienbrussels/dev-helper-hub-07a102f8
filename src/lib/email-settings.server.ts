/**
 * Mailinstellingen (globaal vangnetadres) + logboek van élke formulierinzending.
 *
 * Werking:
 *  1. Elke inzending wordt éérst in `form_submissions` bewaard (status
 *     `email_pending`), zodat een bericht nooit verloren gaat wanneer Brevo
 *     onbereikbaar is.
 *  2. De melding gaat naar de ontvangers van de gekozen categorie. Mislukt dat,
 *     dan volgt automatisch een tweede poging naar het globale vangnetadres met
 *     `[HERSTEL/FALLBACK]` in het onderwerp (status `fallback_used`).
 *  3. Lukt ook dat niet, dan blijft de inzending staan met status `email_failed`
 *     en kan een beheerder ze opnieuw versturen vanuit het portaal.
 *
 * Server-only: dit bestand eindigt op `.server.ts` en komt nooit in de browser.
 */
import { CONTACT_EMAIL } from "./contact-emails";

export const DEFAULT_FALLBACK_EMAIL = CONTACT_EMAIL;

/**
 * Statussen van een inzending. De eerste vier zijn de huidige waarden; de
 * oudere ("email_pending", "sent", "fallback_used", "email_failed") blijven
 * geldig voor rijen die al in de databank staan.
 */
export type SubmissionStatus =
  | "pending"
  | "sent_brevo"
  | "sent_smtp_fallback"
  | "failed"
  | "email_pending"
  | "sent"
  | "fallback_used"
  | "email_failed";

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type FormSubmission = {
  id: string;
  form: string;
  category: string | null;
  name: string | null;
  email: string | null;
  subject: string | null;
  message: string | null;
  recipients: string[];
  status: SubmissionStatus;
  error: string | null;
  transport: string | null;
  payload: Record<string, JsonValue>;
  created_at: string;
};

/** Zorgt dat beide tabellen bestaan (goedkoop, idempotent). */
export async function ensureEmailTables(): Promise<boolean> {
  const { db, hasDatabase } = await import("./neon.server");
  if (!hasDatabase()) return false;
  const sql = db();
  await sql`
    create table if not exists email_settings (
      key text primary key,
      value text not null default '',
      updated_at timestamptz not null default now(),
      updated_by text
    )
  `;
  await sql`
    create table if not exists form_submissions (
      id uuid primary key default gen_random_uuid(),
      form text not null,
      category text,
      name text,
      email text,
      subject text,
      message text,
      payload jsonb not null default '{}'::jsonb,
      recipients text[] not null default '{}',
      status text not null default 'pending',
      error text,
      error_log text,
      transport text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `;
  await sql`alter table form_submissions add column if not exists transport text`;
  await sql`alter table form_submissions add column if not exists error_log text`;
  await sql`create index if not exists form_submissions_created_idx on form_submissions (created_at desc)`;
  await sql`create index if not exists form_submissions_status_idx on form_submissions (status)`;
  await sql`create index if not exists form_submissions_form_idx on form_submissions (form)`;
  return true;
}

/** Het globale vangnetadres; nooit leeg. */
export async function fallbackEmail(): Promise<string> {
  try {
    const { db, hasDatabase } = await import("./neon.server");
    if (!hasDatabase()) return DEFAULT_FALLBACK_EMAIL;
    const rows = (await db()`
      select value from email_settings where key = 'fallback_email' limit 1
    `) as Array<{ value: string | null }>;
    const value = rows[0]?.value?.trim();
    return value || DEFAULT_FALLBACK_EMAIL;
  } catch (err) {
    console.warn(`[email-settings] vangnetadres niet leesbaar: ${(err as Error).message}`);
    return DEFAULT_FALLBACK_EMAIL;
  }
}

/** Bewaart het globale vangnetadres. */
export async function saveFallbackEmail(email: string, updatedBy: string): Promise<void> {
  const ready = await ensureEmailTables();
  if (!ready) throw new Error("De databank is niet verbonden — het adres kan niet bewaard worden.");
  const { db } = await import("./neon.server");
  await db()`
    insert into email_settings (key, value, updated_at, updated_by)
    values ('fallback_email', ${email}, now(), ${updatedBy})
    on conflict (key) do update set value = excluded.value, updated_at = now(), updated_by = excluded.updated_by
  `;
}

/** Bewaart een inzending vóór de verzending. Geeft het id terug (of null). */
export async function logSubmission(input: {
  form: string;
  category?: string;
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  payload?: Record<string, unknown>;
}): Promise<string | null> {
  try {
    const ready = await ensureEmailTables();
    if (!ready) return null;
    const { db } = await import("./neon.server");
    const rows = (await db()`
      insert into form_submissions (form, category, name, email, subject, message, payload, status)
      values (${input.form}, ${input.category ?? null}, ${input.name ?? null}, ${input.email ?? null},
              ${input.subject ?? null}, ${input.message ?? null}, ${JSON.stringify(input.payload ?? {})}, 'pending')
      returning id
    `) as Array<{ id: string }>;
    return rows[0]?.id ?? null;
  } catch (err) {
    console.warn(`[form-submissions] opslaan mislukt: ${(err as Error).message}`);
    return null;
  }
}

/** Werkt de status van een inzending bij. */
export async function markSubmission(
  id: string | null,
  status: SubmissionStatus,
  extra?: { recipients?: string[]; error?: string | null; transport?: string | null },
): Promise<void> {
  if (!id) return;
  try {
    const { db, hasDatabase } = await import("./neon.server");
    if (!hasDatabase()) return;
    await db()`
      update form_submissions
         set status = ${status},
             recipients = coalesce(${extra?.recipients ?? null}, recipients),
             error = ${extra?.error ?? null},
              error_log = ${extra?.error ?? null},
             transport = coalesce(${extra?.transport ?? null}, transport),
             updated_at = now()
       where id = ${id}
    `;
  } catch (err) {
    console.warn(`[form-submissions] status bijwerken mislukt: ${(err as Error).message}`);
  }
}

export type SubmissionFilter = {
  limit?: number;
  /** Formuliersoort: contact, verhuur, webshop, academie … */
  form?: string;
  status?: string;
  /** Vrij zoeken op naam, e-mail, onderwerp of bericht. */
  query?: string;
  /** Enkel inzendingen vanaf deze datum (ISO). */
  since?: string;
};

/** Recente inzendingen voor het beheerportaal, met filters. */
export async function listSubmissions(
  filter: number | SubmissionFilter = 50,
): Promise<FormSubmission[]> {
  const f: SubmissionFilter = typeof filter === "number" ? { limit: filter } : filter;
  const ready = await ensureEmailTables();
  if (!ready) return [];
  const { db } = await import("./neon.server");
  const limit = Math.min(Math.max(f.limit ?? 50, 1), 500);
  const form = f.form?.trim() || null;
  const status = f.status?.trim() || null;
  const query = f.query?.trim() ? `%${f.query.trim()}%` : null;
  const since = f.since?.trim() || null;
  const rows = (await db()`
    select id, form, category, name, email, subject, message, payload, recipients,
           status, error, transport, created_at
      from form_submissions
     where (${form}::text is null or form = ${form})
       and (${status}::text is null or status = ${status})
       and (${since}::timestamptz is null or created_at >= ${since}::timestamptz)
       and (${query}::text is null or
            coalesce(name, '') ilike ${query} or
            coalesce(email, '') ilike ${query} or
            coalesce(subject, '') ilike ${query} or
            coalesce(message, '') ilike ${query})
     order by created_at desc
     limit ${limit}
  `) as Array<Record<string, unknown>>;
  return rows.map((r) => ({
    id: String(r["id"]),
    form: String(r["form"] ?? ""),
    category: (r["category"] as string | null) ?? null,
    name: (r["name"] as string | null) ?? null,
    email: (r["email"] as string | null) ?? null,
    subject: (r["subject"] as string | null) ?? null,
    message: (r["message"] as string | null) ?? null,
    recipients: (r["recipients"] as string[] | null) ?? [],
    status: (r["status"] as SubmissionStatus) ?? "pending",
    error: (r["error"] as string | null) ?? null,
    transport: (r["transport"] as string | null) ?? null,
    payload: (r["payload"] as Record<string, JsonValue> | null) ?? {},
    created_at: new Date(r["created_at"] as string).toISOString(),
  }));
}

/** Eén inzending ophalen (voor herversturen). */
export async function getSubmission(id: string): Promise<FormSubmission | null> {
  const ready = await ensureEmailTables();
  if (!ready) return null;
  const { db } = await import("./neon.server");
  const found = (await db()`
    select id, form, category, name, email, subject, message, payload, recipients,
           status, error, transport, created_at
      from form_submissions where id = ${id} limit 1
  `) as Array<Record<string, unknown>>;
  const r = found[0];
  if (!r) return null;
  return {
    id: String(r["id"]),
    form: String(r["form"] ?? ""),
    category: (r["category"] as string | null) ?? null,
    name: (r["name"] as string | null) ?? null,
    email: (r["email"] as string | null) ?? null,
    subject: (r["subject"] as string | null) ?? null,
    message: (r["message"] as string | null) ?? null,
    recipients: (r["recipients"] as string[] | null) ?? [],
    status: (r["status"] as SubmissionStatus) ?? "pending",
    error: (r["error"] as string | null) ?? null,
    transport: (r["transport"] as string | null) ?? null,
    payload: (r["payload"] as Record<string, JsonValue> | null) ?? {},
    created_at: new Date(r["created_at"] as string).toISOString(),
  };
}

/** Corrigeert het adres van de inzender (bv. een tikfout) voor een herverzending. */
export async function updateSubmissionEmail(id: string, email: string): Promise<boolean> {
  const ready = await ensureEmailTables();
  if (!ready) return false;
  const { db } = await import("./neon.server");
  await db()`update form_submissions set email = ${email}, updated_at = now() where id = ${id}`;
  return true;
}

/** Verwijdert één inzending definitief uit het logboek. */
export async function deleteSubmission(id: string): Promise<boolean> {
  const ready = await ensureEmailTables();
  if (!ready) return false;
  const { db } = await import("./neon.server");
  await db()`delete from form_submissions where id = ${id}`;
  return true;
}

/** Ruimt in één keer alle mislukte óf alle verstuurde rijen op. */
export async function cleanupSubmissions(scope: "failed" | "sent"): Promise<number> {
  const ready = await ensureEmailTables();
  if (!ready) return 0;
  const { db } = await import("./neon.server");
  const statuses =
    scope === "failed"
      ? ["failed", "email_failed"]
      : ["sent", "sent_brevo", "sent_smtp_fallback", "fallback_used"];
  const rows = (await db()`
    delete from form_submissions where status = any(${statuses}) returning id
  `) as Array<{ id: string }>;
  return rows.length;
}

export type DeliveryOutcome = {
  status: SubmissionStatus;
  recipients: string[];
  fallbackUsed: boolean;
  error?: string;
};

/**
 * Verstuurt een beheerdersmelding met automatisch herstel: mislukt de gekozen
 * inbox, dan volgt één poging naar het globale vangnetadres.
 */
export async function deliverAdminNotice(opts: {
  recipients: string[];
  subject: string;
  html: string;
  replyTo?: string;
  kind: string;
}): Promise<DeliveryOutcome> {
  const { sendMail } = await import("./email.server");
  const fallback = await fallbackEmail();

  let firstError = "";
  try {
    const res = await sendMail({
      to: opts.recipients,
      subject: opts.subject,
      html: opts.html,
      ...(opts.replyTo ? { replyTo: opts.replyTo } : {}),
      kind: opts.kind,
    });
    if (res.sent) return { status: "sent", recipients: opts.recipients, fallbackUsed: false };
    firstError = res.error || res.reason || "onbekende fout";
  } catch (err) {
    firstError = (err as Error).message;
  }

  console.error(`[email] melding "${opts.kind}" mislukt (${firstError}) — herstel via ${fallback}`);

  const alreadyFallback = opts.recipients.map((r) => r.toLowerCase()).includes(fallback.toLowerCase());
  if (alreadyFallback) {
    return { status: "email_failed", recipients: opts.recipients, fallbackUsed: false, error: firstError };
  }

  try {
    const retry = await sendMail({
      to: [fallback],
      subject: `[HERSTEL/FALLBACK] ${opts.subject}`,
      html: opts.html,
      ...(opts.replyTo ? { replyTo: opts.replyTo } : {}),
      kind: `${opts.kind}:fallback`,
    });
    if (retry.sent) {
      return { status: "fallback_used", recipients: [fallback], fallbackUsed: true, error: firstError };
    }
    return {
      status: "email_failed",
      recipients: opts.recipients,
      fallbackUsed: false,
      error: `${firstError} — vangnet: ${retry.error || retry.reason || "mislukt"}`,
    };
  } catch (err) {
    return {
      status: "email_failed",
      recipients: opts.recipients,
      fallbackUsed: false,
      error: `${firstError} — vangnet: ${(err as Error).message}`,
    };
  }
}
