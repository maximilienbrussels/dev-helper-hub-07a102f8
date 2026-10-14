import { PagePhotoBand } from "@/components/PagePhotoBand";
import { Link } from "@tanstack/react-router";
import { NavHeader } from "@/components/NavHeader";
import { PartnerLogo } from "@/components/PartnerLogo";
import { PARTNERS, PARTNER_CATEGORIES } from "@/lib/partners";
import { useT, type Lang } from "@/lib/i18n";


const COPY: Record<
  Lang,
  { eyebrow: string; title: string; intro: string; supportQuestion: string; button: string }
> = {
  nl: {
    eyebrow: "Partners",
    title: "Onze partners & netwerken",
    intro:
      "Van subsidies en federaties tot digitale infrastructuur: deze organisaties maken de dagelijkse werking van de stadsboerderij mogelijk.",
    supportQuestion: "Wil jouw organisatie de boerderij ook steunen?",
    button: "Word partner",
  },
  fr: {
    eyebrow: "Partenaires",
    title: "Nos partenaires & réseaux",
    intro:
      "Des subsides et fédérations à l'infrastructure numérique : ces organisations rendent le fonctionnement quotidien de la ferme urbaine possible.",
    supportQuestion: "Votre organisation souhaite-t-elle aussi soutenir la ferme ?",
    button: "Devenir partenaire",
  },
  en: {
    eyebrow: "Partners",
    title: "Our partners & networks",
    intro:
      "From subsidies and federations to digital infrastructure: these organisations make the daily operation of the city farm possible.",
    supportQuestion: "Would your organisation also like to support the farm?",
    button: "Become a partner",
  },
};

export function PartnersPage() {
  const { t, lang } = useT();
  const c = COPY[lang];
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavHeader />
      <PagePhotoBand photo="trojaans-paard" />
      <main className="mx-auto max-w-5xl px-4 py-16 md:px-8 md:py-24">
        <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-[color:var(--color-terracotta)]">
          {c.eyebrow}
        </p>
        <h1 className="font-serif mt-4 text-5xl leading-[0.95] tracking-tight text-[color:var(--ink-forest)] md:text-7xl">
          {c.title}
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/90 md:text-lg">
          {c.intro}
        </p>

        {PARTNER_CATEGORIES.map((cat) => {
          const items = PARTNERS.filter((p) => p.category === cat.id);
          if (items.length === 0) return null;
          return (
            <section key={cat.id} id={cat.id} className="mt-16 scroll-mt-24">
              <h2 className="font-serif text-3xl italic text-[color:var(--color-terracotta)] md:text-4xl">
                {cat.title}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground/90">
                {cat.intro}
              </p>
              <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((p) => (
                  <li key={p.id} className="flex flex-col gap-2">
                    <PartnerLogo partner={p} />
                    <p className="px-1 text-[11px] uppercase tracking-[0.15em] text-foreground/90">
                      {p.desc ?? t(p.descKey)}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        <div className="mt-16 rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
          <p className="text-base text-foreground/90">{c.supportQuestion}</p>
          <Link
            to="/word-partner"
            className="mt-5 inline-flex min-h-[48px] items-center rounded-full bg-[color:var(--surface-forest)] px-7 text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--color-cream)] transition-colors hover:bg-[color:var(--color-terracotta)]"
          >
            {c.button}
          </Link>
        </div>
      </main>
    </div>
  );
}
