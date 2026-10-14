import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { NavHeader } from "@/components/NavHeader";
import { PageContactForm } from "@/components/PageContactForm";
import type { HubEntry } from "@/lib/hub-content";
import { ArrowRight } from "lucide-react";
import { useT } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import fotoMoestuin from "@/assets/foto/foto-moestuin-bakken.jpg.asset.json";
import fotoErf from "@/assets/foto/foto-erf-pad.jpg.asset.json";
import fotoWeideStal from "@/assets/foto/foto-weide-stal.jpg.asset.json";
import fotoGeitMadeliefjes from "@/assets/foto/foto-geit-madeliefjes.jpg.asset.json";
import fotoAlpacasWeide from "@/assets/foto/foto-alpacas-weide.jpg.asset.json";
import fotoPonyBoom from "@/assets/foto/foto-pony-boom.jpg.asset.json";
import fotoTrojaansPaardPony from "@/assets/foto/foto-trojaans-paard-pony.jpg.asset.json";
import fotoBeeldFontein from "@/assets/foto/foto-beeld-fontein.jpg.asset.json";
import sfeerKinderenZadenAsset from "@/assets/sfeer-kinderen-zaden.jpg.asset.json";
const sfeerKinderenZaden = sfeerKinderenZadenAsset.url;
import sfeerKinderenKaartenAsset from "@/assets/sfeer-kinderen-kaarten.jpg.asset.json";
const sfeerKinderenKaarten = sfeerKinderenKaartenAsset.url;
import planFermeAsset from "@/assets/plan-ferme.png.asset.json";
const planFerme = planFermeAsset.url;
import { handleImageError } from "@/lib/image-fallback";

const COPY: Record<
  Lang,
  { ambienceAlt: (title: string) => string; planTitle: string; planAlt: string }
> = {
  nl: {
    ambienceAlt: (title) => `Sfeerbeeld van Maximilien — ${title}`,
    planTitle: "Plattegrond van de boerderij",
    planAlt: "Plattegrond van Maximilien met dieren, moestuinen en ingangen",
  },
  fr: {
    ambienceAlt: (title) => `Ambiance de Maximilien — ${title}`,
    planTitle: "Plan de la ferme",
    planAlt: "Plan de Maximilien avec les animaux, potagers et entrées",
  },
  en: {
    ambienceAlt: (title) => `Atmosphere image of Maximilien — ${title}`,
    planTitle: "Farm map",
    planAlt: "Map of Maximilien showing animals, kitchen gardens and entrances",
  },
};

const AMBIENCE = [
  fotoMoestuin.url,
  fotoErf.url,
  fotoWeideStal.url,
  fotoGeitMadeliefjes.url,
  sfeerKinderenZaden,
  sfeerKinderenKaarten,
  fotoTrojaansPaardPony.url,
  fotoAlpacasWeide.url,
  fotoPonyBoom.url,
  fotoBeeldFontein.url,
];

// Deterministic ambience photo per page so each subtopic keeps the same image.
function ambienceFor(title: string) {
  let h = 0;
  for (const c of title) h = (h * 31 + c.charCodeAt(0)) % 9973;
  return AMBIENCE[h % AMBIENCE.length];
}
/**
 * Single reusable landing template for every hub subtopic. Keeps the visual language
 * consistent across Bezoekers / Betrokkenheid / Informatie without spawning
 * one bespoke route per subtopic.
 */
