import { academyCodePrefix } from "@/lib/academy-cert";

/** Publieke, leesbare certificaatcode per diersoort: KIP-2026-0001, HND-2026-0001, ... */
export function certCode(slug: string | undefined | null, isoDate: string, volgnummer: number) {
  const prefix = academyCodePrefix(slug);
  const year = new Date(isoDate).getFullYear();
  return `${prefix}-${year}-${String(volgnummer).padStart(4, "0")}`;
}

export function parseCertCode(code: string) {
  const m = /^([A-Za-z]{2,4})-(\d{4})-(\d{1,6})$/.exec(code.trim());
  if (!m) return null;
  return { prefix: m[1].toUpperCase(), year: Number(m[2]), volgnummer: Number(m[3]) };
}

/** "jodfb" -> "Jodfb", "jan de smet" -> "Jan De Smet" */
export function titleCaseName(name: string | null | undefined, fallback: string) {
  const raw = (name ?? "").trim();
  if (!raw) return fallback;
  return raw
    .split(/\s+/)
    .map((w) => w.charAt(0).toLocaleUpperCase() + w.slice(1))
    .join(" ");
}

/** "Jan De Smet" -> "Jan D." — publieke verificatie toont nooit de volledige naam. */
export function maskName(name: string | null | undefined): string | null {
  const raw = (name ?? "").trim();
  if (!raw) return null;
  const parts = raw.split(/\s+/);
  const first = parts[0].charAt(0).toLocaleUpperCase() + parts[0].slice(1);
  if (parts.length === 1) return first;
  return `${first} ${parts[parts.length - 1].charAt(0).toLocaleUpperCase()}.`;
}
