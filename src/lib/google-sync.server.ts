/**
 * Google-synchronisatie (server-only).
 *
 * Bewaart de OAuth-tokens per gebruiker in Postgres (`user_tokens`), vernieuwt
 * verlopen access tokens automatisch en synchroniseert de agenda.
 */
import { googleCredentials, GOOGLE_TOKEN_ENDPOINT, type GoogleTokens } from "./google-oauth.server";

const CALENDAR_API = "https://www.googleapis.com/calendar/v3";

export class GoogleSyncError extends Error {
  code: string;
  status: number;
  constructor(message: string, code: string, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

/** Eenvoudige, sleutelgebaseerde versleuteling voor tokens in rust. */
async function cryptoKey(): Promise<CryptoKey | null> {
  const secret = process.env["TOKEN_ENCRYPTION_KEY"] ?? process.env["AUTH_SECRET"] ?? "";
  if (!secret) return null;
  const material = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", material, "AES-GCM", false, ["encrypt", "decrypt"]);
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function encryptSecret(value: string): Promise<string> {
  const key = await cryptoKey();
  if (!key) return `plain:${value}`;
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(value),
  );
  return `enc:${toBase64(iv)}:${toBase64(new Uint8Array(data))}`;
}

export async function decryptSecret(stored: string): Promise<string | null> {
  if (stored.startsWith("plain:")) return stored.slice(6);
  if (!stored.startsWith("enc:")) return stored;
  const key = await cryptoKey();
  if (!key) return null;
  const [, iv, payload] = stored.split(":");
  if (!iv || !payload) return null;
  try {
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64(iv) },
      key,
      fromBase64(payload),
    );
    return new TextDecoder().decode(plain);
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------- opslaglaag */

async function sqlClient() {
  const { db, hasDatabase } = await import("./neon.server");
  if (!hasDatabase()) return null;
  const sql = db();
  await sql`
    create table if not exists user_tokens (
      user_id uuid not null,
      provider text not null,
      access_token text,
      refresh_token text,
      scope text,
      expires_at timestamptz,
      last_sync_at timestamptz,
      last_status text,
      last_message text,
      updated_at timestamptz not null default now(),
      primary key (user_id, provider)
    )
  `;
  return sql;
}

export type StoredTokens = {
  userId: string;
  accessToken: string | null;
  refreshToken: string | null;
  scope: string | null;
  expiresAt: string | null;
  lastSyncAt: string | null;
  lastStatus: string | null;
  lastMessage: string | null;
};

/** Bewaart (versleutelde) tokens; een leeg refresh_token overschrijft het oude niet. */
export async function saveGoogleTokens(userId: string, tokens: GoogleTokens): Promise<void> {
  if (!userId || (!tokens.accessToken && !tokens.refreshToken)) return;
  const sql = await sqlClient();
  if (!sql) return;
  const access = tokens.accessToken ? await encryptSecret(tokens.accessToken) : null;
  const refresh = tokens.refreshToken ? await encryptSecret(tokens.refreshToken) : null;
  try {
    await sql`
      insert into user_tokens (user_id, provider, access_token, refresh_token, scope, expires_at, updated_at)
      values (${userId}::uuid, 'google', ${access}, ${refresh}, ${tokens.scope}, ${tokens.expiresAt}, now())
      on conflict (user_id, provider) do update
        set access_token = coalesce(excluded.access_token, user_tokens.access_token),
            refresh_token = coalesce(excluded.refresh_token, user_tokens.refresh_token),
            scope = coalesce(excluded.scope, user_tokens.scope),
            expires_at = excluded.expires_at,
            updated_at = now()
    `;
  } catch (error) {
    console.error("[google-sync] tokens bewaren mislukt:", error);
  }
}

export async function readGoogleTokens(userId: string): Promise<StoredTokens | null> {
  const sql = await sqlClient();
  if (!sql || !userId) return null;
  const rows = (await sql`
    select access_token, refresh_token, scope, expires_at, last_sync_at, last_status, last_message
    from user_tokens where user_id = ${userId}::uuid and provider = 'google'
  `) as Array<Record<string, string | null>>;
  const row = rows[0];
  if (!row) return null;
  return {
    userId,
    accessToken: row["access_token"] ? await decryptSecret(row["access_token"]) : null,
    refreshToken: row["refresh_token"] ? await decryptSecret(row["refresh_token"]) : null,
    scope: row["scope"] ?? null,
    expiresAt: row["expires_at"] ? new Date(row["expires_at"]).toISOString() : null,
    lastSyncAt: row["last_sync_at"] ? new Date(row["last_sync_at"]).toISOString() : null,
    lastStatus: row["last_status"] ?? null,
    lastMessage: row["last_message"] ?? null,
  };
}

async function recordGoogleSync(userId: string, ok: boolean, message: string) {
  const sql = await sqlClient();
  if (!sql) return;
  await sql`
    update user_tokens
       set last_sync_at = now(), last_status = ${ok ? "ok" : "error"}, last_message = ${message}
     where user_id = ${userId}::uuid and provider = 'google'
  `;
}

/* ---------------------------------------------------------------- refresh */

/** Geeft een geldig access token terug en vernieuwt het indien nodig. */
export async function getValidAccessToken(userId: string): Promise<string> {
  const creds = googleCredentials();
  if (!creds) throw new GoogleSyncError("Google is niet geconfigureerd.", "not_configured", 503);

  const stored = await readGoogleTokens(userId);
  if (!stored) {
    throw new GoogleSyncError(
      "Google is nog niet gekoppeld — log opnieuw in met Google.",
      "not_linked",
      401,
    );
  }

  const expiresSoon =
    !stored.expiresAt || new Date(stored.expiresAt).getTime() - Date.now() < 60_000;
  if (stored.accessToken && !expiresSoon) return stored.accessToken;

  if (!stored.refreshToken) {
    throw new GoogleSyncError(
      "Google token verlopen — opnieuw inloggen vereist.",
      "token_expired",
      401,
    );
  }

  const res = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      refresh_token: stored.refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error("[google-sync] vernieuwen mislukt:", res.status, text.slice(0, 300));
    throw new GoogleSyncError(
      "Google token verlopen — opnieuw inloggen vereist.",
      "token_expired",
      401,
    );
  }
  const payload = JSON.parse(text) as { access_token?: string; expires_in?: number; scope?: string };
  if (!payload.access_token) {
    throw new GoogleSyncError("Google gaf geen nieuw token terug.", "token_expired", 401);
  }
  await saveGoogleTokens(userId, {
    accessToken: payload.access_token,
    refreshToken: null,
    scope: payload.scope ?? stored.scope,
    expiresAt: new Date(Date.now() + (payload.expires_in ?? 3600) * 1000).toISOString(),
  });
  return payload.access_token;
}

/* ------------------------------------------------------------------- sync */

export type GoogleSyncResult = { ok: boolean; count: number; message: string };

/** Haalt de komende agenda-items op en bewaart ze lokaal. */
export async function syncGoogleCalendar(userId: string): Promise<GoogleSyncResult> {
  try {
    const token = await getValidAccessToken(userId);
    const url = new URL(`${CALENDAR_API}/calendars/primary/events`);
    url.searchParams.set("timeMin", new Date().toISOString());
    url.searchParams.set("maxResults", "100");
    url.searchParams.set("singleEvents", "true");
    url.searchParams.set("orderBy", "startTime");

    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const body = await res.text();
    if (!res.ok) {
      const message =
        res.status === 401 || res.status === 403
          ? "Google token verlopen — opnieuw inloggen vereist."
          : `Google Agenda-fout [${res.status}]: ${body.slice(0, 200)}`;
      await recordGoogleSync(userId, false, message);
      throw new GoogleSyncError(message, res.status === 401 ? "token_expired" : "api_error", res.status);
    }

    const parsed = JSON.parse(body) as {
      items?: Array<{
        id: string;
        summary?: string;
        location?: string;
        start?: { dateTime?: string; date?: string };
        end?: { dateTime?: string; date?: string };
      }>;
    };
    const items = parsed.items ?? [];

    const sql = await sqlClient();
    if (sql) {
      await sql`
        create table if not exists google_calendar_events (
          id text primary key,
          user_id uuid,
          title text,
          starts_at timestamptz,
          ends_at timestamptz,
          location text,
          synced_at timestamptz not null default now()
        )
      `;
      for (const item of items) {
        await sql`
          insert into google_calendar_events (id, user_id, title, starts_at, ends_at, location, synced_at)
          values (${item.id}, ${userId}::uuid, ${item.summary ?? null},
                  ${item.start?.dateTime ?? item.start?.date ?? null},
                  ${item.end?.dateTime ?? item.end?.date ?? null},
                  ${item.location ?? null}, now())
          on conflict (id) do update
            set title = excluded.title, starts_at = excluded.starts_at, ends_at = excluded.ends_at,
                location = excluded.location, synced_at = now()
        `;
      }
    }

    const message = `${items.length} agenda-items gesynchroniseerd.`;
    await recordGoogleSync(userId, true, message);
    return { ok: true, count: items.length, message };
  } catch (error) {
    if (error instanceof GoogleSyncError) {
      await recordGoogleSync(userId, false, error.message).catch(() => {});
      throw error;
    }
    const message = error instanceof Error ? error.message : "Onbekende fout";
    await recordGoogleSync(userId, false, message).catch(() => {});
    throw new GoogleSyncError(message, "unknown", 500);
  }
}

export type GoogleStatus = {
  configured: boolean;
  linked: boolean;
  hasRefreshToken: boolean;
  scope: string | null;
  expiresAt: string | null;
  lastSyncAt: string | null;
  lastStatus: string | null;
  lastMessage: string | null;
  redirectUris: string[];
};

export async function googleStatus(userId: string, origin: string): Promise<GoogleStatus> {
  const stored = await readGoogleTokens(userId).catch(() => null);
  const uris = new Set([
    `${origin}/api/auth/callback/google`,
    "https://maximilien.brussels/api/auth/callback/google",
    "https://maximilien.site/api/auth/callback/google",
  ]);
  return {
    configured: googleCredentials() !== null,
    linked: Boolean(stored?.accessToken || stored?.refreshToken),
    hasRefreshToken: Boolean(stored?.refreshToken),
    scope: stored?.scope ?? null,
    expiresAt: stored?.expiresAt ?? null,
    lastSyncAt: stored?.lastSyncAt ?? null,
    lastStatus: stored?.lastStatus ?? null,
    lastMessage: stored?.lastMessage ?? null,
    redirectUris: [...uris],
  };
}
