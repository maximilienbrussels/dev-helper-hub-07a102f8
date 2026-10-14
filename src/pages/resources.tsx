import { deepTx } from "@/lib/i18n-extra";
import { PagePhotoBand } from "@/components/PagePhotoBand";
import { NavHeader } from "@/components/NavHeader";
import { PageContactForm } from "@/components/PageContactForm";
import { useT } from "@/lib/i18n";
import { Link } from "@tanstack/react-router";
import { SLUGS } from "@/lib/routes-i18n";
import {
  ANIMAL_SHEETS,
  FARM_MAP,
  RESOURCES,
  RESOURCES_COPY,
  SHEETS_COPY,
  type Resource,
  type ResourceCategory,
} from "@/lib/resources-content";
import { ArrowUpRight, FileDown, Map } from "lucide-react";
import { handleImageError } from "@/lib/image-fallback";


const ORDER: ResourceCategory[] = ["pedagogie", "moestuin", "dieren", "vzw"];

function Card({ r, open, lang }: { r: Resource; open: string; lang: "nl" | "fr" | "en" }) {
  const { tx } = useT();
  const inner = (
    <>
      <h3 className="font-serif text-lg text-[color:var(--ink-forest)]">{tx(r.title[lang])}</h3>
      <p className="mt-2 text-sm leading-relaxed text-foreground/90">{tx(r.description[lang])}</p>
      <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[color:var(--color-terracotta)]">
        {r.external ? (
          <FileDown className="h-4 w-4" aria-hidden />
        ) : (
          <ArrowUpRight className="h-4 w-4" aria-hidden />
        )}
        {open}
      </span>
    </>
  );

  const className =
    "block rounded-3xl border border-border/60 p-6 transition-colors hover:border-[color:var(--color-terracotta)]";

  if (r.external || !r.page) {
    return (
      <a href={r.href} target="_blank" rel="noreferrer" className={className}>
        {inner}
      </a>
    );
  }
  return (
    <Link
      to="/$lang/$"
      params={{ lang, _splat: SLUGS[r.page][lang] }}
      className={className}
    >
      {inner}
    </Link>
  );
}

export function ResourcesPage() {
  const { lang, tx } = useT();
  const c = deepTx(tx, RESOURCES_COPY[lang]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavHeader />
      <PagePhotoBand photo="weide-stal" />
      <main className="mx-auto max-w-5xl px-4 py-16 md:px-8 md:py-24">
        <p className="text-[11px] uppercase tracking-[0.25em] text-[color:var(--color-terracotta)] font-medium">
          {c.eyebrow}
        </p>
        <h1 className="font-serif mt-4 text-4xl leading-[1.02] tracking-tight text-[color:var(--ink-forest)] md:text-6xl">
          {c.title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">{c.lede}</p>

        <AnimalSheets lang={lang} />

        {ORDER.map((cat) => {
          const items = RESOURCES.filter((r) => r.category === cat);
          if (!items.length) return null;
          return (
            <section key={cat} className="mt-12">
              <h2 className="font-serif text-2xl text-[color:var(--ink-forest)]">
                {c.categories[cat]}
              </h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {items.map((r) => (
                  <Card key={r.id} r={r} open={c.open} lang={lang} />
                ))}
              </div>
            </section>
          );
        })}


        <p className="mt-10 rounded-3xl border border-border/60 bg-[color:var(--surface-page)]/50 px-5 py-4 text-sm text-muted-foreground">
          {c.note}
        </p>

        <div className="mt-16">
          <PageContactForm
            context="Ressources"
            inbox="algemeen"
            title={c.formTitle}
            intro={c.formIntro}
          />
        </div>
      </main>
    </div>
  );
}

function AnimalSheets({ lang }: { lang: "nl" | "fr" | "en" }) {
  const { tx } = useT();
  const s = deepTx(tx, SHEETS_COPY[lang]);
  return (
    <>
      <section className="mt-20">
        <p className="text-[11px] uppercase tracking-[0.25em] text-[color:var(--color-terracotta)] font-medium">
          {s.eyebrow}
        </p>
        <h2 className="font-serif mt-3 text-3xl text-[color:var(--ink-forest)] md:text-4xl">
          {s.title}
        </h2>
        <p className="mt-4 max-w-2xl text-muted-foreground">{s.intro}</p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ANIMAL_SHEETS.map((a) => (
            <article
              key={a.id}
              className="overflow-hidden rounded-3xl border border-border/60 transition-colors hover:border-[color:var(--color-terracotta)]"
            >
              <div className="aspect-[4/3] overflow-hidden bg-[color:var(--surface-page)]/60">
                <img onError={handleImageError}
                  src={a.image}
                  alt={tx(a.title[lang])}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  {s.sheet}
                </p>
                <h3 className="font-serif mt-1 text-lg text-[color:var(--ink-forest)]">
                  {tx(a.title[lang])}
                </h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(["nl", "en"] as const).map((code) =>
                    a.files[code] ? (
                      <a
                        key={code}
                        href={a.files[code]}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-[color:var(--ink-forest)]/30 px-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--ink-forest)] transition-colors hover:bg-[color:var(--surface-forest)] hover:text-white"
                      >
                        <FileDown className="h-3.5 w-3.5" aria-hidden />
                        {code.toUpperCase()}
                      </a>
                    ) : null,
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-6 overflow-hidden rounded-3xl border border-border/60 md:grid-cols-2">
        <div className="aspect-[4/3] overflow-hidden bg-[color:var(--surface-page)]/60 md:aspect-auto">
          <img onError={handleImageError}
            src={FARM_MAP.image}
            alt={tx(FARM_MAP.title[lang])}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="p-6 md:p-8">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{s.print}</p>
          <h3 className="font-serif mt-2 text-2xl text-[color:var(--ink-forest)]">
            {tx(FARM_MAP.title[lang])}
          </h3>
          <p className="mt-3 text-muted-foreground">{tx(FARM_MAP.description[lang])}</p>
          <a
            href={FARM_MAP.href}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[color:var(--surface-forest)] px-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--color-cream)] transition-colors hover:bg-[color:var(--color-terracotta)]"
          >
            <Map className="h-4 w-4" aria-hidden />
            {tx(FARM_MAP.cta[lang])}
          </a>
        </div>
      </section>
    </>
  );
}
