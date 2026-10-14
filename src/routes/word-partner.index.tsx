import { createFileRoute, Link } from "@tanstack/react-router";
import { NavHeader } from "@/components/NavHeader";
import { Handshake, Leaf, Users, Building2 } from "lucide-react";
import { useT, type Lang } from "@/lib/i18n";

export const Route = createFileRoute("/word-partner/")({
  head: () => ({
    meta: [
      { title: "Word partner — Maximilien" },
      {
        name: "description",
        content:
          "Sponsoring, MVO en teambuilding: word partner van de stadsboerderij in hartje Brussel.",
      },
      { property: "og:title", content: "Word partner — Maximilien" },
      {
        property: "og:description",
        content: "Bedrijven en organisaties ondersteunen de stadsboerderij: ontdek hoe.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/word-partner" }],
  }),
  component: WordPartnerPage,
});

const COPY: Record<
  Lang,
  {
    eyebrow: string;
    title: string;
    intro: string;
    benefits: { title: string; body: string }[];
    ctaTitle: string;
    ctaButton: string;
    curious: string;
    link: string;
  }
> = {
  nl: {
    eyebrow: "Partnerships",
    title: "Word partner",
    intro:
      "Bedrijven, stichtingen en overheden maken onze stadsboerderij mogelijk. Samen bouwen we aan een groene, sociale en educatieve plek voor Brussel. We werken met sponsorpakketten op maat, van eenmalige steun tot meerjarige samenwerking.",
    benefits: [
      {
        title: "Zichtbaarheid",
        body: "Je logo op onze site, nieuwsbrief en op het terrein — zichtbaar voor duizenden bezoekers per jaar.",
      },
      {
        title: "Teambuilding",
        body: "Een dag met je team op de boerderij: samen werken in de moestuin of bij de dieren.",
      },
      {
        title: "Maatschappelijke impact",
        body: "Je steunt sociale tewerkstelling, educatie en biodiversiteit in het hart van Brussel.",
      },
      {
        title: "Structurele samenwerking",
        body: "Van subsidiedossiers en VGC-projecten tot meerjarige sponsoring op maat.",
      },
    ],
    ctaTitle: "Klaar om samen te werken?",
    ctaButton: "Partnerschap aanvragen",
    curious: "Benieuwd wie ons al steunt?",
    link: "Bekijk onze partners & netwerken",
  },
  fr: {
    eyebrow: "Partenariats",
    title: "Devenir partenaire",
    intro:
      "Entreprises, fondations et pouvoirs publics rendent notre ferme urbaine possible. Ensemble, nous construisons un lieu vert, social et éducatif pour Bruxelles. Nous proposons des formules de sponsoring sur mesure, du soutien ponctuel à la collaboration pluriannuelle.",
    benefits: [
      {
        title: "Visibilité",
        body: "Votre logo sur notre site, notre newsletter et sur le terrain — visible pour des milliers de visiteurs par an.",
      },
      {
        title: "Teambuilding",
        body: "Une journée avec votre équipe à la ferme : travailler ensemble au potager ou auprès des animaux.",
      },
      {
        title: "Impact sociétal",
        body: "Vous soutenez l'emploi social, l'éducation et la biodiversité au cœur de Bruxelles.",
      },
      {
        title: "Collaboration structurelle",
        body: "Des dossiers de subsides et projets VGC au sponsoring pluriannuel sur mesure.",
      },
    ],
    ctaTitle: "Prêt·e à collaborer ?",
    ctaButton: "Demander un partenariat",
    curious: "Curieux·se de savoir qui nous soutient déjà ?",
    link: "Découvrez nos partenaires & réseaux",
  },
  en: {
    eyebrow: "Partnerships",
    title: "Become a partner",
    intro:
      "Companies, foundations and public bodies make our city farm possible. Together we build a green, social and educational place for Brussels. We work with tailor-made sponsorship packages, from one-off support to multi-year partnerships.",
    benefits: [
      {
        title: "Visibility",
        body: "Your logo on our site, newsletter and on-site — seen by thousands of visitors every year.",
      },
      {
        title: "Team building",
        body: "A day with your team at the farm: working together in the vegetable garden or with the animals.",
      },
      {
        title: "Social impact",
        body: "You support social employment, education and biodiversity in the heart of Brussels.",
      },
      {
        title: "Structural partnership",
        body: "From subsidy files and VGC projects to tailor-made multi-year sponsorship.",
      },
    ],
    ctaTitle: "Ready to work together?",
    ctaButton: "Request a partnership",
    curious: "Curious who already supports us?",
    link: "View our partners & networks",
  },
};

function WordPartnerPage() {
  const { lang } = useT();
  const c = COPY[lang];
  const BENEFITS = [Building2, Users, Leaf, Handshake].map((icon, i) => ({
    icon,
    ...c.benefits[i],
  }));
  return (
    <div className="min-h-screen bg-[color:var(--surface-page)] text-foreground">
      <NavHeader />
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

        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {BENEFITS.map((b) => (
            <div
              key={b.title}
              className="rounded-3xl border border-border bg-card p-7 shadow-sm md:p-8"
            >
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[color:var(--color-sage)]/15 text-[color:var(--ink-forest)]">
                <b.icon className="h-6 w-6" />
              </span>
              <h2 className="mt-5 text-xl font-semibold tracking-tight">{b.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-foreground/90">{b.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start gap-4 rounded-3xl bg-[color:var(--surface-forest)] p-8 text-[color:var(--color-cream)] md:flex-row md:items-center md:justify-between md:p-10">
          <p className="font-serif text-2xl italic md:text-3xl">{c.ctaTitle}</p>
          <Link
            to="/word-partner/contact"
            className="inline-flex min-h-[52px] items-center rounded-full bg-[color:var(--color-apricot)] px-8 text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--ink-forest)] transition-transform hover:-translate-y-0.5"
          >
            {c.ctaButton}
          </Link>
        </div>

        <p className="mt-8 text-sm text-foreground/90">
          {c.curious}{" "}
          <Link to="/partners" className="underline hover:text-[color:var(--color-terracotta)]">
            {c.link}
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
