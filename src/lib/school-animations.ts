/**
 * De 6 educatieve animaties voor scholen (overgenomen van de bestaande
 * Odoo-site) + de praktische regels en picknickopties.
 * Prijzen in euro per groep (max. 25 leerlingen).
 */

import type { Lang } from "@/lib/i18n";

export type AnimationSlug =
  "zintuigen" | "boomgaard" | "bijen" | "moestuin" | "compost" | "boerderijdag";

export type AnimationCopy = {
  title: string;
  age: string;
  duration: string;
  season: string;
  lede: string;
  learn: string[];
  schedule: { time: string; what: string }[];
  bring: string[];
};

export type SchoolAnimation = {
  slug: AnimationSlug;
  price: number;
  fullDay: boolean;
  copy: Record<Lang, AnimationCopy>;
};

export const PICNIC_OPTIONS = [
  { id: "park", price: 0 },
  { id: "chalet", price: 50 },
  { id: "zaal", price: 100 },
] as const;

export type PicnicId = (typeof PICNIC_OPTIONS)[number]["id"];

/** Extra animator vanaf 26 leerlingen. */
export const SECOND_ANIMATOR_PRICE = 250;
export const MAX_GROUP_SIZE = 25;

export const TIME_SLOTS = ["09:30", "10:00", "13:30", "14:00"] as const;

