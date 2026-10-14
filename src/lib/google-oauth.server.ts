/**
 * Google OAuth (server-only).
 *
 * Eén plek voor de Google-omgevingsvariabelen, het uitwisselen van de code en
 * het bijwerken/aanmaken van de gebruiker in Neon Postgres (`public.app_users`).
 * Nooit importeren vanuit browsercode: hier staan client secrets.
 */
import { decodeJwt } from "jose";
import { db, hasDatabase } from "./neon.server";
import { ensureAuthSchema, normalizeEmail, type AppUser } from "./local-auth.server";

export const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
export const GOOGLE_USERINFO_ENDPOINT = "https://openidconnect.googleapis.com/v1/userinfo";
export const GOOGLE_CALLBACK_PATH = "/api/auth/callback/google";
export const OAUTH_STATE_COOKIE = "maximilien_oauth_state";
export const SESSION_COOKIE = "maximilien_session";

/** Leest de Google-credentials — precies één bron, geen dubbele lookups. */
export function googleCredentials(): { clientId: string; clientSecret: string } | null {
  const clientId = process.env["GOOGLE_CLIENT_ID"];
  const clientSecret = process.env["GOOGLE_CLIENT_SECRET"];
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function googleConfigured(): boolean {
  return googleCredentials() !== null;
}

/** Basis-URL van de site, ook achter de preview-proxy correct. */
export function siteOrigin(request: Request): string {
  const url = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (url.hostname === "localhost" && forwardedHost) return `https://${forwardedHost}`;
  const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  return `${proto}://${url.host}`;
}

/** Standaard canoniek adres wanneer geen omgevingsvariabele gezet is. */
export const DEFAULT_APP_URL = "https://maximilien.dlp.li";

/** Ontwikkel- of voorvertoningshost? Daar blijven we op de eigen origin. */
export function isEphemeralHost(host: string): boolean {
  const h = host.toLowerCase();
  return (
    h.startsWith("localhost") ||
    h.startsWith("127.0.0.1") ||
    h.endsWith(".local") ||
    h.endsWith(".lovable.app") ||
    h.endsWith(".lovableproject.com") ||
    h.endsWith(".vercel.app")
  );
}

/**
 * Basisadres voor OAuth-callbacks = het domein waarop de bezoeker zit.
 * Zo werkt elke deploy (eigen domein, Vercel, preview) zolang
 * `<domein>/api/auth/callback/<aanbieder>` bij de aanbieder geregistreerd is.
 * Optioneel: OAUTH_FORCE_ORIGIN dwingt één vast adres af.
 */
export function authOrigin(request: Request): string {
  const forced = (process.env["OAUTH_FORCE_ORIGIN"] ?? "").trim();
  if (forced) {
    try {
      return new URL(forced).origin;
    } catch {
      /* ongeldig: negeren */
    }
  }
  return siteOrigin(request);
}

/** Canonieke callback-URL van een aanbieder. */
export function providerCallbackUrl(request: Request, provider: string): string {
  return new URL(`/api/auth/callback/${provider}`, authOrigin(request)).toString();
}

export function redirectUri(request: Request): string {
  return new URL(GOOGLE_CALLBACK_PATH, authOrigin(request)).toString();
}


export function cookieHeader(
  name: string,
  value: string,
  options: { maxAge: number; secure: boolean },
): string {
  const parts = [
    `${name}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${options.maxAge}`,
  ];
  if (options.secure) parts.push("Secure");
  return parts.join("; ");
}

export function readCookie(request: Request, name: string): string | null {
  const raw = request.headers.get("cookie");
  if (!raw) return null;
  for (const part of raw.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return null;
}

export type GoogleTokens = {
  accessToken: string | null;
  refreshToken: string | null;
  scope: string | null;
  expiresAt: string | null;
};

export type GoogleProfile = {
  email: string;
  name: string | null;
  picture: string | null;
  emailVerified: boolean;
  /** Onveranderlijke Google-gebruikers-id (`sub`). */
  subject?: string | null;
  tokens: GoogleTokens;
};

/**
 * Aanmelden vraagt uitsluitend naam en e-mailadres. Geen agenda-toegang:
 * dat is een aparte, bewuste keuze van een teamlid (zie GOOGLE_CALENDAR_SCOPES).
 */
export const GOOGLE_LOGIN_SCOPES = ["openid", "email", "profile"].join(" ");

/** Extra toestemming voor live agenda-synchronisatie (alleen op verzoek). */
export const GOOGLE_CALENDAR_SCOPES = [
  GOOGLE_LOGIN_SCOPES,
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
].join(" ");

/** @deprecated gebruik GOOGLE_LOGIN_SCOPES of GOOGLE_CALENDAR_SCOPES. */
export const GOOGLE_SCOPES = GOOGLE_LOGIN_SCOPES;

/** Wisselt de OAuth-code in voor het profiel én de tokens van de gebruiker. */
export async function exchangeCodeForProfile(
  code: string,
  request: Request,
): Promise<GoogleProfile> {
  const creds = googleCredentials();
  if (!creds) throw new Error("Google-login is niet geconfigureerd.");

  const res = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      redirect_uri: redirectUri(request),
      grant_type: "authorization_code",
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error("[google-oauth] token-uitwisseling mislukt:", res.status, text.slice(0, 300));
    throw new Error("Google kon de aanmelding niet bevestigen.");
  }
  let payload: {
    id_token?: string;
    access_token?: string;
    refresh_token?: string;
    scope?: string;
    expires_in?: number;
  };
  try {
    payload = JSON.parse(text) as typeof payload;
  } catch {
    throw new Error("Google gaf een onverwacht antwoord.");
  }

  let claims: Record<string, unknown> | null = null;
  if (payload.id_token) {
    claims = decodeJwt(payload.id_token) as Record<string, unknown>;
  } else if (payload.access_token) {
    const info = await fetch(GOOGLE_USERINFO_ENDPOINT, {
      headers: { Authorization: `Bearer ${payload.access_token}` },
    });
    if (info.ok) claims = (await info.json()) as Record<string, unknown>;
  }

  const email = typeof claims?.["email"] === "string" ? (claims["email"] as string) : "";
  if (!email) throw new Error("Google gaf geen e-mailadres terug.");

  return {
    email: normalizeEmail(email),
    name:
      (typeof claims?.["name"] === "string" ? (claims["name"] as string) : null) ??
      (typeof claims?.["given_name"] === "string" ? (claims["given_name"] as string) : null),
    picture: typeof claims?.["picture"] === "string" ? (claims["picture"] as string) : null,
    emailVerified: claims?.["email_verified"] !== false,
    subject: typeof claims?.["sub"] === "string" ? (claims["sub"] as string) : null,
    tokens: {
      accessToken: payload.access_token ?? null,
      refreshToken: payload.refresh_token ?? null,
      scope: payload.scope ?? null,
      expiresAt: payload.expires_in
        ? new Date(Date.now() + payload.expires_in * 1000).toISOString()
        : null,
    },
  };
}


/** Zorgt dat `app_users` een rolkolom heeft (idempotent). */
async function ensureRoleColumn(): Promise<boolean> {
  if (!(await ensureAuthSchema())) return false;
  try {
    await db()`alter table public.app_users add column if not exists role text not null default 'user'`;
    return true;
  } catch (error) {
    console.error("[google-oauth] rolkolom aanmaken mislukt:", error);
    return false;
  }
}

type Row = {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  email_verified_at: string | Date | null;
  role: string | null;
};

function toUser(row: Row): AppUser {
  return {
    id: String(row.id),
    email: row.email,
    name: row.name,
    avatarUrl: row.avatar_url,
    emailVerifiedAt: row.email_verified_at ? new Date(row.email_verified_at).toISOString() : null,
  };
}

/**
 * Zoekt de gebruiker op e-mail: bestaat hij, dan wordt `last_login_at`
 * bijgewerkt; anders wordt een nieuwe rij aangemaakt met rol `user` en
 * bevestigd e-mailadres.
 */
export async function upsertGoogleUser(
  profile: GoogleProfile,
): Promise<{ user: AppUser; role: string; created: boolean }> {
  if (!hasDatabase() || !(await ensureRoleColumn())) {
    throw new Error("De gebruikersdatabank is tijdelijk niet bereikbaar.");
  }
  const { findUserIdByIdentity } = await import("./identities.server");
  const linkedId = await findUserIdByIdentity("google", profile.subject);
  const existing = (linkedId
    ? await db()`
        select id, email, name, avatar_url, email_verified_at, role
          from public.app_users where id = ${linkedId} limit 1`
    : await db()`
        select id, email, name, avatar_url, email_verified_at, role
          from public.app_users
         where lower(email) = ${profile.email}
         limit 1`) as Row[];

  if (existing[0]) {
    const updated = (await db()`
      update public.app_users
         set last_login_at = now(),
             updated_at = now(),
             name = coalesce(name, ${profile.name}),
             avatar_url = coalesce(${profile.picture}, avatar_url),
             email_verified_at = coalesce(email_verified_at, ${profile.emailVerified ? new Date().toISOString() : null})
       where id = ${existing[0].id}
       returning id, email, name, avatar_url, email_verified_at, role`) as Row[];
    const row = updated[0] ?? existing[0];
    // Geslaagde Google-login = gekoppeld account: vastleggen zodat de
    // instellingen "Gekoppeld" tonen in plaats van "Niet gekoppeld".
    const { recordIdentity } = await import("./identities.server");
    await recordIdentity(String(row.id), "google", null, profile.subject ?? null, profile.email);
    return { user: toUser(row), role: row.role ?? "user", created: false };
  }

  const inserted = (await db()`
    insert into public.app_users (email, name, avatar_url, role, email_verified_at, last_login_at)
    values (${profile.email}, ${profile.name}, ${profile.picture}, 'user',
            ${profile.emailVerified ? new Date().toISOString() : null}, now())
    returning id, email, name, avatar_url, email_verified_at, role`) as Row[];
  const row = inserted[0]!;
  const { recordIdentity } = await import("./identities.server");
  await recordIdentity(String(row.id), "google", null, profile.subject ?? null, profile.email);
  return { user: toUser(row), role: row.role ?? "user", created: true };
}

/** Bepaalt of het adres beheerdersrechten heeft (portal_admins of app_users.role). */
export async function resolveRole(email: string, fallbackRole: string): Promise<string> {
  try {
    const rows = (await db()`
      select role from public.portal_admins
       where lower(email) = ${normalizeEmail(email)} and active = true
       limit 1`) as { role: string | null }[];
    if (rows[0]?.role) return rows[0].role;
  } catch {
    /* tabel bestaat niet in elke installatie */
  }
  return fallbackRole || "user";
}

/**
 * Startpad na aanmelden. Op de veld-app (maximilien.app) landt iedereen in de
 * veldschermen; op het desktopbeheer krijgen medewerkers hun werklijst.
 */
export function landingPathForRole(role: string, origin?: string | null): string {
  const isTeam = role === "admin" || role === "owner" || role === "super_admin" || role === "staff" || role === "team";
  if (origin) {
    try {
      const host = new URL(origin).hostname.toLowerCase().replace(/:\d+$/, "");
      if (host === "maximilien.app" || host.endsWith(".maximilien.app")) return "/veld";
    } catch {
      /* geen geldige oorsprong: val terug op het pad hieronder */
    }
  }
  return isTeam ? "/vandaag" : "/account";
}
