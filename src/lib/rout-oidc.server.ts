/**
 * Login met ROUT (OpenID Connect, Authorization Code + PKCE S256). Server-only.
 * Endpoints komen uit de discovery; de client secret blijft op de server.
 */
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { db, hasDatabase } from "./neon.server";
import { ensureAuthSchema, type AppUser } from "./local-auth.server";
import { readCookie, cookieHeader, siteOrigin } from "./google-oauth.server";

export const ROUT_DISCOVERY = "https://rout.be/.well-known/openid-configuration";
export const ROUT_CLIENT_ID = "rout_JNB7g_wjSba7GYGSDJs2XQ";
export const ROUT_SCOPES = "openid profile email linked_accounts";
export const ROUT_CALLBACK_PATH = "/auth/callback/rout";
export const ROUT_COOKIE = "maximilien_rout_oidc";

type Discovery = {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
  userinfo_endpoint?: string;
  end_session_endpoint?: string;
};

let discoveryCache: { at: number; doc: Discovery } | null = null;
let jwks: { uri: string; set: ReturnType<typeof createRemoteJWKSet> } | null = null;

export async function discovery(): Promise<Discovery> {
  if (discoveryCache && Date.now() - discoveryCache.at < 3600_000) return discoveryCache.doc;
  const res = await fetch(ROUT_DISCOVERY, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`ROUT discovery mislukt (${res.status})`);
  const doc = (await res.json()) as Discovery;
  discoveryCache = { at: Date.now(), doc };
  return doc;
}

export function routConfigured(): boolean {
  return Boolean(process.env["ROUT_CLIENT_SECRET"]);
}

export function routRedirectUri(request: Request): string {
  const fixed = process.env["ROUT_REDIRECT_URI"];
  if (fixed) return fixed;
  return new URL(ROUT_CALLBACK_PATH, siteOrigin(request)).toString();
}

const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const randomToken = (n = 32) => b64url(crypto.getRandomValues(new Uint8Array(n)));

async function challenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return b64url(new Uint8Array(digest));
}

export type RoutAttempt = {
  state: string;
  nonce: string;
  verifier: string;
  next: string;
  link: boolean;
  silent: boolean;
};

export async function startAuthorization(
  request: Request,
  opts: { next: string; link: boolean; silent: boolean },
): Promise<Response> {
  const doc = await discovery();
  const attempt: RoutAttempt = {
    state: randomToken(),
    nonce: randomToken(),
    verifier: randomToken(48),
    ...opts,
  };
  const url = new URL(doc.authorization_endpoint);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", ROUT_CLIENT_ID);
  url.searchParams.set("redirect_uri", routRedirectUri(request));
  url.searchParams.set("scope", ROUT_SCOPES);
  url.searchParams.set("state", attempt.state);
  url.searchParams.set("nonce", attempt.nonce);
  url.searchParams.set("code_challenge", await challenge(attempt.verifier));
  url.searchParams.set("code_challenge_method", "S256");
  if (opts.silent) url.searchParams.set("prompt", "none");

  const secure = siteOrigin(request).startsWith("https://");
  return new Response(null, {
    status: 302,
    headers: {
      Location: url.toString(),
      "Set-Cookie": cookieHeader(ROUT_COOKIE, encodeURIComponent(JSON.stringify(attempt)), {
        maxAge: 600,
        secure,
      }),
      "Cache-Control": "no-store",
    },
  });
}

export function readAttempt(request: Request): RoutAttempt | null {
  const raw = readCookie(request, ROUT_COOKIE);
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw)) as RoutAttempt;
  } catch {
    return null;
  }
}

export type RoutClaims = JWTPayload & {
  sub: string;
  preferred_username?: string;
  name?: string;
  picture?: string;
  email?: string;
  email_verified?: boolean;
  linked_accounts?: { provider: string; account_id: string }[];
  is_verified_person?: boolean;
  is_verified_business?: boolean;
  is_influencer?: boolean;
  rout_handle?: string;
  rout_public_activity?: unknown;
};

