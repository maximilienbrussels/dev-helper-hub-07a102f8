/**
 * Gelokaliseerde URL-structuur.
 * Elke pagina heeft per taal een eigen slug: /nl/bezoek, /fr/visite, /en/visit ...
 */

import { CANONICAL_SITE_URL } from "./site-url";

export type Lang = "nl" | "fr" | "en";
export const LANGS: Lang[] = ["nl", "fr", "en"];
export const DEFAULT_LANG: Lang = "nl"; // brontaal van de site en x-default
/**
 * Publiek klantendomein — élke mail en canonical link verwijst hierheen.
 * Instelbaar via VITE_PUBLIC_SITE_URL / PUBLIC_SITE_URL (zie site-url.ts).
 */
export const PUBLIC_SITE_URL = CANONICAL_SITE_URL;
/** Intern beheerdomein (staff/admin only, nooit in publieke mails). */
export const ADMIN_SITE_URL = "https://maximilien.site";
export const SITE_URL = PUBLIC_SITE_URL;

export type PageKey =
  | "home"
  | "visit"
  | "animals"
  | "education"
  | "support"
  | "news"
  | "about"
  | "contact"
  | "privacy"
  | "terms"
  | "pass"
  | "academy"
  | "login"
  | "account"
  | "rental"
  | "camps"
  | "animations"
  | "teambuilding"
  | "seminars"
  | "compost"
  | "shop"
  | "product"
  | "partners"
  | "social"
  | "faq"
  | "transparency"
  | "legal"
  | "resources"
  | "jobs"
  | "volunteers"
  | "events"
  | "press"
  | "cookies"
  | "status"
  | "fairtech"
  | "register";

export const SLUGS: Record<PageKey, Record<Lang, string>> = {
  home: { nl: "", fr: "", en: "" },
  visit: { nl: "bezoek", fr: "visite", en: "visit" },
  animals: { nl: "dieren", fr: "animaux", en: "animals" },
  education: { nl: "educatie", fr: "education", en: "education" },
  support: { nl: "steun-ons", fr: "nous-soutenir", en: "support-us" },
  news: { nl: "nieuws", fr: "actualites", en: "news" },
  about: { nl: "over-ons", fr: "a-propos", en: "about-us" },
  contact: { nl: "contact", fr: "contact", en: "contact" },
  privacy: { nl: "privacy", fr: "politique-de-confidentialite", en: "privacy-policy" },
  terms: {
    nl: "algemene-voorwaarden",
    fr: "conditions-generales",
    en: "terms-and-conditions",
  },
  pass: { nl: "pas", fr: "passe", en: "pass" },
  academy: { nl: "academie", fr: "academie", en: "academy" },
  login: { nl: "inloggen", fr: "connexion", en: "login" },
  account: { nl: "mijn-account", fr: "mon-compte", en: "my-account" },
  rental: { nl: "verhuur", fr: "location", en: "venue-rental" },
  camps: { nl: "vakantiestages", fr: "stages", en: "holiday-camps" },
  animations: { nl: "animaties", fr: "animations", en: "animations" },
  teambuilding: { nl: "teambuilding", fr: "team-building", en: "team-building" },
  seminars: { nl: "seminaries", fr: "seminaires", en: "seminars" },
  compost: { nl: "buurtcompost", fr: "compost-de-quartier", en: "neighbourhood-compost" },
  shop: { nl: "hoevewinkel", fr: "boutique-fermiere", en: "farm-shop" },
  product: { nl: "product", fr: "produit", en: "product" },
  partners: { nl: "partners", fr: "partenaires", en: "partners" },
  social: { nl: "social", fr: "social", en: "social" },
  faq: { nl: "faq", fr: "faq", en: "faq" },
  transparency: { nl: "transparantie", fr: "transparence", en: "transparency" },
  legal: { nl: "wettelijke-vermeldingen", fr: "mentions-legales", en: "legal-notice" },
  resources: { nl: "documenten", fr: "ressources", en: "resources" },
  jobs: { nl: "vacatures", fr: "emploi", en: "jobs" },
  volunteers: { nl: "vrijwilligers", fr: "benevolat", en: "volunteering" },
  events: { nl: "kalender", fr: "agenda", en: "calendar" },
  press: { nl: "pers", fr: "presse", en: "press" },
  cookies: { nl: "cookies", fr: "cookies", en: "cookies" },
  status: { nl: "status", fr: "status", en: "status" },
  fairtech: { nl: "fairtech", fr: "fairtech", en: "fairtech" },
  register: { nl: "registreren", fr: "inscription", en: "register" },
};

/** Gelokaliseerde slug per schoolanimatie (sub-pagina van /animaties). */
export const ANIMATION_SLUGS: Record<string, Record<Lang, string>> = {
  zintuigen: { nl: "zintuigen", fr: "les-cinq-sens", en: "five-senses" },
  boomgaard: { nl: "boomgaard", fr: "le-verger", en: "the-orchard" },
  bijen: { nl: "bijen", fr: "les-abeilles", en: "the-bees" },
  moestuin: { nl: "moestuin", fr: "le-potager", en: "the-kitchen-garden" },
  compost: { nl: "compost", fr: "le-compost", en: "the-compost" },
  boerderijdag: { nl: "boerderijdag", fr: "journee-a-la-ferme", en: "farm-day" },
};

