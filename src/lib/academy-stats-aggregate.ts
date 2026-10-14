import type { AcademyStatRow } from "./academy-stats.functions";

export type Groep = "academy" | "doelgroep" | "taal";
export const TAAL_LABEL: Record<string, string> = { nl: "Nederlands", fr: "Frans", en: "Engels" };
export const DOELGROEP_LABEL: Record<string, string> = { kids: "Kinderen (<16)", "16plus": "16+" };

export function pct(deel: number, totaal: number) {
  return totaal > 0 ? Math.round((deel / totaal) * 100) : 0;
}

type Rij = Pick<AcademyStatRow, "academy" | "taal" | "doelgroep" | "pogingen" | "geslaagd" | "gezakt" | "bezig" | "gem_score" | "uitval_module">;

export function groepeerStats(rijen: Rij[], groep: Groep) {
  const map = new Map<string, { label: string; pogingen: number; geslaagd: number; gezakt: number; bezig: number; scoreSom: number; scoreN: number; uitvalSom: number; uitvalN: number }>();
  for (const r of rijen) {
    const key = groep === "academy" ? r.academy : groep === "taal" ? TAAL_LABEL[r.taal] ?? r.taal : DOELGROEP_LABEL[r.doelgroep] ?? r.doelgroep;
    const cur = map.get(key) ?? { label: key, pogingen: 0, geslaagd: 0, gezakt: 0, bezig: 0, scoreSom: 0, scoreN: 0, uitvalSom: 0, uitvalN: 0 };
    cur.pogingen += r.pogingen;
    cur.geslaagd += r.geslaagd;
    cur.gezakt += r.gezakt;
    cur.bezig += r.bezig;
    if (r.gem_score !== null) { cur.scoreSom += r.gem_score * r.pogingen; cur.scoreN += r.pogingen; }
    if (r.uitval_module !== null) { cur.uitvalSom += r.uitval_module * (r.gezakt + r.bezig); cur.uitvalN += r.gezakt + r.bezig; }
    map.set(key, cur);
  }
  return [...map.values()]
    .map((g) => ({
      ...g,
      slaagPct: pct(g.geslaagd, g.geslaagd + g.gezakt),
      uitvalPct: pct(g.bezig, g.pogingen),
      gemScore: g.scoreN ? Math.round(g.scoreSom / g.scoreN) : null,
      gemUitvalModule: g.uitvalN ? (g.uitvalSom / g.uitvalN).toFixed(1) : "—",
    }))
    .sort((a, b) => b.pogingen - a.pogingen);
}
