/**
 * Bluesky / AT Protocol OAuth (server-only).
 *
 * Volledig gedecentraliseerd: we vertrekken van de handle van de bezoeker,
 * zoeken zijn DID op, daarna zijn PDS en pas dan de authorisatieserver van die
 * PDS. Er is geen centrale developer console nodig: onze app identificeert
 * zich met een publiek client-metadata document (`client_id` = URL) en tekent
 * elke tokenaanvraag met een DPoP-sleutel die per aanmelding wordt gemaakt.
 */
import { normalizeEmail } from "./local-auth.server";
import { authOrigin } from "./google-oauth.server";
import type { SocialProfile } from "./social-oauth.server";

export const BLUESKY_FLOW_COOKIE = "maximilien_atproto_flow";
export const BLUESKY_SCOPE = "atproto";

/* ------------------------------------------------------------------ utils */

function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (const byte of view) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlText(text: string): string {
  return b64url(new TextEncoder().encode(text));
}

async function sha256(text: string): Promise<ArrayBuffer> {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
}

/** Maakt van "@alice.bsky.social", "alice.bsky.social" of een DID één identifier. */
export function normalizeHandle(input: string | null | undefined): string {
  let raw = (input || "").trim().toLowerCase();
  raw = raw.replace(/^@+/, "");
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    try {
      raw = new URL(raw).hostname;
    } catch {
      /* laat de ruwe waarde staan */
    }
  }
  if (raw.startsWith("did:")) return raw;
  if (raw && !raw.includes(".")) raw = `${raw}.bsky.social`;
  return raw;
}

/* ------------------------------------------------------- client metadata */

/** De publieke URL van ons client-metadata document (= onze client_id). */
export function clientMetadataUrl(origin: string): string {
  return new URL("/api/public/atproto/client-metadata.json", origin).toString();
}

export function blueskyRedirectUri(origin: string): string {
  return new URL("/api/auth/callback/bluesky", origin).toString();
}

/**
 * Op een publieke https-site gebruiken we het metadata-document. Lokaal
 * (http) laat AT Protocol het speciale loopback-client-id toe.
 */
export function blueskyClientId(origin: string): string {
  if (origin.startsWith("https://")) return clientMetadataUrl(origin);
  const params = new URLSearchParams({
    redirect_uri: blueskyRedirectUri(origin),
    scope: BLUESKY_SCOPE,
  });
  return `http://localhost?${params.toString()}`;
}

export function clientMetadataDocument(origin: string): Record<string, unknown> {
  return {
    client_id: clientMetadataUrl(origin),
    client_name: "Maximilien",
    client_uri: origin,
    redirect_uris: [blueskyRedirectUri(origin)],
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    scope: BLUESKY_SCOPE,
    application_type: "web",
    token_endpoint_auth_method: "none",
    dpop_bound_access_tokens: true,
  };
}

/* ------------------------------------------------------------- discovery */

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`${url} gaf status ${res.status}`);
  return (await res.json()) as T;
}

/** Handle → DID (via de publieke resolver, of rechtstreeks als het al een DID is). */
export async function resolveDid(identifier: string): Promise<string> {
  if (identifier.startsWith("did:")) return identifier;
  const data = await fetchJson<{ did?: string }>(
    `https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=${encodeURIComponent(identifier)}`,
  );
  if (!data.did) throw new Error("Deze Bluesky-handle bestaat niet.");
  return data.did;
}

/** DID → PDS-adres, via het DID-document (did:plc of did:web). */
export async function resolvePds(did: string): Promise<string> {
  let doc: { service?: { id?: string; type?: string; serviceEndpoint?: string }[] };
  if (did.startsWith("did:web:")) {
    const host = decodeURIComponent(did.slice("did:web:".length)).replace(/:/g, "/");
    doc = await fetchJson(`https://${host}/.well-known/did.json`);
  } else {
    doc = await fetchJson(`https://plc.directory/${encodeURIComponent(did)}`);
  }
  const service = (doc.service ?? []).find(
    (s) => s.type === "AtprotoPersonalDataServer" || s.id?.endsWith("#atproto_pds"),
  );
  if (!service?.serviceEndpoint) throw new Error("Geen PDS gevonden voor dit account.");
  return new URL(service.serviceEndpoint).origin;
}

