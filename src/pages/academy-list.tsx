import { Link } from "@tanstack/react-router";
import { LocalLink } from "@/components/LocalLink";
import { pathFor } from "@/lib/routes-i18n";
import { useSuspenseQuery } from "@tanstack/react-query";
import { academiesQO } from "@/lib/academy-query";
import { useMemo, useState } from "react";
import { NavHeader } from "@/components/NavHeader";
import { listAcademies } from "@/lib/academy.functions";
import { useT, formatT } from "@/lib/i18n";
import { academyName, academyDescription } from "@/lib/academy-i18n";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Printer, Search } from "lucide-react";
import { printSheet } from "@/lib/print-sheet";

import { AnimalIcon } from "@/lib/animal-glyph";
import {
  WARNING_CATEGORY,
  countByCategory,
  filterAcademies,
  usedCategories,
} from "@/lib/academy-filter";

export function AcademyIndex() {
  const { data: academies } = useSuspenseQuery(academiesQO);
  const { t, lang } = useT();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("all");

  const categories = useMemo(() => usedCategories(academies), [academies]);
  const counts = useMemo(() => countByCategory(academies), [academies]);

  const filtered = useMemo(
    () => filterAcademies(academies, { category: cat, query, lang }),
    [academies, cat, query, lang],
  );

  const featured = filtered.slice(0, 3);
  const rest = filtered.slice(3);
  const showFeatured = !query.trim() && cat === "all" && featured.length === 3;

  return (
    <div className="min-h-screen bg-[color:var(--surface-page)] text-foreground">
      <NavHeader />
      <section>
        <div className="mx-auto max-w-5xl px-4 pt-16 pb-8 md:px-8 md:pt-24">
          <p className="text-xs uppercase tracking-[0.25em] text-primary">{t("aca.eyebrow")}</p>
          <h1 className="font-serif mt-5 text-5xl leading-[0.95] tracking-tight text-[color:var(--ink-forest)] md:text-7xl">
            {t("aca.title")}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            {t("aca.lede")}
          </p>
        </div>
      </section>

      <div className="sticky top-0 z-20 border-y border-border bg-[color:var(--surface-page)]/90 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-4 md:px-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative md:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("aca.search")}
                aria-label={t("aca.search")}
                className="h-11 rounded-full pl-9"
              />
            </div>
            <div className="flex items-center gap-3 md:ml-auto">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {formatT(t("aca.count"), { n: filtered.length })}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={printSheet}
                data-testid="print-worksheet"
              >
                <Printer className="mr-2 size-4" />
                {t("work.print")}
              </Button>
            </div>
          </div>

          <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
            {[
              { key: "all", label: t("aca.cat.all") },
              ...categories.map((c) => ({ key: c, label: t(`aca.cat.${c}`) })),
            ].map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setCat(c.key)}
                aria-pressed={cat === c.key}
                data-category={c.key}
                data-count={counts[c.key] ?? 0}
                aria-label={`${c.label} (${counts[c.key] ?? 0})`}
                className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm transition ${
                  cat === c.key
                    ? c.key === WARNING_CATEGORY
                      ? "border-destructive bg-destructive text-destructive-foreground"
                      : "border-primary bg-primary text-primary-foreground"
                    : c.key === WARNING_CATEGORY
                      ? "border-destructive/50 bg-destructive/10 text-destructive hover:border-destructive"
                      : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
              >
                {c.label}
                <span className="ml-1.5 text-xs opacity-70">{counts[c.key] ?? 0}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 py-10 pb-20 md:px-8">
        {showFeatured && (
          <>
            <h2 className="mb-4 text-xs uppercase tracking-[0.25em] text-muted-foreground">
              {t("aca.popular")}
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((a) => (
                <AcademyCard key={a.id} a={a} lang={lang} t={t} highlight />
              ))}
            </div>
            {rest.length > 0 && <div className="mt-12 border-t border-border pt-10" />}
          </>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(showFeatured ? rest : filtered).map((a) => (
            <AcademyCard key={a.id} a={a} lang={lang} t={t} />
          ))}
        </div>

        {academies.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">{t("aca.empty")}</p>
        )}

        {academies.length > 0 && filtered.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              {formatT(t("aca.noResults"), { q: query })}
            </p>
            <Button
              variant="outline"
              className="mt-4 rounded-full"
              onClick={() => {
                setQuery("");
                setCat("all");
              }}
            >
              {t("aca.clear")}
            </Button>
          </div>
        )}
      </main>

      {/* Printbaar A4-werkblad (portret): enkel zichtbaar bij printen. */}
      <div id="worksheet-print-area" aria-hidden="true">
        <h2 style={{ fontSize: "20pt", margin: 0 }}>{t("work.title")}</h2>
        <p style={{ fontSize: "10pt", marginTop: "4mm" }}>{t("work.intro")}</p>
        <p style={{ fontSize: "10pt", marginTop: "6mm" }}>
          {t("work.name")}: ______________________________ &nbsp;&nbsp; {t("work.date")}:
          ____________
        </p>
        <table
          style={{
            width: "100%",
            marginTop: "6mm",
            borderCollapse: "collapse",
            fontSize: "10pt",
          }}
        >
          <thead>
            <tr>
              <th style={{ border: "1px solid #1a2e1e", padding: "2mm", width: "10mm" }}>✓</th>
              <th style={{ border: "1px solid #1a2e1e", padding: "2mm", textAlign: "left" }}>
                {t("work.col.animal")}
              </th>
              <th style={{ border: "1px solid #1a2e1e", padding: "2mm", textAlign: "left" }}>
                {t("work.col.notes")}
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id}>
                <td style={{ border: "1px solid #1a2e1e", padding: "3mm" }}></td>
                <td style={{ border: "1px solid #1a2e1e", padding: "3mm" }}>
                  {academyName(a, lang)}
                </td>
                <td style={{ border: "1px solid #1a2e1e", padding: "3mm" }}></td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ fontSize: "8pt", marginTop: "8mm" }}>{t("work.footer")}</p>
      </div>
    </div>
  );
}

