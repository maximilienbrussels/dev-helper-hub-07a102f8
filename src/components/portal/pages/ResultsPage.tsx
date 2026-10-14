/**
 * Academy-resultaten: slagingspercentages, uitvalmomenten en gemiddelde scores
 * vergelijken per dier, leeftijdscategorie en taal. Alle cijfers komen uit
 * anonieme pogingen — er staan geen persoonsgegevens in.
 */
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Loader2 } from "lucide-react";
import { RoutBadgesSection } from "@/components/portal/RoutBadgesSection";
import { getAcademyStats, type AcademyStatRow } from "@/lib/academy-stats.functions";
import { usePortal } from "@/lib/portal-store";
import { DOELGROEP_LABEL, TAAL_LABEL, groepeerStats, pct, type Groep } from "@/lib/academy-stats-aggregate";

export function ResultsPage() {
  const { lang } = usePortal();
  const fn = useServerFn(getAcademyStats);
  const [dagen, setDagen] = useState(365);
  const [groep, setGroep] = useState<Groep>("academy");
  const [taal, setTaal] = useState<string>("alle");
  const [doelgroep, setDoelgroep] = useState<string>("alle");

  const { data, isLoading, error } = useQuery({
    queryKey: ["academy-stats", dagen],
    queryFn: () => fn({ data: { dagen } }),
  });

  const rijen = useMemo(() => {
    const alle = data?.rijen ?? [];
    return alle.filter(
      (r) =>
        (taal === "alle" || r.taal === taal) &&
        (doelgroep === "alle" || r.doelgroep === doelgroep),
    );
  }, [data, taal, doelgroep]);

  const gegroepeerd = useMemo(() => groepeerStats(rijen, groep), [rijen, groep]);

  const totalen = useMemo(() => {
    const p = rijen.reduce((s, r) => s + r.pogingen, 0);
    const g = rijen.reduce((s, r) => s + r.geslaagd, 0);
    const z = rijen.reduce((s, r) => s + r.gezakt, 0);
    const b = rijen.reduce((s, r) => s + r.bezig, 0);
    return { p, g, z, b, slaag: pct(g, g + z), uitval: pct(b, p) };
  }, [rijen]);

  if (isLoading)
    return (
      <p className="p-6 text-sm text-muted-foreground">
        <Loader2 className="mr-2 inline size-4 animate-spin" /> Resultaten laden…
      </p>
    );

  if (error)
    return (
      <p className="p-6 text-sm text-destructive">
        De resultaten konden niet geladen worden. Probeer het later opnieuw.
      </p>
    );

  return (
    <div className="space-y-6 p-4 md:p-6" lang={lang}>
      <header>
        <h1 className="text-xl font-semibold">Academy-resultaten</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Anonieme cijfers: slaagkans, waar deelnemers afhaken en gemiddelde score.
        </p>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Select label="Periode" value={String(dagen)} onChange={(v) => setDagen(Number(v))} options={[["30", "30 dagen"], ["90", "90 dagen"], ["365", "12 maanden"], ["3650", "Alles"]]} />
        <Select label="Groeperen op" value={groep} onChange={(v) => setGroep(v as Groep)} options={[["academy", "Dier"], ["doelgroep", "Leeftijdscategorie"], ["taal", "Taal"]]} />
        <Select label="Taal" value={taal} onChange={setTaal} options={[["alle", "Alle talen"], ["nl", "Nederlands"], ["fr", "Frans"], ["en", "Engels"]]} />
        <Select label="Leeftijd" value={doelgroep} onChange={setDoelgroep} options={[["alle", "Alle"], ["kids", "Kinderen (<16)"], ["16plus", "16+"]]} />
      </div>

      {/* Kerncijfers */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Pogingen" value={String(totalen.p)} />
        <Kpi label="Slagingspercentage" value={`${totalen.slaag}%`} />
        <Kpi label="Afgehaakt (niet afgerond)" value={`${totalen.uitval}%`} />
        <Kpi label="Niet geslaagd" value={String(totalen.z)} />
      </div>

      {totalen.p === 0 ? (
        <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Er zijn nog geen pogingen in deze periode. Zodra bezoekers de Academy starten, verschijnen
          hier de cijfers.
        </p>
      ) : (
        <>
          <section className="rounded-2xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">Slagingspercentage</h2>
            <div className="mt-4 h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gegroepeerd} margin={{ left: 0, right: 8, top: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Bar dataKey="slaagPct" radius={[6, 6, 0, 0]}>
                    {gegroepeerd.map((g) => (
                      <Cell
                        key={g.label}
                        fill={g.slaagPct >= 70 ? "var(--color-quiz-ok, #2f6b3f)" : g.slaagPct >= 40 ? "#8a6508" : "var(--color-quiz-bad, #a02c2c)"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full min-w-[720px] text-sm">
              <caption className="sr-only">
                Resultaten per {groep === "academy" ? "dier" : groep === "taal" ? "taal" : "leeftijdscategorie"}
              </caption>
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3">{groep === "academy" ? "Dier" : groep === "taal" ? "Taal" : "Leeftijd"}</th>
                  <th scope="col" className="px-4 py-3 text-right">Pogingen</th>
                  <th scope="col" className="px-4 py-3 text-right">Geslaagd</th>
                  <th scope="col" className="px-4 py-3 text-right">Slaagkans</th>
                  <th scope="col" className="px-4 py-3 text-right">Afgehaakt</th>
                  <th scope="col" className="px-4 py-3 text-right">Gem. score</th>
                  <th scope="col" className="px-4 py-3 text-right">Afhaakt in ronde</th>
                </tr>
              </thead>
              <tbody>
                {gegroepeerd.map((g) => (
                  <tr key={g.label} className="border-t border-border">
                    <th scope="row" className="px-4 py-3 text-left font-medium">{g.label}</th>
                    <td className="px-4 py-3 text-right">{g.pogingen}</td>
                    <td className="px-4 py-3 text-right">{g.geslaagd}</td>
                    <td className="px-4 py-3 text-right font-semibold">{g.slaagPct}%</td>
                    <td className="px-4 py-3 text-right">{g.uitvalPct}%</td>
                    <td className="px-4 py-3 text-right">{g.gemScore === null ? "—" : `${g.gemScore}%`}</td>
                    <td className="px-4 py-3 text-right">{g.gemUitvalModule}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}

      {(data?.zwak?.length ?? 0) > 0 && (
        <section className="overflow-x-auto rounded-2xl border border-border bg-card">
          <h2 className="px-4 pt-4 text-sm font-semibold">Moeilijkste vragen</h2>
          <p className="px-4 pb-2 pt-1 text-xs text-muted-foreground">
            Vragen die het vaakst fout gaan — handig om de formulering te herbekijken.
          </p>
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3">Vraag</th>
                <th scope="col" className="px-4 py-3">Dier</th>
                <th scope="col" className="px-4 py-3">Taal</th>
                <th scope="col" className="px-4 py-3">Leeftijd</th>
                <th scope="col" className="px-4 py-3 text-right">Gesteld</th>
                <th scope="col" className="px-4 py-3 text-right">Juist</th>
              </tr>
            </thead>
            <tbody>
              {data!.zwak.map((v) => (
                <tr key={`${v.vraag_id}-${v.taal}-${v.doelgroep}`} className="border-t border-border">
                  <td className="max-w-[28rem] px-4 py-3">{v.vraag}</td>
                  <td className="px-4 py-3">{v.academy}</td>
                  <td className="px-4 py-3">{TAAL_LABEL[v.taal] ?? v.taal}</td>
                  <td className="px-4 py-3">{DOELGROEP_LABEL[v.doelgroep] ?? v.doelgroep}</td>
                  <td className="px-4 py-3 text-right">{v.gesteld}</td>
                  <td className="px-4 py-3 text-right font-semibold">{v.juist_pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
      <RoutBadgesSection />
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-muted-foreground">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-full border border-border bg-background px-3 text-sm text-foreground"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

export default ResultsPage;

/** Ongebruikte placeholder-typing zodat de rij-typing zichtbaar blijft. */
export type { AcademyStatRow };
