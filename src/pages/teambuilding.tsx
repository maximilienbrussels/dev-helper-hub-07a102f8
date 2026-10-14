import { PagePhotoBand } from "@/components/PagePhotoBand";
import { PublicGallery } from "@/components/PublicGallery";
import { FarmImage } from "@/components/FarmImage";
import { NavHeader } from "@/components/NavHeader";
import { useQuery } from "@tanstack/react-query";
import { fetchPageContent } from "@/lib/page-content.functions";
import { localized } from "@/lib/page-content";

import { PageContactForm } from "@/components/PageContactForm";
import { useT } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import {
  TEAMBUILDING_CATERING,
  TEAMBUILDING_FORMULAS,
  TEAMBUILDING_HOURS,
  TEAMBUILDING_NOTES,
} from "@/lib/teambuilding";
import { Users, Clock, MapPin } from "lucide-react";
import { usePricing } from "@/lib/use-pricing";

const COPY: Record<
  Lang,
  {
    eyebrow: string;
    title: string;
    lede: string;
    from: string;
    perPerson: string;
    half: string;
    full: string;
    people: (min: number, max: number) => string;
    program: string;
    included: string;
    catering: string;
    good: string;
    formTitle: string;
    formIntro: string;
  }
> = {
  nl: {
    eyebrow: "Bedrijven & organisaties",
    title: "Teambuilding op de boerderij of op het platteland",
    lede: "Twee decors, dezelfde aanpak: samen werken met dieren, aarde en vuur. Halve of hele dag, in het Nederlands, Frans of Engels.",
    from: "vanaf",
    perPerson: "per persoon",
    half: "Halve dag",
    full: "Hele dag",
    people: (min, max) => `${min} tot ${max} personen`,
    program: "Wat je doet",
    included: "Inbegrepen",
    catering: "Eten en drinken",
    good: "Goed om te weten",
    formTitle: "Vraag een teambuilding aan",
    formIntro:
      "Vertel ons de gewenste datum, het aantal personen, halve of hele dag, de formule (boerderij of platteland) en of je catering wenst. Je krijgt een voorstel met prijs.",
  },
  fr: {
    eyebrow: "Entreprises & organisations",
    title: "Team building à la ferme ou à la campagne",
    lede: "Deux décors, la même approche : travailler ensemble avec les animaux, la terre et le feu. Demi-journée ou journée, en français, néerlandais ou anglais.",
    from: "à partir de",
    perPerson: "par personne",
    half: "Demi-journée",
    full: "Journée",
    people: (min, max) => `de ${min} à ${max} personnes`,
    program: "Au programme",
    included: "Compris",
    catering: "Manger et boire",
    good: "Bon à savoir",
    formTitle: "Demander un team building",
    formIntro:
      "Indiquez la date souhaitée, le nombre de personnes, demi-journée ou journée, la formule (ferme ou campagne) et vos souhaits de catering. Vous recevrez une proposition chiffrée.",
  },
  en: {
    eyebrow: "Companies & organisations",
    title: "Team building at the farm or in the countryside",
    lede: "Two settings, one approach: working together with animals, soil and fire. Half or full day, in English, French or Dutch.",
    from: "from",
    perPerson: "per person",
    half: "Half day",
    full: "Full day",
    people: (min, max) => `${min} to ${max} people`,
    program: "What you do",
    included: "Included",
    catering: "Food and drink",
    good: "Good to know",
    formTitle: "Request a team building day",
    formIntro:
      "Tell us your preferred date, group size, half or full day, which formula (farm or countryside) and any catering wishes. We will send you a quote.",
  },
};

