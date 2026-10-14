/**
 * Veilige e-mailwijziging (server-only).
 *
 * Het e-mailadres is een gewoon profielveld: het interne UUID van de
 * gebruiker blijft ongewijzigd, dus reservaties, Hoefjes, badges en historiek
 * blijven gekoppeld. De wijziging gaat pas door nadat de eigenaar van het
 * nieuwe adres de bevestigingslink volgt.
 */
import { db, hasDatabase } from "./neon.server";
import { ensureAuthSchema, normalizeEmail, randomToken } from "./local-auth.server";

const TTL_SECONDS = 24 * 3600;

let ready: Promise<boolean> | null = null;

export function ensureEmailChangeSchema(): Promise<boolean> {
  ready ??= (async () => {
    if (!hasDatabase() || !(await ensureAuthSchema())) return false;
    try {
      await db()`
        create table if not exists public.app_user_email_changes (
          id uuid primary key default gen_random_uuid(),
          user_id uuid not null references public.app_users(id) on delete cascade,
          new_email text not null,
          token text not null unique,
          created_at timestamptz not null default now(),
          expires_at timestamptz not null,
          consumed_at timestamptz
        )`;
      return true;
    } catch (error) {
      console.error("[email-change] schema aanmaken mislukt:", error);
      return false;
    }
  })();
  return ready;
}

export type EmailChangeResult =
  | { ok: true }
  | { ok: false; reason: "db" | "in-use" | "same" | "mail" };

/** Maakt de aanvraag aan en stuurt de bevestigingslink naar het nieuwe adres. */
export async function requestEmailChange(
  userId: string,
  rawEmail: string,
): Promise<EmailChangeResult> {
  if (!(await ensureEmailChangeSchema())) return { ok: false, reason: "db" };
  const email = normalizeEmail(rawEmail);

  const current = (await db()`
    select email, name from public.app_users where id = ${userId} limit 1`) as {
    email: string;
    name: string | null;
  }[];
  if (!current[0]) return { ok: false, reason: "db" };
  if (normalizeEmail(current[0].email) === email) return { ok: false, reason: "same" };

  const taken = (await db()`
    select id from public.app_users where lower(email) = ${email} limit 1`) as { id: string }[];
  if (taken[0]) return { ok: false, reason: "in-use" };

  const token = randomToken();
  const expires = new Date(Date.now() + TTL_SECONDS * 1000).toISOString();
  await db()`delete from public.app_user_email_changes where user_id = ${userId} and consumed_at is null`;
  await db()`
    insert into public.app_user_email_changes (user_id, new_email, token, expires_at)
    values (${userId}, ${email}, ${token}, ${expires})`;

  try {
    const { requestOrigin } = await import("./auth-email.server");
    const { sendMail } = await import("./email.server");
    const origin = await requestOrigin();
    const url = `${origin}/e-mailadres-bevestigen?token=${encodeURIComponent(token)}`;
    const esc = (v: string) =>
      v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const naam = esc(String(current[0].name ?? ""));
    const result = await sendMail({
      to: email,
      subject: "Bevestig je nieuwe e-mailadres",
      html: `<p>Dag ${naam || "daar"},</p>
<p>Je vroeg om het e-mailadres van je account te wijzigen naar <strong>${esc(email)}</strong>.</p>
<p><a href="${url}">Bevestig je nieuwe e-mailadres</a></p>
<p>Deze link blijft 24 uur geldig. Heb je dit niet aangevraagd, dan mag je deze mail negeren.</p>`,
      text: `Bevestig je nieuwe e-mailadres: ${url}\n\nDeze link blijft 24 uur geldig.`,
      transactional: true,
      kind: "auth-email-change",
    });
    if (!result.sent) {
      console.error("[email-change] mail niet verzonden:", result.reason, result.error);
      return { ok: false, reason: "mail" };
    }
  } catch (error) {
    console.error("[email-change] mail mislukt:", error);
    return { ok: false, reason: "mail" };
  }

  return { ok: true };
}

/** Verzilvert de bevestigingslink: enkel het profielveld verandert. */
export async function confirmEmailChange(
  token: string,
): Promise<{ ok: boolean; email?: string; reason?: "invalid" | "expired" | "in-use" | "db" }> {
  if (!(await ensureEmailChangeSchema())) return { ok: false, reason: "db" };
  const rows = (await db()`
    select id, user_id, new_email, expires_at, consumed_at
      from public.app_user_email_changes
     where token = ${token}
     limit 1`) as {
    id: string;
    user_id: string;
    new_email: string;
    expires_at: string | Date;
    consumed_at: string | Date | null;
  }[];
  const row = rows[0];
  if (!row || row.consumed_at) return { ok: false, reason: "invalid" };
  if (new Date(row.expires_at).getTime() < Date.now()) return { ok: false, reason: "expired" };

  const taken = (await db()`
    select id from public.app_users where lower(email) = ${row.new_email} limit 1`) as {
    id: string;
  }[];
  if (taken[0] && String(taken[0].id) !== String(row.user_id)) {
    return { ok: false, reason: "in-use" };
  }

  await db()`
    update public.app_users
       set email = ${row.new_email},
           email_verified_at = now(),
           updated_at = now()
     where id = ${row.user_id}`;
  await db()`
    update public.app_user_email_changes set consumed_at = now() where id = ${row.id}`;
  return { ok: true, email: row.new_email };
}
