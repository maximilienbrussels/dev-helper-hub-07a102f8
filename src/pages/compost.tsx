import { PagePhotoBand } from "@/components/PagePhotoBand";
import { NavHeader } from "@/components/NavHeader";
import { PageContactForm } from "@/components/PageContactForm";
import { useT } from "@/lib/i18n";
import { COMPOST_COPY, COMPOST_HOW, COMPOST_NO, COMPOST_SLOTS, COMPOST_YES } from "@/lib/compost";
import { Check, X, Clock } from "lucide-react";
import { Illustration } from "@/components/Illustration";
import compostAsset from "@/assets/illustrations/compost.webp.asset.json";

const FORM: Record<string, { title: string; intro: string; compostAlt: string }> = {
  nl: {
    title: "Vraag over de buurtcompost?",
    intro: "Stel je vraag over afgifte, compostmeesters of een compostinitiatief in je straat.",
    compostAlt: "Illustratie van compost en kleine beestjes",
  },
  fr: {
    title: "Une question sur le compost de quartier ?",
    intro:
      "Posez votre question sur les dépôts, les maîtres-composteurs ou un projet de compost dans votre rue.",
    compostAlt: "Illustration du compost et des petites bêtes",
  },
  en: {
    title: "A question about the neighbourhood compost?",
    intro:
      "Ask us about drop-offs, compost masters or starting a compost project in your own street.",
    compostAlt: "Illustration of compost and little creatures",
  },
};

export function CompostPage() {
  const { lang, tx } = useT();
  const c0 = COMPOST_COPY[lang];
  const c = Object.fromEntries(Object.entries(c0).map(([k, v]) => [k, tx(v)])) as typeof c0;
  const f0 = FORM[lang]!;
  const f = { title: tx(f0.title), intro: tx(f0.intro), compostAlt: tx(f0.compostAlt) };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavHeader />
      <PagePhotoBand photo="moestuin" />
      <main className="mx-auto max-w-5xl px-4 py-16 md:px-8 md:py-24">
        <p className="text-[11px] uppercase tracking-[0.25em] text-[color:var(--color-terracotta)] font-medium">
          {c.eyebrow}
        </p>
        <h1 className="font-serif mt-4 text-4xl leading-[1.02] tracking-tight text-[color:var(--ink-forest)] md:text-6xl">
          {c.title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">{c.lede}</p>

        <section className="mt-12 rounded-3xl border border-border/60 bg-[color:var(--surface-page)]/50 p-6">
          <h2 className="flex items-center gap-2 font-serif text-xl text-[color:var(--ink-forest)]">
            <Clock className="h-4 w-4" aria-hidden /> {c.when}
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {COMPOST_SLOTS.map((s) => (
              <li
                key={s.time + s.day.nl}
                className="flex items-center justify-between rounded-2xl border border-border/50 px-4 py-3 text-sm"
              >
                <span className="font-medium text-[color:var(--ink-forest)]">{tx(s.day[lang])}</span>
                <span className="text-muted-foreground">{s.time}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <section className="rounded-3xl border border-border/60 p-6">
            <h2 className="font-serif text-xl text-[color:var(--ink-forest)]">{c.yes}</h2>
            <ul className="mt-3 space-y-2 text-sm text-foreground/90">
              {COMPOST_YES[lang].map((i) => (
                <li key={i} className="flex gap-2">
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--ink-forest)]"
                    aria-hidden
                  />
                  <span>{tx(i)}</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-3xl border border-border/60 p-6">
            <h2 className="font-serif text-xl text-[color:var(--ink-forest)]">{c.no}</h2>
            <ul className="mt-3 space-y-2 text-sm text-foreground/90">
              {COMPOST_NO[lang].map((i) => (
                <li key={i} className="flex gap-2">
                  <X
                    className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--color-terracotta)]"
                    aria-hidden
                  />
                  <span>{tx(i)}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="mt-8 rounded-3xl border border-border/60 p-6">
          <h2 className="font-serif text-xl text-[color:var(--ink-forest)]">{c.how}</h2>
          <ol className="mt-3 space-y-1.5 text-sm text-foreground/90">
            {COMPOST_HOW[lang].map((i, idx) => (
              <li key={i}>
                {idx + 1}. {tx(i)}
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-8 rounded-3xl border border-border/60 bg-[color:var(--color-cream)] p-6 text-center">
          <Illustration
            src={compostAsset.url}
            alt={f.compostAlt}
            className="mx-auto max-w-md w-full"
          />
        </section>

        <div className="mt-16">
          <PageContactForm
            context="Buurtcompost"
            inbox="algemeen"
            title={f.title}
            intro={f.intro}
          />
        </div>
      </main>
    </div>
  );
}
