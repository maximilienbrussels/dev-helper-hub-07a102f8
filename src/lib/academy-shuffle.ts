/**
 * Deterministisch schudden van antwoordopties.
 *
 * De server stuurt de opties in geschudde volgorde naar de browser, maar
 * bewaart die volgorde nergens: ze wordt telkens opnieuw afgeleid uit
 * (sessie-seed + vraag-id). Zo kan de server een gekozen weergave-index
 * terugrekenen naar de echte index, zonder het juiste antwoord te lekken en
 * zonder serverstatus.
 */

/** Kleine, snelle string-hash (FNV-1a). */
function hash32(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** Mulberry32: deterministische pseudo-willekeur uit één 32-bits seed. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Permutatie van 0..n-1 voor één vraag binnen één examensessie.
 * `perm[weergaveIndex] = echteIndex`.
 */
export function optiePermutatie(sessie: string, vraagId: string, n: number): number[] {
  const order = Array.from({ length: n }, (_, i) => i);
  const rand = rng(hash32(`${sessie}:${vraagId}`));
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

/** Zet een lijst opties om naar de geschudde weergavevolgorde. */
export function schudOpties<T>(opties: T[], perm: number[]): T[] {
  return perm.map((echt) => opties[echt]);
}

/** Rekent een gekozen weergave-index terug naar de echte index. */
export function echteIndex(sessie: string, vraagId: string, n: number, weergave: number): number {
  const perm = optiePermutatie(sessie, vraagId, n);
  return perm[weergave] ?? -1;
}

/** Nieuwe, willekeurige sessiesleutel voor één examenpoging. */
export function nieuweSessie(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Fisher-Yates met een gewone willekeurige bron. */
export function shuffle<T>(arr: readonly T[]): T[] {
  const pool = arr.slice();
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}
