/**
 * Tweestapsverificatie — server-only opslag, versleuteling en sms-verzending.
 */
import { db, hasDatabase, connectionString } from "./neon.server";

let schemaReady: Promise<boolean> | null = null;

export function ensureMfaSchema(): Promise<boolean> {
  if (!hasDatabase()) return Promise.resolve(false);
  schemaReady ??= (async () => {
    try {
      await db()`
        create table if not exists public.app_mfa (
          user_id uuid primary key references public.app_users (id) on delete cascade,
          totp_secret_enc text, totp_pending_enc text, totp_enabled_at timestamptz,
          phone text, phone_country text, phone_verified_at timestamptz, phone_method text,
          recovery_hashes text[] not null default '{}',
          updated_at timestamptz not null default now())`;
      await db()`
        create table if not exists public.app_mfa_codes (
          id uuid primary key default gen_random_uuid(),
          user_id uuid not null references public.app_users (id) on delete cascade,
          kind text not null, purpose text not null,
          code_hash text not null, code_plain text, phone text, country text,
          status text not null default 'pending', attempts int not null default 0,
          decided_by text, decided_at timestamptz, expires_at timestamptz not null,
          created_at timestamptz not null default now())`;
      await db()`alter table public.app_mfa_codes add column if not exists tg_chat_id bigint`;
      return true;
    } catch (e) {
      console.error("[mfa] schema mislukt", e);
      schemaReady = null;
      return false;
    }
  })();
  return schemaReady;
}

function rawSecret(): string {
  return (
    process.env["MFA_SECRET"] ||
    process.env["AUTH_JWT_SECRET"] ||
    process.env["JWT_SECRET"] ||
    connectionString() ||
    (() => {
      throw new Error("MFA_SECRET ontbreekt: tweestapsverificatie is niet veilig in te stellen.");
    })()
  );
}

async function aesKey(): Promise<CryptoKey> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`mfa:${rawSecret()}`));
  return crypto.subtle.importKey("raw", hash, "AES-GCM", false, ["encrypt", "decrypt"]);
}

const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export async function encrypt(plain: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await aesKey(), new TextEncoder().encode(plain)),
  );
  return `${b64(iv)}.${b64(ct)}`;
}

export async function decrypt(enc: string): Promise<string | null> {
  try {
    const [iv, ct] = enc.split(".");
    const pt = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: unb64(iv) as BufferSource },
      await aesKey(),
      unb64(ct) as BufferSource,
    );
    return new TextDecoder().decode(pt);
  } catch {
    return null;
  }
}

