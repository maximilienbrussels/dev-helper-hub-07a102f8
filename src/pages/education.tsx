import { PagePhotoBand } from "@/components/PagePhotoBand";
import { LocalLink } from "@/components/LocalLink";
import { NavHeader } from "@/components/NavHeader";
import { useT } from "@/lib/i18n";
import { PageContactForm } from "@/components/PageContactForm";
import { pathFor, subPathFor, type Lang } from "@/lib/routes-i18n";
import { Illustration } from "@/components/Illustration";
import dagOpDeBoerderijAsset from "@/assets/illustrations/dag-op-de-boerderij.webp.asset.json";
import bijenRucheAsset from "@/assets/illustrations/bijen-ruche.webp.asset.json";
import dieren5ZintuigenAsset from "@/assets/illustrations/dieren-5-zintuigen.webp.asset.json";
import compostAsset from "@/assets/illustrations/compost.webp.asset.json";
import moestuinSchattenAsset from "@/assets/illustrations/moestuin-schatten.webp.asset.json";
import boomgaardFruitAsset from "@/assets/illustrations/boomgaard-fruit.webp.asset.json";

const COPY: Record<
  Lang,
  {
    title: string;
    lede: string;
    offer: string;
    items: { title: string; body: string }[];
    practical: string;
    practicalBody: string[];
    themesTitle: string;
    bookCta: string;
    backCta: string;
    bookTitle: string;
    bookLede: string;
    formTitle: string;
    formIntro: string;
  }
> = {
  nl: {
    title: "Educatie & scholen",
    lede: "De boerderij als klaslokaal: dieren, moestuin, biodiversiteit en de kringloop van het leven.",
    offer: "Ons aanbod",
    items: [
      {
        title: "Kleuters (2,5 – 6 jaar)",
        body: "Dieren voelen, voeren en verzorgen. Een zintuiglijke kennismaking van 1,5 uur.",
      },
      {
        title: "Lager onderwijs",
        body: "Van gras tot melk, van zaad tot soep: de kringloop ontdekken met opdrachten in de stallen en de moestuin.",
      },
      {
        title: "Secundair & hogeschool",
        body: "Stadslandbouw, dierenwelzijn en sociale cohesie — met ruimte voor debat en projectwerk.",
      },
      {
        title: "Buitenschoolse groepen",
        body: "Vakantiewerking, jeugdbeweging of buurtgroep: op maat samengestelde animaties.",
      },
    ],
    practical: "Praktisch",
    themesTitle: "Thema's op de boerderij",
    practicalBody: [
      "Animaties in het Nederlands, Frans of Engels.",
      "Maximum 25 leerlingen per animator; grotere groepen splitsen we.",
      "Sociaal tarief mogelijk voor Brusselse scholen.",
    ],
    bookCta: "Reserveer een schoolbezoek",
    backCta: "Terug naar educatie",
    bookTitle: "Reserveer een schoolbezoek",
    bookLede:
      "Vertel ons over je groep en gewenste datum — we nemen binnen enkele werkdagen contact op.",
    formTitle: "Vraag over een klasbezoek?",
    formIntro:
      "Geef ons de leeftijdsgroep, het aantal leerlingen en de gewenste periode — we bezorgen je snel een voorstel op maat.",
  },
  fr: {
    title: "Éducation & écoles",
    lede: "La ferme comme salle de classe : animaux, potager, biodiversité et cycle du vivant.",
    offer: "Notre offre",
    items: [
      {
        title: "Maternelles (2,5 – 6 ans)",
        body: "Toucher, nourrir et soigner les animaux. Une découverte sensorielle d'1h30.",
      },
      {
        title: "Primaire",
        body: "De l'herbe au lait, de la graine à la soupe : découvrir le cycle avec des activités aux étables et au potager.",
      },
      {
        title: "Secondaire & supérieur",
        body: "Agriculture urbaine, bien-être animal et cohésion sociale — avec place au débat et au travail de projet.",
      },
      {
        title: "Groupes extrascolaires",
        body: "Stages, mouvements de jeunesse ou groupes de quartier : animations sur mesure.",
      },
    ],
    practical: "Infos pratiques",
    themesTitle: "Thèmes à la ferme",
    practicalBody: [
      "Animations en français, néerlandais ou anglais.",
      "Maximum 25 élèves par animateur ; les grands groupes sont divisés.",
      "Tarif social possible pour les écoles bruxelloises.",
    ],
    bookCta: "Réserver une visite scolaire",
    backCta: "Retour à l'éducation",
    bookTitle: "Réserver une visite scolaire",
    bookLede:
      "Parlez-nous de votre groupe et de la date souhaitée — nous vous répondons sous quelques jours ouvrables.",
    formTitle: "Une question sur une visite scolaire ?",
    formIntro:
      "Indiquez-nous la tranche d'âge, le nombre d'élèves et la période souhaitée — nous vous envoyons rapidement une proposition sur mesure.",
  },
  en: {
    title: "Education & schools",
    lede: "The farm as a classroom: animals, kitchen garden, biodiversity and the cycle of life.",
    offer: "What we offer",
    items: [
      {
        title: "Pre-school (2.5 – 6 years)",
        body: "Touching, feeding and caring for the animals. A 1.5-hour sensory introduction.",
      },
      {
        title: "Primary school",
        body: "From grass to milk, from seed to soup: discovering the cycle through activities in the stables and garden.",
      },
      {
        title: "Secondary & higher education",
        body: "Urban agriculture, animal welfare and social cohesion — with room for debate and project work.",
      },
      {
        title: "Out-of-school groups",
        body: "Holiday camps, youth movements or neighbourhood groups: tailor-made activities.",
      },
    ],
    practical: "Practical info",
    themesTitle: "Farm themes",
    practicalBody: [
      "Activities in English, Dutch or French.",
      "Maximum 25 pupils per guide; larger groups are split.",
      "Reduced rates available for Brussels schools.",
    ],
    bookCta: "Book a school visit",
    backCta: "Back to education",
    bookTitle: "Book a school visit",
    bookLede: "Tell us about your group and preferred date — we reply within a few working days.",
    formTitle: "Question about a school visit?",
    formIntro:
      "Tell us the age group, number of pupils and preferred period — we'll quickly send a tailored proposal.",
  },
};