export const SCHOOL_ANIMATIONS: SchoolAnimation[] = [
  {
    slug: "zintuigen",
    price: 250,
    fullDay: false,
    copy: {
      nl: {
        title: "De dieren & onze 5 zintuigen",
        age: "Alle leeftijden",
        duration: "2 uur",
        season: "Hele jaar",
        lede: "Ruiken, voelen, luisteren, kijken en proeven: de kinderen ontdekken de boerderijdieren met al hun zintuigen.",
        learn: [
          "De dieren van de boerderij herkennen en benoemen",
          "Voelen aan vacht, veren en wol",
          "Luisteren naar de geluiden van de stal",
          "Voederen onder begeleiding van de animator",
        ],
        schedule: [
          { time: "0:00", what: "Onthaal en afspraken op de boerderij" },
          { time: "0:15", what: "Rondgang langs de weides en de stal" },
          { time: "1:00", what: "Zintuigenparcours in kleine groepjes" },
          { time: "1:45", what: "Afsluiting en vragenronde" },
        ],
        bring: [
          "Laarzen of stevige schoenen",
          "Aangepaste kledij die vuil mag worden",
          "Regenjas bij twijfelachtig weer",
        ],
      },
      fr: {
        title: "Les animaux & nos 5 sens",
        age: "Tous âges",
        duration: "2 heures",
        season: "Toute l'année",
        lede: "Sentir, toucher, écouter, regarder et goûter : les enfants découvrent les animaux de la ferme avec tous leurs sens.",
        learn: [
          "Reconnaître et nommer les animaux de la ferme",
          "Toucher le pelage, les plumes et la laine",
          "Écouter les sons de l'étable",
          "Nourrir les animaux avec l'animateur",
        ],
        schedule: [
          { time: "0:00", what: "Accueil et règles de la ferme" },
          { time: "0:15", what: "Tour des prés et de l'étable" },
          { time: "1:00", what: "Parcours sensoriel en petits groupes" },
          { time: "1:45", what: "Clôture et questions" },
        ],
        bring: [
          "Bottes ou chaussures solides",
          "Vêtements adaptés qui peuvent se salir",
          "Imperméable en cas de doute",
        ],
      },
      en: {
        title: "The animals & our 5 senses",
        age: "All ages",
        duration: "2 hours",
        season: "All year",
        lede: "Smell, touch, listen, look and taste: children discover the farm animals with all their senses.",
        learn: [
          "Recognise and name the farm animals",
          "Touch fur, feathers and wool",
          "Listen to the sounds of the stable",
          "Feed the animals with the facilitator",
        ],
        schedule: [
          { time: "0:00", what: "Welcome and farm rules" },
          { time: "0:15", what: "Tour of the pastures and stable" },
          { time: "1:00", what: "Sensory trail in small groups" },
          { time: "1:45", what: "Wrap-up and questions" },
        ],
        bring: [
          "Boots or sturdy shoes",
          "Clothes that may get dirty",
          "Rain jacket if weather is uncertain",
        ],
      },
    },
  },
  {
    slug: "boomgaard",
    price: 350,
    fullDay: false,
    copy: {
      nl: {
        title: "Appel, peer & de boomgaard",
        age: "Vanaf 6 jaar",
        duration: "2 uur",
        season: "Herfst",
        lede: "Van bloesem tot fruitsap: de klas plukt in de boomgaard en perst het eigen sap.",
        learn: [
          "De levenscyclus van een fruitboom",
          "Oude fruitrassen herkennen",
          "Plukken en sorteren",
          "Zelf appelsap persen en proeven",
        ],
        schedule: [
          { time: "0:00", what: "Onthaal en introductie boomgaard" },
          { time: "0:20", what: "Plukken in de boomgaard" },
          { time: "1:00", what: "Persen van het sap" },
          { time: "1:40", what: "Proeven en afsluiting" },
        ],
        bring: ["Laarzen of stevige schoenen", "Aangepaste kledij", "Eventueel een beker per kind"],
      },
      fr: {
        title: "Pomme, poire & fruits du verger",
        age: "Dès 6 ans",
        duration: "2 heures",
        season: "Automne",
        lede: "De la fleur au jus : la classe récolte dans le verger et presse son propre jus.",
        learn: [
          "Le cycle de vie d'un arbre fruitier",
          "Reconnaître d'anciennes variétés",
          "Récolter et trier",
          "Presser et goûter son jus de pomme",
        ],
        schedule: [
          { time: "0:00", what: "Accueil et introduction au verger" },
          { time: "0:20", what: "Récolte dans le verger" },
          { time: "1:00", what: "Pressage du jus" },
          { time: "1:40", what: "Dégustation et clôture" },
        ],
        bring: [
          "Bottes ou chaussures solides",
          "Vêtements adaptés",
          "Éventuellement un gobelet par enfant",
        ],
      },
      en: {
        title: "Apple, pear & the orchard",
        age: "From 6 years",
        duration: "2 hours",
        season: "Autumn",
        lede: "From blossom to juice: the class harvests in the orchard and presses its own juice.",
        learn: [
          "The life cycle of a fruit tree",
          "Recognising heritage varieties",
          "Picking and sorting",
          "Pressing and tasting apple juice",
        ],
        schedule: [
          { time: "0:00", what: "Welcome and orchard introduction" },
          { time: "0:20", what: "Harvesting in the orchard" },
          { time: "1:00", what: "Pressing the juice" },
          { time: "1:40", what: "Tasting and wrap-up" },
        ],
        bring: ["Boots or sturdy shoes", "Suitable clothing", "Optionally a cup per child"],
      },
    },
  },
  {
    slug: "bijen",
    price: 250,
    fullDay: false,
    copy: {
      nl: {
        title: "De bijen & hun kast",
        age: "Vanaf 6 jaar",
        duration: "2 uur",
        season: "Lente & zomer",
        lede: "Ontdek het leven in de bijenkast, de rol van bestuivers en hoe honing gemaakt wordt.",
        learn: [
          "Koningin, werkster en dar herkennen",
          "Hoe bestuiving werkt",
          "Een raat en de bijenkast van dichtbij bekijken",
          "Honing proeven",
        ],
        schedule: [
          { time: "0:00", what: "Onthaal en veiligheidsafspraken" },
          { time: "0:20", what: "De bijenkast van dichtbij" },
          { time: "1:00", what: "Bestuiving in de moestuin" },
          { time: "1:40", what: "Honingproeverij en afsluiting" },
        ],
        bring: [
          "Lange broek en gesloten schoenen",
          "Geen sterk geparfumeerde producten",
          "Aangepaste kledij",
        ],
      },
      fr: {
        title: "Les abeilles & leur ruche",
        age: "Dès 6 ans",
        duration: "2 heures",
        season: "Printemps & été",
        lede: "Découvrez la vie de la ruche, le rôle des pollinisateurs et la fabrication du miel.",
        learn: [
          "Reconnaître la reine, l'ouvrière et le faux-bourdon",
          "Comprendre la pollinisation",
          "Observer un cadre et la ruche de près",
          "Goûter le miel",
        ],
        schedule: [
          { time: "0:00", what: "Accueil et consignes de sécurité" },
          { time: "0:20", what: "La ruche de près" },
          { time: "1:00", what: "La pollinisation au potager" },
          { time: "1:40", what: "Dégustation de miel et clôture" },
        ],
        bring: ["Pantalon long et chaussures fermées", "Pas de parfum fort", "Vêtements adaptés"],
      },
      en: {
        title: "The bees & their hive",
        age: "From 6 years",
        duration: "2 hours",
        season: "Spring & summer",
        lede: "Discover life inside the hive, the role of pollinators and how honey is made.",
        learn: [
          "Spot the queen, worker and drone",
          "Understand pollination",
          "See a frame and the hive up close",
          "Taste honey",
        ],
        schedule: [
          { time: "0:00", what: "Welcome and safety rules" },
          { time: "0:20", what: "The hive up close" },
          { time: "1:00", what: "Pollination in the vegetable garden" },
          { time: "1:40", what: "Honey tasting and wrap-up" },
        ],
        bring: ["Long trousers and closed shoes", "No strong perfumes", "Suitable clothing"],
      },
    },
  },
  {
    slug: "moestuin",
    price: 250,
    fullDay: false,
    copy: {
      nl: {
        title: "De moestuin & zijn schatten",
        age: "Vanaf 6 jaar",
        duration: "2 uur",
        season: "Alle seizoenen",
        lede: "Zaaien, wieden en oogsten: de klas werkt mee in de moestuin en ontdekt waar groenten vandaan komen.",
        learn: [
          "Groenten herkennen in de grond",
          "Zaaien en planten",
          "Seizoenen en de moestuinkalender",
          "Oogsten en proeven",
        ],
        schedule: [
          { time: "0:00", what: "Onthaal en rondleiding moestuin" },
          { time: "0:30", what: "Zaaien en planten in kleine groepjes" },
          { time: "1:10", what: "Oogsten van het seizoen" },
          { time: "1:45", what: "Proeven en afsluiting" },
        ],
        bring: ["Laarzen", "Kledij die vuil mag worden", "Regenjas bij twijfelachtig weer"],
      },
      fr: {
        title: "Le potager & ses trésors",
        age: "Dès 6 ans",
        duration: "2 heures",
        season: "Toutes saisons",
        lede: "Semer, désherber et récolter : la classe met les mains dans la terre et découvre d'où viennent les légumes.",
        learn: [
          "Reconnaître les légumes en terre",
          "Semer et planter",
          "Les saisons et le calendrier du potager",
          "Récolter et goûter",
        ],
        schedule: [
          { time: "0:00", what: "Accueil et visite du potager" },
          { time: "0:30", what: "Semis et plantations en petits groupes" },
          { time: "1:10", what: "Récolte de saison" },
          { time: "1:45", what: "Dégustation et clôture" },
        ],
        bring: ["Bottes", "Vêtements qui peuvent se salir", "Imperméable en cas de doute"],
      },
      en: {
        title: "The vegetable garden & its treasures",
        age: "From 6 years",
        duration: "2 hours",
        season: "All seasons",
        lede: "Sowing, weeding and harvesting: the class works in the garden and discovers where vegetables come from.",
        learn: [
          "Recognise vegetables in the soil",
          "Sow and plant",
          "Seasons and the garden calendar",
          "Harvest and taste",
        ],
        schedule: [
          { time: "0:00", what: "Welcome and garden tour" },
          { time: "0:30", what: "Sowing and planting in small groups" },
          { time: "1:10", what: "Seasonal harvest" },
          { time: "1:45", what: "Tasting and wrap-up" },
        ],
        bring: ["Boots", "Clothes that may get dirty", "Rain jacket if weather is uncertain"],
      },
    },
  },
  {
    slug: "compost",
    price: 250,
    fullDay: false,
    copy: {
      nl: {
        title: "Compost & de kleine diertjes",
        age: "Vanaf 6 jaar",
        duration: "2 uur",
        season: "Alle seizoenen",
        lede: "Wormen, pissebedden en bacteriën aan het werk: hoe afval verandert in vruchtbare aarde.",
        learn: [
          "De compostcyclus begrijpen",
          "Bodemdiertjes zoeken en herkennen",
          "Wat mag wel en niet in de compost",
          "Zelf een composthoop omzetten",
        ],
        schedule: [
          { time: "0:00", what: "Onthaal en introductie compost" },
          { time: "0:20", what: "Op zoek naar bodemdiertjes" },
          { time: "1:00", what: "De composthoop omzetten" },
          { time: "1:40", what: "Besluit en afsluiting" },
        ],
        bring: ["Laarzen", "Kledij die vuil mag worden", "Eventueel een loep per duo"],
      },
      fr: {
        title: "Le compost & ses petites bêtes",
        age: "Dès 6 ans",
        duration: "2 heures",
        season: "Toutes saisons",
        lede: "Vers, cloportes et bactéries au travail : comment les déchets deviennent une terre fertile.",
        learn: [
          "Comprendre le cycle du compost",
          "Chercher et reconnaître les petites bêtes du sol",
          "Ce qui va (ou non) au compost",
          "Retourner soi-même le tas de compost",
        ],
        schedule: [
          { time: "0:00", what: "Accueil et introduction au compost" },
          { time: "0:20", what: "À la recherche des petites bêtes" },
          { time: "1:00", what: "Retourner le tas de compost" },
          { time: "1:40", what: "Conclusion et clôture" },
        ],
        bring: ["Bottes", "Vêtements qui peuvent se salir", "Éventuellement une loupe par duo"],
      },
      en: {
        title: "Compost & its little creatures",
        age: "From 6 years",
        duration: "2 hours",
        season: "All seasons",
        lede: "Worms, woodlice and bacteria at work: how waste turns into fertile soil.",
        learn: [
          "Understand the compost cycle",
          "Find and identify soil creatures",
          "What can and cannot go into compost",
          "Turn a compost heap yourself",
        ],
        schedule: [
          { time: "0:00", what: "Welcome and compost introduction" },
          { time: "0:20", what: "Searching for soil creatures" },
          { time: "1:00", what: "Turning the compost heap" },
          { time: "1:40", what: "Conclusions and wrap-up" },
        ],
        bring: ["Boots", "Clothes that may get dirty", "Optionally a magnifier per pair"],
      },
    },
  },
  {
    slug: "boerderijdag",
    price: 500,
    fullDay: true,
    copy: {
      nl: {
        title: "Een dag op de boerderij",
        age: "Vanaf 6 jaar",
        duration: "Volledige dag",
        season: "Hele jaar · 2 animaties naar keuze",
        lede: "Een volledige dag op de boerderij met twee animaties naar keuze en een picknickpauze tussenin.",
        learn: [
          "Twee animaties naar keuze combineren",
          "Het ritme van een boerderijdag beleven",
          "Meehelpen bij de dagelijkse verzorging",
          "Rustige picknickpauze op het domein",
        ],
        schedule: [
          { time: "09:30", what: "Onthaal en eerste animatie" },
          { time: "12:00", what: "Picknickpauze (park, chalet of zaal)" },
          { time: "13:30", what: "Tweede animatie" },
          { time: "15:30", what: "Afsluiting en vertrek" },
        ],
        bring: ["Laarzen", "Lunchpakket en drinkbus", "Aangepaste kledij en regenjas"],
      },
      fr: {
        title: "Une journée à la ferme",
        age: "Dès 6 ans",
        duration: "Journée complète",
        season: "Toute l'année · 2 animations au choix",
        lede: "Une journée complète à la ferme avec deux animations au choix et une pause pique-nique.",
        learn: [
          "Combiner deux animations au choix",
          "Vivre le rythme d'une journée à la ferme",
          "Participer aux soins quotidiens",
          "Pause pique-nique tranquille sur le site",
        ],
        schedule: [
          { time: "09:30", what: "Accueil et première animation" },
          { time: "12:00", what: "Pause pique-nique (parc, chalet ou salle)" },
          { time: "13:30", what: "Deuxième animation" },
          { time: "15:30", what: "Clôture et départ" },
        ],
        bring: ["Bottes", "Pique-nique et gourde", "Vêtements adaptés et imperméable"],
      },
      en: {
        title: "A day at the farm",
        age: "From 6 years",
        duration: "Full day",
        season: "All year · 2 activities of your choice",
        lede: "A full day at the farm with two activities of your choice and a picnic break in between.",
        learn: [
          "Combine two activities of your choice",
          "Experience the rhythm of a farm day",
          "Help with the daily animal care",
          "A quiet picnic break on site",
        ],
        schedule: [
          { time: "09:30", what: "Welcome and first activity" },
          { time: "12:00", what: "Picnic break (park, chalet or hall)" },
          { time: "13:30", what: "Second activity" },
          { time: "15:30", what: "Wrap-up and departure" },
        ],
        bring: ["Boots", "Packed lunch and water bottle", "Suitable clothing and rain jacket"],
      },
    },
  },
];

export function getAnimation(slug: AnimationSlug) {
  return SCHOOL_ANIMATIONS.find((a) => a.slug === slug)!;
}
