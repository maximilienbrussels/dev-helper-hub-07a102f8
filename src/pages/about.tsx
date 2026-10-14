import { PagePhotoBand } from "@/components/PagePhotoBand";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronDown, Mail } from "lucide-react";
import { NavHeader } from "@/components/NavHeader";
import { LocalLink } from "@/components/LocalLink";
import { pathFor } from "@/lib/routes-i18n";
import { useT } from "@/lib/i18n";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PublicGallery } from "@/components/PublicGallery";
import { farmGalleryUrls } from "@/lib/farm-gallery";
import { MILESTONES, TEAM, BOARD, type Person } from "@/lib/about-content";
import { listTeamAvatars, type TeamAvatarMap } from "@/lib/team-avatars.functions";

const UI = {
  historyMore: {
    nl: "Lees meer over onze geschiedenis",
    fr: "En savoir plus sur notre histoire",
    en: "Read more about our history",
  },
  historyLess: { nl: "Toon minder", fr: "Afficher moins", en: "Show less" },
  contact: { nl: "Contact opnemen", fr: "Nous contacter", en: "Get in touch" },
  openCard: { nl: "Bekijk profiel", fr: "Voir le profil", en: "View profile" },
  impressionTitle: {
    nl: "Sfeerbeeld van de boerderij",
    fr: "Image de la ferme",
    en: "Farm impressions",
  },
  impressionBody: {
    nl: "Een kijkje op onze dieren, tuinen en speelplekken.",
    fr: "Un aperçu de nos animaux, jardins et espaces de jeu.",
    en: "A glimpse of our animals, gardens and play areas.",
  },
  impressionAlt: {
    nl: "Collage met foto's van de boerderij, dieren en groentetuin",
    fr: "Collage de photos de la ferme, des animaux et du potager",
    en: "Collage of farm photos showing animals and vegetable garden",
  },
} as const;