/** Gezouten hash voor codes (HMAC-SHA256 met de servergeheim). */
export async function hashCode(code: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(`code:${rawSecret()}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(code)));
  return Array.from(sig, (b) => b.toString(16).padStart(2, "0")).join("");
}

export type MfaRow = {
  user_id: string;
  totp_secret_enc: string | null;
  totp_pending_enc: string | null;
  totp_enabled_at: string | null;
  phone: string | null;
  phone_country: string | null;
  phone_verified_at: string | null;
  phone_method: string | null;
  recovery_hashes: string[];
};

export async function getMfaRow(userId: string): Promise<MfaRow | null> {
  await ensureMfaSchema();
  const rows = (await db()`select * from public.app_mfa where user_id = ${userId}::uuid`) as MfaRow[];
  return rows[0] ?? null;
}

export async function upsertMfa(userId: string, patch: Partial<Omit<MfaRow, "user_id">>): Promise<void> {
  await ensureMfaSchema();
  const cur = (await getMfaRow(userId)) ?? ({ recovery_hashes: [] } as unknown as MfaRow);
  const n = { ...cur, ...patch };
  await db()`
    insert into public.app_mfa (user_id, totp_secret_enc, totp_pending_enc, totp_enabled_at, phone,
      phone_country, phone_verified_at, phone_method, recovery_hashes, updated_at)
    values (${userId}::uuid, ${n.totp_secret_enc ?? null}, ${n.totp_pending_enc ?? null},
      ${n.totp_enabled_at ?? null}, ${n.phone ?? null}, ${n.phone_country ?? null},
      ${n.phone_verified_at ?? null}, ${n.phone_method ?? null}, ${n.recovery_hashes ?? []}, now())
    on conflict (user_id) do update set
      totp_secret_enc = excluded.totp_secret_enc, totp_pending_enc = excluded.totp_pending_enc,
      totp_enabled_at = excluded.totp_enabled_at, phone = excluded.phone,
      phone_country = excluded.phone_country, phone_verified_at = excluded.phone_verified_at,
      phone_method = excluded.phone_method, recovery_hashes = excluded.recovery_hashes,
      updated_at = now()`;
}

export async function passkeyCount(userId: string): Promise<number> {
  try {
    const rows = (await db()`
      select count(*)::int as n from public.webauthn_credentials where user_id = ${userId}::uuid`) as {
      n: number;
    }[];
    return rows[0]?.n ?? 0;
  } catch {
    return 0;
  }
}

export type MfaMethods = { passkey: boolean; totp: boolean; phone: boolean };

export async function methodsFor(userId: string): Promise<MfaMethods> {
  const [row, pk] = await Promise.all([getMfaRow(userId).catch(() => null), passkeyCount(userId)]);
  return {
    passkey: pk > 0,
    totp: Boolean(row?.totp_enabled_at && row.totp_secret_enc),
    phone: Boolean(row?.phone_verified_at),
  };
}

export async function hasAnyFactor(userId: string): Promise<boolean> {
  const m = await methodsFor(userId);
  return m.passkey || m.totp || m.phone;
}

/** Stuurt een sms via de eigen Android SMS-gateway (sms-gate.app); gegevens enkel uit geheime instellingen. */
const SMS_API_URL = "https://api.sms-gate.app/3rdparty/v1/messages";

function smsGatewayConfig(): { url: string; auth: string } {
  let url = (process.env["SMS_GATEWAY_URL"] || "").trim();
  // Enkel het serveradres opgegeven (bv. https://sms-gate.app) → officieel API-pad.
  if (!url || !/\/3rdparty\/v1\/messages?$/.test(url)) url = SMS_API_URL;
  const token = (process.env["SMS_GATEWAY_TOKEN"] || "").trim();
  const user = process.env["SMS_GATEWAY_USERNAME"];
  const pass = process.env["SMS_GATEWAY_PASSWORD"];
  let auth: string;
  if (user && pass) auth = `Basic ${btoa(`${user}:${pass}`)}`;
  else if (token.includes(":")) auth = `Basic ${btoa(token)}`;
  else if (token) auth = `Bearer ${token}`;
  else throw new Error("Sms-verzending is nog niet ingesteld.");
  return { url, auth };
}

export async function sendSms(to: string, message: string): Promise<void> {
  const { url, auth } = smsGatewayConfig();
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: auth },
    body: JSON.stringify({ textMessage: { text: message }, phoneNumbers: [to] }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[mfa] sms-gateway ${res.status}: ${body.slice(0, 300)}`);
    throw new Error("De sms kon niet verstuurd worden. Probeer het straks opnieuw.");
  }
}

export async function createCode(input: {
  userId: string;
  kind: "sms" | "intl" | "telegram";
  purpose: "setup" | "login";
  code: string;
  phone?: string | null;
  country?: string | null;
  ttlSeconds: number;
}): Promise<string> {
  await ensureMfaSchema();
  // Oudere openstaande codes van dit soort vervallen meteen.
  await db()`
    update public.app_mfa_codes set status = 'used'
    where user_id = ${input.userId}::uuid and kind = ${input.kind} and status = 'pending'`;
  const rows = (await db()`
    insert into public.app_mfa_codes (user_id, kind, purpose, code_hash, code_plain, phone, country, expires_at)
    values (${input.userId}::uuid, ${input.kind}, ${input.purpose}, ${await hashCode(input.code)},
      ${input.kind === "intl" ? input.code : null}, ${input.phone ?? null}, ${input.country ?? null},
      now() + make_interval(secs => ${input.ttlSeconds}))
    returning id`) as { id: string }[];
  return rows[0].id;
}

