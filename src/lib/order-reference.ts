/**
 * Publieke bestelreferentie van de hoevewinkel.
 *
 * Formaat: `MP-2026-8F3A2`
 *   MP    = Maximilien Park
 *   2026  = jaartal van de bestelling
 *   XXXXX = 5 willekeurige tekens (hoofdletters + cijfers)
 *
 * Verwarrende tekens (I, O, 0, 1) blijven weg zodat klanten de code
 * telefonisch of op papier foutloos kunnen doorgeven.
 */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Geeft één nieuwe referentie, bv. `MP-2026-8F3A2`. */
export function generateOrderReference(year: number = new Date().getFullYear()): string {
  const bytes = new Uint8Array(5);
  crypto.getRandomValues(bytes);
  let code = "";
  for (const byte of bytes) code += ALPHABET[byte % ALPHABET.length];
  return `MP-${year}-${code}`;
}

/** Herkent een geldige referentie (hoofdletterongevoelig). */
export function isOrderReference(value: string): boolean {
  return /^MP-\d{4}-[A-Z0-9]{5}$/i.test(value.trim());
}

/** Factuurnummer dat één-op-één bij de bestelreferentie hoort: `INV-2026-8F3A2`. */
export function invoiceNumberForReference(reference: string): string {
  return reference.replace(/^MP-/i, "INV-").toUpperCase();
}

/** Toonbare vorm voor UI en e-mails: `MP-2026-8F3A2` of een terugval op het id. */
export function displayOrderReference(
  reference: string | null | undefined,
  orderId: number | string,
): string {
  return reference && reference.trim() ? reference.trim().toUpperCase() : `#${orderId}`;
}
