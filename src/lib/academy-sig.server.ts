/**
 * Cryptografische handtekening op certificaat-QR-codes (server-only).
 *
 * De QR op een certificaat bevat niet alleen de leesbare code maar ook een
 * HMAC-SHA256-handtekening:
 *
 *   https://maximilien.brussels/verifieer/KNJ-2026-0001?s=<hmac>
 *
 * Zonder het serversecret kan niemand een geldige handtekening voor een
 * andere (of verzonnen) code maken. De verificatiepagina toont het volledige
 * certificaatbeeld enkel bij een geldige handtekening; een handmatig getypte
 * code blijft werken, maar wordt als "niet ondertekend" gemarkeerd.
 *
 * Pure Web Crypto: werkt in Node én op de edge-runtime.
 */

const SIG_HEX_LENGTH = 64;

function secret(): string {
  const env = process.env;
  const value =
    env["CERT_QR_SECRET"] || env["PICKUP_QR_SECRET"] || env["AUTH_SECRET"] || env["JWT_SECRET"];
  if (!value || value.length < 16) {
    throw new Error("Geen ondertekeningssecret beschikbaar voor certificaat-QR-codes.");
  }
  return value;
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Constante-tijd vergelijking om timing-lekken te vermijden. */
function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Handtekening voor één certificaatcode, bv. KNJ-2026-0001. */
export async function signCertCode(code: string): Promise<string> {
  const message = `cert:v1:${String(code).replace(/^#/, "").toUpperCase()}`;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return toHex(await crypto.subtle.sign("HMAC", key, enc.encode(message)));
}

/** True enkel wanneer de handtekening exact bij deze code hoort. */
export async function verifyCertSignature(code: string, sig: unknown): Promise<boolean> {
  if (typeof sig !== "string" || sig.length !== SIG_HEX_LENGTH) return false;
  if (!/^[0-9a-f]+$/i.test(sig)) return false;
  try {
    const expected = await signCertCode(code);
    return timingSafeEqualHex(expected.toLowerCase(), sig.toLowerCase());
  } catch {
    return false;
  }
}

/** Veilige variant die nooit gooit (bv. wanneer er geen secret is ingesteld). */
export async function signCertCodeSafe(code: string): Promise<string | null> {
  try {
    return await signCertCode(code);
  } catch {
    return null;
  }
}
