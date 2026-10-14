/**
 * Onraadbare betaalsleutel per bestelling (HMAC-SHA256 over het bestelnummer).
 * Enkel wie de bestelling plaatste krijgt hem terug; zonder sleutel geen betaalpagina.
 */
function secret(): string {
  const s =
    process.env["ORDER_PAY_SECRET"] ||
    process.env["PICKUP_QR_SECRET"] ||
    process.env["AUTH_JWT_SECRET"] ||
    process.env["JWT_SECRET"];
  if (!s) throw new Error("Betalen is tijdelijk niet beschikbaar.");
  return s;
}

async function hmac(msg: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(`orderpay:${secret()}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg)));
  return Array.from(sig, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function orderPayToken(orderId: number): Promise<string> {
  return hmac(`order:v1:${orderId}`);
}

export async function verifyOrderPayToken(orderId: number, token: unknown): Promise<boolean> {
  if (typeof token !== "string" || token.length !== 64) return false;
  let expected: string;
  try {
    expected = await orderPayToken(orderId);
  } catch {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < 64; i++) diff |= expected.charCodeAt(i) ^ token.charCodeAt(i);
  return diff === 0;
}