/** Vaste subpagina's met vertaalde slug (bv. educatie/reserveer-schoolbezoek). */
export const SUB_SLUGS: Partial<Record<PageKey, Record<string, Record<Lang, string>>>> = {
  volunteers: {
    "gestion-projet": {
      nl: "projectbeheer-en-animatie",
      fr: "gestion-de-projet-et-animation",
      en: "project-management-and-activities",
    },
    "soin-animalier": {
      nl: "dierenverzorging",
      fr: "soin-animalier",
      en: "animal-care",
    },
  },
  education: {
    booking: {
      nl: "reserveer-schoolbezoek",
      fr: "reserver-visite-scolaire",
      en: "book-school-visit",
    },
  },
  support: {
    sponsor: {
      nl: "adopteer",
      fr: "parrainer",
      en: "sponsor",
    },
  },
  animations: ANIMATION_SLUGS,
};


export function isLang(v: unknown): v is Lang {
  return v === "nl" || v === "fr" || v === "en";
}

/**
 * Kortere/alternatieve slugs die naar de canonieke gelokaliseerde URL
 * doorverwijzen (bv. /nl/webshop → /nl/hoevewinkel, /en/rentals → /en/venue-rental).
 * De canonieke slug in SLUGS blijft leidend voor SEO en hreflang.
 */
export const ALIAS_SLUGS: Record<Lang, Record<string, PageKey>> = {
  nl: { webshop: "shop", winkel: "shop", account: "account", verhuur: "rental", academy: "academy" },
  fr: { boutique: "shop", compte: "account", location: "rental", academie: "academy" },
  en: {
    shop: "shop",
    webshop: "shop",
    account: "account",
    rentals: "rental",
    "about-us": "about",
    academy: "academy",
  },
};

/** Geeft de pagina terug waar een alternatieve slug naar verwijst (of null). */
export function aliasToKey(lang: Lang, slug: string): PageKey | null {
  if (slugToKey(lang, slug)) return null; // canonieke slug: geen doorverwijzing
  return ALIAS_SLUGS[lang][slug] ?? null;
}

export function slugToKey(lang: Lang, slug: string): PageKey | null {
  const entry = (Object.keys(SLUGS) as PageKey[]).find((k) => SLUGS[k][lang] === slug);
  return entry ?? null;
}

/** Zoekt de key ongeacht taal (voor redirects vanaf oude/andere paden). */
export function slugToKeyAnyLang(slug: string): { key: PageKey; lang: Lang } | null {
  for (const key of Object.keys(SLUGS) as PageKey[]) {
    for (const lang of LANGS) {
      if (SLUGS[key][lang] === slug && slug !== "") return { key, lang };
    }
  }
  return null;
}

export function subSlugToId(key: PageKey, lang: Lang, slug: string): string | null {
  const table = SUB_SLUGS[key];
  if (!table) return null;
  const id = Object.keys(table).find((k) => table[k][lang] === slug);
  return id ?? null;
}

export function pathFor(key: PageKey, lang: Lang, sub?: string): string {
  const slug = SLUGS[key][lang];
  const parts = [lang, slug, sub].filter((p): p is string => !!p);
  return "/" + parts.join("/");
}

export function subPathFor(key: PageKey, lang: Lang, subId: string): string {
  const table = SUB_SLUGS[key];
  const sub = table?.[subId]?.[lang] ?? subId;
  return pathFor(key, lang, sub);
}

/** Slugify (accenten weg, spaties → koppelteken). */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Diersoorten vertaald zodat /nl/dieren/geit-barnaby ↔ /fr/animaux/chevre-barnaby werkt. */
export const SPECIES_I18N: Record<string, Record<Lang, string>> = {
  goat: { nl: "geit", fr: "chevre", en: "goat" },
  geit: { nl: "geit", fr: "chevre", en: "goat" },
  chevre: { nl: "geit", fr: "chevre", en: "goat" },
  sheep: { nl: "schaap", fr: "mouton", en: "sheep" },
  schaap: { nl: "schaap", fr: "mouton", en: "sheep" },
  mouton: { nl: "schaap", fr: "mouton", en: "sheep" },
  donkey: { nl: "ezel", fr: "ane", en: "donkey" },
  ezel: { nl: "ezel", fr: "ane", en: "donkey" },
  ane: { nl: "ezel", fr: "ane", en: "donkey" },
  chicken: { nl: "kip", fr: "poule", en: "chicken" },
  kip: { nl: "kip", fr: "poule", en: "chicken" },
  poule: { nl: "kip", fr: "poule", en: "chicken" },
  rabbit: { nl: "konijn", fr: "lapin", en: "rabbit" },
  konijn: { nl: "konijn", fr: "lapin", en: "rabbit" },
  lapin: { nl: "konijn", fr: "lapin", en: "rabbit" },
  pig: { nl: "varken", fr: "cochon", en: "pig" },
  varken: { nl: "varken", fr: "cochon", en: "pig" },
  cochon: { nl: "varken", fr: "cochon", en: "pig" },
  cow: { nl: "koe", fr: "vache", en: "cow" },
  koe: { nl: "koe", fr: "vache", en: "cow" },
  vache: { nl: "koe", fr: "vache", en: "cow" },
  duck: { nl: "eend", fr: "canard", en: "duck" },
  eend: { nl: "eend", fr: "canard", en: "duck" },
  canard: { nl: "eend", fr: "canard", en: "duck" },
};