export function AboutPage() {
  const { t, lang } = useT();
  const [showAll, setShowAll] = useState(false);
  const [active, setActive] = useState<Person | null>(null);
  const loadAvatars = useServerFn(listTeamAvatars);
  const { data: avatars = {} as TeamAvatarMap } = useQuery<TeamAvatarMap>({
    queryKey: ["team-avatars"],
    queryFn: () => loadAvatars(),
    staleTime: 5 * 60_000,
  });
  const tx = (o: Record<string, string>) => o[lang] ?? o.nl;

  const PILLARS = [
    { title: t("about.pillar.welfare"), body: t("about.pillar.welfare.body") },
    { title: t("about.pillar.education"), body: t("about.pillar.education.body") },
    { title: t("about.pillar.biodiversity"), body: t("about.pillar.biodiversity.body") },
    { title: t("about.pillar.social"), body: t("about.pillar.social.body") },
  ];

  const visible = showAll ? MILESTONES : MILESTONES.slice(0, 3);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavHeader />
      <PagePhotoBand photo="erf" pageKey="about" />
      <main className="mx-auto max-w-5xl px-4 py-16 md:px-8 md:py-24">
        <p className="text-[11px] uppercase tracking-[0.25em] text-[color:var(--color-terracotta)] font-medium">
          {t("about.title")}
        </p>
        <h1 className="font-serif mt-4 text-5xl leading-[0.9] tracking-tight text-[color:var(--ink-forest)] md:text-7xl">
          {t("about.lede")}
        </h1>

        {/* Missie */}
        <section className="mt-10 max-w-3xl">
          <h2 className="font-serif text-3xl italic text-[color:var(--color-terracotta)] md:text-4xl">
            {t("about.mission.title")}
          </h2>
          <p className="mt-5 text-base font-light leading-relaxed text-foreground/90">
            {t("about.mission.body")}
          </p>
        </section>

        {/* Pijlers */}
        <section className="mt-16">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground/90">
            {t("about.pillars.title")}
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map((p) => (
              <li
                key={p.title}
                className="rounded-2xl border border-border bg-[color:var(--surface-page)]/50 p-5"
              >
                <p className="font-serif text-xl italic text-[color:var(--color-terracotta)]">
                  {p.title}
                </p>
                <p className="mt-2 text-sm font-light leading-relaxed text-foreground/90">
                  {p.body}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* Geschiedenis — tijdlijn */}
        <section id="geschiedenis" className="mt-20 scroll-mt-24">
          <h2 className="font-serif text-3xl italic text-[color:var(--color-terracotta)] md:text-4xl">
            {t("about.history.title")}
          </h2>
          <p className="mt-5 max-w-2xl text-base font-light leading-relaxed text-foreground/90">
            {t("about.history.body")}
          </p>

          <ol className="mt-10 space-y-8">
            {visible.map((m) => (
              <li key={m.year} className="flex gap-4 md:gap-5">
                <span
                  aria-hidden="true"
                  className="mt-1.5 h-3 w-3 shrink-0 rounded-full bg-[color:var(--color-terracotta)] ring-4 ring-[color:var(--color-terracotta)]/15"
                />
                <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[color:var(--color-terracotta)]">
                  {m.year}
                </p>
                <p className="font-serif mt-1 text-xl italic text-[color:var(--ink-forest)]">
                  {tx(m.title)}
                </p>
                <p className="mt-2 max-w-2xl text-sm font-light leading-relaxed text-foreground/90">
                  {tx(m.body)}
                </p>
                </div>
              </li>
            ))}
          </ol>

          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="mt-6 inline-flex min-h-[48px] items-center gap-2 rounded-full border border-border px-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--ink-forest)] transition-colors hover:border-[color:var(--color-terracotta)]"
          >
            {showAll ? tx(UI.historyLess) : tx(UI.historyMore)}
            <ChevronDown
              className={`h-4 w-4 transition-transform ${showAll ? "rotate-180" : ""}`}
            />
          </button>
        </section>

        {/* Sfeerbeeld */}
        <section className="mt-20 scroll-mt-24 rounded-3xl border border-border/60 bg-[color:var(--color-cream)] p-5 sm:p-6 md:p-10">
          <h2 className="font-serif text-2xl italic text-[color:var(--color-on-cream)] md:text-3xl">
            {tx(UI.impressionTitle)}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[color:var(--color-on-cream)]/90">
            {tx(UI.impressionBody)}
          </p>
          <PublicGallery
            urls={farmGalleryUrls()}
            altBase={tx(UI.impressionAlt)}
            className="mt-6"
          />
        </section>

        {/* Team & bestuur */}
        <section
          id="team"
          className="mt-20 scroll-mt-24 rounded-3xl bg-[color:var(--surface-forest)] p-6 text-[color:var(--color-cream)] sm:p-8 md:p-14"
        >
          <h2 className="font-serif text-3xl italic md:text-5xl">{t("about.team.title")}</h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-[color:var(--color-cream)]/95">
            {t("about.team.body")}
          </p>
          <ul className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 md:grid-cols-3">
            {TEAM.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => setActive(m)}
                  aria-label={`${m.name} — ${tx(UI.openCard)}`}
                  className="flex min-h-[64px] w-full items-center gap-4 rounded-2xl border border-[color:var(--color-cream)]/25 bg-[color:var(--color-cream)]/[0.07] p-4 text-left transition-colors hover:bg-[color:var(--color-cream)]/15 sm:min-h-0 sm:flex-col sm:items-start sm:gap-0 sm:p-5"
                >
                  {avatars[m.id] ? (
                    <img
                      src={avatars[m.id]}
                      alt={m.name}
                      loading="lazy"
                      className="h-16 w-16 shrink-0 rounded-full object-cover sm:h-20 sm:w-20"
                    />
                  ) : (
                    <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-[color:var(--color-apricot)]/35 text-2xl font-semibold text-[color:var(--color-cream)] sm:h-20 sm:w-20">
                      {m.name[0]}
                    </div>
                  )}
                  <div className="min-w-0 sm:mt-4">
                    <p className="font-serif truncate text-xl italic">{m.name}</p>
                    <p className="mt-1 break-words text-[11px] uppercase leading-snug tracking-[0.12em] text-[color:var(--color-cream)]/90">
                      {t(m.roleKey)}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>

          <div
            id="bestuur"
            className="mt-14 scroll-mt-24 border-t border-[color:var(--color-cream)]/25 pt-10"
          >
            <h3 className="font-serif text-2xl italic md:text-3xl">{t("about.gov.title")}</h3>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[color:var(--color-cream)]/95">
              {t("about.gov.body")}
            </p>
            <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {BOARD.map((b) => (
                <li key={b.id}>
                  <button
                    type="button"
                    onClick={() => setActive(b)}
                    aria-label={`${b.name} — ${tx(UI.openCard)}`}
                    className="flex min-h-[64px] w-full flex-col items-start justify-center gap-1 rounded-2xl border border-[color:var(--color-cream)]/25 bg-[color:var(--color-cream)]/[0.07] px-5 py-4 text-left transition-colors hover:bg-[color:var(--color-cream)]/15 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
                  >
                    <span className="font-serif text-lg italic">{b.name}</span>
                    <span className="text-[11px] uppercase tracking-[0.15em] text-[color:var(--color-cream)]/90">
                      {t(b.roleKey)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>

      </main>

      <Sheet open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          {active && (
            <>
              <SheetHeader>
                <div className="grid h-20 w-20 place-items-center rounded-full bg-[color:var(--color-sage)]/25 text-2xl font-semibold text-[color:var(--ink-forest)]">
                  {active.name[0]}
                </div>
                <SheetTitle className="font-serif mt-4 text-2xl italic text-[color:var(--ink-forest)]">
                  {active.name} — {t(active.roleKey)}
                </SheetTitle>
              </SheetHeader>
              <blockquote className="mt-6 border-l-2 border-[color:var(--color-terracotta)] pl-4 font-serif text-lg italic leading-relaxed text-foreground/90">
                “{tx(active.quote)}”
              </blockquote>
              <p className="mt-5 text-sm font-light leading-relaxed text-foreground/90">
                {tx(active.bio)}
              </p>
              <LocalLink
                to={pathFor("contact", lang)}
                search={{ onderwerp: active.subject }}
                onClick={() => setActive(null)}
                className="mt-8 inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[color:var(--surface-forest)] px-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--color-cream)] transition-colors hover:bg-[color:var(--color-terracotta)]"
              >
                <Mail className="h-4 w-4" />
                {tx(UI.contact)}
              </LocalLink>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
