/**
 * Deterministische pseudo-willekeur op basis van een string-seed.
 * Zelfde seed => zelfde waarde, zodat een stempel op dezelfde plek blijft
 * staan bij elke re-render of refresh.
 */
export function pseudoRandom(seed: string, min: number, max: number) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0;
  }
  const rnd = (Math.sin(hash) + 1) / 2; // 0..1
  return min + rnd * (max - min);
}

export type StampJitter = {
  rotate: number;
  offsetX: number;
  offsetY: number;
  opacity: number;
  scale: number;
};

/** De 5 variabelen van een echte, handgezette stempel. */
export function stampJitter(seed: string): StampJitter {
  return {
    rotate: pseudoRandom(seed + "rot", -6, 6),
    offsetX: pseudoRandom(seed + "x", -8, 8),
    offsetY: pseudoRandom(seed + "y", -8, 8),
    opacity: pseudoRandom(seed + "op", 0.72, 0.9),
    scale: pseudoRandom(seed + "sc", 0.97, 1.03),
  };
}
