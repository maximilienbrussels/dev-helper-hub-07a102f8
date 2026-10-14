/**
 * Kinderdiploma's ("Junior Boerderij Expert").
 *
 * Kinderen (<16) blijven volledig anoniem: er komt géén rij in de databank.
 * Toch krijgt elk diploma een eigen, leesbare code met het `KND`-voorvoegsel
 * (los van de volwassen certificaten die `KNJ`, `KIP`, ... gebruiken), plus een
 * publieke verificatie-URL die de echtheid van de opmaak bevestigt.
 */

export const KIDS_CERT_PREFIX = "KND";

/** Publieke verificatiepagina voor kinderdiploma's. */
export const KIDS_VERIFY_BASE = "https://maximilien.brussels/academy/verify";

/** Stabiele 32-bits hash (FNV-1a) — deterministisch, zonder afhankelijkheden. */
function hash32(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/**
 * Bouwt een kinderdiplomacode: `KND-2026-0042`.
 * Het volgnummer komt uit een hash van quiz + naam + datum, zodat hetzelfde
 * diploma altijd dezelfde code toont, ook na herladen van de pagina.
 */
export function kidsCertCode(input: {
  slug: string;
  voornaam: string;
  datum: string;
  nonce?: string;
}): string {
  const year = new Date(input.datum || Date.now()).getFullYear();
  const seed = `${input.slug}|${input.voornaam.trim().toLowerCase()}|${input.datum}|${input.nonce ?? ""}`;
  const nummer = (hash32(seed) % 9999) + 1;
  return `${KIDS_CERT_PREFIX}-${year}-${String(nummer).padStart(4, "0")}`;
}

/** Controleert of een code de vorm van een kinderdiploma heeft. */
export function isKidsCertCode(code: string | null | undefined): boolean {
  return /^KND-\d{4}-\d{4}$/.test(String(code ?? "").trim().toUpperCase());
}

/** Absolute verificatie-URL die in de QR-code van het diploma zit. */
export function kidsVerifyUrl(code: string): string {
  return `${KIDS_VERIFY_BASE}?code=${encodeURIComponent(code.replace(/^#/, ""))}`;
}
