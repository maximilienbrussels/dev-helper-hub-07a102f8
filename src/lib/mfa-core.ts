/**
 * Pure hulpfuncties voor tweestapsverificatie (browser én server).
 * TOTP volgens RFC 6238 (SHA-1, 6 cijfers, 30 s) met Web Crypto.
 */

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(input: string): Uint8Array {
  const clean = input.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    value = (value << 5) | B32.indexOf(ch);
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}

export function randomBase32Secret(bytes = 20): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return base32Encode(buf);
}

export async function totpAt(secret: string, counter: number): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    base32Decode(secret) as BufferSource,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const msg = new ArrayBuffer(8);
  const view = new DataView(msg);
  view.setUint32(0, Math.floor(counter / 2 ** 32));
  view.setUint32(4, counter >>> 0);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, msg));
  const offset = sig[sig.length - 1] & 15;
  const bin =
    ((sig[offset] & 127) << 24) |
    (sig[offset + 1] << 16) |
    (sig[offset + 2] << 8) |
    sig[offset + 3];
  return String(bin % 1_000_000).padStart(6, "0");
}

/** Controleert een code met ±1 tijdvenster speling (klokverschil). */
export async function verifyTotp(secret: string, code: string, now = Date.now()): Promise<boolean> {
  const clean = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(clean)) return false;
  const step = Math.floor(now / 30_000);
  for (const d of [-1, 0, 1]) {
    if ((await totpAt(secret, step + d)) === clean) return true;
  }
  return false;
}

export function otpauthUri(secret: string, email: string): string {
  const label = encodeURIComponent(`Maximilien:${email}`);
  return `otpauth://totp/${label}?secret=${secret}&issuer=Maximilien&algorithm=SHA1&digits=6&period=30`;
}

export function randomSixDigits(): string {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return String(buf[0] % 1_000_000).padStart(6, "0");
}

/** Belgisch gsm-nummer normaliseren naar +324xxxxxxxx, anders null. */
export function normalizeBelgianMobile(input: string): string | null {
  let d = input.replace(/[^\d+]/g, "");
  if (d.startsWith("+32")) d = d.slice(3);
  else if (d.startsWith("0032")) d = d.slice(4);
  else if (d.startsWith("0")) d = d.slice(1);
  if (!/^4\d{8}$/.test(d)) return null;
  return `+32${d}`;
}

/** Het ontvangende nummer van Maximilien voor buitenlandse verificaties. */
export const VERIFY_PHONE = "+32486353111";
/** Messenger heeft een gebruikersnaam nodig; leeg = Messenger openen en bericht kopiëren. */
export const MESSENGER_USERNAME = "";

export function verifyMessage(code: string): string {
  return `Verify my account with code: ${code}`;
}

export type MessengerApp = "whatsapp" | "threema" | "signal" | "messenger";

export function messengerLink(app: MessengerApp, code: string): string {
  const text = encodeURIComponent(verifyMessage(code));
  const digits = VERIFY_PHONE.replace(/\D/g, "");
  switch (app) {
    case "whatsapp":
      return `https://wa.me/${digits}?text=${text}`;
    case "threema":
      return `threema://compose?text=${text}`;
    case "signal":
      return `https://signal.me/#p/${VERIFY_PHONE}`;
    case "messenger":
      return MESSENGER_USERNAME ? `https://m.me/${MESSENGER_USERNAME}?text=${text}` : "https://www.messenger.com/";
  }
}

export const COUNTRIES: { code: string; dial: string; name: string }[] = [
  { code: "BE", dial: "+32", name: "België" },
  { code: "NL", dial: "+31", name: "Nederland" },
  { code: "FR", dial: "+33", name: "France" },
  { code: "DE", dial: "+49", name: "Deutschland" },
  { code: "LU", dial: "+352", name: "Luxembourg" },
  { code: "GB", dial: "+44", name: "United Kingdom" },
  { code: "ES", dial: "+34", name: "España" },
  { code: "IT", dial: "+39", name: "Italia" },
  { code: "PT", dial: "+351", name: "Portugal" },
  { code: "PL", dial: "+48", name: "Polska" },
  { code: "MA", dial: "+212", name: "Maroc" },
  { code: "TR", dial: "+90", name: "Türkiye" },
  { code: "US", dial: "+1", name: "United States" },
  { code: "XX", dial: "", name: "Ander land" },
];