export function speciesIn(species: string, lang: Lang): string {
  const key = slugify(species);
  return SPECIES_I18N[key]?.[lang] ?? species;
}

export function animalSlug(animal: { name: string; species: string }, lang: Lang): string {
  return `${slugify(speciesIn(animal.species, lang))}-${slugify(animal.name)}`;
}

/** Alternatieve taalversies van dezelfde pagina, voor hreflang en taalschakelaar. */
export function alternates(
  key: PageKey,
  opts: { subId?: string; animal?: { name: string; species: string }; newsId?: string } = {},
): Record<Lang, string> {
  const out = {} as Record<Lang, string>;
  for (const lang of LANGS) {
    if (opts.animal) out[lang] = pathFor(key, lang, animalSlug(opts.animal, lang));
    else if (opts.newsId) out[lang] = pathFor(key, lang, newsSlug(opts.newsId, lang));
    else if (opts.subId) out[lang] = subPathFor(key, lang, opts.subId);
    else out[lang] = pathFor(key, lang);
  }
  return out;
}

export function hreflangLinks(
  key: PageKey,
  opts: Parameters<typeof alternates>[1] = {},
): { rel: string; hrefLang?: string; href: string }[] {
  const alts = alternates(key, opts);
  return [
    ...LANGS.map((l) => ({ rel: "alternate", hrefLang: l, href: `${SITE_URL}${alts[l]}` })),
    { rel: "alternate", hrefLang: "x-default", href: `${SITE_URL}${alts[DEFAULT_LANG]}` },
  ];
}

/* ---------- Nieuws (statische agenda-items met vertaalde slug) ---------- */

export type NewsItem = {
  id: string;
  date: string;
  slug: Record<Lang, string>;
  title: Record<Lang, string>;
  lede: Record<Lang, string>;
  body: Record<Lang, string[]>;
};

export const NEWS: NewsItem[] = [
  {
    id: "lentefeest-2026",
    date: "2026-04-18",
    slug: {
      nl: "lentefeest-2026",
      fr: "fete-du-printemps-2026",
      en: "spring-festival-2026",
    },
    title: {
      nl: "Lentefeest 2026",
      fr: "Fête du printemps 2026",
      en: "Spring Festival 2026",
    },
    lede: {
      nl: "Een dag vol jonge dieren, moestuinworkshops en muziek in het Maximiliaanpark.",
      fr: "Une journée de jeunes animaux, d'ateliers potagers et de musique au parc Maximilien.",
      en: "A day of baby animals, kitchen-garden workshops and music in Maximilien Park.",
    },
    body: {
      nl: [
        "Op zaterdag 18 april vieren we de lente op de boerderij. De stallen zijn open, de jonge dieren maken hun eerste rondjes en de moestuin gaat de grond in.",
        "Doorlopend: rondleidingen, workshops zaaien, verpakkingsvrije markt en koffie met taart ten voordele van de dieren.",
      ],
      fr: [
        "Le samedi 18 avril, nous fêtons le printemps à la ferme. Les étables sont ouvertes, les jeunes animaux font leurs premiers pas et le potager est mis en terre.",
        "En continu : visites guidées, ateliers semis, marché zéro déchet et café-gâteau au profit des animaux.",
      ],
      en: [
        "On Saturday 18 April we celebrate spring at the farm. The stables are open, the young animals take their first steps and the kitchen garden goes into the ground.",
        "All day: guided tours, sowing workshops, a packaging-free market and coffee and cake in support of the animals.",
      ],
    },
  },
  {
    id: "zomerstages",
    date: "2026-07-06",
    slug: {
      nl: "zomerstages-2026",
      fr: "stages-dete-2026",
      en: "summer-camps-2026",
    },
    title: {
      nl: "Zomerstages 2026",
      fr: "Stages d'été 2026",
      en: "Summer camps 2026",
    },
    lede: {
      nl: "Vijf weken boerderijstage voor kinderen van 6 tot 12 jaar.",
      fr: "Cinq semaines de stages à la ferme pour les enfants de 6 à 12 ans.",
      en: "Five weeks of farm camps for children aged 6 to 12.",
    },
    body: {
      nl: [
        "Dieren verzorgen, oogsten, koken op het vuur en bouwen met natuurlijke materialen. Elke week een ander thema.",
        "Inschrijven kan vanaf maart via het contactformulier. Sociaal tarief mogelijk.",
      ],
      fr: [
        "Soigner les animaux, récolter, cuisiner au feu de bois et construire avec des matériaux naturels. Un thème différent chaque semaine.",
        "Inscriptions dès mars via le formulaire de contact. Tarif social possible.",
      ],
      en: [
        "Caring for animals, harvesting, cooking over fire and building with natural materials. A different theme every week.",
        "Registration opens in March via the contact form. Reduced rates available.",
      ],
    },
  },
  {
    id: "nieuwe-stallen",
    date: "2026-02-02",
    slug: {
      nl: "nieuwe-stallen",
      fr: "nouvelles-etables",
      en: "new-stables",
    },
    title: {
      nl: "De nieuwe stallen zijn klaar",
      fr: "Les nouvelles étables sont prêtes",
      en: "The new stables are ready",
    },
    lede: {
      nl: "Dankzij jullie steun hebben de geiten en schapen een droge, ruime winterstal.",
      fr: "Grâce à votre soutien, les chèvres et les moutons ont une étable d'hiver sèche et spacieuse.",
      en: "Thanks to your support, the goats and sheep have a dry, spacious winter stable.",
    },
    body: {
      nl: [
        "Na een jaar bouwen zijn de nieuwe stallen in gebruik: meer licht, betere ventilatie en een aparte ruimte voor jonge dieren.",
        "Bedankt aan iedereen die doneerde, meebouwde of materiaal schonk.",
      ],
      fr: [
        "Après un an de travaux, les nouvelles étables sont en service : plus de lumière, une meilleure ventilation et un espace séparé pour les jeunes animaux.",
        "Merci à toutes celles et ceux qui ont donné, construit ou fourni du matériel.",
      ],
      en: [
        "After a year of works the new stables are in use: more light, better ventilation and a separate space for young animals.",
        "Thank you to everyone who donated, helped build or supplied materials.",
      ],
    },
  },
];

