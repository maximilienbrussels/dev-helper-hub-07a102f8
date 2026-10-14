/**
 * Beheerbare inhoud voor de "Boeken & huren"-pagina's.
 *
 * Elke pagina heeft een hero (afbeelding + titel/tekst per taal) en een
 * lijst van blokken (afbeelding, titel, tekst en prijs per taal). De
 * standaardwaarden hieronder komen overeen met de bestaande statische
 * bestanden (school-animations.ts, farm-camps.ts, rental-spaces.ts,
 * teambuilding.ts, seminars.ts) en dienen als vangnet zolang er niets in de
 * databank staat.
 */
import { SCHOOL_ANIMATIONS } from "./school-animations";
import { FARM_CAMPS, CAMP_PRICES, campDateRange } from "./farm-camps";
import { RENTAL_SPACES } from "./rental-spaces";
import { TEAMBUILDING_FORMULAS } from "./teambuilding";
import { SEMINAR_FORMATS } from "./seminars";

export const PAGE_CONTENT_KEYS = [
  "animations",
  "camps",
  "rental",
  "teambuilding",
  "seminars",
  "home",
  "about",
  "events",
  "contact",
] as const;

export type PageContentKey = (typeof PAGE_CONTENT_KEYS)[number];

export const PAGE_CONTENT_LABELS: Record<PageContentKey, string> = {
  animations: "Schoolanimaties",
  camps: "Vakantiestages",
  rental: "Zalen huren",
  teambuilding: "Teambuilding",
  seminars: "Seminaries",
  home: "Startpagina",
  about: "Over ons",
  events: "Evenementen",
  contact: "Contact",
};

export type LocalizedText = { nl: string; fr: string; en: string };

export type PageBlockContent = {
  id: string;
  sortOrder: number;
  active: boolean;
  imageUrl: string | null;
  title: LocalizedText;
  text: LocalizedText;
  price: number | null;
  priceLabel: LocalizedText;
};

export type PageHeroContent = {
  imageUrl: string | null;
  title: LocalizedText;
  text: LocalizedText;
};

export type PageContent = {
  hero: PageHeroContent;
  blocks: PageBlockContent[];
  /** Extra fotogalerij per pagina (volgorde = weergavevolgorde). */
  gallery: string[];
};

function block(
  id: string,
  sortOrder: number,
  title: LocalizedText,
  text: LocalizedText,
  price: number | null,
  priceLabel: LocalizedText,
  imageUrl: string | null = null,
): PageBlockContent {
  return { id, sortOrder, active: true, imageUrl, title, text, price, priceLabel };
}

const PER_GROUP: LocalizedText = { nl: "per groep", fr: "par groupe", en: "per group" };
const PER_WEEK: LocalizedText = { nl: "per week (1 kind)", fr: "par semaine (1 enfant)", en: "per week (1 child)" };
const PER_DAY: LocalizedText = { nl: "per dag", fr: "par jour", en: "per day" };
const PER_PERSON: LocalizedText = { nl: "per persoon", fr: "par personne", en: "per person" };
const FROM_SPACE: LocalizedText = { nl: "vanaf, ruimte", fr: "à partir de, espace", en: "from, space" };

const ANIMATIONS_DEFAULT: PageContent = {
  hero: {
    imageUrl: null,
    title: {
      nl: "Ons animaties-aanbod",
      fr: "Notre offre d'animations",
      en: "Our activity programme",
    },
    text: {
      nl: "Zes educatieve animaties, begeleid door onze animatoren. Kies een animatie, vink je opties aan en vraag meteen een datum aan.",
      fr: "Six animations éducatives encadrées par nos animateurs. Choisissez une animation, cochez vos options et demandez directement une date.",
      en: "Six educational activities led by our facilitators. Pick an activity, tick your options and request a date right away.",
    },
  },
  blocks: SCHOOL_ANIMATIONS.map((a, i) =>
    block(
      `default-${a.slug}`,
      i,
      { nl: a.copy.nl.title, fr: a.copy.fr.title, en: a.copy.en.title },
      { nl: a.copy.nl.lede, fr: a.copy.fr.lede, en: a.copy.en.lede },
      a.price,
      PER_GROUP,
    ),
  ),
  gallery: [],
};

const CAMPS_DEFAULT: PageContent = {
  hero: {
    imageUrl: null,
    title: {
      nl: "Vakantiestages op de boerderij",
      fr: "Stages à la ferme",
      en: "Holiday camps at the farm",
    },
    text: {
      nl: "Een onvergetelijke week vol dierenverzorging, tuinieren, creatieve workshops en buitenpret voor kinderen van 6 tot 10 jaar.",
      fr: "Une semaine inoubliable rythmée par le soin des animaux, le jardinage, les ateliers créatifs et le grand air, pour les enfants de 6 à 10 ans.",
      en: "An unforgettable week of animal care, gardening, creative workshops and outdoor fun for children aged 6 to 10.",
    },
  },
  blocks: FARM_CAMPS.map((camp, i) =>
    block(
      `default-${camp.slug}`,
      i,
      camp.name,
      camp.note ?? { nl: campDateRange(camp), fr: campDateRange(camp), en: campDateRange(camp) },
      CAMP_PRICES.normal[1],
      PER_WEEK,
    ),
  ),
  gallery: [],
};

