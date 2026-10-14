/**
 * Ressources / downloads — pedagogische fiches en documenten.
 * De PDF's staan voorlopig nog op de oude site; vervang de URL's na de migratie.
 */

import type { Lang } from "@/lib/i18n";
import type { PageKey } from "@/lib/routes-i18n";
import { OLD_SITE } from "@/lib/transparency-content";

export type ResourceCategory = "pedagogie" | "moestuin" | "dieren" | "vzw";

export type Resource = {
  id: string;
  category: ResourceCategory;
  title: Record<Lang, string>;
  description: Record<Lang, string>;
  /** Interne pagina (gelokaliseerd) of externe URL. */
  page?: PageKey;
  href?: string;
  external?: boolean;
};

export const RESOURCES_COPY: Record<
  Lang,
  {
    eyebrow: string;
    title: string;
    lede: string;
    open: string;
    categories: Record<ResourceCategory, string>;
    formTitle: string;
    formIntro: string;
    note: string;
  }
> = {
  nl: {
    eyebrow: "Informatie",
    title: "Ressources & downloads",
    lede: "Pedagogische fiches, praktische documenten en verslagen om mee aan de slag te gaan, thuis of in de klas.",
    open: "Openen",
    categories: {
      pedagogie: "Pedagogisch materiaal",
      moestuin: "Moestuin & compost",
      dieren: "Dieren",
      vzw: "Over de vzw",
    },
    formTitle: "Een document nodig dat er niet bij staat?",
    formIntro: "Vraag het ons — we bezorgen je het juiste document.",
    note: "Sommige documenten worden nog gemigreerd en openen voorlopig op onze vorige website.",
  },
  fr: {
    eyebrow: "Informations",
    title: "Ressources et téléchargements",
    lede: "Fiches pédagogiques, documents pratiques et rapports à utiliser à la maison ou en classe.",
    open: "Ouvrir",
    categories: {
      pedagogie: "Matériel pédagogique",
      moestuin: "Potager et compost",
      dieren: "Animaux",
      vzw: "À propos de l'ASBL",
    },
    formTitle: "Un document manque à l'appel ?",
    formIntro: "Demandez-le nous — nous vous envoyons le bon document.",
    note: "Certains documents sont encore en cours de migration et s'ouvrent pour l'instant sur notre ancien site.",
  },
  en: {
    eyebrow: "Information",
    title: "Resources and downloads",
    lede: "Educational sheets, practical documents and reports to use at home or in the classroom.",
    open: "Open",
    categories: {
      pedagogie: "Educational material",
      moestuin: "Vegetable garden & compost",
      dieren: "Animals",
      vzw: "About the non-profit",
    },
    formTitle: "Missing a document?",
    formIntro: "Ask us — we will send you the right document.",
    note: "Some documents are still being migrated and currently open on our previous website.",
  },
};

export const RESOURCES: Resource[] = [
  {
    id: "animations-scolaires",
    category: "pedagogie",
    title: {
      nl: "Catalogus schoolanimaties",
      fr: "Catalogue des animations scolaires",
      en: "School workshop catalogue",
    },
    description: {
      nl: "Alle animaties per leeftijd, met duur, prijs en leerdoelen.",
      fr: "Toutes les animations par âge, avec durée, tarif et objectifs pédagogiques.",
      en: "All workshops by age, with duration, price and learning goals.",
    },
    page: "animations",
  },
  {
    id: "voorbereiding-bezoek",
    category: "pedagogie",
    title: {
      nl: "Je bezoek voorbereiden",
      fr: "Préparer votre visite",
      en: "Preparing your visit",
    },
    description: {
      nl: "Praktische info, gedragsregels bij de dieren en wat je meebrengt.",
      fr: "Infos pratiques, règles de comportement avec les animaux et ce qu'il faut emporter.",
      en: "Practical info, how to behave around the animals and what to bring.",
    },
    page: "visit",
  },
  {
    id: "compost-gids",
    category: "moestuin",
    title: {
      nl: "Composteren in de stad",
      fr: "Composter en ville",
      en: "Composting in the city",
    },
    description: {
      nl: "Wat mag er wel en niet in de compost, en hoe je een wijkcompost start.",
      fr: "Ce qui va (ou non) au compost, et comment lancer un compost de quartier.",
      en: "What goes in the compost (and what doesn't), and how to start a neighbourhood compost.",
    },
    page: "compost",
  },
  {
    id: "moestuin-kalender",
    category: "moestuin",
    title: {
      nl: "Moestuinkalender",
      fr: "Calendrier du potager",
      en: "Vegetable garden calendar",
    },
    description: {
      nl: "Maand per maand: zaaien, planten en oogsten in Brussel.",
      fr: "Mois par mois : semis, plantations et récoltes à Bruxelles.",
      en: "Month by month: sowing, planting and harvesting in Brussels.",
    },
    page: "education",
  },
  {
    id: "dierenfiches",
    category: "dieren",
    title: { nl: "Fiches van onze dieren", fr: "Fiches de nos animaux", en: "Our animal profiles" },
    description: {
      nl: "Wie woont er op de boerderij? Soort, karakter en verzorging.",
      fr: "Qui vit à la ferme ? Espèce, caractère et soins.",
      en: "Who lives at the farm? Species, character and care.",
    },
    page: "animals",
  },
  {
    id: "rapport-transparence",
    category: "vzw",
    title: {
      nl: "Transparantierapport 2025",
      fr: "Rapport transparence 2025",
      en: "Transparency report 2025",
    },
    description: {
      nl: "Verloning, aanwezigheden, overheidsopdrachten en subsidies.",
      fr: "Rémunérations, présences, marchés publics et subsides.",
      en: "Pay, attendance, public contracts and subsidies.",
    },
    href: `${OLD_SITE}/web/content/8196?download=true`,
    external: true,
  },
  {
    id: "rapport-annuel",
    category: "vzw",
    title: {
      nl: "Activiteitenverslag 2025",
      fr: "Rapport annuel d'activité 2025",
      en: "Annual activity report 2025",
    },
    description: {
      nl: "Onze opdrachten, het team, de projecten en de evenementen van het jaar.",
      fr: "Nos missions, l'équipe, les projets et les événements de l'année.",
      en: "Our missions, the team, the projects and the events of the year.",
    },
    href: `${OLD_SITE}/web/content/8195?download=true`,
    external: true,
  },
  {
    id: "privacy",
    category: "vzw",
    title: { nl: "Privacybeleid", fr: "Politique de confidentialité", en: "Privacy policy" },
    description: {
      nl: "Hoe we je gegevens verwerken en bewaren.",
      fr: "Comment nous traitons et conservons vos données.",
      en: "How we process and store your data.",
    },
    page: "privacy",
  },
];

