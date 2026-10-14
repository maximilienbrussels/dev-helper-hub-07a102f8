import { deepTx, type ExtraLang } from "@/lib/i18n-extra";
import { PagePhotoBand } from "@/components/PagePhotoBand";
import { NavHeader } from "@/components/NavHeader";
import { PageContactForm } from "@/components/PageContactForm";
import { MastodonShareButton } from "@/components/social/MastodonShareButton";
import { useT, localeFor, type Lang } from "@/lib/i18n";
import { Link } from "@tanstack/react-router";
import { NEWS, SLUGS } from "@/lib/routes-i18n";
import { FARM_CAMPS, CAMP_SCHEDULE } from "@/lib/farm-camps";
import { CalendarDays, Clock, Ticket } from "lucide-react";
import { Illustration } from "@/components/Illustration";
import dagOpDeBoerderijAsset from "@/assets/illustrations/dag-op-de-boerderij.webp.asset.json";

type AgendaKind = "camp" | "event";

type AgendaEntry = {
  id: string;
  kind: AgendaKind;
  start: string;
  end?: string;
  title: Record<Lang, string>;
  detail: Record<Lang, string>;
  splat?: Record<Lang, string>;
  status?: "available" | "few" | "full";
};

const COPY: Record<
  Lang,
  {
    eyebrow: string;
    title: string;
    lede: string;
    upcoming: string;
    empty: string;
    kinds: Record<AgendaKind, string>;
    statuses: Record<"available" | "few" | "full", string>;
    more: string;
    dayTitle: string;
    dayIntro: string;
    dayImageAlt: string;
    formTitle: string;
    formIntro: string;
  }
> = {
  nl: {
    eyebrow: "Agenda",
    title: "Kalender & evenementen",
    lede: "Alle data van de boerderij op één plek: vakantiestages, feesten en momenten om samen in de aarde te wroeten.",
    upcoming: "Wat komt eraan",
    empty: "Er staan momenteel geen data in de kalender. Kom binnenkort terug.",
    kinds: { camp: "Vakantiestage", event: "Evenement" },
    statuses: { available: "Plaatsen vrij", few: "Laatste plaatsen", full: "Volzet" },
    more: "Meer info",
    dayTitle: "Een dag op de boerderij",
    dayIntro: "Het typische ritme van een stagedag — handig om je kind voor te bereiden.",
    dayImageAlt: "Illustratie van een dag op de boerderij met dieren en tuinieren",
    formTitle: "Een datum missen?",
    formIntro: "Vraag ons naar een activiteit, of stel er zelf een voor in je buurt.",
  },
  fr: {
    eyebrow: "Agenda",
    title: "Agenda et événements",
    lede: "Toutes les dates de la ferme au même endroit : stages de vacances, fêtes et moments pour mettre les mains dans la terre.",
    upcoming: "À venir",
    empty: "Aucune date n'est programmée pour l'instant. Revenez bientôt.",
    kinds: { camp: "Stage", event: "Événement" },
    statuses: { available: "Places disponibles", few: "Dernières places", full: "Complet" },
    more: "Plus d'infos",
    dayTitle: "Une journée à la ferme",
    dayIntro: "Le rythme type d'une journée de stage — pratique pour préparer votre enfant.",
    dayImageAlt: "Illustration d'une journée à la ferme avec animaux et jardinage",
    formTitle: "Une date vous manque ?",
    formIntro: "Demandez-nous une activité, ou proposez-en une dans votre quartier.",
  },
  en: {
    eyebrow: "Agenda",
    title: "Calendar and events",
    lede: "All the farm's dates in one place: holiday camps, festivals and moments to get your hands in the soil.",
    upcoming: "Coming up",
    empty: "No dates are scheduled right now. Come back soon.",
    kinds: { camp: "Holiday camp", event: "Event" },
    statuses: { available: "Places available", few: "Last places", full: "Fully booked" },
    more: "More info",
    dayTitle: "A day at the farm",
    dayIntro: "The typical rhythm of a camp day — handy to prepare your child.",
    dayImageAlt: "Illustration of a day at the farm with animals and gardening",
    formTitle: "Missing a date?",
    formIntro: "Ask us about an activity, or suggest one in your own neighbourhood.",
  },
};

