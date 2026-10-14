import "reflect-metadata";

/**
 * Server-only WebAuthn (passkey) helpers. Bundelvriendelijk: alle logica
 * hier importeert dbAdmin lazily binnen de functies die het nodig
 * hebben, zodat dit bestand nooit in een browserbundel terechtkomt.
 */
import { getRequestHeaders } from "@tanstack/react-start/server";

const CHALLENGE_TTL_SECONDS = 5 * 60;

let schemaReady: Promise<boolean> | null = null;

/**
 * Maakt de passkey-tabellen aan wanneer ze nog niet bestaan (idempotent).
 * Zonder deze stap mislukte registratie stil op een verse databank.
 */
export function ensureWebauthnSchema(): Promise<boolean> {
  schemaReady ??= (async () => {
    const { db, hasDatabase } = await import("./neon.server");
    if (!hasDatabase()) return false;
    try {
      await db()`
        create table if not exists public.webauthn_credentials (
          id uuid primary key default gen_random_uuid(),
          user_id uuid not null,
          credential_id text not null unique,
          public_key text not null,
          counter bigint not null default 0,
          transports text[] not null default '{}',
          device_name text,
          backed_up boolean not null default false,
          created_at timestamptz not null default now(),
          last_used_at timestamptz
        )`;
      await db()`
        create table if not exists public.webauthn_challenges (
          id uuid primary key default gen_random_uuid(),
          challenge text not null,
          purpose text not null,
          email text,
          user_id uuid,
          created_at timestamptz not null default now(),
          expires_at timestamptz not null
        )`;
      return true;
    } catch (error) {
      console.error("[webauthn] schema aanmaken mislukt:", error);
      return false;
    }
  })();
  return schemaReady;
}

/**
 * Bepaalt rpID/rpName/origin op basis van de lopende aanvraag, zodat
 * passkeys ook correct werken in preview-omgevingen en niet enkel op het
 * canonieke productiedomein.
 */
export async function webauthnContext(): Promise<{ rpID: string; rpName: string; origin: string }> {
  const headers = new Headers(getRequestHeaders() as unknown as Record<string, string>);
  const originHeader = headers.get("origin");
  let origin: string;
  if (originHeader && /^https?:\/\//.test(originHeader)) {
    origin = originHeader.replace(/\/+$/, "");
  } else {
    const host = headers.get("host");
    origin = host ? `https://${host}` : "https://maximilien.brussels";
  }
  let rpID: string;
  try {
    rpID = new URL(origin).hostname;
  } catch {
    rpID = "maximilien.brussels";
  }
  return { rpID, rpName: "Maximilien", origin };
}

/** Slaat een nieuwe challenge op met een korte vervaltijd. */
export async function storeChallenge(opts: {
  challenge: string;
  purpose: "registration" | "authentication";
  email?: string | null;
  userId?: string | null;
}): Promise<void> {
  await ensureWebauthnSchema();
  const { dbAdmin } = await import("@/lib/db-admin.server");
  const expiresAt = new Date(Date.now() + CHALLENGE_TTL_SECONDS * 1000).toISOString();
  const { error } = await dbAdmin.from("webauthn_challenges").insert({
    challenge: opts.challenge,
    purpose: opts.purpose,
    email: opts.email ?? null,
    user_id: opts.userId ?? null,
    expires_at: expiresAt,
  });
  if (error) throw error;
}

/**
 * Haalt de meest recente, niet-verlopen challenge op voor een bepaald doel
 * en verwijdert daarna alle challenges met hetzelfde doel/identificatie
 * (eenmalig gebruik).
 */
export async function consumeChallenge(opts: {
  purpose: "registration" | "authentication";
  email?: string | null;
  userId?: string | null;
}): Promise<string | null> {
  await ensureWebauthnSchema();
  const { dbAdmin } = await import("@/lib/db-admin.server");
  let query = dbAdmin
    .from("webauthn_challenges")
    .select("id, challenge, expires_at")
    .eq("purpose", opts.purpose)
    .order("created_at", { ascending: false })
    .limit(1);

  if (opts.userId) {
    query = query.eq("user_id", opts.userId);
  } else if (opts.email) {
    query = query.eq("email", opts.email);
  } else {
    query = query.is("user_id", null).is("email", null);
  }

  const { data, error } = await query.maybeSingle();
  if (error || !data) return null;

  // Eenmalig gebruik: verwijder de challenge meteen, ongeacht of ze geldig blijkt.
  await dbAdmin.from("webauthn_challenges").delete().eq("id", data.id);

  if (new Date(data.expires_at).getTime() < Date.now()) return null;
  return data.challenge;
}

/**
 * Eenmalig verbruik op basis van de exacte challenge-waarde uit het antwoord
 * van de browser. Werkt voor inloggen met en zonder e-mailadres.
 */
export async function consumeChallengeValue(
  challenge: string,
  purpose: "registration" | "authentication",
): Promise<string | null> {
  if (!challenge) return null;
  await ensureWebauthnSchema();
  const { dbAdmin } = await import("@/lib/db-admin.server");
  const { data } = await dbAdmin
    .from("webauthn_challenges")
    .select("id, challenge, expires_at")
    .eq("purpose", purpose)
    .eq("challenge", challenge)
    .maybeSingle();
  if (!data) return null;
  await dbAdmin.from("webauthn_challenges").delete().eq("id", data.id);
  if (new Date(data.expires_at).getTime() < Date.now()) return null;
  return data.challenge;
}

/** Leest de challenge uit clientDataJSON (base64url) van een WebAuthn-antwoord. */
export function challengeFromResponse(response: unknown): string {
  try {
    const raw = (response as { response?: { clientDataJSON?: string } }).response?.clientDataJSON;
    if (!raw) return "";
    const b64 = raw.replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(atob(b64 + "===".slice((b64.length + 3) % 4)));
    return typeof json.challenge === "string" ? json.challenge : "";
  } catch {
    return "";
  }
}