/* ---------- Dierenfiches (illustraties + downloads per taal) ---------- */

export type AnimalSheet = {
  id: string;
  image: string;
  title: Record<Lang, string>;
  /** Download-URL per taal van de fiche (PDF). */
  files: Partial<Record<"nl" | "en", string>>;
};

const CONTENT = (id: number) => `${OLD_SITE}/web/content/${id}?download=true`;

export const ANIMAL_SHEETS: AnimalSheet[] = [
  {
    id: "hoenders",
    image: "/fiches/hoenders.webp",
    title: { nl: "Hennen & hanen", fr: "Les poules et coqs", en: "Hens & roosters" },
    files: { en: CONTENT(6700), nl: CONTENT(6674) },
  },
  {
    id: "konijnen",
    image: "/fiches/konijnen.webp",
    title: { nl: "Huiskonijnen", fr: "Les lapins domestiques", en: "Domestic rabbits" },
    files: { en: CONTENT(6686), nl: CONTENT(6672) },
  },
  {
    id: "shetlandponys",
    image: "/fiches/shetlandponys.webp",
    title: { nl: "Shetlandpony's", fr: "Les poneys Shetland", en: "Shetland ponies" },
    files: { en: CONTENT(6698), nl: CONTENT(6678) },
  },
  {
    id: "ardense-schapen",
    image: "/fiches/ardense-schapen.webp",
    title: {
      nl: "Ardense roodkopschapen",
      fr: "Les moutons roux ardennais",
      en: "Ardennes Red sheep",
    },
    files: { en: CONTENT(6680), nl: CONTENT(6662) },
  },
  {
    id: "dwerggeiten",
    image: "/fiches/dwerggeiten.webp",
    title: { nl: "Dwerggeiten", fr: "Les chèvres naines", en: "Dwarf goats" },
    files: { nl: CONTENT(6664) },
  },
  {
    id: "gansen",
    image: "/fiches/gansen.webp",
    title: { nl: "Gansen", fr: "Les oies", en: "Geese" },
    files: { en: CONTENT(6692), nl: CONTENT(6670) },
  },
  {
    id: "ezels",
    image: "/fiches/ezels.webp",
    title: { nl: "Ezels", fr: "Les ânes", en: "Common donkeys" },
    files: { en: CONTENT(6684), nl: CONTENT(6668) },
  },
  {
    id: "ouessant-schapen",
    image: "/fiches/ouessant-schapen.webp",
    title: { nl: "Ouessantschapen", fr: "Les moutons d'Ouessant", en: "Ouessant sheep" },
    files: { en: CONTENT(6696), nl: CONTENT(6676) },
  },
  {
    id: "alpacas",
    image: "/fiches/alpacas.webp",
    title: { nl: "Alpaca's", fr: "Les alpagas", en: "Alpacas" },
    files: { en: CONTENT(6682), nl: CONTENT(6660) },
  },
  {
    id: "eenden",
    image: "/fiches/eenden.webp",
    title: { nl: "Eenden", fr: "Les canards", en: "Ducks" },
    files: { en: CONTENT(6688), nl: CONTENT(6666) },
  },
];

export const FARM_MAP = {
  image: "/fiches/plan-ferme.webp",
  href: CONTENT(1158),
  title: { nl: "Plattegrond van de boerderij", fr: "Le plan de la ferme", en: "Map of the farm" },
  description: {
    nl: "Vind de weides, ingangen en bezoekpunten terug voor je komt.",
    fr: "Repérez les enclos, les entrées et les points d'intérêt avant votre visite.",
    en: "Spot the paddocks, entrances and points of interest before your visit.",
  },
  cta: { nl: "Plattegrond downloaden", fr: "Télécharger le plan", en: "Download the map" },
} as const;

export const SHEETS_COPY: Record<
  Lang,
  { eyebrow: string; title: string; intro: string; sheet: string; print: string }
> = {
  nl: {
    eyebrow: "Dierenfiches",
    title: "De fiches van onze dieren",
    intro:
      "Eén fiche per soort, om te downloaden in het Nederlands of het Engels. Ideaal voor scholen, families en natuurliefhebbers.",
    sheet: "Dierenfiche",
    print: "Om af te printen",
  },
  fr: {
    eyebrow: "Fiches animaux",
    title: "Les fiches de nos animaux",
    intro:
      "Une fiche par espèce, à télécharger en néerlandais ou en anglais. Idéal pour les écoles, les familles et les curieux de nature.",
    sheet: "Fiche animal",
    print: "À imprimer",
  },
  en: {
    eyebrow: "Animal sheets",
    title: "Our animal fact sheets",
    intro:
      "One sheet per species, to download in Dutch or English. Ideal for schools, families and nature lovers.",
    sheet: "Animal sheet",
    print: "To print",
  },
};
