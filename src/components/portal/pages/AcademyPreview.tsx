import { useMemo, useState } from "react";
import {
  academyName,
  academyDescription,
  vraagTekst,
  vraagOpties,
  wistJeDat,
} from "@/lib/academy-i18n";
import { AnimalIcon } from "@/lib/animal-glyph";
import type { Lang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { handleImageError } from "@/lib/image-fallback";

export type PreviewVraag = {
  id: string;
  module: number;
  vraag_type: string;
  vraag_tekst: string;
  vraag_tekst_fr: string | null;
  vraag_tekst_en: string | null;
  opties: string[];
  opties_fr: string[] | null;
  opties_en: string[] | null;
  correcte_optie_index: number;
  media_url: string | null;
  media_alt: string | null;
  wist_je_dat: string | null;
  wist_je_dat_fr: string | null;
  wist_je_dat_en: string | null;
  doelgroep?: string | null;
  correct_getal?: number | null;
  getal_eenheid?: string | null;
  getal_eenheid_fr?: string | null;
  getal_eenheid_en?: string | null;
};

export type PreviewAcademy = {
  id: string;
  slug: string;
  badge_icon: string;
  categorie: string;
  diersoort_naam: string;
  diersoort_naam_fr: string | null;
  diersoort_naam_en: string | null;
  beschrijving: string | null;
  beschrijving_fr: string | null;
  beschrijving_en: string | null;
  vragen_per_test: number;
  slaag_grens: number;
  vragen: PreviewVraag[];
};

const LANGS: Lang[] = ["nl", "fr", "en"];

/** Kaart exact zoals bezoekers die zien op 'Kies je Academy'. */
export function AcademyCardPreview({ a, lang }: { a: PreviewAcademy; lang: Lang }) {
  return (
    <div className="flex min-h-[210px] flex-col justify-between rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--color-sage)]/15 text-[color:var(--ink-forest)]">
            <AnimalIcon
              slug={a.slug}
              badgeIcon={a.badge_icon}
              alt={academyName(a, lang)}
              className="h-9 w-9"
            />
          </div>
          <span className="max-w-[55%] text-right text-[10px] uppercase leading-tight tracking-[0.14em] text-muted-foreground">
            {a.categorie}
          </span>
        </div>
        <p className="mt-4 text-xl font-semibold tracking-tight">{academyName(a, lang)} Academy</p>
        {academyDescription(a, lang) && (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {academyDescription(a, lang)}
          </p>
        )}
      </div>
      <p className="mt-6 border-t border-border pt-4 text-xs uppercase tracking-[0.2em] text-muted-foreground">
        {a.vragen.length || a.vragen_per_test} vragen · {a.slaag_grens} juist
      </p>
    </div>
  );
}

/** Quizweergave per module, met het juiste antwoord en de 'Wist je dat?'-tekst. */
export function AcademyQuizPreview({ a, lang }: { a: PreviewAcademy; lang: Lang }) {
  const modules = useMemo(() => {
    const map = new Map<number, PreviewVraag[]>();
    for (const v of a.vragen) {
      const list = map.get(v.module) ?? [];
      list.push(v);
      map.set(v.module, list);
    }
    return [...map.entries()].sort((x, y) => x[0] - y[0]);
  }, [a.vragen]);

  if (modules.length === 0) {
    return <p className="text-sm text-muted-foreground">Nog geen vragen voor deze academy.</p>;
  }

  return (
    <div className="space-y-5">
      {modules.map(([module, vragen]) => (
        <section key={module} className="rounded-xl border border-border bg-card p-4">
          <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Module {module} · {vragen.length} vragen
          </h4>
          <ol className="mt-3 space-y-4">
            {vragen.map((v, i) => {
              const opties = vraagOpties(v, lang);
              const tekst = vraagTekst(v, lang);
              const feedback = wistJeDat(v, lang);
              return (
                <li key={v.id} className="rounded-lg border border-border/70 bg-background p-3">
                  <p className="text-sm font-medium">
                    {i + 1}. {tekst}
                  </p>
                  {v.media_url && (
                    <img
                      src={v.media_url}
                      alt={v.media_alt ?? tekst}
                      loading="lazy"
                      className="mt-2 h-28 w-full rounded-md object-cover"
                      onError={handleImageError}
                    />
                  )}
                   {v.vraag_type === "getal" ? (
                     <p className="mt-2 rounded-md border border-primary/50 bg-primary/10 px-2 py-1 text-xs font-semibold">
                       {v.correct_getal} {lang === "fr" ? v.getal_eenheid_fr : lang === "en" ? v.getal_eenheid_en : v.getal_eenheid}
                     </p>
                   ) : <ul className="mt-2 space-y-1">
                    {opties.map((o, idx) => (
                      <li
                        key={idx}
                        className={cn(
                          "rounded-md border px-2 py-1 text-xs",
                          idx === v.correcte_optie_index
                            ? "border-primary/50 bg-primary/10 font-semibold"
                            : "border-border text-muted-foreground",
                        )}
                      >
                        {o || <span className="italic text-destructive">ontbreekt</span>}
                      </li>
                    ))}
                   </ul>}
                  {feedback && (
                    <p className="mt-2 text-xs italic text-muted-foreground">💡 {feedback}</p>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}

/** Volledige previewmodus: kaart + quiz naast elkaar in NL, FR en EN. */
export function AcademyPreviewPanel({ academies }: { academies: PreviewAcademy[] }) {
  const [selected, setSelected] = useState(academies[0]?.id ?? "");
  const [lang, setLang] = useState<Lang>("nl");
  const [doelgroep, setDoelgroep] = useState<"kids" | "16plus">("kids");
  const academy = academies.find((a) => a.id === selected) ?? academies[0];
  const previewAcademy = academy ? { ...academy, vragen: academy.vragen.filter((v) => !v.doelgroep || v.doelgroep === "beide" || v.doelgroep === doelgroep) } : academy;

  if (!academy || !previewAcademy) return <p className="text-sm text-muted-foreground">Nog geen academies.</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={academy.id}
          onChange={(e) => setSelected(e.target.value)}
          aria-label="Kies een academy"
          className="h-9 rounded-md border border-border bg-background px-2 text-sm"
        >
          {academies.map((a) => (
            <option key={a.id} value={a.id}>
              {a.diersoort_naam}
            </option>
          ))}
        </select>
        <div className="flex gap-1">
          {LANGS.map((l) => (
            <Button
              key={l}
              size="sm"
              variant={lang === l ? "default" : "outline"}
              onClick={() => setLang(l)}
            >
              {l.toUpperCase()}
            </Button>
          ))}
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant={doelgroep === "kids" ? "default" : "outline"} onClick={() => setDoelgroep("kids")}>6–15</Button>
          <Button size="sm" variant={doelgroep === "16plus" ? "default" : "outline"} onClick={() => setDoelgroep("16plus")}>16+</Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {LANGS.map((l) => (
          <div key={l} className={cn("space-y-2", l !== lang && "hidden lg:block")}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {l.toUpperCase()}
            </p>
            <AcademyCardPreview a={previewAcademy} lang={l} />
          </div>
        ))}
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Quiz — {lang.toUpperCase()}
        </p>
         <AcademyQuizPreview a={previewAcademy} lang={lang} />
      </div>
    </div>
  );
}
