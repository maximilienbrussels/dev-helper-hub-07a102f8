/**
 * Vakantiestages op de boerderij (6–10 jaar, max. 15 kinderen).
 * Tarieven, weekprogramma, praktische info en annulering — NL/FR/EN.
 */

import type { Lang } from "@/lib/i18n";

export type Season = "lente" | "zomer" | "herfst" | "winter";
export type CampStatus = "available" | "few" | "full";
export type RateKind = "normal" | "social";

/** Prijs per week volgens tarief en aantal kinderen (broers/zussen). */
export const CAMP_PRICES: Record<RateKind, Record<1 | 2 | 3, number>> = {
  normal: { 1: 130, 2: 250, 3: 370 },
  social: { 1: 90, 2: 170, 3: 250 },
};

export const CAMP_BASE_PRICE = CAMP_PRICES.normal[1];
export const CAMP_MAX_CHILDREN = 15;
export const CAMP_AGE_MIN = 6;
export const CAMP_AGE_MAX = 10;

export function campPrice(rate: RateKind, children: 1 | 2 | 3): number {
  return CAMP_PRICES[rate][children];
}

export type FarmCamp = {
  slug: string;
  season: Season;
  /** ISO start/eind (inclusief). */
  start: string;
  end: string;
  status: CampStatus;
  name: Record<Lang, string>;
  /** Optionele extra nota per stage. */
  note?: Record<Lang, string>;
};

export const FARM_CAMPS: FarmCamp[] = [
  {
    slug: "winter-1",
    season: "winter",
    start: "2026-02-23",
    end: "2026-02-27",
    status: "full",
    name: { nl: "Winter", fr: "Hiver", en: "Winter" },
  },
  {
    slug: "lente-1",
    season: "lente",
    start: "2026-04-27",
    end: "2026-04-30",
    status: "few",
    name: { nl: "Lente 1", fr: "Printemps 1", en: "Spring 1" },
    note: {
      nl: "Vrijdag 1 mei is een feestdag — die dag is er geen stage.",
      fr: "Le vendredi 1er mai est férié — pas de stage ce jour-là.",
      en: "Friday 1 May is a public holiday — no camp that day.",
    },
  },
  {
    slug: "lente-2",
    season: "lente",
    start: "2026-05-04",
    end: "2026-05-08",
    status: "available",
    name: { nl: "Lente 2", fr: "Printemps 2", en: "Spring 2" },
  },
  {
    slug: "zomer-1",
    season: "zomer",
    start: "2026-07-06",
    end: "2026-07-10",
    status: "available",
    name: { nl: "Zomer 1", fr: "Été 1", en: "Summer 1" },
  },
  {
    slug: "zomer-2",
    season: "zomer",
    start: "2026-07-13",
    end: "2026-07-17",
    status: "available",
    name: { nl: "Zomer 2", fr: "Été 2", en: "Summer 2" },
  },
  {
    slug: "zomer-3",
    season: "zomer",
    start: "2026-08-03",
    end: "2026-08-07",
    status: "few",
    name: { nl: "Zomer 3", fr: "Été 3", en: "Summer 3" },
    note: {
      nl: "Deze week is speciaal voor kinderen van 5,5 tot 8 jaar.",
      fr: "Cette semaine est dédiée aux enfants de 5,5 à 8 ans.",
      en: "This week is dedicated to children aged 5.5 to 8.",
    },
  },
  {
    slug: "zomer-4",
    season: "zomer",
    start: "2026-08-17",
    end: "2026-08-21",
    status: "available",
    name: { nl: "Zomer 4", fr: "Été 4", en: "Summer 4" },
  },
  {
    slug: "herfst-1",
    season: "herfst",
    start: "2026-11-02",
    end: "2026-11-06",
    status: "available",
    name: { nl: "Herfst", fr: "Automne", en: "Autumn" },
  },
];

/** Dagprogramma — identiek voor elke stageweek. */
export const CAMP_SCHEDULE: { time: string; what: Record<Lang, string> }[] = [
  {
    time: "08:00 – 09:00",
    what: {
      nl: "Onthaal van de kinderen",
      fr: "Arrivée des enfants",
      en: "Children arrive",
    },
  },
  {
    time: "09:00 – 12:00",
    what: {
      nl: "Ochtendtussendoortje & verzorging van de dieren",
      fr: "Collation & soin des animaux",
      en: "Morning snack & animal care",
    },
  },
  {
    time: "12:00 – 13:15",
    what: {
      nl: "Lunchpakket & vrije speeltijd",
      fr: "Repas tiré du sac & temps libre",
      en: "Packed lunch & free play",
    },
  },
  {
    time: "13:15 – 15:00",
    what: {
      nl: "Thema-activiteit van de week (tuinieren, ambachten, natuur)",
      fr: "Activité thématique de la semaine (jardinage, artisanat, nature)",
      en: "Themed activity of the week (gardening, crafts, nature)",
    },
  },
  {
    time: "15:00 – 15:30",
    what: {
      nl: "« Météo des émotions » — het emotieweerbericht",
      fr: "Météo des émotions",
      en: "“Météo des émotions” — the emotions weather report",
    },
  },
  {
    time: "15:30 – 16:00",
    what: {
      nl: "Gezond tussendoortje, voorzien door de boerderij",
      fr: "Goûter sain fourni par nos soins",
      en: "Healthy snack, provided by the farm",
    },
  },
  {
    time: "16:00 – 16:59",
    what: {
      nl: "Ophaalmoment",
      fr: "Départ des enfants",
      en: "Pick-up time",
    },
  },
  {
    time: "17:00",
    what: {
      nl: "Sluiting van de boerderij",
      fr: "Fermeture de la ferme",
      en: "The farm closes",
    },
  },
];

