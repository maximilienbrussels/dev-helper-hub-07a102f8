import { PagePhotoBand } from "@/components/PagePhotoBand";
import { PublicGallery } from "@/components/PublicGallery";
import { FarmImage } from "@/components/FarmImage";
import { NavHeader } from "@/components/NavHeader";
import { useQuery } from "@tanstack/react-query";
import { fetchPageContent } from "@/lib/page-content.functions";
import { localized } from "@/lib/page-content";

import { PageContactForm } from "@/components/PageContactForm";
import { LocalLink } from "@/components/LocalLink";
import { useT } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { SEMINAR_CATERING, SEMINAR_FORMATS, SEMINAR_NOTES } from "@/lib/seminars";
import { pathFor } from "@/lib/routes-i18n";
import { ArrowRight, Clock, Users } from "lucide-react";
import { usePricing } from "@/lib/use-pricing";

const COPY: Record<
  Lang,
  {
    eyebrow: string;
    title: string;
    lede: string;
    from: string;
    hours: string;
    people: string;
    included: string;
    catering: string;
    good: string;
    rentalCta: string;
    formTitle: string;
    formIntro: string;
  }
> = {
  nl: {
    eyebrow: "Bedrijven & organisaties",
    title: "Seminaries & vergaderingen op de boerderij",
    lede: "Vergaderen tussen de moestuin en de weide, op vijf minuten van Brussel-Centraal. Van een halve dag met acht mensen tot een seminarie met tachtig.",
    from: "Ruimte vanaf",
    hours: "Duur",
    people: "Capaciteit",
    included: "Inbegrepen",
    catering: "Catering",
    good: "Goed om te weten",
    rentalCta: "Alle ruimtes en tarieven",
    formTitle: "Vraag een datum aan",
    formIntro:
      "Geef je gewenste datum, dagdeel, aantal deelnemers en cateringwensen mee. We bevestigen de beschikbaarheid en sturen een prijsvoorstel.",
  },
  fr: {
    eyebrow: "Entreprises & organisations",
    title: "Séminaires & réunions à la ferme",
    lede: "Se réunir entre le potager et la prairie, à cinq minutes de Bruxelles-Central. D'une demi-journée à huit à un séminaire de quatre-vingts personnes.",
    from: "Espace à partir de",
    hours: "Durée",
    people: "Capacité",
    included: "Compris",
    catering: "Catering",
    good: "Bon à savoir",
    rentalCta: "Tous les espaces et tarifs",
    formTitle: "Demander une date",
    formIntro:
      "Indiquez la date souhaitée, le moment de la journée, le nombre de participants et vos souhaits de catering. Nous confirmons la disponibilité et envoyons une proposition.",
  },
  en: {
    eyebrow: "Companies & organisations",
    title: "Seminars & meetings at the farm",
    lede: "Meet between the kitchen garden and the meadow, five minutes from Brussels-Central. From a half day for eight to a seminar for eighty.",
    from: "Space from",
    hours: "Duration",
    people: "Capacity",
    included: "Included",
    catering: "Catering",
    good: "Good to know",
    rentalCta: "All spaces and rates",
    formTitle: "Request a date",
    formIntro:
      "Tell us your preferred date, part of the day, number of participants and catering wishes. We will confirm availability and send a quote.",
  },
};

export function SeminarsPage() {
  const { price } = usePricing();
  const { t, lang } = useT();
  const c = COPY[lang];
  const { data: page } = useQuery({
    queryKey: ["page-content", "seminars"],
    queryFn: () => fetchPageContent({ data: { key: "seminars" } }),
  });
  const heroTitle = page ? localized(page.hero.title, lang) : "";
  const heroText = page ? localized(page.hero.text, lang) : "";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavHeader />
      <PagePhotoBand photo="erf" />
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

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {SEMINAR_FORMATS.map((f) => {
            const copy = f.copy[lang];
            const block = page?.blocks.find((b) => b.id === `default-${f.id}`);
            return (
              <section
                key={f.id}
                className="overflow-hidden rounded-3xl border border-border/60 bg-[color:var(--surface-page)]/50 p-6"
              >
                {block?.imageUrl ? (
                  <div className="-mx-6 -mt-6 mb-5 h-36 overflow-hidden">
                    <FarmImage src={block.imageUrl} />
                  </div>
                ) : null}
                <h2 className="font-serif text-xl text-[color:var(--ink-forest)]">{copy.title}</h2>
                <p className="mt-2 text-sm text-foreground/90">{copy.lede}</p>
                <dl className="mt-5 space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-muted-foreground">{c.from}</dt>
                    <dd className="font-medium text-[color:var(--ink-forest)]">€ {price(`seminar.${f.id}.from`, f.fromPrice)}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" aria-hidden /> {c.hours}
                    </dt>
                    <dd className="font-medium text-[color:var(--ink-forest)]">{f.hours} u</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="h-3.5 w-3.5" aria-hidden /> {c.people}
                    </dt>
                    <dd className="font-medium text-[color:var(--ink-forest)]">{f.capacity}</dd>
                  </div>
                </dl>
                <h3 className="mt-5 text-[12px] uppercase tracking-[0.2em] text-[color:var(--color-terracotta)]">
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
              {SEMINAR_CATERING[lang].map((i) => (
                <li key={i}>· {i}</li>
              ))}
            </ul>
          </section>
          <section className="rounded-3xl border border-border/60 p-6">
            <h2 className="font-serif text-xl text-[color:var(--ink-forest)]">{c.good}</h2>
            <ul className="mt-3 space-y-1.5 text-sm text-foreground/90">
              {SEMINAR_NOTES[lang].map((i) => (
                <li key={i}>· {i}</li>
              ))}
            </ul>
            <LocalLink
              to={pathFor("rental", lang)}
              className="mt-5 inline-flex items-center gap-1 text-[12px] uppercase tracking-[0.2em] text-[color:var(--color-terracotta)]"
            >
              {c.rentalCta}
              <ArrowRight className="h-3.5 w-3.5" />
            </LocalLink>
          </section>
        </div>

        <div className="mt-16">
          <PageContactForm
            context="Seminarie"
            inbox="bedrijf"
            title={c.formTitle}
            intro={c.formIntro}
          />
        </div>

        <PublicGallery urls={page?.gallery ?? []} title={t("gallery.seminars.title")} altBase={t("gallery.seminars.alt")} />
      </main>
    </div>
  );
}
