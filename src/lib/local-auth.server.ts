/**
 * Eigen authenticatie bovenop Neon Postgres — server-only.
 *
 * Geen externe Neon Auth / Better Auth meer: gebruikers staan in
 * `public.app_users`, wachtwoorden worden met bcrypt gehasht en sessies zijn
 * door onszelf ondertekende JWT's (HS256). Eenmalige tokens (inloglink,
 * bevestiging, wachtwoordherstel) staan in `public.app_auth_tokens`.
 */
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { db, hasDatabase, connectionString } from "./neon.server";

export type AppUser = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  emailVerifiedAt: string | null;
};

export type SessionClaims = {
  sub: string;
  email: string;
  name?: string | null;
  email_verified?: boolean;
  [key: string]: unknown;
};

const SESSION_TTL_SECONDS = 30 * 24 * 3600;

/** Sleutel voor het ondertekenen van sessietokens. */
function jwtSecret(): Uint8Array {
  const raw =
    process.env["AUTH_JWT_SECRET"] ||
    process.env["JWT_SECRET"] ||
    // Terugval zodat preview/dev nooit stukloopt: afgeleid van de DB-URL.
    connectionString();
  if (!raw) throw new Error("AUTH_JWT_SECRET ontbreekt: sessies kunnen niet veilig ondertekend worden.");
  return new TextEncoder().encode(raw);
}

let schemaReady: Promise<boolean> | null = null;

/** Maakt de auth-tabellen aan wanneer ze nog niet bestaan. */
export function ensureAuthSchema(): Promise<boolean> {
  if (!hasDatabase()) return Promise.resolve(false);
  if (!schemaReady) {
    schemaReady = (async () => {
      try {
        await db()`
          create table if not exists public.app_users (
            id uuid primary key default gen_random_uuid(),
            email text not null,
            password_hash text,
            name text,
            avatar_url text,
            email_verified_at timestamptz,
            last_login_at timestamptz,
            created_at timestamptz not null default now(),
            updated_at timestamptz not null default now()
          )`;
        await db()`
          create unique index if not exists app_users_email_key on public.app_users (lower(email))`;
        await db()`
          create table if not exists public.app_auth_tokens (
            token text primary key,
            kind text not null,
            email text not null,
            user_id uuid references public.app_users (id) on delete cascade,
            redirect_to text,
            expires_at timestamptz not null,
            used_at timestamptz,
            created_at timestamptz not null default now()
          )`;
        return true;
      } catch (error) {
        console.error("[auth] tabellen aanmaken mislukt:", error);
        schemaReady = null;
        return false;
      }
    })();
  }
  return schemaReady;
}

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  email_verified_at: string | Date | null;
  password_hash?: string | null;
};