type AcademyRow = Awaited<ReturnType<typeof listAcademies>>[number];

function AcademyCard({
  a,
  lang,
  t,
  highlight = false,
}: {
  a: AcademyRow;
  lang: ReturnType<typeof useT>["lang"];
  t: ReturnType<typeof useT>["t"];
  highlight?: boolean;
}) {
  return (
    <LocalLink
      to={pathFor("academy", lang, a.slug)}
      className={`group relative flex min-h-[220px] flex-col justify-between overflow-hidden rounded-3xl border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg sm:p-7 md:p-8 ${
        highlight ? "border-primary/40" : "border-border"
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--color-sage)]/15 text-[color:var(--ink-forest)] transition group-hover:bg-primary group-hover:text-primary-foreground sm:h-14 sm:w-14">
            <AnimalIcon
              slug={a.slug}
              badgeIcon={a.badge_icon}
              alt={academyName(a, lang)}
              className="h-9 w-9 sm:h-11 sm:w-11"
            />
          </div>
          <span className="max-w-[55%] text-right text-[10px] uppercase leading-tight tracking-[0.14em] text-muted-foreground break-words">
            {t(`aca.cat.${a.categorie}`)}
          </span>
        </div>
        <h2 className="mt-4 text-xl font-semibold tracking-tight break-words hyphens-auto sm:text-2xl">
          {academyName(a, lang)} Academy
        </h2>
        {academyDescription(a, lang) && (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {academyDescription(a, lang)}
          </p>
        )}
      </div>

      <div className="mt-7 flex items-baseline justify-between border-t border-border pt-5 text-xs uppercase tracking-[0.2em] text-muted-foreground">
        <span>
          {a.modules > 1
            ? formatT(t("aca.qPassMod"), { n: a.totaal_vragen, k: a.modules })
            : formatT(t("aca.qPass"), { n: a.totaal_vragen, m: a.slaag_grens })}
        </span>
        <span className="text-primary transition group-hover:translate-x-1">→</span>
      </div>
    </LocalLink>
  );
}