export function newsSlug(id: string, lang: Lang): string {
  return NEWS.find((n) => n.id === id)?.slug[lang] ?? id;
}

export function newsBySlug(lang: Lang, slug: string): NewsItem | null {
  return NEWS.find((n) => n.slug[lang] === slug) ?? null;
}

/* ---------- SEO-teksten per pagina en taal ---------- */

type Meta = { title: string; description: string };

export const PAGE_META: Record<PageKey, Record<Lang, Meta>> = {
  fairtech: {
    nl: {
      title: "Fair & Open Tech @ Maximilien — eerlijke technologie in Brussel",
      description:
        "Ontdek Fairphone en /e/OS op de stadsboerderij: herstelbare hardware, privacyvriendelijke software en een demostand aan de Schipperijkaai 2 in Brussel.",
    },
    fr: {
      title: "Fair & Open Tech @ Maximilien — technologie équitable à Bruxelles",
      description:
        "Découvrez Fairphone et /e/OS à la ferme urbaine : matériel réparable, logiciels respectueux de la vie privée et un stand de démonstration au Quai des Péniches 2 à Bruxelles.",
    },
    en: {
      title: "Fair & Open Tech @ Maximilien — fair technology in Brussels",
      description:
        "Discover Fairphone and /e/OS at the urban farm: repairable hardware, privacy-first software and a demo station at Quai des Péniches 2, Brussels.",
    },
  },
  faq: {
    nl: {
      title: "Veelgestelde vragen — Maximilien",
      description:
        "Antwoorden over bezoeken, schoolanimaties, verjaardagen, stages, teambuilding, reserveren en betalen op de stadsboerderij.",
    },
    fr: {
      title: "Questions fréquentes — Maximilien",
      description:
        "Réponses sur les visites, animations scolaires, anniversaires, stages, teambuilding, réservations et paiements à la ferme urbaine.",
    },
    en: {
      title: "Frequently asked questions — Maximilien",
      description:
        "Answers about visits, school workshops, birthdays, camps, team building, bookings and payments at the urban farm.",
    },
  },
  transparency: {
    nl: {
      title: "Transparantie — Maximilien",
      description:
        "Subsidies, overheidsopdrachten, verloning, transparantierapport en jaarverslag van de vzw Maximilien.",
    },
    fr: {
      title: "Transparence — Maximilien",
      description:
        "Subventions, marchés publics, rémunérations, rapport transparence et rapport annuel de l'ASBL Maximilien.",
    },
    en: {
      title: "Transparency — Maximilien",
      description:
        "Subsidies, public contracts, pay, transparency report and annual report of the non-profit Maximilien.",
    },
  },
  legal: {
    nl: {
      title: "Wettelijke vermeldingen — Maximilien",
      description:
        "Uitgever, hosting, aansprakelijkheid, intellectuele eigendom en gebruiksvoorwaarden van de website van de stadsboerderij.",
    },
    fr: {
      title: "Mentions légales — Maximilien",
      description:
        "Éditeur, hébergement, responsabilité, propriété intellectuelle et conditions d'utilisation du site de la ferme urbaine.",
    },
    en: {
      title: "Legal notice — Maximilien",
      description:
        "Publisher, hosting, liability, intellectual property and terms of use of the urban farm's website.",
    },
  },
  resources: {
    nl: {
      title: "Documenten & downloads — Maximilien",
      description:
        "Pedagogische fiches, moestuin- en compostgidsen, dierenfiches en de rapporten van de vzw om te downloaden.",
    },
    fr: {
      title: "Ressources et téléchargements — Maximilien",
      description:
        "Fiches pédagogiques, guides potager et compost, fiches animaux et rapports de l'ASBL à télécharger.",
    },
    en: {
      title: "Resources and downloads — Maximilien",
      description:
        "Educational sheets, garden and compost guides, animal profiles and the non-profit's reports to download.",
    },
  },
  jobs: {
    nl: {
      title: "Jobs & stages — Maximilien",
      description:
        "Openstaande vacatures, studentenstages in dierenverzorging, moestuin, imkerij en animatie, en spontaan solliciteren.",
    },
    fr: {
      title: "Emploi et stages — Maximilien",
      description:
        "Offres d'emploi ouvertes, stages étudiants en soin animalier, maraîchage, apiculture et animation, et candidature spontanée.",
    },
    en: {
      title: "Jobs and internships — Maximilien",
      description:
        "Open positions, student internships in animal care, gardening, beekeeping and activities, plus spontaneous applications.",
    },
  },
  volunteers: {
    nl: {
      title: "Vrijwilliger worden — Maximilien",
      description:
        "Word vrijwilliger op de stadsboerderij: projectbeheer en animatie of dierenverzorging. Engagement, taken en inschrijving.",
    },
    fr: {
      title: "Devenir bénévole — Maximilien",
      description:
        "Devenez bénévole à la ferme urbaine : gestion de projet et animation ou soin animalier. Engagement, missions et inscription.",
    },
    en: {
      title: "Become a volunteer — Maximilien",
      description:
        "Volunteer at the urban farm: project management and activities, or animal care. Commitment, tasks and how to join.",
    },
  },
  events: {
    nl: {
      title: "Kalender & evenementen — Maximilien",
      description:
        "Alle data van de stadsboerderij: vakantiestages, feesten, markten, workshops en buurtevenementen op één kalender.",
    },
    fr: {
      title: "Agenda et événements — Maximilien",
      description:
        "Toutes les dates de la ferme urbaine : stages de vacances, fêtes, marchés, ateliers et événements de quartier.",
    },
    en: {
      title: "Calendar and events — Maximilien",
      description:
        "All the urban farm's dates: holiday camps, festivals, markets, workshops and neighbourhood events in one calendar.",
    },
  },
  home: {
    nl: {
      title: "Maximilien — Stadsboerderij Brussel",
      description:
        "Stadsboerderij aan het Maximiliaanpark: dieren ontmoeten, educatie, verpakkingsvrij winkelen en activiteiten in hartje Brussel.",
    },
    fr: {
      title: "Maximilien — Ferme urbaine à Bruxelles",
      description:
        "Ferme urbaine au parc Maximilien : rencontrer les animaux, éducation, épicerie zéro déchet et activités au cœur de Bruxelles.",
    },
    en: {
      title: "Maximilien — Urban farm in Brussels",
      description:
        "Urban farm at Maximilien Park: meet the animals, education, packaging-free shop and activities in the heart of Brussels.",
    },
  },
  visit: {
    nl: {
      title: "Bezoek & info — Maximilien",
      description:
        "Openingsuren, toegang, prijzen en bereikbaarheid met MIVB. Alles wat je moet weten voor je bezoek aan de stadsboerderij.",
    },
    fr: {
      title: "Visite & infos — Maximilien",
      description:
        "Horaires, accès, tarifs et transports STIB. Tout ce qu'il faut savoir avant votre visite à la ferme urbaine.",
    },
    en: {
      title: "Visit & info — Maximilien",
      description:
        "Opening hours, access, prices and public transport. Everything you need to know before visiting the urban farm.",
    },
  },
  animals: {
    nl: {
      title: "Onze dieren — Maximilien",
      description:
        "Maak kennis met de geiten, schapen, ezels, kippen en konijnen van de stadsboerderij.",
    },
    fr: {
      title: "Nos animaux — Maximilien",
      description:
        "Faites connaissance avec les chèvres, moutons, ânes, poules et lapins de la ferme urbaine.",
    },
    en: {
      title: "Our animals — Maximilien",
      description: "Meet the goats, sheep, donkeys, chickens and rabbits of the urban farm.",
    },
  },
  education: {
    nl: {
      title: "Educatie & scholen — Maximilien",
      description:
        "Schoolbezoeken, animaties en workshops rond dieren, moestuin en biodiversiteit. Reserveer je schoolbezoek.",
    },
    fr: {
      title: "Éducation & écoles — Maximilien",
      description:
        "Visites scolaires, animations et ateliers autour des animaux, du potager et de la biodiversité.",
    },
    en: {
      title: "Education & schools — Maximilien",
      description:
        "School visits, activities and workshops about animals, the kitchen garden and biodiversity.",
    },
  },
  support: {
    nl: {
      title: "Steun ons — Maximilien",
      description:
        "Steun de stadsboerderij met een gift, via Wero of overschrijving. Concrete doelen: voer, ateliers, stallen.",
    },
    fr: {
      title: "Nous soutenir — Maximilien",
      description:
        "Soutenez la ferme urbaine par un don, via Wero ou virement. Objectifs concrets : nourriture, ateliers, étables.",
    },
    en: {
      title: "Support us — Maximilien",
      description:
        "Support the urban farm with a donation, via Wero or bank transfer. Concrete goals: feed, workshops, stables.",
    },
  },
  news: {
    nl: {
      title: "Nieuws & agenda — Maximilien",
      description:
        "Activiteiten, evenementen en nieuws van de stadsboerderij aan het Maximiliaanpark.",
    },
    fr: {
      title: "Actualités & agenda — Maximilien",
      description: "Activités, événements et actualités de la ferme urbaine du parc Maximilien.",
    },
    en: {
      title: "News & events — Maximilien",
      description: "Activities, events and news from the urban farm at Maximilien Park.",
    },
  },
  about: {
    nl: {
      title: "Over het park — Maximilien",
      description: "Missie, geschiedenis, team en bestuur van de stadsboerderij in Brussel.",
    },
    fr: {
      title: "À propos — Maximilien",
      description:
        "Mission, histoire, équipe et conseil d'administration de la ferme urbaine à Bruxelles.",
    },
    en: {
      title: "About us — Maximilien",
      description: "Mission, history, team and board of the urban farm in Brussels.",
    },
  },
  contact: {
    nl: {
      title: "Contact — Maximilien",
      description:
        "Neem contact op: e-mail, telefoon, WhatsApp of kom langs aan het Maximiliaanpark.",
    },
    fr: {
      title: "Contact — Maximilien",
      description: "Contactez-nous : e-mail, téléphone, WhatsApp ou passez au parc Maximilien.",
    },
    en: {
      title: "Contact — Maximilien",
      description: "Get in touch: email, phone, WhatsApp or drop by at Maximilien Park.",
    },
  },
  privacy: {
    nl: {
      title: "Privacybeleid — Maximilien",
      description:
        "Hoe we met je gegevens omgaan: geen trackingpixels, geen reclame, enkel wat nodig is.",
    },
    fr: {
      title: "Politique de confidentialité — Maximilien",
      description:
        "Comment nous traitons vos données : pas de pixels de suivi, pas de publicité, uniquement le nécessaire.",
    },
    en: {
      title: "Privacy policy — Maximilien",
      description:
        "How we handle your data: no tracking pixels, no advertising, only what is necessary.",
    },
  },
  terms: {
    nl: {
      title: "Algemene voorwaarden — Maximilien",
      description:
        "Afspraken over reservaties, zaalverhuur, schoolanimaties, workshops, bestellingen en annulering bij de stadsboerderij.",
    },
    fr: {
      title: "Conditions générales — Maximilien",
      description:
        "Règles pour les réservations, la location de salle, les animations scolaires, les ateliers, les commandes et les annulations.",
    },
    en: {
      title: "Terms and conditions — Maximilien",
      description:
        "Rules for bookings, venue rental, school activities, workshops, farm shop orders and cancellations.",
    },
  },
  academy: {
    nl: {
      title: "Academies — Maximilien",
      description: "Kies je Academy, leer alles over het dier en behaal je certificaat.",
    },
    fr: {
      title: "Académies — Maximilien",
      description:
        "Choisissez votre académie, apprenez tout sur l'animal et obtenez votre certificat.",
    },
    en: {
      title: "Academies — Maximilien",
      description: "Pick your academy, learn all about the animal and earn your certificate.",
    },
  },
  pass: {
    nl: {
      title: "Digitale pas — Maximilien",
      description: "Je digitale boerderijpas met hoefjes, badges en certificaten.",
    },
    fr: {
      title: "Passe numérique — Maximilien",
      description: "Votre passe numérique avec sabots, badges et certificats.",
    },
    en: {
      title: "Digital pass — Maximilien",
      description: "Your digital farm pass with hooves, badges and certificates.",
    },
  },
  login: {
    nl: {
      title: "Inloggen — Maximilien",
      description: "Log in op je boerderijaccount.",
    },
    fr: {
      title: "Connexion — Maximilien",
      description: "Connectez-vous à votre compte.",
    },
    en: {
      title: "Log in — Maximilien",
      description: "Log in to your farm account.",
    },
  },
  account: {
    nl: {
      title: "Mijn account — Maximilien",
      description: "Je donaties, bestellingen, reservaties en instellingen.",
    },
    fr: {
      title: "Mon compte — Maximilien",
      description: "Vos dons, commandes, réservations et paramètres.",
    },
    en: {
      title: "My account — Maximilien",
      description: "Your donations, orders, bookings and settings.",
    },
  },
  rental: {
    nl: {
      title: "Zalen & ruimtes huren — Maximilien",
      description:
        "Huur een zaal, het chalet of de boerderijtuin in het hart van Brussel voor je vergadering, feest of workshop.",
    },
    fr: {
      title: "Location de salles & espaces — Maximilien",
      description:
        "Louez une salle, le chalet ou le jardin de la ferme au cœur de Bruxelles pour votre réunion, fête ou atelier.",
    },
    en: {
      title: "Venue & room rental — Maximilien",
      description:
        "Rent a hall, the chalet or the farm garden in the heart of Brussels for your meeting, party or workshop.",
    },
  },
  camps: {
    nl: {
      title: "Vakantiestages 6-10 jaar — Maximilien",
      description:
        "Een week vol dierenverzorging, tuinieren en buitenpret voor kinderen van 6 tot 10 jaar, midden in Brussel.",
    },
    fr: {
      title: "Stages de vacances 6-10 ans — Maximilien",
      description:
        "Une semaine de soin des animaux, de jardinage et de grand air pour les enfants de 6 à 10 ans, en pleine ville.",
    },
    en: {
      title: "Holiday camps ages 6-10 — Maximilien",
      description:
        "A week of animal care, gardening and outdoor fun for children aged 6 to 10, right in the middle of Brussels.",
    },
  },
  animations: {
    nl: {
      title: "Schoolanimaties op de boerderij — Maximilien",
      description:
        "Zes animaties rond zintuigen, boomgaard, bijen, moestuin, compost en de boerderijdag. Met animator en materiaal.",
    },
    fr: {
      title: "Animations scolaires à la ferme — Maximilien",
      description:
        "Six animations autour des sens, du verger, des abeilles, du potager, du compost et de la journée à la ferme.",
    },
    en: {
      title: "School activities at the farm — Maximilien",
      description:
        "Six activities on the senses, the orchard, bees, the kitchen garden, compost and a full farm day.",
    },
  },
  teambuilding: {
    nl: {
      title: "Teambuilding op de boerderij — Maximilien",
      description:
        "Teambuilding in het Maximiliaanpark of op het platteland in Sterrebeek: samenwerken rond dieren, tuin en vuur.",
    },
    fr: {
      title: "Team building à la ferme — Maximilien",
      description:
        "Team building au parc Maximilien ou à la campagne à Sterrebeek : coopérer autour des animaux, du jardin et du feu.",
    },
    en: {
      title: "Team building at the farm — Maximilien",
      description:
        "Team building at Maximilien Park or in the countryside in Sterrebeek: cooperate around animals, garden and fire.",
    },
  },
  seminars: {
    nl: {
      title: "Vergaderingen & seminaries — Maximilien",
      description:
        "Vergader, seminarieer of geef een workshopdag in een groene setting op wandelafstand van Brussel-Noord.",
    },
    fr: {
      title: "Réunions & séminaires — Maximilien",
      description:
        "Réunion, séminaire ou journée d'atelier dans un cadre vert, à deux pas de Bruxelles-Nord.",
    },
    en: {
      title: "Meetings & seminars — Maximilien",
      description:
        "Hold a meeting, seminar or workshop day in a green setting a short walk from Brussels-North.",
    },
  },
  compost: {
    nl: {
      title: "Buurtcompost — Maximilien",
      description:
        "Breng je groenafval naar de buurtcompost aan het Maximiliaanpark. Openingsmomenten, wat mag en wat niet.",
    },
    fr: {
      title: "Compost de quartier — Maximilien",
      description:
        "Apportez vos déchets verts au compost de quartier du parc Maximilien. Horaires, ce qui est accepté ou non.",
    },
    en: {
      title: "Neighbourhood compost — Maximilien",
      description:
        "Bring your green waste to the neighbourhood compost at Maximilien Park. Opening times and what is accepted.",
    },
  },
  shop: {
    nl: {
      title: "Hoevewinkel — Maximilien",
      description:
        "Verpakkingsvrije, lokale hoeveproducten. Reserveer online en haal op aan de stadsboerderij in Brussel.",
    },
    fr: {
      title: "Boutique fermière — Maximilien",
      description:
        "Produits fermiers locaux et sans emballage. Réservez en ligne et retirez à la ferme urbaine à Bruxelles.",
    },
    en: {
      title: "Farm shop — Maximilien",
      description:
        "Packaging-free local farm products. Order online and collect at the urban farm in Brussels.",
    },
  },
  product: {
    nl: {
      title: "Product — Hoevewinkel Maximilien",
      description: "Verpakkingsvrij afhalen aan de stadsboerderij in Brussel.",
    },
    fr: {
      title: "Produit — Boutique fermière Maximilien",
      description: "À retirer sans emballage à la ferme urbaine à Bruxelles.",
    },
    en: {
      title: "Product — Farm shop Maximilien",
      description: "Packaging-free collection at the urban farm in Brussels.",
    },
  },
  partners: {
    nl: {
      title: "Onze partners & netwerken — Maximilien",
      description:
        "Overheden, sectorfederaties en digitale partners die de stadsboerderij in Brussel mogelijk maken.",
    },
    fr: {
      title: "Nos partenaires & réseaux — Maximilien",
      description:
        "Pouvoirs publics, fédérations et partenaires numériques qui rendent la ferme urbaine possible.",
    },
    en: {
      title: "Our partners & networks — Maximilien",
      description:
        "Public authorities, federations and digital partners supporting the urban farm in Brussels.",
    },
  },
  social: {
    nl: {
      title: "Social Hub — Live van de stadsboerderij",
      description:
        "Alle updates, foto's en video's van Maximilien op één plek: Instagram, Facebook en TikTok.",
    },
    fr: {
      title: "Social Hub — En direct de la ferme urbaine",
      description:
        "Toutes les publications, photos et vidéos de Maximilien : Instagram, Facebook et TikTok.",
    },
    en: {
      title: "Social Hub — Live from the urban farm",
      description:
        "All updates, photos and videos from Maximilien: Instagram, Facebook and TikTok.",
    },
  },
  press: {
    nl: {
      title: "Pers & mediakit — Maximilien",
      description:
        "Logo's in verschillende formaten, merkkleuren, persfoto's, kerncijfers en perscontact van de stadsboerderij in hartje Brussel.",
    },
    fr: {
      title: "Presse & kit média — Maximilien",
      description:
        "Logos en plusieurs formats, couleurs de marque, photos de presse, chiffres clés et contact presse de la ferme urbaine de Bruxelles.",
    },
    en: {
      title: "Press & media kit — Maximilien",
      description:
        "Logos in several formats, brand colours, press photos, key figures and press contact for the Brussels city farm.",
    },
  },
  cookies: {
    nl: {
      title: "Cookie-statement — Maximilien",
      description:
        "Geen trackers, geen advertentiecookies en dus geen cookiebanner. Enkel strikt functionele cookies.",
    },
    fr: {
      title: "Déclaration cookies — Maximilien",
      description:
        "Pas de traceurs, pas de cookies publicitaires et donc aucune bannière cookies. Uniquement des cookies strictement fonctionnels.",
    },
    en: {
      title: "Cookie statement — Maximilien",
      description:
        "No trackers, no advertising cookies and therefore no cookie banner. Strictly functional cookies only.",
    },
  },
  status: {
    nl: {
      title: "Status & infrastructuur — Maximilien",
      description:
        "Onze domeinen, de geïsoleerde mailgate send.maximilien.site en de Europese infrastructuur achter dit platform.",
    },
    fr: {
      title: "Statut & infrastructure — Maximilien",
      description:
        "Nos domaines, la passerelle mail isolée send.maximilien.site et l'infrastructure européenne du platform.",
    },
    en: {
      title: "Status & infrastructure — Maximilien",
      description:
        "Our domains, the isolated mail gateway send.maximilien.site and the European infrastructure behind this platform.",
    },
  },
  register: {
    nl: {
      title: "Account aanmaken — Maximilien",
      description: "Maak een account om hoefjes te sparen, badges te verzamelen en te bestellen.",
    },
    fr: {
      title: "Créer un compte — Maximilien",
      description:
        "Créez un compte pour collecter des sabots, gagner des badges et commander en ligne.",
    },
    en: {
      title: "Create an account — Maximilien",
      description: "Create an account to collect hooves, earn badges and order online.",
    },
  },
};