const THEMES: Record<Lang, { title: string; body: string; src: string; alt: string }[]> = {
  nl: [
    {
      title: "Dieren & onze 5 zintuigen",
      body: "Voel, ruik, kijk en luister tijdens een ontdekkingsreis langs alpaca's, schapen en kippen.",
      src: dieren5ZintuigenAsset.url,
      alt: "Illustratie van dieren op de boerderij",
    },
    {
      title: "Bijen & hun bijenkorf",
      body: "Leer over bestuiving, honing en het belang van bijen voor onze tuin.",
      src: bijenRucheAsset.url,
      alt: "Illustratie van bijen en een bijenkorf",
    },
    {
      title: "De moestuin & zijn schatten",
      body: "Zaaien, oogsten en proeven: van eigen zaad tot verse groenten.",
      src: moestuinSchattenAsset.url,
      alt: "Illustratie van een moestuin met groenten",
    },
    {
      title: "Appel, peer & fruit uit de boomgaard",
      body: "Ontdek fruitbomen, oogsten en waarom een boomgaard goed is voor de natuur.",
      src: boomgaardFruitAsset.url,
      alt: "Illustratie van fruitbomen en oogst",
    },
    {
      title: "Compost & zijn kleine beestjes",
      body: "Wat mag op de composthoop? Wormen, schimmels en de kringloop van organisch afval.",
      src: compostAsset.url,
      alt: "Illustratie van compost en wormen",
    },
    {
      title: "Een dag op de boerderij",
      body: "Van dieren voeren tot tuinieren: een hele dag boerderijbelevenis.",
      src: dagOpDeBoerderijAsset.url,
      alt: "Illustratie van een dag op de boerderij",
    },
  ],
  fr: [
    {
      title: "Les animaux & nos 5 sens",
      body: "Touchez, sentez, regardez et écoutez lors d'un voyage de découverte avec alpagas, moutons et poules.",
      src: dieren5ZintuigenAsset.url,
      alt: "Illustration d'animaux à la ferme",
    },
    {
      title: "Les abeilles & leur ruche",
      body: "Apprenez-en sur la pollinisation, le miel et l'importance des abeilles pour notre jardin.",
      src: bijenRucheAsset.url,
      alt: "Illustration d'abeilles et d'une ruche",
    },
    {
      title: "Le potager & ses trésors",
      body: "Semer, récolter et goûter : de sa propre graine aux légumes frais.",
      src: moestuinSchattenAsset.url,
      alt: "Illustration d'un potager avec des légumes",
    },
    {
      title: "Pomme, poire & fruits du verger",
      body: "Découvrez les arbres fruitiers, la récolte et pourquoi un verger est bon pour la nature.",
      src: boomgaardFruitAsset.url,
      alt: "Illustration d'arbres fruitiers et de récolte",
    },
    {
      title: "Le compost & ses petites bêtes",
      body: "Que peut-on mettre au compost ? Vers, champignons et cycle des déchets organiques.",
      src: compostAsset.url,
      alt: "Illustration du compost et des vers",
    },
    {
      title: "Une journée à la ferme",
      body: "De nourrir les animaux au jardinage : une journée entière d'expériences à la ferme.",
      src: dagOpDeBoerderijAsset.url,
      alt: "Illustration d'une journée à la ferme",
    },
  ],
  en: [
    {
      title: "Animals & our 5 senses",
      body: "Touch, smell, look and listen on a discovery tour past alpacas, sheep and chickens.",
      src: dieren5ZintuigenAsset.url,
      alt: "Illustration of animals at the farm",
    },
    {
      title: "Bees & their hive",
      body: "Learn about pollination, honey and why bees matter for our garden.",
      src: bijenRucheAsset.url,
      alt: "Illustration of bees and a beehive",
    },
    {
      title: "The vegetable garden & its treasures",
      body: "Sowing, harvesting and tasting: from your own seed to fresh vegetables.",
      src: moestuinSchattenAsset.url,
      alt: "Illustration of a vegetable garden with vegetables",
    },
    {
      title: "Apple, pear & orchard fruit",
      body: "Discover fruit trees, harvesting and why an orchard is good for nature.",
      src: boomgaardFruitAsset.url,
      alt: "Illustration of fruit trees and harvest",
    },
    {
      title: "Compost & its little creatures",
      body: "What goes on the compost heap? Worms, fungi and the cycle of organic waste.",
      src: compostAsset.url,
      alt: "Illustration of compost and worms",
    },
    {
      title: "A day at the farm",
      body: "From feeding animals to gardening: a full day of farm experiences.",
      src: dagOpDeBoerderijAsset.url,
      alt: "Illustration of a day at the farm",
    },
  ],
};