const RENTAL_DEFAULT: PageContent = {
  hero: {
    imageUrl: null,
    title: { nl: "Ruimtes huren op de boerderij", fr: "Louer un espace à la ferme", en: "Rent a space at the farm" },
    text: {
      nl: "Van een gezellig chalet tot de volledige boerderij: kies de ruimte die bij je moment past.",
      fr: "D'un chalet chaleureux à toute la ferme : choisissez l'espace qui correspond à votre événement.",
      en: "From a cosy chalet to the whole farm: choose the space that fits your event.",
    },
  },
  blocks: RENTAL_SPACES.map((s, i) =>
    block(
      `default-${s.slug}`,
      i,
      { nl: s.copy.nl.title, fr: s.copy.fr.title, en: s.copy.en.title },
      { nl: s.copy.nl.lede, fr: s.copy.fr.lede, en: s.copy.en.lede },
      s.fullDay,
      PER_DAY,
    ),
  ),
  gallery: [],
};

const TEAMBUILDING_DEFAULT: PageContent = {
  hero: {
    imageUrl: null,
    title: {
      nl: "Teambuilding op de boerderij of op het platteland",
      fr: "Team building à la ferme ou à la campagne",
      en: "Team building at the farm or in the countryside",
    },
    text: {
      nl: "Twee decors, dezelfde aanpak: samen werken met dieren, aarde en vuur. Halve of hele dag, in het Nederlands, Frans of Engels.",
      fr: "Deux décors, la même approche : travailler ensemble avec les animaux, la terre et le feu. Demi-journée ou journée, en français, néerlandais ou anglais.",
      en: "Two settings, the same approach: working together with animals, earth and fire. Half or full day, in Dutch, French or English.",
    },
  },
  blocks: TEAMBUILDING_FORMULAS.map((f, i) =>
    block(
      `default-${f.slug}`,
      i,
      { nl: f.copy.nl.title, fr: f.copy.fr.title, en: f.copy.en.title },
      { nl: f.copy.nl.lede, fr: f.copy.fr.lede, en: f.copy.en.lede },
      f.pricePerPerson,
      PER_PERSON,
    ),
  ),
  gallery: [],
};

const SEMINARS_DEFAULT: PageContent = {
  hero: {
    imageUrl: null,
    title: {
      nl: "Seminaries & vergaderingen op de boerderij",
      fr: "Séminaires & réunions à la ferme",
      en: "Seminars & meetings at the farm",
    },
    text: {
      nl: "Vergaderen tussen de moestuin en de weide, op vijf minuten van Brussel-Centraal.",
      fr: "Se réunir entre le potager et la prairie, à cinq minutes de Bruxelles-Central.",
      en: "Meet between the kitchen garden and the meadow, five minutes from Brussels-Central.",
    },
  },
  blocks: SEMINAR_FORMATS.map((f, i) =>
    block(
      `default-${f.id}`,
      i,
      { nl: f.copy.nl.title, fr: f.copy.fr.title, en: f.copy.en.title },
      { nl: f.copy.nl.lede, fr: f.copy.fr.lede, en: f.copy.en.lede },
      f.fromPrice,
      FROM_SPACE,
    ),
  ),
  gallery: [],
};

export const DEFAULT_PAGE_CONTENT: Record<PageContentKey, PageContent> = {
  animations: ANIMATIONS_DEFAULT,
  camps: CAMPS_DEFAULT,
  rental: RENTAL_DEFAULT,
  teambuilding: TEAMBUILDING_DEFAULT,
  seminars: SEMINARS_DEFAULT,
  // Pagina's zonder blokken: enkel een hero-afbeelding en -tekst uit het portaal.
  home: emptyPageContent(),
  about: emptyPageContent(),
  events: emptyPageContent(),
  contact: emptyPageContent(),
};

/** Lege pagina-inhoud: de bestaande vormgeving blijft het vangnet. */
function emptyPageContent(): PageContent {
  const empty = { nl: "", fr: "", en: "" };
  return {
    hero: { imageUrl: null, title: { ...empty }, text: { ...empty } },
    blocks: [],
    gallery: [],
  };
}

export function localized(text: LocalizedText, lang: "nl" | "fr" | "en"): string {
  return text[lang] || text.nl || text.fr || text.en || "";
}
