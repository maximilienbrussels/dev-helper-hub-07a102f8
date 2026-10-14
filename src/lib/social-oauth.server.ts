/**
 * Sociale login (server-only) voor GitHub en Mastodon.
 *
 * Deelt de cookie-, state- en gebruikerslogica met de Google-implementatie in
 * `google-oauth.server.ts`. Client secrets blijven altijd op de server.
 */
import { db, hasDatabase } from "./neon.server";
import { ensureAuthSchema, normalizeEmail, type AppUser } from "./local-auth.server";
import { authOrigin } from "./google-oauth.server";

export type SocialProvider = "google" | "github" | "mastodon" | "bluesky" | "rout";

export type SocialProfile = {
  email: string;
  name: string | null;
  picture: string | null;
  emailVerified: boolean;
  /** Alleen voor Mastodon: de server waarop het account staat. */
  instance?: string | null;
  /** Onveranderlijk account-id bij de aanbieder (sub/id/DID). */
  subject?: string | null;
};

export function githubCredentials(): { clientId: string; clientSecret: string } | null {
  const clientId = process.env["GITHUB_CLIENT_ID"];
  const clientSecret = process.env["GITHUB_CLIENT_SECRET"];
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function callbackUrl(request: Request, provider: SocialProvider): string {
  return new URL(`/api/auth/callback/${provider}`, authOrigin(request)).toString();
}

/** Wisselt de GitHub-code in voor het profiel (inclusief geverifieerd e-mailadres). */
export async function exchangeGithubCode(code: string, request: Request): Promise<SocialProfile> {
  const creds = githubCredentials();
  if (!creds) throw new Error("GitHub-login is niet geconfigureerd.");

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      code,
      redirect_uri: callbackUrl(request, "github"),
    }),
  });
  const token = (await tokenRes.json()) as { access_token?: string; error?: string };
  if (!tokenRes.ok || !token.access_token) {
    console.error("[github-oauth] token mislukt:", tokenRes.status, token.error);
    throw new Error("GitHub kon de aanmelding niet bevestigen.");
  }

  const headers = {
    Authorization: `Bearer ${token.access_token}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "maximilien-site",
  };
  const userRes = await fetch("https://api.github.com/user", { headers });
  if (!userRes.ok) throw new Error("GitHub gaf geen profiel terug.");
  const profile = (await userRes.json()) as {
    id?: number | string;
    email?: string | null;
    name?: string | null;
    login?: string;
    avatar_url?: string | null;
  };

  let email = profile.email ?? "";
  let verified = true;
  if (!email) {
    const mailRes = await fetch("https://api.github.com/user/emails", { headers });
    if (mailRes.ok) {
      const mails = (await mailRes.json()) as {
        email: string;
        primary: boolean;
        verified: boolean;
      }[];
      const chosen = mails.find((m) => m.primary && m.verified) ?? mails.find((m) => m.verified);
      if (chosen) {
        email = chosen.email;
        verified = chosen.verified;
      }
    }
  }
  if (!email) throw new Error("GitHub gaf geen e-mailadres terug.");

  return {
    email: normalizeEmail(email),
    name: profile.name ?? profile.login ?? null,
    picture: profile.avatar_url ?? null,
    emailVerified: verified,
    subject: profile.id != null ? String(profile.id) : null,
  };
}

/** Zorgt dat `app_users` de kolommen `role` en `auth_provider` heeft (idempotent). */
async function ensureColumns(): Promise<boolean> {
  if (!(await ensureAuthSchema())) return false;
  try {
    await db()`alter table public.app_users add column if not exists role text not null default 'user'`;
    await db()`alter table public.app_users add column if not exists auth_provider text`;
    return true;
  } catch (error) {
    console.error("[social-oauth] kolommen aanmaken mislukt:", error);
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
 * Zoekt de gebruiker op e-mail: bestaat hij, dan worden `last_login_at`,
 * naam en avatar bijgewerkt; anders wordt een nieuwe rij aangemaakt met rol
 * `user`, bevestigd e-mailadres en de gebruikte aanbieder.
 */
export async function upsertSocialUser(
  profile: SocialProfile,
  provider: SocialProvider,
): Promise<{ user: AppUser; role: string; created: boolean }> {
  if (!hasDatabase() || !(await ensureColumns())) {
    throw new Error("De gebruikersdatabank is tijdelijk niet bereikbaar.");
  }
  // Een geslaagde OAuth-login bevestigt het account: e-mailadres is bevestigd.
  const verifiedAt = new Date().toISOString();
  // Eerst op het onveranderlijke account-id van de aanbieder: zo blijft het
  // interne UUID (en dus alle data) behouden, ook als het e-mailadres wijzigt.
  const { findUserIdByIdentity } = await import("./identities.server");
  const linkedId = await findUserIdByIdentity(provider, profile.subject);
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
             avatar_url = coalesce(avatar_url, ${profile.picture}),
             auth_provider = coalesce(auth_provider, ${provider}),
             email_verified_at = coalesce(email_verified_at, ${verifiedAt})
       where id = ${existing[0].id}
       returning id, email, name, avatar_url, email_verified_at, role`) as Row[];
    const row = updated[0] ?? existing[0];
    // Zelfde e-mailadres = zelfde persoon: we koppelen de aanbieder aan het
    // bestaande account in plaats van een dubbel profiel te maken.
    const { recordIdentity } = await import("./identities.server");
    await recordIdentity(String(row.id), provider, profile.instance ?? null, profile.subject ?? null, profile.email);
    return { user: toUser(row), role: row.role ?? "user", created: false };
  }

  const inserted = (await db()`
    insert into public.app_users (email, name, avatar_url, role, auth_provider, email_verified_at, last_login_at)
    values (${profile.email}, ${profile.name}, ${profile.picture}, 'user', ${provider}, ${verifiedAt}, now())
    returning id, email, name, avatar_url, email_verified_at, role`) as Row[];
  const row = inserted[0]!;
  const { recordIdentity } = await import("./identities.server");
  await recordIdentity(String(row.id), provider, profile.instance ?? null, profile.subject ?? null, profile.email);
  return { user: toUser(row), role: row.role ?? "user", created: true };
}
