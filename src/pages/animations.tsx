import { deepTx } from "@/lib/i18n-extra";
import { NavHeader } from "@/components/NavHeader";
import { PublicGallery } from "@/components/PublicGallery";
import { FarmImage } from "@/components/FarmImage";
import { useQuery } from "@tanstack/react-query";
import { fetchPageContent } from "@/lib/page-content.functions";
import { localized } from "@/lib/page-content";

import { PageContactForm } from "@/components/PageContactForm";
import { LocalLink } from "@/components/LocalLink";
import { useT, formatT } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { MAX_GROUP_SIZE, PICNIC_OPTIONS, SCHOOL_ANIMATIONS, SECOND_ANIMATOR_PRICE, getAnimation } from "@/lib/school-animations";
import type { AnimationSlug } from "@/lib/school-animations";
import { ANIMATION_SLUGS, pathFor, subPathFor } from "@/lib/routes-i18n";
import { ArrowLeft, ArrowRight, Clock, Users, CalendarDays } from "lucide-react";
import { handleImageError } from "@/lib/image-fallback";

const COPY: Record<
  Lang,
  {
    eyebrow: string;
    title: string;
    lede: string;
    perGroup: string;
    maxGroup: (n: number) => string;
    extra: (n: number) => string;
    picnic: string;
    picnicFree: string;
    read: string;
    back: string;
    learn: string;
    schedule: string;
    bring: string;
    age: string;
    duration: string;
    season: string;
    formTitle: string;
    formIntro: string;
  }
> = {
  nl: {
    eyebrow: "Scholen & groepen",
    title: "Onze zes boerderijanimaties",
    lede: "Elke animatie is opgebouwd rond één thema, met een animator, materiaal en een vast uurschema. Kies je animatie en vraag een datum aan.",
    perGroup: "per groep",
    maxGroup: (n) => `Max. ${n} leerlingen per groep`,
    extra: (n) => `Vanaf 26 leerlingen komt er een tweede animator bij (€ ${n}).`,
    picnic: "Picknickopties",
    picnicFree: "gratis",
    read: "Lees meer",
    back: "Alle animaties",
    learn: "Wat de kinderen leren",
    schedule: "Uurschema",
    bring: "Wat je meebrengt",
    age: "Leeftijd",
    duration: "Duur",
    season: "Seizoen",
    formTitle: "Vraag deze animatie aan",
    formIntro:
      "Geef je gewenste datum en startuur, het aantal leerlingen, de leeftijd en je picknickkeuze mee. We bevestigen de beschikbaarheid.",
  },
  fr: {
    eyebrow: "Écoles & groupes",
    title: "Nos six animations à la ferme",
    lede: "Chaque animation est construite autour d'un thème, avec un animateur, le matériel et un horaire précis. Choisissez la vôtre et demandez une date.",
    perGroup: "par groupe",
    maxGroup: (n) => `Max. ${n} élèves par groupe`,
    extra: (n) => `À partir de 26 élèves, un deuxième animateur s'ajoute (${n} €).`,
    picnic: "Options pique-nique",
    picnicFree: "gratuit",
    read: "Lire plus",
    back: "Toutes les animations",
    learn: "Ce que les enfants apprennent",
    schedule: "Horaire",
    bring: "À apporter",
    age: "Âge",
    duration: "Durée",
    season: "Saison",
    formTitle: "Demander cette animation",
    formIntro:
      "Indiquez la date et l'heure de début souhaitées, le nombre d'élèves, leur âge et votre choix de pique-nique. Nous confirmons la disponibilité.",
  },
  en: {
    eyebrow: "Schools & groups",
    title: "Our six farm activities",
    lede: "Each activity is built around one theme, with a facilitator, materials and a set schedule. Pick one and request a date.",
    perGroup: "per group",
    maxGroup: (n) => `Max. ${n} pupils per group`,
    extra: (n) => `From 26 pupils on, a second facilitator joins (€${n}).`,
    picnic: "Picnic options",
    picnicFree: "free",
    read: "Read more",
    back: "All activities",
    learn: "What the children learn",
    schedule: "Schedule",
    bring: "What to bring",
    age: "Age",
    duration: "Duration",
    season: "Season",
    formTitle: "Request this activity",
    formIntro:
      "Tell us your preferred date and start time, the number of pupils, their age and your picnic choice. We will confirm availability.",
  },
};