/** Wisselt de code in (met code_verifier), valideert de id_token en haalt userinfo op. */
export async function exchangeCode(
  request: Request,
  code: string,
  attempt: RoutAttempt,
): Promise<RoutClaims> {
  const secret = process.env["ROUT_CLIENT_SECRET"];
  if (!secret) throw new Error("ROUT_CLIENT_SECRET ontbreekt");
  const doc = await discovery();

  const res = await fetch(doc.token_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: routRedirectUri(request),
      client_id: ROUT_CLIENT_ID,
      client_secret: secret,
      code_verifier: attempt.verifier,
    }),
  });
  const tokens = (await res.json().catch(() => ({}))) as {
    id_token?: string;
    access_token?: string;
    error?: string;
  };
  if (!res.ok || !tokens.id_token) {
    console.error("[rout] token mislukt:", res.status, tokens.error);
    throw new Error("ROUT kon de aanmelding niet bevestigen.");
  }

  if (!jwks || jwks.uri !== doc.jwks_uri) {
    jwks = { uri: doc.jwks_uri, set: createRemoteJWKSet(new URL(doc.jwks_uri)) };
  }
  const { payload } = await jwtVerify(tokens.id_token, jwks.set, {
    issuer: doc.issuer,
    audience: ROUT_CLIENT_ID,
    algorithms: ["ES256"],
  });
  if (payload["nonce"] !== attempt.nonce) throw new Error("ROUT nonce klopt niet");
  if (!payload.sub) throw new Error("ROUT gaf geen sub");

  let claims = payload as RoutClaims;
  if (doc.userinfo_endpoint && tokens.access_token) {
    const info = await fetch(doc.userinfo_endpoint, {
      headers: { Authorization: `Bearer ${tokens.access_token}`, Accept: "application/json" },
    });
    if (info.ok) {
      const extra = (await info.json()) as Record<string, unknown>;
      // userinfo.sub moet overeenkomen met de id_token (OIDC Core 5.3.2).
      if (extra["sub"] === payload.sub) claims = { ...claims, ...extra } as RoutClaims;
    }
  }
  return claims;
}

type Row = {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  email_verified_at: string | Date | null;
  role: string | null;
};

const toUser = (r: Row): AppUser => ({
  id: String(r.id),
  email: r.email,
  name: r.name,
  avatarUrl: r.avatar_url,
  emailVerifiedAt: r.email_verified_at ? new Date(r.email_verified_at).toISOString() : null,
});

let schemaReady: Promise<boolean> | null = null;
function ensureRoutSchema(): Promise<boolean> {
  schemaReady ??= (async () => {
    if (!hasDatabase() || !(await ensureAuthSchema())) return false;
    try {
      const sql = db();
      await sql`alter table public.app_users add column if not exists role text not null default 'user'`;
      await sql`alter table public.app_users add column if not exists auth_provider text`;
      await sql`alter table public.app_users add column if not exists rout_id text`;
      await sql`alter table public.app_users add column if not exists email_verified boolean not null default false`;
      await sql`alter table public.app_users add column if not exists is_verified_person boolean not null default false`;
      await sql`alter table public.app_users add column if not exists is_verified_business boolean not null default false`;
      await sql`alter table public.app_users add column if not exists is_influencer boolean not null default false`;
      await sql`create unique index if not exists app_users_rout_id_key on public.app_users (rout_id) where rout_id is not null`;
      return true;
    } catch (error) {
      console.error("[rout] schema mislukt:", error);
      schemaReady = null;
      return false;
    }
  })();
  return schemaReady;
}

const SELECT = "id, email, name, avatar_url, email_verified_at, role";

/**
 * Zoekt/maakt de gebruiker. Volgorde: rout_id → identiteitskoppeling →
 * (enkel bij email_verified) bestaand account met hetzelfde e-mailadres → nieuw.
 * Rich Identity-vlaggen komen altijd uit de claims, nooit uit de client.
 */