function toUser(row: UserRow): AppUser {
  return {
    id: String(row.id),
    email: row.email,
    name: row.name,
    avatarUrl: row.avatar_url,
    emailVerifiedAt: row.email_verified_at ? new Date(row.email_verified_at).toISOString() : null,
  };
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Zoekt een gebruiker op e-mailadres (inclusief hash, server-only). */
async function rowByEmail(email: string): Promise<UserRow | null> {
  if (!(await ensureAuthSchema())) return null;
  const rows = (await db()`
    select id, email, name, avatar_url, email_verified_at, password_hash
      from public.app_users
     where lower(email) = ${normalizeEmail(email)}
     limit 1`) as UserRow[];
  return rows[0] ?? null;
}

export async function findUserByEmail(email: string): Promise<AppUser | null> {
  const row = await rowByEmail(email);
  return row ? toUser(row) : null;
}

export async function findUserById(id: string): Promise<AppUser | null> {
  if (!(await ensureAuthSchema())) return null;
  const rows = (await db()`
    select id, email, name, avatar_url, email_verified_at
      from public.app_users where id = ${id} limit 1`) as UserRow[];
  return rows[0] ? toUser(rows[0]) : null;
}

/** Maakt (of vindt) een gebruiker. `created` vertelt of het account nieuw is. */
export async function createUser(input: {
  email: string;
  password?: string;
  name?: string;
  emailVerified?: boolean;
}): Promise<{ user: AppUser; created: boolean }> {
  if (!(await ensureAuthSchema())) {
    throw new Error("De gebruikersdatabank is tijdelijk niet bereikbaar.");
  }
  const email = normalizeEmail(input.email);
  const existing = await rowByEmail(email);
  if (existing) {
    // Bestaand account zonder wachtwoord (aangemaakt via inloglink): het
    // opgegeven wachtwoord instellen zodat de klant voortaan kan inloggen.
    if (input.password && !existing.password_hash) {
      const hash = await hashPassword(input.password);
      await db()`update public.app_users
                    set password_hash = ${hash}, name = coalesce(${input.name ?? null}, name),
                        updated_at = now()
                  where id = ${existing.id}`;
    }
    return { user: toUser(existing), created: false };
  }
  const hash = input.password ? await hashPassword(input.password) : null;
  const rows = (await db()`
    insert into public.app_users (email, password_hash, name, email_verified_at)
    values (${email}, ${hash}, ${input.name ?? null}, ${input.emailVerified ? new Date().toISOString() : null})
    returning id, email, name, avatar_url, email_verified_at`) as UserRow[];
  return { user: toUser(rows[0]!), created: true };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Is de auth-laag bruikbaar? Zonder databankverbinding bestaan er géén
 * accounts: dan is "wachtwoord fout" een misleidende boodschap en moeten we
 * een storing melden.
 */
export async function authBackendReady(): Promise<boolean> {
  if (!hasDatabase()) return false;
  return ensureAuthSchema();
}

/** Controleert e-mail + wachtwoord. Geeft null bij een foute combinatie. */
export async function verifyPassword(
  email: string,
  password: string,
): Promise<{ user: AppUser } | null> {
  const row = await rowByEmail(email);
  if (!row?.password_hash) return null;
  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) return null;
  await db()`update public.app_users set last_login_at = now() where id = ${row.id}`;
  return { user: toUser(row) };
}

/** Zet een nieuw wachtwoord voor een gebruiker. */
export async function setPassword(userId: string, password: string): Promise<void> {
  const hash = await hashPassword(password);
  await db()`update public.app_users
                set password_hash = ${hash}, updated_at = now(),
                    email_verified_at = coalesce(email_verified_at, now())
              where id = ${userId}`;
}

export async function updateProfile(
  userId: string,
  patch: { name?: string | null; avatarUrl?: string | null },
): Promise<void> {
  if (!(await ensureAuthSchema())) return;
  await db()`update public.app_users
                set name = coalesce(${patch.name ?? null}, name),
                    avatar_url = coalesce(${patch.avatarUrl ?? null}, avatar_url),
                    updated_at = now()
              where id = ${userId}`;
}

export async function markEmailVerified(userId: string): Promise<void> {
  await db()`update public.app_users
                set email_verified_at = coalesce(email_verified_at, now()), updated_at = now()
              where id = ${userId}`;
}

/* ------------------------------- sessies -------------------------------- */

/** Ondertekent een sessie-JWT (HS256). */
export async function signSession(user: AppUser, extra?: { mfa?: boolean }): Promise<string> {
  return new SignJWT({
    email: user.email,
    name: user.name,
    email_verified: Boolean(user.emailVerifiedAt),
    ...(extra?.mfa ? { mfa: true, mfa_at: Math.floor(Date.now() / 1000) } : {}),
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(user.id)
    .setIssuedAt()
    .setIssuer("maximilien")
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(jwtSecret());
}

/** Valideert een sessie-JWT. Gooit bij een ongeldige of verlopen token. */
export async function verifySession(token: string): Promise<SessionClaims> {
  const { payload } = await jwtVerify(token, jwtSecret(), { issuer: "maximilien" });
  if (!payload.sub) throw new Error("token zonder subject");
  return payload as SessionClaims;
}

/* -------------------------- eenmalige tokens ---------------------------- */

export type AuthTokenKind = "magic" | "verify" | "reset" | "code";

const ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function randomToken(length = 40): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

/** Maakt een eenmalige token aan en bewaart hem in de databank. */
export async function mintToken(input: {
  kind: AuthTokenKind;
  email: string;
  ttlSeconds: number;
  redirectTo?: string;
  value?: string;
  userId?: string | null;
}): Promise<string | null> {
  if (!(await ensureAuthSchema())) return null;
  const email = normalizeEmail(input.email);
  const token = input.value ?? randomToken();
  const expires = new Date(Date.now() + input.ttlSeconds * 1000).toISOString();
  try {
    if (input.kind === "code") {
      // Slechts één geldige code per adres.
      await db()`delete from public.app_auth_tokens where lower(email) = ${email} and kind = 'code'`;
    }
    await db()`
      insert into public.app_auth_tokens (token, kind, email, user_id, redirect_to, expires_at)
      values (${token}, ${input.kind}, ${email}, ${input.userId ?? null}, ${input.redirectTo ?? null}, ${expires})
      on conflict (token) do update set expires_at = excluded.expires_at, used_at = null`;
    return token;
  } catch (error) {
    console.error("[auth] token bewaren mislukt:", error);
    return null;
  }
}

type TokenRow = {
  token: string;
  kind: string;
  email: string;
  user_id: string | null;
  redirect_to: string | null;
  expires_at: string | Date;
  used_at: string | Date | null;
};

/** Haalt een geldige token op en markeert hem als gebruikt. */
export async function consumeToken(
  token: string,
  kind: AuthTokenKind,
): Promise<{ email: string; redirectTo: string | null; userId: string | null } | null> {
  if (!(await ensureAuthSchema())) {
    console.error(`[auth-token] kind=${kind} reden=db-onbereikbaar (500)`);
    return null;
  }
  const rows = (await db()`
    select token, kind, email, user_id, redirect_to, expires_at, used_at
      from public.app_auth_tokens
     where token = ${token} and kind = ${kind}
     limit 1`) as TokenRow[];
  const row = rows[0];
  if (!row) {
    console.warn(`[auth-token] kind=${kind} reden=niet-gevonden (404)`);
    return null;
  }
  const expired = new Date(row.expires_at).getTime() < Date.now();
  await db()`delete from public.app_auth_tokens where token = ${row.token}`;
  if (expired || row.used_at) {
    console.warn(
      `[auth-token] kind=${kind} reden=${row.used_at ? "al-gebruikt" : "verlopen"} (401)`,
    );
    return null;
  }
  console.info(`[auth-token] kind=${kind} status=geldig`);
  return { email: row.email, redirectTo: row.redirect_to, userId: row.user_id };

}

/** 6-cijferige inlogcode aanmaken. */
export async function mintLoginCode(email: string, ttlSeconds = 900): Promise<string | null> {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  const code = String(100000 + (bytes[0]! % 900000));
  const stored = await mintToken({ kind: "code", email, ttlSeconds, value: `${normalizeEmail(email)}:${code}` });
  return stored ? code : null;
}

/** Controleert (en verbruikt) een inlogcode. */
export async function consumeLoginCode(email: string, code: string): Promise<boolean> {
  const consumed = await consumeToken(`${normalizeEmail(email)}:${code.trim()}`, "code");
  return Boolean(consumed);
}

/**
 * Zet een geldige inloglink/bevestigingslink om in een sessie: de gebruiker
 * wordt aangemaakt wanneer hij nog niet bestaat en het e-mailadres geldt
 * meteen als bevestigd.
 */
export async function sessionFromMagicToken(
  token: string,
  kind: AuthTokenKind = "magic",
): Promise<{ token: string; user: AppUser; redirectTo: string | null } | null> {
  const consumed = await consumeToken(token, kind);
  if (!consumed) return null;
  const { user } = await createUser({ email: consumed.email, emailVerified: true });
  await markEmailVerified(user.id);
  const fresh = (await findUserById(user.id)) ?? user;
  return {
    token: await signSession(fresh),
    user: fresh,
    redirectTo: consumed.redirectTo,
  };
}
