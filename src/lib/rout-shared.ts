/**
 * Pure ROUT-hulpfuncties (geen geheimen, geen I/O): gedeeld door server en tests.
 */

/** ROUT-handles: kleine letters, zonder @ of spaties. */
export function normalizeHandle(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const h = raw.trim().replace(/^@+/, "").toLowerCase();
  return /^[a-z0-9][a-z0-9._-]{0,62}$/.test(h) ? h : null;
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export type SignatureCheck = { ok: true } | { ok: false; reason: "missing" | "stale" | "mismatch" };

/**
 * Controleert `x-rout-signature: t=<unix>,v1=<hex>` met
 * v1 = HMAC-SHA256(secret, `${t}.${rawBody}`) en een venster van 300 s.
 */
export async function verifyRoutSignature(
  secret: string,
  header: string | null,
  rawBody: string,
  nowSec: number = Math.floor(Date.now() / 1000),
  toleranceSec = 300,
): Promise<SignatureCheck> {
  if (!header || !secret) return { ok: false, reason: "missing" };
  const parts = Object.fromEntries(
    header.split(",").map((p) => {
      const i = p.indexOf("=");
      return [p.slice(0, i).trim(), p.slice(i + 1).trim()];
    }),
  ) as Record<string, string | undefined>;
  const t = Number(parts["t"]);
  const v1 = (parts["v1"] ?? "").toLowerCase();
  if (!Number.isFinite(t) || !v1) return { ok: false, reason: "missing" };
  if (Math.abs(nowSec - t) > toleranceSec) return { ok: false, reason: "stale" };
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${t}.${rawBody}`));
  return timingSafeEqualHex(toHex(mac), v1) ? { ok: true } : { ok: false, reason: "mismatch" };
}

/** Hoe reageren we op een antwoord van de Badge Issuance API? */
export function classifyBadgeStatus(status: number): "created" | "not_found" | "auth" | "retry" | "fail" {
  if (status === 201 || status === 200) return "created";
  if (status === 404) return "not_found";
  if (status === 401 || status === 403) return "auth";
  if (status === 429 || status >= 500) return "retry";
  return "fail";
}

/** Exponentiële backoff (ms) voor poging n (1-based), met maximum. */
export function backoffMs(attempt: number, baseMs = 500, maxMs = 8000): number {
  return Math.min(maxMs, baseMs * 2 ** (attempt - 1));
}
