import { deepTx } from "@/lib/i18n-extra";
import { Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { NavHeader } from "@/components/NavHeader";
import { HeroStatusBadge } from "@/components/HeroStatusBadge";
import { LocalLink } from "@/components/LocalLink";
import { pathFor } from "@/lib/routes-i18n";
import { useT, formatT } from "@/lib/i18n";
import { computeOpenStatus, getAnimals, getHours, getOrganisation } from "@/lib/data.functions";
import { ResidentPhoto } from "@/components/ResidentPhoto";
import { useAlbumPhotos } from "@/lib/use-album-photos";
import { FarmFeed } from "@/components/FarmFeed";
import type { Lang } from "@/lib/i18n";
// Vaste, lokale hero-foto: nooit via externe opslag of de mediabibliotheek.
const heroSheepPark = "/hero-schapen-park.webp";

const COPY: Record<Lang, { heroAlt: string; brussels: string }> = {
  nl: {
    heroAlt: "Schapen in het groene park van Maximilien",
    brussels: "Brussel",
  },
  fr: {
    heroAlt: "Moutons dans le parc verdoyant de Maximilien",
    brussels: "Bruxelles",
  },
  en: { heroAlt: "Sheep in the green park of Maximilien", brussels: "Brussels" },
};

export const orgQO = queryOptions({ queryKey: ["org"], queryFn: () => getOrganisation() });
export const hoursQO = queryOptions({ queryKey: ["hours"], queryFn: () => getHours() });
export const animalsQO = queryOptions({ queryKey: ["animals"], queryFn: () => getAnimals() });

export function Index() {
  const { data: hours } = useSuspenseQuery(hoursQO);
  const { data: animals } = useSuspenseQuery(animalsQO);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-[color:var(--color-apricot)]/40">
      <NavHeader />
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <Hero hours={hours} />
        <EditorialGrid animals={animals ?? []} vision="" />
        <FarmFeed />
      </div>
    </div>
  );
}
/* ---------- HERO: EDITORIAL SPLIT ---------- */

function Hero({ hours }: { hours: Awaited<ReturnType<typeof getHours>> }) {
  const { t, lang, tx } = useT();
  const c = deepTx(tx, COPY[lang]);
  // De hero-foto is bewust vast en lokaal: geen mediabibliotheek, geen externe opslag.

  return (
    <>
      <header className="relative mt-6 aspect-[4/5] overflow-hidden rounded-3xl border border-border bg-[color:var(--color-surface-forest)] sm:aspect-[3/2] md:aspect-[16/9]">
        <img
          src={heroSheepPark}
          alt={c.heroAlt}
          width={1773}
          height={797}
          loading="eager"
          fetchPriority="high"
          decoding="sync"
          className="absolute inset-0 h-full w-full object-cover object-[50%_55%]"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-[color:var(--color-surface-forest)]/90 via-[color:var(--color-surface-forest)]/70 to-[color:var(--color-surface-forest)]/45 md:bg-gradient-to-r md:from-[color:var(--color-surface-forest)]/95 md:via-[color:var(--color-surface-forest)]/65 md:to-transparent" />

        <div className="relative grid h-full grid-cols-1 items-end gap-8 p-6 md:grid-cols-2 md:p-10 lg:p-12">
          <div className="max-w-2xl">
            <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-[color:var(--color-terracotta)]">
              {t("home.eyebrow")}
            </p>
            <h1 className="font-serif mt-6 leading-[0.85] tracking-tight text-[color:var(--color-cream)]">
              <span className="block text-6xl italic sm:text-7xl md:text-8xl lg:text-9xl">
                {t("brand.name")}
              </span>
            </h1>

            <p className="mt-6 max-w-md text-lg font-light leading-relaxed text-[color:var(--color-cream)]/95 md:mt-8 md:text-xl">
              {t("home.vision.default")}
            </p>

            {/* Weer staat nu in de praktische-infokaart rechts. */}

            <div className="mt-6 flex flex-wrap gap-3">
              <LocalLink
                to={pathFor("academy", lang)}
                className="inline-flex min-h-[48px] items-center rounded-full border border-[color:var(--color-cream)]/40 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--color-cream)] transition-colors hover:bg-[color:var(--color-cream)]/10"
              >
                {t("home.cta.academy")}
              </LocalLink>
              <Link
                to={pathFor("support", lang)}
                className="inline-flex min-h-[48px] items-center rounded-full bg-[color:var(--color-terracotta)] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:bg-[color:var(--color-terracotta-bright)]"
              >
                {t("home.cta.support")}
              </Link>
            </div>
          </div>

          <div className="hidden md:block" />
        </div>

        <div className="absolute bottom-4 right-4 hidden md:block">
          <HeroStatusBadge hours={hours ?? []} />
        </div>
      </header>

      <div className="mt-4 md:hidden">
        <HeroStatusBadge hours={hours ?? []} />
      </div>
    </>
  );
}