export function TeamBuildingPage() {
  const { price } = usePricing();
  const { t, lang } = useT();
  const c = COPY[lang];
  const { data: page } = useQuery({
    queryKey: ["page-content", "teambuilding"],
    queryFn: () => fetchPageContent({ data: { key: "teambuilding" } }),
  });
  const heroTitle = page ? localized(page.hero.title, lang) : "";
  const heroText = page ? localized(page.hero.text, lang) : "";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavHeader />
      <PagePhotoBand photo="alpacas-weide" />
      {page?.hero.imageUrl ? (
        <div className="relative h-64 w-full overflow-hidden md:h-96">
          <FarmImage src={page.hero.imageUrl} loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
        </div>
      ) : null}
      <main className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">
        <p className="text-[11px] uppercase tracking-[0.25em] text-[color:var(--color-terracotta)] font-medium">
          {c.eyebrow}
        </p>
        <h1 className="font-serif mt-4 text-4xl leading-[1.02] tracking-tight text-[color:var(--ink-forest)] md:text-6xl">
          {heroTitle || c.title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">{heroText || c.lede}</p>

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {TEAMBUILDING_FORMULAS.map((f) => {
            const copy = f.copy[lang];
            const block = page?.blocks.find((b) => b.id === `default-${f.slug}`);
            return (
              <section
                key={f.slug}
                className="overflow-hidden rounded-3xl border border-border/60 bg-[color:var(--surface-page)]/50 p-6 md:p-8"
              >
                {block?.imageUrl ? (
                  <div className="-mx-6 -mt-6 mb-6 h-44 overflow-hidden md:-mx-8 md:-mt-8">
                    <FarmImage src={block.imageUrl} />
                  </div>
                ) : null}
                <h2 className="font-serif text-2xl text-[color:var(--ink-forest)]">{copy.title}</h2>
                <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" aria-hidden /> {copy.place}
                </p>
                <p className="mt-4 text-sm text-foreground/90">{copy.lede}</p>

                <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
                  <div className="rounded-2xl border border-border/50 p-3">
                    <dt className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      {c.from}
                    </dt>
                    <dd className="mt-1 font-medium text-[color:var(--ink-forest)]">
                      € {price(`teambuilding.${f.slug}.perPerson`, f.pricePerPerson)} {c.perPerson}
                    </dd>
                  </div>
                  <div className="rounded-2xl border border-border/50 p-3">
                    <dt className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" aria-hidden /> {c.half} / {c.full}
                    </dt>
                    <dd className="mt-1 font-medium text-[color:var(--ink-forest)]">
                      {TEAMBUILDING_HOURS.half} u / {TEAMBUILDING_HOURS.full} u
                    </dd>
                  </div>
                  <div className="rounded-2xl border border-border/50 p-3">
                    <dt className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      <Users className="h-3.5 w-3.5" aria-hidden />
                    </dt>
                    <dd className="mt-1 font-medium text-[color:var(--ink-forest)]">
                      {c.people(f.minPeople, f.maxPeople)}
                    </dd>
                  </div>
                </dl>

                <h3 className="mt-6 text-[12px] uppercase tracking-[0.2em] text-[color:var(--color-terracotta)]">
                  {c.program}
                </h3>
                <ul className="mt-2 space-y-1.5 text-sm text-foreground/90">
                  {copy.activities.map((a) => (
                    <li key={a}>· {a}</li>
                  ))}
                </ul>

                <h3 className="mt-6 text-[12px] uppercase tracking-[0.2em] text-[color:var(--color-terracotta)]">
                  {c.included}
                </h3>
                <ul className="mt-2 space-y-1.5 text-sm text-foreground/90">
                  {copy.includes.map((i) => (
                    <li key={i}>· {i}</li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <section className="rounded-3xl border border-border/60 p-6">
            <h2 className="font-serif text-xl text-[color:var(--ink-forest)]">{c.catering}</h2>
            <ul className="mt-3 space-y-1.5 text-sm text-foreground/90">
              {TEAMBUILDING_CATERING[lang].map((i) => (
                <li key={i}>· {i}</li>
              ))}
            </ul>
          </section>
          <section className="rounded-3xl border border-border/60 p-6">
            <h2 className="font-serif text-xl text-[color:var(--ink-forest)]">{c.good}</h2>
            <ul className="mt-3 space-y-1.5 text-sm text-foreground/90">
              {TEAMBUILDING_NOTES[lang].map((i) => (
                <li key={i}>· {i}</li>
              ))}
            </ul>
          </section>
        </div>

        <div className="mt-16">
          <PageContactForm
            context="Teambuilding"
            inbox="bedrijf"
            title={c.formTitle}
            intro={c.formIntro}
          />
        </div>

        <PublicGallery urls={page?.gallery ?? []} title={t("gallery.teambuilding.title")} altBase={t("gallery.teambuilding.alt")} />
      </main>
    </div>
  );
}
