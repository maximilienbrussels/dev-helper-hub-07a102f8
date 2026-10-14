import { deepTx } from "@/lib/i18n-extra";
import { PagePhotoBand } from "@/components/PagePhotoBand";
import { PublicGallery } from "@/components/PublicGallery";
import { FarmImage } from "@/components/FarmImage";
import { NavHeader } from "@/components/NavHeader";
import { useQuery } from "@tanstack/react-query";
import { fetchPageContent } from "@/lib/page-content.functions";
import { localized } from "@/lib/page-content";

import { FarmCamps } from "@/components/FarmCamps";
import { useT } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { Illustration } from "@/components/Illustration";
import dagOpDeBoerderijAsset from "@/assets/illustrations/dag-op-de-boerderij.webp.asset.json";

const COPY: Record<Lang, { eyebrow: string; title: string; lede: string; dayImageAlt: string }> = {
  nl: {
    eyebrow: "Kinderen · 6 tot 10 jaar",
    title: "Vakantiestages op de boerderij",
    lede: "Een onvergetelijke week vol dierenverzorging, tuinieren, creatieve workshops en buitenpret voor kinderen van 6 tot 10 jaar.",
    dayImageAlt: "Illustratie van een dag op de boerderij met dieren en tuinieren",
  },
  fr: {
    eyebrow: "Enfants · 6 à 10 ans",
    title: "Stages à la ferme",
    lede: "Une semaine inoubliable rythmée par le soin des animaux, le jardinage, les ateliers créatifs et le grand air, pour les enfants de 6 à 10 ans.",
    dayImageAlt: "Illustration d'une journée à la ferme avec animaux et jardinage",
  },
  en: {
    eyebrow: "Children · ages 6 to 10",
    title: "Holiday camps at the farm",
    lede: "An unforgettable week of animal care, gardening, creative workshops and outdoor fun for children aged 6 to 10.",
    dayImageAlt: "Illustration of a day at the farm with animals and gardening",
  },
};

export function CampsPage() {
  const { t, lang, tx } = useT();
  const c = deepTx(tx, COPY[lang]);
  const { data: page } = useQuery({
    queryKey: ["page-content", "camps"],
    queryFn: () => fetchPageContent({ data: { key: "camps" } }),
  });
  const heroTitle = page ? tx(localized(page.hero.title, lang)) : "";
  const heroText = page ? tx(localized(page.hero.text, lang)) : "";
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavHeader />
      <PagePhotoBand photo="pony" />
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
        <div className="mt-10 flex justify-center">
          <Illustration
            src={dagOpDeBoerderijAsset.url}
            alt={c.dayImageAlt}
            className="max-w-2xl w-full"
          />
        </div>
        <FarmCamps />

        <PublicGallery urls={page?.gallery ?? []} title={t("gallery.camps.title")} altBase={t("gallery.camps.alt")} />
      </main>
    </div>
  );
}
