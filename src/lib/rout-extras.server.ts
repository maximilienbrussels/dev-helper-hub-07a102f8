/**
 * ROUT-uitbreidingen (server-only): handle-synchronisatie, Rich Identity,
 * webhook-idempotentie en de Badge Issuance API.
 */
import { db, hasDatabase } from "./neon.server";
import { ROUT_CLIENT_ID } from "./rout-oidc.server";
import { backoffMs, classifyBadgeStatus, normalizeHandle } from "./rout-shared";

let ready: Promise<boolean> | null = null;
export function ensureRoutExtrasSchema(): Promise<boolean> {
  ready ??= (async () => {
    if (!hasDatabase()) return false;
    try {
      const sql = db();
      await sql`alter table public.app_users add column if not exists username text`;
      await sql`alter table public.app_users add column if not exists rout_public_activity jsonb`;
      await sql`create unique index if not exists app_users_username_key on public.app_users (lower(username)) where username is not null`;
      await sql`create table if not exists public.rout_webhook_events (
        id text primary key, type text not null, received_at timestamptz not null default now())`;
      await sql`create table if not exists public.issued_badges (
        id uuid primary key default gen_random_uuid(),
        recipient_handle text not null, badge_slug text not null,
        issue_date date not null default current_date, metadata jsonb,
        rout_badge_id text, status text not null default 'pending', last_error text,
        idempotency_key uuid not null unique, issued_by uuid,
        created_at timestamptz not null default now())`;
      return true;
    } catch (error) {
      console.error("[rout] extra schema mislukt:", error);
      ready = null;
      return false;
    }
  })();
  return ready;
}

/**
 * Zet `username = rout_handle` voor de gebruiker met dit rout_id. Een andere
 * rij die nog dezelfde (verouderde) naam draagt, wordt in dezelfde transactie
 * eerst vrijgemaakt.
 */
export async function syncRoutHandle(sub: string, rawHandle: unknown): Promise<boolean> {
  const handle = normalizeHandle(rawHandle);
  if (!handle || !(await ensureRoutExtrasSchema())) return false;
  const sql = db();
  await sql.transaction([
    sql`update public.app_users set username = null
         where lower(username) = ${handle} and rout_id is distinct from ${sub}`,
    sql`update public.app_users set username = ${handle}, updated_at = now() where rout_id = ${sub}`,
  ]);
  return true;
}

/** Rich Identity: overschrijven bij elke login, wissen als de claim ontbreekt. */
export async function storePublicActivity(sub: string, activity: unknown): Promise<void> {
  if (!(await ensureRoutExtrasSchema())) return;
  const list = Array.isArray(activity)
    ? activity
        .filter((a): a is Record<string, unknown> => !!a && typeof a === "object")
        .slice(0, 50)
        .map((a) => ({
          kind: String(a["kind"] ?? "").slice(0, 60),
          title: String(a["title"] ?? "").slice(0, 300),
          occurred_at: String(a["occurred_at"] ?? "").slice(0, 40),
        }))
    : null;
  await db()`update public.app_users set rout_public_activity = ${list ? JSON.stringify(list) : null}::jsonb
              where rout_id = ${sub}`;
}

/** Bewaart het event-id; false = al eerder verwerkt. */
export async function claimWebhookEvent(id: string, type: string): Promise<boolean> {
  if (!(await ensureRoutExtrasSchema())) throw new Error("Databank niet bereikbaar");
  const rows = (await db()`insert into public.rout_webhook_events (id, type) values (${id}, ${type})
                           on conflict (id) do nothing returning id`) as unknown[];
  return rows.length > 0;
}

export function routBadgesEnabled(): boolean {
  return ["1", "true", "yes", "on"].includes(String(process.env["ROUT_BADGES_ENABLED"] ?? "").toLowerCase());
}

export type BadgeInput = {
  recipient_handle: string;
  badge_slug: string;
  issue_date: string;
  metadata: { title: string; description?: string; verification_url?: string };
  idempotency_key?: string;
};

export type BadgeResult =
  | { ok: true; id: string; rout_badge_id: string | null; idempotency_key: string }
  | { ok: false; code: "disabled" | "not_configured" | "not_found" | "auth" | "unavailable" | "rejected"; message: string; idempotency_key?: string };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Geeft een badge uit op het ROUT-profiel; herhaalt 429/5xx met dezelfde Idempotency-Key. */
