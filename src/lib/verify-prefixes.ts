/**
 * Publieke lijst van geldige certificaat-prefixen (bv. KNJ, KIP, HND...).
 * Bewust hier apart gehouden (afgeleid van `academy-cert.ts`) zodat de
 * publieke verificatiepagina's — die géén server-only code mogen bundelen —
 * er client-side suggesties mee kunnen tonen wanneer een nummer niet
 * gevonden wordt.
 */
export const KNOWN_CERT_PREFIXES = [
  "KIP",
  "HND",
  "KNJ",
  "GEI",
  "EZL",
  "BIJ",
  "VRK",
  "SCH",
  "PRD",
  "PON",
  "END",
  "KWR",
  "GNS",
  "KLK",
  "CAV",
  "RAT",
  "KAT",
  "DUF",
  "ALP",
  "VIS",
  "CMP",
  "MOE",
] as const;

/** Voorbeeld dat we overal tonen als helper-formaat. */
export const EXAMPLE_CERT_CODE = "KNJ-2026-0001";

function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [
    i,
    ...Array(b.length).fill(0),
  ]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

/** Geeft de dichtstbijzijnde geldige prefixen voor een (fout getypte) prefix. */
export function closestCertPrefixes(prefix: string, max = 3): string[] {
  const clean = prefix.trim().toUpperCase();
  if (!clean) return [];
  return [...KNOWN_CERT_PREFIXES]
    .map((p) => ({ p, d: levenshtein(clean, p) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, max)
    .map((x) => x.p);
}