export type PracticalItem = {
  id: "entrance" | "shoes" | "clothes" | "food" | "phones" | "language";
  icon: string;
  copy: Record<Lang, { title: string; body: string }>;
};

export const CAMP_PRACTICAL: PracticalItem[] = [
  {
    id: "entrance",
    icon: "map-pin",
    copy: {
      nl: {
        title: "Ingang",
        body: "Personeelsingang via Willebroekkaai 21, 1000 Brussel — brengen én ophalen.",
      },
      fr: {
        title: "Accès",
        body: "Entrée du personnel, 21 Quai de Willebroeck, 1000 Bruxelles — dépose et reprise.",
      },
      en: {
        title: "Entrance",
        body: "Staff entrance, Quai de Willebroeck 21, 1000 Brussels — drop-off and pick-up.",
      },
    },
  },
  {
    id: "shoes",
    icon: "footprints",
    copy: {
      nl: {
        title: "Schoeisel",
        body: "Comfortabele stapschoenen of regenlaarzen én pantoffels/binnenschoenen.",
      },
      fr: {
        title: "Chaussures",
        body: "Chaussures de marche confortables ou bottes, et une paire d'intérieur.",
      },
      en: {
        title: "Footwear",
        body: "Comfortable walking shoes or wellies, plus a pair of indoor slippers.",
      },
    },
  },
  {
    id: "clothes",
    icon: "shirt",
    copy: {
      nl: {
        title: "Kledij",
        body: "Kledij die vuil mag worden, aangepast aan het weer, plus reservekledij die de hele week op de boerderij blijft.",
      },
      fr: {
        title: "Vêtements",
        body: "Des vêtements qui peuvent être salis, adaptés à la météo, et une tenue de rechange qui reste à la ferme.",
      },
      en: {
        title: "Clothing",
        body: "Clothes that can get dirty, suited to the weather, plus a spare set that stays at the farm all week.",
      },
    },
  },
  {
    id: "food",
    icon: "apple",
    copy: {
      nl: {
        title: "Voeding",
        body: "Tussendoortje voor 10u, lunchpakket en een hervulbare drinkbus. Het vieruurtje voorzien wij.",
      },
      fr: {
        title: "Alimentation",
        body: "Une collation pour 10h, un repas de midi et une gourde. Le goûter est fourni par la ferme.",
      },
      en: {
        title: "Food",
        body: "A snack for 10 am, a packed lunch and a refillable water bottle. The afternoon snack is on us.",
      },
    },
  },
  {
    id: "phones",
    icon: "smartphone-off",
    copy: {
      nl: {
        title: "Geen smartphones",
        body: "Smartphones en elektronica zijn strikt verboden tijdens de stage. De boerderij is niet aansprakelijk bij verlies of diefstal.",
      },
      fr: {
        title: "Pas de smartphones",
        body: "Smartphones et appareils électroniques sont strictement interdits. La ferme décline toute responsabilité en cas de perte ou de vol.",
      },
      en: {
        title: "No smartphones",
        body: "Smartphones and electronics are strictly forbidden during the camp. The farm is not liable for loss or theft.",
      },
    },
  },
  {
    id: "language",
    icon: "languages",
    copy: {
      nl: {
        title: "Taal",
        body: "De stages worden hoofdzakelijk in het Frans geanimeerd; een tweetalige animator begeleidt de Nederlandstalige kinderen.",
      },
      fr: {
        title: "Langue",
        body: "Les stages sont principalement animés en français ; une animatrice bilingue accompagne les enfants néerlandophones.",
      },
      en: {
        title: "Language",
        body: "Camps run mainly in French; a bilingual facilitator supports Dutch-speaking children.",
      },
    },
  },
];

export const CAMP_CANCELLATION: Record<Lang, string> = {
  nl: "Verwittig ons minstens 15 dagen op voorhand bij annulering voor een volledige terugbetaling. Bij een latere annulering is geen terugbetaling meer mogelijk.",
  fr: "Prévenez-nous au moins 15 jours à l'avance pour un remboursement intégral. Passé ce délai, aucun remboursement n'est possible.",
  en: "Let us know at least 15 days in advance for a full refund. After that, no refund is possible.",
};

export const CAMP_MUTUELLE: Record<Lang, string> = {
  nl: "Lid van het ziekenfonds (mutualiteit)? Je ontvangt na afloop een fiscaal attest (ONE) voor een gedeeltelijke terugbetaling.",
  fr: "Affilié·e à une mutuelle ? Une attestation fiscale (ONE) vous est remise après le stage en vue d'un remboursement partiel.",
  en: "Member of a health fund? You receive an official tax certificate (ONE) afterwards for partial reimbursement.",
};

const LOCALES: Record<Lang, string> = { nl: "nl-BE", fr: "fr-BE", en: "en-GB" };

/** "06.07.2026 > 10.07.2026" */
export function campDateRange(camp: FarmCamp): string {
  const fmt = (iso: string) => {
    const [y, m, d] = iso.split("-");
    return `${d}.${m}.${y}`;
  };
  return `${fmt(camp.start)} > ${fmt(camp.end)}`;
}

export function campLongDate(iso: string, lang: Lang): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString(LOCALES[lang], {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