export function HubLandingTemplate({
  entry,
  inbox,
  showPlan = false,
  extra,
}: {
  entry: HubEntry;
  /** Inbox-sleutel (slug) voor het contactformulier. */
  inbox?: string;
  showPlan?: boolean;
  /** Extra sectie onder de inhoudsblokken, bv. het animaties-aanbod. */
  extra?: ReactNode;
}) {
  const { t, lang } = useT();
  const c = COPY[lang];
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavHeader />
      <main className="mx-auto max-w-5xl px-4 py-16 md:px-8 md:py-24">
        {/* Hero */}
        <p className="text-[11px] uppercase tracking-[0.25em] text-[color:var(--color-terracotta)] font-medium">
          {entry.eyebrow}
        </p>
        <h1 className="font-serif mt-4 text-4xl leading-[1.02] tracking-tight text-[color:var(--ink-forest)] md:text-6xl">
          {entry.title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">{entry.lede}</p>

        <figure className="mt-10 overflow-hidden rounded-3xl border border-border/60 bg-muted shadow-sm">
          <img
            onError={handleImageError}
            src={ambienceFor(entry.title)}
            alt={c.ambienceAlt(entry.title)}
            loading="lazy"
            className="aspect-[16/7] w-full object-cover object-[50%_40%]"
          />
        </figure>

        {entry.cta && (
          <div className="mt-8">
            <Link
              to={entry.cta.href}
              className="inline-flex items-center gap-2 rounded-full bg-[color:var(--color-terracotta)] px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-[color:var(--surface-forest)] transition-colors"
            >
              {entry.cta.label}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {/* Blocks */}
        <section className="mt-16 grid gap-10 md:mt-20 md:grid-cols-2 md:gap-x-12 md:gap-y-14">
          {entry.blocks.map((b, i) => (
            <article key={i} className="border-l-2 border-[color:var(--color-apricot)]/60 pl-6">
              <h2 className="font-serif text-2xl text-[color:var(--ink-forest)]">{b.title}</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-foreground/90">{b.body}</p>
              {b.bullets && (
                <ul className="mt-4 space-y-2 text-sm text-foreground/90">
                  {b.bullets.map((bl, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <span
                        aria-hidden
                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--color-terracotta)]"
                      />
                      <span>{bl}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </section>

        {/* Practical */}
        {entry.practical && entry.practical.length > 0 && (
          <section className="mt-16 rounded-3xl bg-[color:var(--surface-page)]/70 p-6 md:mt-20 md:p-10">
            <h2 className="text-[11px] uppercase tracking-[0.25em] text-[color:var(--color-terracotta)] font-medium">
              {t("hub.practical")}
            </h2>
            <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2 md:grid-cols-4">
              {entry.practical.map((p, i) => (
                <div key={i}>
                  <dt className="text-[11px] uppercase tracking-widest text-muted-foreground">
                    {p.label}
                  </dt>
                  <dd className="mt-1 text-[15px] font-medium text-[color:var(--ink-forest)]">
                    {p.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {/* FAQ */}
        {entry.faq && entry.faq.length > 0 && (
          <section className="mt-16 md:mt-20">
            <h2 className="font-serif text-2xl text-[color:var(--ink-forest)]">{t("hub.faq")}</h2>
            <div className="mt-6 divide-y divide-border/60">
              {entry.faq.map((f, i) => (
                <details key={i} className="group py-4">
                  <summary className="cursor-pointer list-none text-[15px] font-medium text-foreground marker:hidden group-open:text-[color:var(--color-terracotta)]">
                    {f.q}
                  </summary>
                  <p className="mt-2 text-sm text-foreground/90">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {extra}

        {showPlan && (
          <section className="mt-16 md:mt-20">
            <h2 className="font-serif text-2xl text-[color:var(--ink-forest)]">{c.planTitle}</h2>
            <figure className="mt-6 overflow-hidden rounded-3xl border border-border/60 bg-[color:var(--surface-page)]/70 p-3 shadow-sm md:p-5">
              <img
                onError={handleImageError}
                src={planFerme}
                alt={c.planAlt}
                loading="lazy"
                className="w-full rounded-2xl"
              />
            </figure>
          </section>
        )}

        {entry.contact && (
          <PageContactForm
            context={entry.title}
            inbox={inbox}
            title={entry.contact.title}
            intro={entry.contact.intro}
          />
        )}
      </main>
    </div>
  );
}

export function HubNotFound({ eyebrow }: { eyebrow: string }) {
  const { t } = useT();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavHeader />
      <main className="mx-auto max-w-3xl px-4 py-24 md:px-8 text-center">
        <p className="text-[11px] uppercase tracking-[0.25em] text-[color:var(--color-terracotta)] font-medium">
          {eyebrow}
        </p>
        <h1 className="font-serif mt-4 text-4xl text-[color:var(--ink-forest)]">
          {t("hub.notFound.title")}
        </h1>
        <p className="mt-4 text-muted-foreground">
          {t("hub.notFound.body")}{" "}
          <Link to="/" className="underline">
            {t("hub.notFound.home")}
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
