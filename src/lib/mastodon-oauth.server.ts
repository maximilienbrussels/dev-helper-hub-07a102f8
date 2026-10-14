/**
 * Federatieve Mastodon-login (server-only).
 *
 * Mastodon is een netwerk van servers, dus registreren we onze app dynamisch
 * per instantie via `POST /api/v1/apps` en bewaren we de client-gegevens in
 * Neon Postgres (`public.mastodon_apps`) voor volgende aanmeldingen.
 */
import { db, hasDatabase } from "./neon.server";
import { normalizeEmail } from "./local-auth.server";
import { authOrigin } from "./google-oauth.server";
import type { SocialProfile } from "./social-oauth.server";

export const MASTODON_APP_NAME = "Maximilien";
export const MASTODON_SCOPE = "read:accounts";
export const MASTODON_INSTANCE_COOKIE = "maximilien_oauth_instance";

/** Maakt van `@user@fosstodon.org`, `fosstodon.org` of een URL één origin. */
export function normalizeInstance(input: string | null | undefined): string {
  const fallback = (process.env["MASTODON_INSTANCE_URL"] || "https://mastodon.social").trim();
  let raw = (input || fallback).trim();
  if (!raw) raw = "https://mastodon.social";
  if (raw.includes("@")) {
    const parts = raw.split("@").filter(Boolean);
    raw = parts[parts.length - 1] ?? raw;
  }
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase();
    // Enkel publieke https-servers op de standaardpoort: geen interne hosts of IP's.
    if (
      !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(host) ||
      url.port ||
      /\.(local|localhost|internal|lan|home|corp|intranet)$/.test(host)
    ) {
      return "https://mastodon.social";
    }
    return `https://${host}`;
  } catch {
    return "https://mastodon.social";
  }
}

export function mastodonRedirectUri(request: Request): string {
  return new URL("/api/auth/callback/mastodon", authOrigin(request)).toString();
}

async function ensureAppsTable(): Promise<boolean> {
  if (!hasDatabase()) return false;
  try {
    await db()`
      create table if not exists public.mastodon_apps (
        instance text primary key,
        client_id text not null,
        client_secret text not null,
        redirect_uri text not null,
        created_at timestamptz not null default now()
      )`;
    return true;
  } catch (error) {
    console.error("[mastodon-oauth] tabel mastodon_apps aanmaken mislukt:", error);
    return false;
  }
}

export type MastodonApp = { clientId: string; clientSecret: string };

/** Haalt bestaande client-gegevens op of registreert de app op de instantie. */
export async function getOrRegisterApp(
  instance: string,
  redirectUri: string,
): Promise<MastodonApp> {
  const hasTable = await ensureAppsTable();

  if (hasTable) {
    const rows = (await db()`
      select client_id, client_secret
        from public.mastodon_apps
       where instance = ${instance} and redirect_uri = ${redirectUri}
       limit 1`) as { client_id: string; client_secret: string }[];
    if (rows[0]) return { clientId: rows[0].client_id, clientSecret: rows[0].client_secret };
  }

  const res = await fetch(`${instance}/api/v1/apps`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_name: MASTODON_APP_NAME,
      redirect_uris: redirectUri,
      scopes: MASTODON_SCOPE,
      website: new URL(redirectUri).origin,
    }),
  });
  if (!res.ok) {
    console.error("[mastodon-oauth] registratie mislukt:", instance, res.status);
    throw new Error("Deze Mastodon-server aanvaardde de aanmelding niet.");
  }
  const app = (await res.json()) as { client_id?: string; client_secret?: string };
  if (!app.client_id || !app.client_secret) {
    throw new Error("Deze Mastodon-server gaf geen app-gegevens terug.");
  }

  if (hasTable) {
    try {
      await db()`
        insert into public.mastodon_apps (instance, client_id, client_secret, redirect_uri)
        values (${instance}, ${app.client_id}, ${app.client_secret}, ${redirectUri})
        on conflict (instance) do update
           set client_id = excluded.client_id,
               client_secret = excluded.client_secret,
               redirect_uri = excluded.redirect_uri`;
    } catch (error) {
      console.error("[mastodon-oauth] app bewaren mislukt:", error);
    }
  }

  return { clientId: app.client_id, clientSecret: app.client_secret };
}

/** Wisselt de code in bij de juiste instantie en levert het profiel. */
export async function exchangeMastodonCodeOnInstance(
  code: string,
  instance: string,
  request: Request,
): Promise<SocialProfile> {
  const redirectUri = mastodonRedirectUri(request);
  const app = await getOrRegisterApp(instance, redirectUri);

  const tokenRes = await fetch(`${instance}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: app.clientId,
      client_secret: app.clientSecret,
      redirect_uri: redirectUri,
      code,
      scope: MASTODON_SCOPE,
    }),
  });
  const token = (await tokenRes.json()) as { access_token?: string };
  if (!tokenRes.ok || !token.access_token) {
    console.error("[mastodon-oauth] token mislukt:", instance, tokenRes.status);
    throw new Error("Mastodon kon de aanmelding niet bevestigen.");
  }

  const accRes = await fetch(`${instance}/api/v1/accounts/verify_credentials`, {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  if (!accRes.ok) throw new Error("Mastodon gaf geen profiel terug.");
  const acc = (await accRes.json()) as {
    id?: string | number;
    username?: string;
    acct?: string;
    display_name?: string;
    avatar?: string | null;
  };

  const host = new URL(instance).host;
  const local = (acc.acct ?? acc.username ?? "").split("@")[0] ?? "";
  if (!local) throw new Error("Mastodon gaf geen account terug.");
  // Mastodon deelt geen e-mailadres: we bouwen een stabiel adres uit het handle.
  const email = `${local}.${host.replace(/[^a-z0-9.-]/gi, "")}@mastodon.local`;

  return {
    email: normalizeEmail(email),
    name: acc.display_name || `@${local}@${host}`,
    picture: acc.avatar ?? null,
    emailVerified: true,
    instance: host,
    subject: acc.id != null ? `${host}:${acc.id}` : null,
  };
}
