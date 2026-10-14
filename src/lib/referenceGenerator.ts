/**
 * Unieke, menselijk leesbare referentienummers per transactietype.
 *
 *   Donaties / peterschappen        → DON-2026-X892
 *   Vakantiestages / animaties      → TKT-2026-K481
 *   Zaalverhuur / teambuilding      → FAC-2026-M102
 *   Hoevewinkel                     → ORD-2026-W991
 *
 * De referentie wordt bij het aanmaken van de Stripe PaymentIntent verplicht
 * in de databank bewaard (`payments.reference`, `orders.reference`) en komt in
 * élke bevestigingsmail, ticket en factuur terug.
 */

export type TransactionKind = "donation" | "ticket" | "invoice" | "shop";

export const REFERENCE_PREFIX: Record<TransactionKind, string> = {
  donation: "DON",
  ticket: "TKT",
  invoice: "FAC",
  shop: "ORD",
};

/** Zonder I, O, 0 en 1: verwarring bij voorlezen aan de telefoon uitgesloten. */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomBlock(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const byte of bytes) out += ALPHABET[byte % ALPHABET.length];
  return out;
}

/** Bouwt bv. `DON-2026-X892`. */
export function generateReference(kind: TransactionKind, year = new Date().getFullYear()): string {
  return `${REFERENCE_PREFIX[kind]}-${year}-${randomBlock(4)}`;
}

const PATTERN = /^(DON|TKT|FAC|ORD)-(\d{4})-([A-Z0-9]{4})$/;

export function isValidReference(reference: string): boolean {
  return PATTERN.test(reference.trim().toUpperCase());
}

/** Leidt het transactietype af uit een bestaande referentie. */
export function kindFromReference(reference: string): TransactionKind | null {
  const match = PATTERN.exec(reference.trim().toUpperCase());
  if (!match) return null;
  const prefix = match[1] as (typeof REFERENCE_PREFIX)[TransactionKind];
  const entry = (Object.entries(REFERENCE_PREFIX) as [TransactionKind, string][]).find(
    ([, value]) => value === prefix,
  );
  return entry ? entry[0] : null;
}

/** Vaste productcodes → transactietype (voor de PaymentIntent-metadata). */
export function kindForProduct(product: string): TransactionKind {
  if (/peterschap|donatie|steun|gift/i.test(product)) return "donation";
  if (/stage|animatie|kamp|ticket|workshop/i.test(product)) return "ticket";
  if (/winkel|shop|bestel|order|hoeve/i.test(product)) return "shop";
  return "invoice";
}
