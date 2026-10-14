import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { optieToets } from "../src/lib/academy-quiz-keys";
import { groepeerStats } from "../src/lib/academy-stats-aggregate";

function lum(hex: string) {
  const c = hex.replace("#", "").match(/../g)!.map((h) => parseInt(h, 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
const ratio = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

describe("toetsenbord antwoordopties", () => {
  it("pijltjes lopen rond", () => {
    expect(optieToets("ArrowDown", 3, 4)).toEqual({ focus: 0, kies: false });
    expect(optieToets("ArrowUp", 0, 4)).toEqual({ focus: 3, kies: false });
    expect(optieToets("End", 0, 4)).toEqual({ focus: 3, kies: false });
  });
  it("cijfers kiezen, buiten bereik niet", () => {
    expect(optieToets("2", 0, 4)).toEqual({ focus: 1, kies: true });
    expect(optieToets("7", 0, 4)).toBeNull();
    expect(optieToets("a", 0, 4)).toBeNull();
  });
});

describe("statistiek-aggregatie", () => {
  const rij = (o: Partial<Parameters<typeof groepeerStats>[0][0]>) => ({ academy: "Kip", taal: "nl", doelgroep: "16plus", pogingen: 0, geslaagd: 0, gezakt: 0, bezig: 0, gem_score: null, uitval_module: null, ...o });
  it("weegt scores en groepeert per taal", () => {
    const g = groepeerStats([
      rij({ taal: "nl", pogingen: 10, geslaagd: 6, gezakt: 2, bezig: 2, gem_score: 80, uitval_module: 2 }),
      rij({ taal: "nl", academy: "Geit", pogingen: 30, geslaagd: 10, gezakt: 10, bezig: 10, gem_score: 60, uitval_module: 1 }),
      rij({ taal: "fr", pogingen: 5, geslaagd: 5 }),
    ], "taal");
    expect(g[0].label).toBe("Nederlands");
    expect(g[0].pogingen).toBe(40);
    expect(g[0].slaagPct).toBe(57);
    expect(g[0].uitvalPct).toBe(30);
    expect(g[0].gemScore).toBe(65);
    expect(g[0].gemUitvalModule).toBe("1.2");
    expect(g[1]).toMatchObject({ label: "Frans", slaagPct: 100, gemScore: null });
  });
});

describe("kleurcontrast quiz (AA)", () => {
  const css = readFileSync("src/styles.css", "utf8");
  const get = (n: string) => css.match(new RegExp(`--color-${n}:\\s*(#[0-9a-f]{6})`, "i"))![1];
  it("groen en rood halen 4.5:1 op crème en wit", () => {
    for (const k of ["quiz-ok", "quiz-bad"]) for (const bg of ["#faf8f3", "#ffffff"]) expect(ratio(get(k), bg)).toBeGreaterThanOrEqual(4.5);
  });
});