type AuthServerMeta = {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  pushed_authorization_request_endpoint?: string;
};

/** PDS → authorisatieserver → metadata (endpoints). */
export async function resolveAuthServer(pds: string): Promise<AuthServerMeta> {
  const resource = await fetchJson<{ authorization_servers?: string[] }>(
    `${pds}/.well-known/oauth-protected-resource`,
  );
  const issuer = resource.authorization_servers?.[0] ?? pds;
  const meta = await fetchJson<AuthServerMeta>(
    `${issuer.replace(/\/$/, "")}/.well-known/oauth-authorization-server`,
  );
  if (!meta.authorization_endpoint || !meta.token_endpoint) {
    throw new Error("Deze Bluesky-server publiceert geen OAuth-endpoints.");
  }
  return meta;
}

/* ------------------------------------------------------------------ DPoP */

type DpopKey = { privateKey: CryptoKey; publicJwk: JsonWebKey };

async function generateDpopKey(): Promise<DpopKey & { privateJwk: JsonWebKey }> {
  const pair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, [
    "sign",
    "verify",
  ]);
  const privateJwk = await crypto.subtle.exportKey("jwk", pair.privateKey);
  const jwk = await crypto.subtle.exportKey("jwk", pair.publicKey);
  return {
    privateKey: pair.privateKey,
    privateJwk,
    publicJwk: { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y },
  };
}

async function importDpopKey(privateJwk: JsonWebKey): Promise<DpopKey> {
  const privateKey = await crypto.subtle.importKey(
    "jwk",
    privateJwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  return {
    privateKey,
    publicJwk: { kty: privateJwk.kty, crv: privateJwk.crv, x: privateJwk.x, y: privateJwk.y },
  };
}

async function dpopProof(
  key: DpopKey,
  method: string,
  url: string,
  nonce?: string | null,
): Promise<string> {
  const header = { typ: "dpop+jwt", alg: "ES256", jwk: key.publicJwk };
  const payload: Record<string, unknown> = {
    jti: crypto.randomUUID(),
    htm: method,
    htu: url.split("?")[0],
    iat: Math.floor(Date.now() / 1000),
  };
  if (nonce) payload["nonce"] = nonce;
  const signingInput = `${b64urlText(JSON.stringify(header))}.${b64urlText(JSON.stringify(payload))}`;
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key.privateKey,
    new TextEncoder().encode(signingInput),
  );
  return `${signingInput}.${b64url(signature)}`;
}

/** POST met DPoP; herhaalt automatisch met de nonce die de server oplegt. */
async function dpopFetch(
  key: DpopKey,
  url: string,
  body: URLSearchParams,
  nonce?: string | null,
): Promise<{ res: Response; nonce: string | null }> {
  let currentNonce = nonce ?? null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        DPoP: await dpopProof(key, "POST", url, currentNonce),
      },
      body,
    });
    const serverNonce = res.headers.get("DPoP-Nonce");
    if (res.ok || attempt === 1 || !serverNonce || serverNonce === currentNonce) {
      return { res, nonce: serverNonce ?? currentNonce };
    }
    currentNonce = serverNonce;
  }
  throw new Error("Bluesky weigerde de aanvraag.");
}

/* ------------------------------------------------------------------ flow */

export type BlueskyFlow = {
  jwk: JsonWebKey;
  verifier: string;
  tokenEndpoint: string;
  issuer: string;
  did: string;
  handle: string;
  nonce: string | null;
};

export function encodeFlow(flow: BlueskyFlow): string {
  return encodeURIComponent(b64urlText(JSON.stringify(flow)));
}