export async function issueRoutBadge(input: BadgeInput, issuedBy: string | null): Promise<BadgeResult> {
  if (!routBadgesEnabled()) return { ok: false, code: "disabled", message: "ROUT-badges staan uit (ROUT_BADGES_ENABLED)." };
  const apiKey = process.env["ROUT_API_KEY"];
  if (!apiKey) return { ok: false, code: "not_configured", message: "De ROUT API-sleutel ontbreekt." };
  if (!(await ensureRoutExtrasSchema())) return { ok: false, code: "unavailable", message: "Databank niet bereikbaar." };

  const sql = db();
  const key = input.idempotency_key ?? crypto.randomUUID();
  const handle = normalizeHandle(input.recipient_handle) ?? input.recipient_handle;
  const rows = (await sql`
    insert into public.issued_badges (recipient_handle, badge_slug, issue_date, metadata, idempotency_key, issued_by)
    values (${handle}, ${input.badge_slug}, ${input.issue_date}, ${JSON.stringify(input.metadata)}::jsonb, ${key}, ${issuedBy})
    on conflict (idempotency_key) do update set recipient_handle = excluded.recipient_handle
    returning id, rout_badge_id, status`) as { id: string; rout_badge_id: string | null; status: string }[];
  const row = rows[0]!;
  if (row.status === "issued") return { ok: true, id: String(row.id), rout_badge_id: row.rout_badge_id, idempotency_key: key };

  const body = JSON.stringify({
    recipient_handle: handle,
    badge_slug: input.badge_slug,
    issue_date: input.issue_date,
    metadata: input.metadata,
  });
  const fail = async (code: Exclude<BadgeResult, { ok: true }>["code"], message: string): Promise<BadgeResult> => {
    await sql`update public.issued_badges set status = 'failed', last_error = ${message} where id = ${row.id}`;
    return { ok: false, code, message, idempotency_key: key };
  };

  for (let attempt = 1; attempt <= 5; attempt++) {
    let res: Response;
    try {
      res = await fetch("https://rout.be/api/v1/badges/issue", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Idempotency-Key": key,
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Client-Id": ROUT_CLIENT_ID,
        },
        body,
      });
    } catch (error) {
      console.error("[rout-badges] netwerkfout, poging", attempt, error);
      if (attempt < 5) { await sleep(backoffMs(attempt)); continue; }
      return fail("unavailable", "ROUT is niet bereikbaar. Probeer het later opnieuw.");
    }
    const kind = classifyBadgeStatus(res.status);
    if (kind === "created") {
      const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      const badgeId = String(json["id"] ?? (json["badge"] as Record<string, unknown> | undefined)?.["id"] ?? "") || null;
      await sql`update public.issued_badges set status = 'issued', rout_badge_id = ${badgeId}, last_error = null where id = ${row.id}`;
      return { ok: true, id: String(row.id), rout_badge_id: badgeId, idempotency_key: key };
    }
    if (kind === "not_found") return fail("not_found", "Deze ROUT-handle bestaat niet.");
    if (kind === "auth") {
      console.error("[rout-badges] ALERT: API-sleutel ongeldig of zonder rechten", res.status);
      return fail("auth", "De ROUT API-sleutel is ongeldig of heeft geen toestemming.");
    }
    if (kind === "retry" && attempt < 5) {
      const ra = Number(res.headers.get("retry-after"));
      await sleep(Number.isFinite(ra) && ra > 0 ? Math.min(ra * 1000, 8000) : backoffMs(attempt));
      continue;
    }
    const text = await res.text().catch(() => "");
    console.error("[rout-badges] geweigerd:", res.status, text.slice(0, 300));
    return fail(kind === "retry" ? "unavailable" : "rejected", kind === "retry" ? "ROUT is tijdelijk overbelast. Probeer het later opnieuw." : `ROUT weigerde de badge (${res.status}).`);
  }
  return fail("unavailable", "ROUT is niet bereikbaar.");
}

export async function listIssuedBadges(limit = 50) {
  if (!(await ensureRoutExtrasSchema())) return [];
  return (await db()`select id, recipient_handle, badge_slug, issue_date, rout_badge_id, status, last_error, idempotency_key, created_at
                     from public.issued_badges order by created_at desc limit ${limit}`) as {
    id: string; recipient_handle: string; badge_slug: string; issue_date: string; rout_badge_id: string | null;
    status: string; last_error: string | null; idempotency_key: string; created_at: string;
  }[];
}