export type CodeRow = {
  id: string;
  user_id: string;
  kind: string;
  purpose: string;
  code_hash: string;
  phone: string | null;
  country: string | null;
  status: string;
  attempts: number;
  expires_at: string;
};

export async function latestPendingSms(userId: string): Promise<CodeRow | null> {
  await ensureMfaSchema();
  const rows = (await db()`
    select * from public.app_mfa_codes
    where user_id = ${userId}::uuid and kind = 'sms' and status = 'pending'
    order by created_at desc limit 1`) as CodeRow[];
  return rows[0] ?? null;
}

export async function getCode(id: string, userId: string): Promise<CodeRow | null> {
  await ensureMfaSchema();
  const rows = (await db()`
    select * from public.app_mfa_codes where id = ${id}::uuid and user_id = ${userId}::uuid`) as CodeRow[];
  return rows[0] ?? null;
}

export async function setCodeStatus(id: string, status: string, attemptsInc = 0): Promise<void> {
  await db()`
    update public.app_mfa_codes set status = ${status}, attempts = attempts + ${attemptsInc}
    where id = ${id}::uuid`;
}

export async function bumpAttempts(id: string): Promise<void> {
  await db()`update public.app_mfa_codes set attempts = attempts + 1 where id = ${id}::uuid`;
}

/* ------------------------------ WhatsApp (Green-API) ------------------------------ */

export function whatsappConfigured(): boolean {
  return Boolean(process.env["GREEN_API_INSTANCE_ID"] && process.env["GREEN_API_TOKEN"]);
}

/** Stuurt een WhatsApp-bericht via een Green-API-instantie (gratis ontwikkelaarsplan). */
export async function sendWhatsapp(toE164: string, message: string): Promise<void> {
  const id = process.env["GREEN_API_INSTANCE_ID"];
  const token = process.env["GREEN_API_TOKEN"];
  if (!id || !token) throw new Error("WhatsApp-verzending is nog niet ingesteld.");
  const base = (process.env["GREEN_API_URL"] || "https://api.green-api.com").replace(/\/$/, "");
  const res = await fetch(`${base}/waInstance${id}/sendMessage/${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatId: `${toE164.replace(/\D/g, "")}@c.us`, message }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[mfa] green-api ${res.status}: ${body.slice(0, 300)}`);
    throw new Error("Het WhatsApp-bericht kon niet verstuurd worden. Probeer het straks opnieuw.");
  }
}

/* ---------------------------------- Telegram ---------------------------------- */

export const TELEGRAM_BOT_USERNAME = "Maximiliebot";

export async function telegramWebhookSecret(): Promise<string> {
  const key = process.env["TELEGRAM_API_KEY"];
  if (!key) throw new Error("TELEGRAM_API_KEY ontbreekt");
  const h = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`telegram-webhook:${key}`)));
  return btoa(String.fromCharCode(...h)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function telegramCall(method: string, body: unknown): Promise<void> {
  const lk = process.env["LOVABLE_API_KEY"];
  const tk = process.env["TELEGRAM_API_KEY"];
  if (!lk || !tk) throw new Error("Telegram is niet gekoppeld.");
  const res = await fetch(`https://connector-gateway.lovable.dev/telegram/${method}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${lk}`, "X-Connection-Api-Key": tk, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) console.error(`[telegram] ${method} ${res.status}: ${(await res.text().catch(() => "")).slice(0, 300)}`);
}

export function normalizeE164(raw: string): string | null {
  const d = raw.replace(/[^\d+]/g, "").replace(/^00/, "+");
  const digits = d.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return null;
  return `+${digits}`;
}
