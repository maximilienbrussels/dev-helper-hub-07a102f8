import { PagePhotoBand } from "@/components/PagePhotoBand";
import { PublicGallery } from "@/components/PublicGallery";
import { FarmImage } from "@/components/FarmImage";
import { NavHeader } from "@/components/NavHeader";
import { useQuery } from "@tanstack/react-query";
import { fetchPageContent } from "@/lib/page-content.functions";
import { localized } from "@/lib/page-content";

import { LocalLink } from "@/components/LocalLink";
import { useT } from "@/lib/i18n";
import { ArrowRight } from "lucide-react";
import { RentalSpaces } from "@/components/RentalSpaces";
import { pathFor } from "@/lib/routes-i18n";

export function RentalPage() {
  const { t, lang } = useT();
  const AUDIENCES = [
    { href: "/bezoekers/school", label: t("rent.school.label"), body: t("rent.school.body") },
    { href: "/bezoekers/familie", label: t("rent.family.label"), body: t("rent.family.body") },
    { href: "/bezoekers/bedrijf", label: t("rent.biz.label"), body: t("rent.biz.body") },
  ];
  const { data: page } = useQuery({
    queryKey: ["page-content", "rental"],
    queryFn: () => fetchPageContent({ data: { key: "rental" } }),
  });
  const heroTitle = page ? localized(page.hero.title, lang) : "";
  const heroText = page ? localized(page.hero.text, lang) : "";
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavHeader />
      <PagePhotoBand photo="trojaans-paard" />
      {page?.hero.imageUrl ? (
        <div className="relative h-64 w-full overflow-hidden md:h-96">
          <FarmImage src={page.hero.imageUrl} loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
        </div>
      ) : null}
      <main className="mx-auto max-w-5xl px-4 py-16 md:px-8 md:py-24">
        <p className="text-[11px] uppercase tracking-[0.25em] text-[color:var(--color-terracotta)] font-medium">
          {t("rent.eyebrow")}
        </p>
        <h1 className="font-serif mt-4 text-4xl leading-[1.02] tracking-tight text-[color:var(--ink-forest)] md:text-6xl">
          {heroTitle || t("rent.title")}
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">{heroText || t("rent.lede")}</p>

        <section className="mt-14 grid gap-4 md:grid-cols-3">
          {AUDIENCES.map((a) => (
            <LocalLink
              key={a.href}
              to={a.href}
              className="group rounded-3xl border border-border/60 bg-[color:var(--surface-page)]/50 p-6 transition-colors hover:border-[color:var(--color-terracotta)] hover:bg-[color:var(--surface-page)]"
            >
              <h2 className="font-serif text-xl text-[color:var(--ink-forest)]">{a.label}</h2>
              <p className="mt-2 text-sm text-foreground/90">{a.body}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-[12px] uppercase tracking-[0.2em] text-[color:var(--color-terracotta)] group-hover:gap-2 transition-all">
                {t("rent.view")}
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </LocalLink>
          ))}
        </section>

        <RentalSpaces />

        <p className="mt-16 text-sm text-muted-foreground">
          {t("rent.help")}{" "}
          <LocalLink
            to={pathFor("contact", lang)}
            className="text-[color:var(--color-terracotta)] underline"
          >
            {t("rent.contactUs")}
          </LocalLink>{" "}
          {t("rent.helpTail")}
        </p>

        <PublicGallery urls={page?.gallery ?? []} title={t("gallery.rental.title")} altBase={t("gallery.rental.alt")} />
      </main>
    </div>
  );
}