export async function upsertRoutUser(
  claims: RoutClaims,
): Promise<{ user: AppUser; role: string } | { error: "email-ontbreekt" | "email-in-gebruik" }> {
  if (!(await ensureRoutSchema())) throw new Error("Databank niet bereikbaar");
  const sql = db();
  const verified = claims.email_verified === true;
  const email = (claims.email ?? "").trim().toLowerCase();
  const name = claims.name ?? claims.preferred_username ?? null;
  const picture = claims.picture ?? null;
  const flags = {
    person: claims.is_verified_person === true,
    business: claims.is_verified_business === true,
    influencer: claims.is_influencer === true,
  };

  const { findUserIdByIdentity, recordIdentity } = await import("./identities.server");
  let rows = (await sql.query(
    `select ${SELECT} from public.app_users where rout_id = $1 limit 1`,
    [claims.sub],
  )) as Row[];
  if (!rows[0]) {
    const linked = await findUserIdByIdentity("rout", claims.sub);
    if (linked) {
      rows = (await sql.query(`select ${SELECT} from public.app_users where id = $1 limit 1`, [
        linked,
      ])) as Row[];
    }
  }
  if (!rows[0] && email) {
    const byEmail = (await sql.query(
      `select ${SELECT} from public.app_users where lower(email) = $1 limit 1`,
      [email],
    )) as Row[];
    if (byEmail[0]) {
      // Auto-Discovery: enkel samenvoegen bij een door ROUT bevestigd e-mailadres.
      if (!verified) return { error: "email-in-gebruik" };
      rows = byEmail;
    }
  }

  let row: Row;
  if (rows[0]) {
    const updated = (await sql`
      update public.app_users set
        rout_id = ${claims.sub},
        email_verified = email_verified or ${verified},
        is_verified_person = ${flags.person},
        is_verified_business = ${flags.business},
        is_influencer = ${flags.influencer},
        name = coalesce(name, ${name}),
        avatar_url = coalesce(avatar_url, ${picture}),
        auth_provider = coalesce(auth_provider, 'rout'),
        email_verified_at = case when ${verified} then coalesce(email_verified_at, now()) else email_verified_at end,
        last_login_at = now(), updated_at = now()
      where id = ${rows[0].id}
      returning id, email, name, avatar_url, email_verified_at, role`) as Row[];
    row = updated[0] ?? rows[0];
  } else {
    if (!email) return { error: "email-ontbreekt" };
    const inserted = (await sql`
      insert into public.app_users
        (email, name, avatar_url, role, auth_provider, rout_id, email_verified,
         is_verified_person, is_verified_business, is_influencer, email_verified_at, last_login_at)
      values (${email}, ${name}, ${picture}, 'user', 'rout', ${claims.sub}, ${verified},
        ${flags.person}, ${flags.business}, ${flags.influencer},
        ${verified ? new Date().toISOString() : null}, now())
      returning id, email, name, avatar_url, email_verified_at, role`) as Row[];
    row = inserted[0]!;
  }
  await recordIdentity(String(row.id), "rout", null, claims.sub, email || null);
  // Gebruikersnaam = ROUT-handle (bij elke login); Rich Identity overschrijven of wissen.
  try {
    const extras = await import("./rout-extras.server");
    await extras.syncRoutHandle(claims.sub, claims.rout_handle ?? claims.preferred_username);
    await extras.storePublicActivity(claims.sub, claims.rout_public_activity);
  } catch (error) {
    console.error("[rout] handle/activiteit bijwerken mislukt:", error);
  }
  return { user: toUser(row), role: row.role ?? "user" };
}

/** Zet ROUT-foutcodes om naar onze interne redenen (vriendelijke toast). */
export function mapRoutError(code: string): string {
  switch (code) {
    case "access_denied":
      return "rout-geweigerd";
    case "login_required":
    case "interaction_required":
    case "consent_required":
      return "rout-login-nodig";
    case "temporarily_unavailable":
    case "server_error":
      return "rout-onbereikbaar";
    default:
      return "rout-mislukt";
  }
}