/* ---------- EDITORIAL GRID: vision + sidebar ---------- */

function EditorialGrid({
  animals,
  vision,
}: {
  animals: Awaited<ReturnType<typeof getAnimals>>;
  vision: string;
}) {
  const { t, lang, tx } = useT();
  const albums = useAlbumPhotos();
  const preview = animals.slice(0, 3);
  return (
    <section className="grid grid-cols-1 gap-8 py-12 lg:grid-cols-12 lg:gap-10">
      {/* Editorial content */}
      <div className="lg:col-span-8">
        <div className="rounded-3xl border border-border bg-card p-6 text-card-foreground md:p-10">
          <p className="font-serif text-2xl italic text-[color:var(--color-terracotta)]">
            {t("home.vision.title")}
          </p>
          <p className="font-serif mt-6 text-3xl leading-tight text-foreground md:text-5xl">
            {vision || t("home.vision.default")}
          </p>
        </div>

        <div className="mt-8 rounded-3xl border border-border bg-card p-6 text-card-foreground md:p-10">
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-3xl italic md:text-4xl">{t("home.residents")}</h2>
            <LocalLink
              to={pathFor("academy", lang)}
              className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--color-terracotta)] hover:underline"
            >
              {t("home.discoverAll")}
            </LocalLink>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
            {preview.map((a) => {
              return (
                <Link
                  key={a.id}
                  to="/qr/$animalId"
                  params={{ animalId: String(a.id) }}
                  className="group block"
                >
                  <div className="aspect-square overflow-hidden rounded-2xl bg-secondary">
                    <ResidentPhoto
                      animal={a}
                      albums={albums}
                      className="transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <p className="font-serif mt-3 text-xl italic">{a.name}</p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    {a.species}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sidebar: forest card */}
      <aside className="lg:col-span-4">
        <div className="rounded-3xl border border-border bg-[color:var(--color-surface-forest)] p-8 text-[color:var(--color-cream)]">
          <h3 className="font-serif text-3xl italic">{t("home.hub.title")}</h3>
          <p className="mt-4 text-sm font-light leading-relaxed text-[color:var(--color-cream)]/95">{t("home.hub.body")}</p>
          <div className="mt-8 flex flex-col gap-2">
            <Link
              to="/bezoekers/$doelgroep"
              params={{ doelgroep: "school" }}
              className="min-h-[48px] inline-flex items-center rounded-full border border-[color:var(--color-cream)]/25 px-5 text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors hover:bg-[color:var(--surface-page)]/10"
            >
              {t("home.hub.school")}
            </Link>
            <Link
              to="/bezoekers/$doelgroep"
              params={{ doelgroep: "familie" }}
              className="min-h-[48px] inline-flex items-center rounded-full border border-[color:var(--color-cream)]/25 px-5 text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors hover:bg-[color:var(--surface-page)]/10"
            >
              {t("home.hub.family")}
            </Link>
            <Link
              to="/bezoekers/$doelgroep"
              params={{ doelgroep: "bedrijf" }}
              className="min-h-[48px] inline-flex items-center rounded-full border border-[color:var(--color-cream)]/25 px-5 text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors hover:bg-[color:var(--surface-page)]/10"
            >
              {t("home.hub.business")}
            </Link>

            <Link
              to={pathFor("support", lang)}
              className="min-h-[48px] inline-flex items-center rounded-full bg-[color:var(--color-terracotta)] px-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white hover:opacity-90"
            >
              {t("home.hub.support")}
            </Link>
          </div>
        </div>
      </aside>
    </section>
  );
}