/* ---------- Open Graph share-afbeeldingen per pagina ---------- */

/** Branded social share cards (1200x630) per pagina; fallback = /og/default.png. */
export const OG_IMAGES: Partial<Record<PageKey, string>> = {
  support: "/og/donaties.png",
  animals: "/og/og-bezoek.jpg",
  rental: "/og/zaalverhuur.png",
  seminars: "/og/zaalverhuur.png",
  teambuilding: "/og/zaalverhuur.png",
  camps: "/og/og-programmas.jpg",
  animations: "/og/stages.png",
  education: "/og/stages.png",
  compost: "/og/buurtcompost.png",
  events: "/og/kalender.png",
  news: "/og/kalender.png",
  press: "/og/pers.png",
  home: "/og/og-home.jpg",
  visit: "/og/og-bezoek.jpg",
  academy: "/og/og-academy.jpg",
  shop: "/og/og-winkel.jpg",
  product: "/og/og-winkel.jpg",
};

export const OG_IMAGE_FALLBACK = "/og/default.png";

/** Absolute URL van de share-afbeelding voor een pagina (met fallback). */
export function ogImageFor(key: PageKey, override?: string): string {
  const path = override ?? OG_IMAGES[key] ?? OG_IMAGE_FALLBACK;
  return path.startsWith("http") ? path : `${SITE_URL}${path}`;
}