export function decodeFlow(raw: string | null): BlueskyFlow | null {
  if (!raw) return null;
  try {
    const normalized = decodeURIComponent(raw).replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(normalized)) as BlueskyFlow;
  } catch {
    return null;
  }
}

/** Stap 1: handle oplossen, PAR uitvoeren en de authorisatie-URL bouwen. */
export async function startBlueskyAuth(
  request: Request,
  handleInput: string | null,
  state: string,
): Promise<{ authUrl: URL; flow: BlueskyFlow }> {
  const origin = authOrigin(request);
  const handle = normalizeHandle(handleInput);
  if (!handle) throw new Error("Geef je Bluesky-handle op.");

  const did = await resolveDid(handle);
  const pds = await resolvePds(did);
  const meta = await resolveAuthServer(pds);

  const key = await generateDpopKey();
  const verifier = b64url(crypto.getRandomValues(new Uint8Array(32)));
  const challenge = b64url(await sha256(verifier));
  const clientId = blueskyClientId(origin);
  const redirectUri = blueskyRedirectUri(origin);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: BLUESKY_SCOPE,
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    login_hint: handle,
  });

  const authUrl = new URL(meta.authorization_endpoint);
  let nonce: string | null = null;

  if (meta.pushed_authorization_request_endpoint) {
    const { res, nonce: parNonce } = await dpopFetch(
      key,
      meta.pushed_authorization_request_endpoint,
      params,
    );
    if (!res.ok) {
      console.error("[bluesky-oauth] PAR mislukt:", res.status, await res.text());
      throw new Error("Deze Bluesky-server aanvaardde de aanmelding niet.");
    }
    const parsed = (await res.json()) as { request_uri?: string };
    if (!parsed.request_uri) throw new Error("Bluesky gaf geen request_uri terug.");
    nonce = parNonce;
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("request_uri", parsed.request_uri);
  } else {
    for (const [k, v] of params) authUrl.searchParams.set(k, v);
  }

  return {
    authUrl,
    flow: {
      jwk: key.privateJwk,
      verifier,
      tokenEndpoint: meta.token_endpoint,
      issuer: meta.issuer,
      did,
      handle,
      nonce,
    },
  };
}

/** Stap 2: code inwisselen (DPoP) en het profiel opbouwen. */
export async function exchangeBlueskyCode(
  request: Request,
  code: string,
  flow: BlueskyFlow,
): Promise<SocialProfile> {
  const origin = authOrigin(request);
  const key = await importDpopKey(flow.jwk);

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: blueskyRedirectUri(origin),
    client_id: blueskyClientId(origin),
    code_verifier: flow.verifier,
  });

  const { res } = await dpopFetch(key, flow.tokenEndpoint, body, flow.nonce);
  if (!res.ok) {
    console.error("[bluesky-oauth] token mislukt:", res.status, await res.text());
    throw new Error("Bluesky kon de aanmelding niet bevestigen.");
  }
  const token = (await res.json()) as { sub?: string };
  const did = token.sub || flow.did;
  if (!did) throw new Error("Bluesky gaf geen account terug.");

  let handle = flow.handle;
  let name: string | null = null;
  let picture: string | null = null;
  try {
    const profile = await fetchJson<{ handle?: string; displayName?: string; avatar?: string }>(
      `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${encodeURIComponent(did)}`,
    );
    if (profile.handle) handle = profile.handle;
    name = profile.displayName || null;
    picture = profile.avatar || null;
  } catch (error) {
    console.error("[bluesky-oauth] profiel ophalen mislukt:", error);
  }

  // Bluesky deelt geen e-mailadres: we bouwen een stabiel adres uit de handle.
  const slug = handle.replace(/[^a-z0-9.-]/gi, "") || did.replace(/[^a-z0-9]/gi, "");
  return {
    email: normalizeEmail(`${slug}@bsky.local`),
    name: name || `@${handle}`,
    picture,
    emailVerified: true,
    subject: did,
    instance: handle.includes(".") ? handle.split(".").slice(-2).join(".") : null,
  };
}