const PICNIC_LABELS: Record<Lang, Record<string, string>> = {
  nl: { park: "Picknick in het park", chalet: "Picknick in het chalet", zaal: "Picknick in de zaal" },
  fr: {
    park: "Pique-nique dans le parc",
    chalet: "Pique-nique au chalet",
    zaal: "Pique-nique dans la salle",
  },
  en: {
    park: "Picnic in the park",
    chalet: "Picnic in the chalet",
    zaal: "Picnic in the hall",
  },
};

export function AnimationsIndexPage() {
  const { t, lang, tx } = useT();
  const c = deepTx(tx, COPY[lang]);
  const { data: page } = useQuery({
    queryKey: ["page-content", "animations"],
    queryFn: () => fetchPageContent({ data: { key: "animations" } }),
  });
  const heroTitle = page ? tx(localized(page.hero.title, lang)) : "";
  const heroText = page ? tx(localized(page.hero.text, lang)) : "";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavHeader />
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

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {SCHOOL_ANIMATIONS.map((a) => {
            const copy = deepTx(tx, a.copy[lang]);
            const block = page?.blocks.find((b) => b.id === `default-${a.slug}`);
            return (
              <LocalLink
                key={a.slug}
                to={subPathFor("animations", lang, a.slug)}
                className="group overflow-hidden rounded-3xl border border-border/60 bg-[color:var(--surface-page)]/50 transition-colors hover:border-[color:var(--color-terracotta)]"
              >
                {block?.imageUrl ? (
                  <div className="h-40 w-full overflow-hidden">
                    <img loading="lazy" onError={handleImageError}
                      src={block.imageUrl}
                      alt=""
                      className="h-full w-full object-cover object-[50%_40%] transition-transform group-hover:scale-105"
                    />
                  </div>
                ) : null}
                <div className="p-6">
                  <h2 className="font-serif text-xl text-[color:var(--ink-forest)]">{copy.title}</h2>
                  <p className="mt-2 text-sm text-foreground/90">{copy.lede}</p>
                  <p className="mt-4 text-sm font-medium text-[color:var(--ink-forest)]">
                    € {a.price} <span className="font-normal text-muted-foreground">{c.perGroup}</span>
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-[12px] uppercase tracking-[0.2em] text-[color:var(--color-terracotta)] group-hover:gap-2 transition-all">
                    {c.read}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </LocalLink>
            );
          })}
        </div>

        <section className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-border/60 p-6 text-sm text-foreground/90">
            <p className="font-medium text-[color:var(--ink-forest)]">{formatT(tx("Max. {n} pupils per group"), { n: MAX_GROUP_SIZE })}</p>
            <p className="mt-2">{formatT(tx("From 26 pupils on, a second facilitator joins (€{n})."), { n: SECOND_ANIMATOR_PRICE })}</p>
          </div>
          <div className="rounded-3xl border border-border/60 p-6">
            <h2 className="font-serif text-xl text-[color:var(--ink-forest)]">{c.picnic}</h2>
            <ul className="mt-3 space-y-1.5 text-sm text-foreground/90">
              {PICNIC_OPTIONS.map((p) => (
                <li key={p.id} className="flex justify-between gap-3">
                  <span>{tx(PICNIC_LABELS[lang][p.id])}</span>
                  <span className="text-muted-foreground">
                    {p.price === 0 ? c.picnicFree : `€ ${p.price}`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <PublicGallery urls={page?.gallery ?? []} title={t("gallery.animations.title")} altBase={t("gallery.animations.alt")} />
      </main>
    </div>
  );
}

export function AnimationDetailPage({ slug }: { slug: AnimationSlug }) {
  const { lang, tx } = useT();
  const c = deepTx(tx, COPY[lang]);
  const animation = getAnimation(slug);
  if (!animation) return null;
  const copy = deepTx(tx, animation.copy[lang]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavHeader />
      <main className="mx-auto max-w-4xl px-4 py-16 md:px-8 md:py-24">
        <LocalLink
          to={pathFor("animations", lang)}
          className="inline-flex items-center gap-1.5 text-[12px] uppercase tracking-[0.2em] text-[color:var(--color-terracotta)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {c.back}
        </LocalLink>

        <h1 className="font-serif mt-6 text-4xl leading-[1.05] tracking-tight text-[color:var(--ink-forest)] md:text-5xl">
          {copy.title}
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">{copy.lede}</p>

        <dl className="mt-8 grid gap-3 text-sm sm:grid-cols-4">
          <div className="rounded-2xl border border-border/50 p-3">
            <dt className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <Users className="h-3.5 w-3.5" aria-hidden /> {c.age}
            </dt>
            <dd className="mt-1 font-medium text-[color:var(--ink-forest)]">{copy.age}</dd>
          </div>
          <div className="rounded-2xl border border-border/50 p-3">
            <dt className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <Clock className="h-3.5 w-3.5" aria-hidden /> {c.duration}
            </dt>
            <dd className="mt-1 font-medium text-[color:var(--ink-forest)]">{copy.duration}</dd>
          </div>
          <div className="rounded-2xl border border-border/50 p-3">
            <dt className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden /> {c.season}
            </dt>
            <dd className="mt-1 font-medium text-[color:var(--ink-forest)]">{copy.season}</dd>
          </div>
          <div className="rounded-2xl border border-border/50 p-3">
            <dt className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {c.perGroup}
            </dt>
            <dd className="mt-1 font-medium text-[color:var(--ink-forest)]">€ {animation.price}</dd>
          </div>
        </dl>

        <section className="mt-12">
          <h2 className="font-serif text-2xl text-[color:var(--ink-forest)]">{c.learn}</h2>
          <ul className="mt-3 space-y-1.5 text-sm text-foreground/90">
            {copy.learn.map((l) => (
              <li key={l}>· {l}</li>
            ))}
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-2xl text-[color:var(--ink-forest)]">{c.schedule}</h2>
          <ul className="mt-3 divide-y divide-border/50 text-sm">
            {copy.schedule.map((s) => (
              <li key={s.time} className="flex gap-4 py-2">
                <span className="w-20 shrink-0 font-medium text-[color:var(--ink-forest)]">
                  {s.time}
                </span>
                <span className="text-foreground/90">{s.what}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-2xl text-[color:var(--ink-forest)]">{c.bring}</h2>
          <ul className="mt-3 space-y-1.5 text-sm text-foreground/90">
            {copy.bring.map((b) => (
              <li key={b}>· {b}</li>
            ))}
          </ul>
        </section>

        <p className="mt-10 text-sm text-muted-foreground">
          {formatT(tx("Max. {n} pupils per group"), { n: MAX_GROUP_SIZE })} — {formatT(tx("From 26 pupils on, a second facilitator joins (€{n})."), { n: SECOND_ANIMATOR_PRICE })}
        </p>

        <div className="mt-16">
          <PageContactForm
            context={`Animatie: ${copy.title}`}
            inbox="school"
            title={c.formTitle}
            intro={c.formIntro}
          />
        </div>
      </main>
    </div>
  );
}

export function isAnimationSlug(v: string): v is AnimationSlug {
  return Object.keys(ANIMATION_SLUGS).includes(v);
}