/** Bouwt de volledige head-meta voor een gelokaliseerde pagina. */
export function localizedHead(
  key: PageKey,
  lang: Lang,
  opts: {
    title?: string;
    description?: string;
    subId?: string;
    animal?: { name: string; species: string };
    newsId?: string;
    type?: string;
    image?: string;
    /** Schema.org-documenten die als JSON-LD in de <head> komen. */
    jsonLd?: unknown[];
  } = {},
) {
  const base = PAGE_META[key][lang];
  const title = opts.title ?? base.title;
  const description = opts.description ?? base.description;
  const alts = alternates(key, opts);
  const self = `${SITE_URL}${alts[lang]}`;
  const image = ogImageFor(key, opts.image);
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: self },
      { property: "og:type", content: opts.type ?? "website" },
      { property: "og:image", content: image },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: title },
      {
        property: "og:locale",
        content: lang === "fr" ? "fr_BE" : lang === "en" ? "en_GB" : "nl_BE",
      },
      { httpEquiv: "content-language", content: lang },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: image },
    ],
    links: [{ rel: "canonical", href: self }, ...hreflangLinks(key, opts)],
    ...(opts.jsonLd?.length
      ? {
          scripts: opts.jsonLd.map((doc) => ({
            type: "application/ld+json",
            children: JSON.stringify(doc),
          })),
        }
      : {}),
  };
}


