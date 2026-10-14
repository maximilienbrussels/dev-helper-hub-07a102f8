/** Toetsenbordlogica voor antwoordopties: nieuwe focusindex en of er gekozen wordt. */
export function optieToets(key: string, huidig: number, n: number): { focus: number; kies: boolean } | null {
  if (n <= 0) return null;
  if (key === "ArrowDown" || key === "ArrowRight") return { focus: (huidig + 1) % n, kies: false };
  if (key === "ArrowUp" || key === "ArrowLeft") return { focus: (huidig - 1 + n) % n, kies: false };
  if (key === "Home") return { focus: 0, kies: false };
  if (key === "End") return { focus: n - 1, kies: false };
  if (/^[1-9]$/.test(key)) {
    const i = Number(key) - 1;
    return i < n ? { focus: i, kies: true } : null;
  }
  return null;
}
