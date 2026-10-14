import { NavHeader } from "@/components/NavHeader";
import { PageContactForm } from "@/components/PageContactForm";
import { useT, type Lang } from "@/lib/i18n";
import { ExternalLink, Recycle, ShieldCheck, MapPin } from "lucide-react";

export const MURENA_PARTNER_URL = "https://murena.com/partner/Maximilienbrussels/";

type Copy = {
  eyebrow: string;
  title: string;
  lede: string;
  cta: string;
  ctaSecondary: string;
  valuesTitle: string;
  values: { title: string; body: string }[];
  formTitle: string;
  formIntro: string;
  affiliate: string;
};

const COPY: Record<Lang, Copy> = {
  nl: {
    eyebrow: "Fair & Open Tech",
    title: "Fair & Open Tech @ Maximilien",
    lede: "De stadsboerderij is ook een Brusselse ontmoetingsplek voor duurzame toestellen (Fairphone) en privacyvriendelijke, open software (/e/OS). Kom kijken, testen en herstellen.",
    cta: "Ontdek Fairphone & /e/OS",
    ctaSecondary: "Bestel via onze partnerpagina",
    valuesTitle: "Waar we voor staan",
    values: [
      {
        title: "Circulair & herstelbaar",
        body: "Modulaire Fairphone 6-hardware: onderdelen zelf vervangen, langer gebruiken, geen elektronisch afval.",
      },
      {
        title: "Privacy & decentraal",
        body: "/e/OS werkt zonder tracking, met open broncode en gedecentraliseerde protocollen zoals Mastodon en Matrix.",
      },
      {
        title: "Lokale impact",
        body: "Fysieke demostand op de boerderij, Schipperijkaai 2 / Quai des Péniches 2, 1000 Brussel.",
      },
    ],
    formTitle: "Interesse of een vraag over Fair Tech?",
    formIntro:
      "Voor bezoekers, scholen en partnerverenigingen die een toestel willen testen of willen meedoen aan een Repair Café.",
    affiliate: "Via deze partnerlink steun je de boerderij, zonder meerkost voor jou.",
  },
  fr: {
    eyebrow: "Fair & Open Tech",
    title: "Fair & Open Tech @ Maximilien",
    lede: "La ferme urbaine est aussi un lieu bruxellois dédié au matériel durable (Fairphone) et aux logiciels libres respectueux de la vie privée (/e/OS). Venez voir, tester et réparer.",
    cta: "Découvrir Fairphone & /e/OS",
    ctaSecondary: "Commander via notre page partenaire",
    valuesTitle: "Nos valeurs",
    values: [
      {
        title: "Circulaire & réparable",
        body: "Matériel modulaire Fairphone 6 : pièces remplaçables, durée de vie prolongée, zéro déchet électronique.",
      },
      {
        title: "Vie privée & décentralisation",
        body: "/e/OS fonctionne sans pistage, en code ouvert, avec des protocoles décentralisés comme Mastodon et Matrix.",
      },
      {
        title: "Impact local",
        body: "Stand de démonstration à la ferme, Quai des Péniches 2 / Schipperijkaai 2, 1000 Bruxelles.",
      },
    ],
    formTitle: "Une question sur la Fair Tech ?",
    formIntro:
      "Pour les visiteurs, les écoles et les ASBL partenaires qui veulent tester un appareil ou rejoindre un Repair Café.",
    affiliate: "Ce lien partenaire soutient la ferme, sans surcoût pour vous.",
  },
  en: {
    eyebrow: "Fair & Open Tech",
    title: "Fair & Open Tech @ Maximilien",
    lede: "The urban farm is also a Brussels hub for sustainable hardware (Fairphone) and privacy-first open-source software (/e/OS). Come and see, test and repair.",
    cta: "Discover Fairphone & /e/OS",
    ctaSecondary: "Order via our partner page",
    valuesTitle: "What we stand for",
    values: [
      {
        title: "Circular & repairable",
        body: "Modular Fairphone 6 hardware: replace parts yourself, keep devices longer, avoid e-waste.",
      },
      {
        title: "Privacy & decentralised",
        body: "/e/OS runs without tracking, fully open source, with decentralised protocols such as Mastodon and Matrix.",
      },
      {
        title: "Local impact",
        body: "Physical demo station at the farm, Quai des Péniches 2 / Schipperijkaai 2, 1000 Brussels.",
      },
    ],
    formTitle: "Interested or have a Fair Tech question?",
    formIntro:
      "For visitors, local schools and partner NPOs who want to test a device or join a Repair Café.",
    affiliate: "This partner link supports the farm, at no extra cost to you.",
  },
};

const ICONS = [Recycle, ShieldCheck, MapPin];

export function FairTechPage() {
  const { lang } = useT();
  const c = COPY[lang];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavHeader />
      <main className="mx-auto max-w-5xl px-4 py-16 md:px-8 md:py-24">
        <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-[color:var(--color-terracotta)]">
          {c.eyebrow}
        </p>
        <h1 className="font-serif mt-4 text-4xl leading-[1.02] tracking-tight text-[color:var(--ink-forest)] md:text-6xl">
          {c.title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">{c.lede}</p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a
            href={MURENA_PARTNER_URL}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="inline-flex items-center gap-2 rounded-full bg-[color:var(--color-terracotta)] px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            {c.cta}
            <ExternalLink className="h-4 w-4" aria-hidden />
          </a>
          <a
            href={MURENA_PARTNER_URL}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-medium transition-colors hover:bg-muted"
          >
            {c.ctaSecondary}
          </a>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{c.affiliate}</p>

        <section className="mt-14">
          <h2 className="font-serif text-2xl text-[color:var(--ink-forest)]">{c.valuesTitle}</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {c.values.map((v, i) => {
              const Icon = ICONS[i] ?? Recycle;
              return (
                <article key={v.title} className="rounded-3xl border border-border/60 p-6">
                  <Icon
                    className="h-5 w-5 text-[color:var(--color-terracotta)]"
                    aria-hidden
                  />
                  <h3 className="mt-4 font-serif text-lg text-[color:var(--ink-forest)]">
                    {v.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">{v.body}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-16">
          <PageContactForm context="FairTech" title={c.formTitle} intro={c.formIntro} />
        </section>
      </main>
    </div>
  );
}

export default FairTechPage;