/** Taaldetectie op basis van Accept-Language / navigator.language. */
export function pickLang(input: string | null | undefined): Lang {
  const raw = (input ?? "").toLowerCase();
  const first = raw.split(",")[0]?.slice(0, 2);
  if (first === "nl" || first === "fr" || first === "en") return first;
  if (raw.includes("nl")) return "nl";
  if (raw.includes("fr")) return "fr";
  if (raw.includes("en")) return "en";
  return DEFAULT_LANG;
}

/** Vertaalt een bestaand gelokaliseerd pad naar een andere taal. */
export function translatePath(pathname: string, to: Lang): string {
  const parts = pathname.split("/").filter(Boolean);
  const from = parts[0];
  if (!isLang(from)) return `/${to}`;
  const slug = parts[1];
  if (!slug) return `/${to}`;
  const key = slugToKey(from, slug) ?? aliasToKey(from, slug);
  if (!key) return `/${to}`;
  const sub = parts[2];
  if (!sub) return pathFor(key, to);

  if (key === "education") {
    const id = subSlugToId("education", from, sub);
    if (id) return subPathFor("education", to, id);
  }
  if (key === "volunteers") {
    const id = subSlugToId("volunteers", from, sub);
    if (id) return subPathFor("volunteers", to, id);
  }
  if (key === "animations") {
    const id = subSlugToId("animations", from, sub);
    if (id) return subPathFor("animations", to, id);
  }
  if (key === "news") {
    const item = newsBySlug(from, sub);
    if (item) return pathFor("news", to, item.slug[to]);
  }
  if (key === "animals") {
    const idx = sub.indexOf("-");
    if (idx > 0) {
      const species = sub.slice(0, idx);
      const rest = sub.slice(idx + 1);
      return pathFor("animals", to, `${slugify(speciesIn(species, to))}-${rest}`);
    }
  }
  return pathFor(key, to, sub);
}