function buildAgenda(): AgendaEntry[] {
  const camps: AgendaEntry[] = FARM_CAMPS.map((c) => ({
    id: `camp-${c.slug}`,
    kind: "camp",
    start: c.start,
    end: c.end,
    status: c.status,
    title: c.name,
    detail: c.note ?? {
      nl: "Vakantiestage van 9u tot 16u, met opvang van 8u tot 17u30.",
      fr: "Stage de 9h à 16h, avec garderie de 8h à 17h30.",
      en: "Camp from 9am to 4pm, with childcare from 8am to 5.30pm.",
    },
    splat: {
      nl: SLUGS.camps.nl,
      fr: SLUGS.camps.fr,
      en: SLUGS.camps.en,
    },
  }));

  const events: AgendaEntry[] = NEWS.map((n) => ({
    id: `news-${n.id}`,
    kind: "event",
    start: n.date,
    title: n.title,
    detail: n.lede,
    splat: {
      nl: `${SLUGS.news.nl}/${n.slug.nl}`,
      fr: `${SLUGS.news.fr}/${n.slug.fr}`,
      en: `${SLUGS.news.en}/${n.slug.en}`,
    },
  }));

  return [...camps, ...events].sort((a, b) => a.start.localeCompare(b.start));
}

function formatRange(entry: AgendaEntry, lang: Lang | ExtraLang): string {
  const locale = localeFor(lang);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
  const start = new Date(entry.start).toLocaleDateString(locale, opts);
  if (!entry.end || entry.end === entry.start) return start;
  const end = new Date(entry.end).toLocaleDateString(locale, opts);
  return `${new Date(entry.start).toLocaleDateString(locale, { day: "numeric", month: "long" })} – ${end}`;
}

export function EventsPage() {
  const { lang, extra, tx } = useT();
  const c = deepTx(tx, COPY[lang]);
  const today = new Date().toISOString().slice(0, 10);
  const agenda = buildAgenda().filter((e) => (e.end ?? e.start) >= today);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavHeader />
      <PagePhotoBand photo="pony-herfst" pageKey="events" />
      <main className="mx-auto max-w-4xl px-4 py-16 md:px-8 md:py-24">
        <p className="text-[11px] uppercase tracking-[0.25em] text-[color:var(--color-terracotta)] font-medium">
          {c.eyebrow}
        </p>
        <h1 className="font-serif mt-4 text-4xl leading-[1.02] tracking-tight text-[color:var(--ink-forest)] md:text-6xl">
          {c.title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">{c.lede}</p>

        <section className="mt-12">
          <h2 className="flex items-center gap-2 font-serif text-2xl text-[color:var(--ink-forest)]">
            <CalendarDays className="h-5 w-5" aria-hidden /> {c.upcoming}
          </h2>
          {agenda.length === 0 ? (
            <p className="mt-4 rounded-3xl border border-border/60 p-6 text-sm text-muted-foreground">
              {c.empty}
            </p>
          ) : (
            <ul className="mt-5 space-y-4">
              {agenda.map((e) => (
                <li key={e.id} className="rounded-3xl border border-border/60 p-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-[color:var(--surface-page)] px-3 py-1 text-[11px] uppercase tracking-[0.15em] text-[color:var(--ink-forest)]">
                      {c.kinds[e.kind]}
                    </span>
                    {e.status ? (
                      <span
                        className={
                          e.status === "full"
                            ? "text-xs text-muted-foreground"
                            : "text-xs font-medium text-[color:var(--color-terracotta)]"
                        }
                      >
                        {c.statuses[e.status]}
                      </span>
                    ) : null}
                  </div>
                  <h3 className="font-serif mt-3 text-xl text-[color:var(--ink-forest)]">
                    {tx(e.title[lang])}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">{formatRange(e, extra ?? lang)}</p>
                  <p className="mt-3 text-sm leading-relaxed text-foreground/90">
                    {tx(e.detail[lang])}
                  </p>
                  <MastodonShareButton className="mt-4" text={`${tx(e.title[lang])} — ${formatRange(e, extra ?? lang)}`} />
                  {e.splat ? (
                    <Link
                      to="/$lang/$"
                      params={{ lang, _splat: e.splat[lang] }}
                      className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[color:var(--color-terracotta)]"
                    >
                      <Ticket className="h-4 w-4" aria-hidden /> {c.more}
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-14 rounded-3xl border border-border/60 bg-[color:var(--surface-page)]/50 p-6">
          <h2 className="flex items-center gap-2 font-serif text-xl text-[color:var(--ink-forest)]">
            <Clock className="h-4 w-4" aria-hidden /> {c.dayTitle}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{c.dayIntro}</p>
          <Illustration
            src={dagOpDeBoerderijAsset.url}
            alt={c.dayImageAlt}
            className="mt-6 w-full"
          />
          <ul className="mt-4 space-y-2">
            {CAMP_SCHEDULE.map((s) => (
              <li
                key={s.time}
                className="flex gap-4 rounded-2xl border border-border/50 px-4 py-3 text-sm"
              >
                <span className="w-20 shrink-0 tabular-nums font-medium text-[color:var(--ink-forest)]">
                  {s.time}
                </span>
                <span className="text-foreground/90">{tx(s.what[lang])}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-16">
          <PageContactForm
            context="Agenda"
            inbox="algemeen"
            title={c.formTitle}
            intro={c.formIntro}
          />
        </div>
      </main>
    </div>
  );
}