export function EducationPage() {
  const { lang, tx } = useT();
  const source = COPY[lang];
  const c = {
    ...source,
    ...Object.fromEntries(
      Object.entries(source)
        .filter(([, value]) => typeof value === "string")
        .map(([key, value]) => [key, tx(value as string)]),
    ),
    items: source.items.map((item) => ({ title: tx(item.title), body: tx(item.body) })),
    practicalBody: source.practicalBody.map(tx),
  } as typeof source;
  const themes = THEMES[lang].map((theme) => ({
    ...theme,
    title: tx(theme.title),
    body: tx(theme.body),
    alt: tx(theme.alt),
  }));
  return (
    <div className="min-h-screen bg-background">
      <NavHeader />
      <PagePhotoBand photo="alpacas-rust" />
      <main className="mx-auto w-full max-w-3xl px-5 py-10">
        <h1 className="font-serif text-4xl text-foreground">{c.title}</h1>
        <p className="mt-3 text-muted-foreground">{c.lede}</p>

        <h2 className="mt-10 font-serif text-2xl text-foreground">{c.offer}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {c.items.map((it) => (
            <article key={it.title} className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-semibold text-foreground">{it.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{it.body}</p>
            </article>
          ))}
        </div>

        <section className="mt-8 rounded-2xl border border-border bg-card p-5">
          <h2 className="font-serif text-2xl text-foreground">{c.practical}</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {c.practicalBody.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="font-serif text-2xl text-foreground">{c.themesTitle}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {themes.map((theme) => (
              <article
                key={theme.title}
                className="rounded-2xl border border-border bg-[color:var(--color-cream)] p-4"
              >
                <Illustration
                  src={theme.src}
                  alt={theme.alt}
                  className="aspect-[4/3] w-full"
                />
                <h3 className="mt-3 font-semibold text-[color:var(--color-on-cream)]">{theme.title}</h3>
                <p className="mt-1 text-sm text-[color:var(--color-on-cream)]/85">{theme.body}</p>
              </article>
            ))}
          </div>
        </section>

        <div className="mt-8">
          <LocalLink
            to={subPathFor("education", lang, "booking")}
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            {c.bookCta}
          </LocalLink>
        </div>
      </main>
    </div>
  );
}

export function EducationBookingPage() {
  const { lang, tx } = useT();
  const source = COPY[lang];
  const c = {
    ...source,
    ...Object.fromEntries(
      Object.entries(source)
        .filter(([, value]) => typeof value === "string")
        .map(([key, value]) => [key, tx(value as string)]),
    ),
  } as typeof source;
  return (
    <div className="min-h-screen bg-background">
      <NavHeader />
      <main className="mx-auto w-full max-w-2xl px-5 py-10">
        <LocalLink
          to={pathFor("education", lang)}
          className="text-sm text-muted-foreground underline"
        >
          ← {c.backCta}
        </LocalLink>
        <h1 className="mt-4 font-serif text-4xl text-foreground">{c.bookTitle}</h1>
        <p className="mt-3 text-muted-foreground">{c.bookLede}</p>
        <div className="mt-8">
          <PageContactForm context="school-visit" title={c.formTitle} intro={c.formIntro} />
        </div>
      </main>
    </div>
  );
}
