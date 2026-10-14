/**
 * Cryptografisch beveiligde afhaal-QR-codes (server-only).
 *
 * De QR bevat nooit een raadbaar volgnummer (ORDER-1012) maar een UUID plus
 * een HMAC-SHA256-handtekening met `PICKUP_QR_SECRET`. Zonder het geheim kan
 * niemand een geldige code voor een andere bestelling samenstellen.
 *
 *   https://maximilien.brussels/admin/scan?orderId={uuid}&token={hmac}
 *
 * Pure Web Crypto: werkt in Node én op de edge-runtime.
 */

const TOKEN_HEX_LENGTH = 64; // 32 bytes SHA-256 → 64 hex-tekens
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function secret(): string {
  const value = process.env["PICKUP_QR_SECRET"];
  if (!value || value.length < 16) {
    throw new Error("PICKUP_QR_SECRET ontbreekt — afhaal-QR-codes kunnen niet ondertekend worden.");
  }
  return value;
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacHex(message: string): Promise<string> {
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

/** Constante-tijd vergelijking om timing-lekken te vermijden. */
function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function isPickupUuid(value: string): boolean {
  return UUID_RE.test(value);
}

/** Handtekening voor één bestelling (gebonden aan het UUID, niet aan het volgnummer). */
export async function signPickupToken(orderUuid: string): Promise<string> {
  if (!isPickupUuid(orderUuid)) throw new Error("Ongeldig bestel-UUID.");
  return hmacHex(`pickup:v1:${orderUuid.toLowerCase()}`);
}

/** True enkel wanneer het token exact overeenkomt met de serverhandtekening. */
export async function verifyPickupToken(orderUuid: string, token: string): Promise<boolean> {
  if (!isPickupUuid(orderUuid)) return false;
  if (typeof token !== "string" || token.length !== TOKEN_HEX_LENGTH) return false;
  if (!/^[0-9a-f]+$/i.test(token)) return false;
  try {
    const expected = await signPickupToken(orderUuid);
    return timingSafeEqualHex(expected.toLowerCase(), token.toLowerCase());
  } catch {
    return false;
  }
}

export const PICKUP_SCAN_PATH = "/admin/scan";

/** De URL die in de QR-code wordt gecodeerd (scanbaar met een admin-toestel). */
export function pickupScanUrl(orderUuid: string, token: string, origin = "https://maximilien.brussels"): string {
  const u = new URL(PICKUP_SCAN_PATH, origin);
  u.searchParams.set("orderId", orderUuid.toLowerCase());
  u.searchParams.set("token", token);
  return u.toString();
}

/** Publieke PNG van de QR (voor e-mail); vereist hetzelfde token. */
export function pickupQrImageUrl(orderUuid: string, token: string, origin = "https://maximilien.brussels"): string {
  const u = new URL("/api/public/pickup/qr", origin);
  u.searchParams.set("orderId", orderUuid.toLowerCase());
  u.searchParams.set("token", token);
  return u.toString();
}

/** Downloadbare PDF-afhaalpas; vereist hetzelfde token. */
export function pickupPassUrl(orderUuid: string, token: string, origin = "https://maximilien.brussels"): string {
  const u = new URL("/api/public/pickup/pass", origin);
  u.searchParams.set("orderId", orderUuid.toLowerCase());
  u.searchParams.set("token", token);
  return u.toString();
}

/** Alle links voor één bestelling in één keer. */
export async function pickupLinks(orderUuid: string, origin?: string) {
  const token = await signPickupToken(orderUuid);
  return {
    token,
    scanUrl: pickupScanUrl(orderUuid, token, origin),
    qrImageUrl: pickupQrImageUrl(orderUuid, token, origin),
    passUrl: pickupPassUrl(orderUuid, token, origin),
  };
}
