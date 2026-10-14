/**
 * Seminaries & vergaderingen voor bedrijven en organisaties.
 * Bouwt op de ruimtes uit rental-spaces.ts (chalet, zaal, weide).
 */

import type { Lang } from "@/lib/i18n";

export type SeminarFormat = {
  id: "meeting" | "seminar" | "workshopday";
  /** Duur in uren. */
  hours: number;
  /** Vanafprijs voor de ruimte (excl. catering en animatie). */
  fromPrice: number;
  capacity: string;
  copy: Record<Lang, { title: string; lede: string; includes: string[] }>;
};

export const SEMINAR_FORMATS: SeminarFormat[] = [
  {
    id: "meeting",
    hours: 4,
    fromPrice: 150,
    capacity: "8–40",
    copy: {
      nl: {
        title: "Vergadering (halve dag)",
        lede: "Het chalet als vergaderruimte, met zicht op de weide en de moestuin.",
        includes: [
          "Tafels in U- of eilandopstelling",
          "Scherm en flipchart",
          "Wifi",
          "Gefilterd water, koffie en thee",
        ],
      },
      fr: {
        title: "Réunion (demi-journée)",
        lede: "Le chalet comme salle de réunion, avec vue sur la prairie et le potager.",
        includes: [
          "Tables en U ou en îlots",
          "Écran et flipchart",
          "Wifi",
          "Eau filtrée, café et thé",
        ],
      },
      en: {
        title: "Meeting (half day)",
        lede: "The chalet as a meeting room, overlooking the meadow and kitchen garden.",
        includes: [
          "Tables in U-shape or islands",
          "Screen and flipchart",
          "Wifi",
          "Filtered water, coffee and tea",
        ],
      },
    },
  },
  {
    id: "seminar",
    hours: 8,
    fromPrice: 300,
    capacity: "20–80",
    copy: {
      nl: {
        title: "Seminarie (hele dag)",
        lede: "De polyvalente zaal voor een volledige dag met plenaire momenten en werkgroepen.",
        includes: [
          "Zaal met stoelen in theater- of werkgroepopstelling",
          "Scherm, projector en geluid",
          "Uitgeruste keuken voor je traiteur",
          "Buitenruimte voor pauzes en walking lunch",
        ],
      },
      fr: {
        title: "Séminaire (journée)",
        lede: "L'espace polyvalent pour une journée complète, plénières et groupes de travail.",
        includes: [
          "Salle en disposition théâtre ou groupes de travail",
          "Écran, projecteur et son",
          "Cuisine équipée pour votre traiteur",
          "Espace extérieur pour les pauses et le walking lunch",
        ],
      },
      en: {
        title: "Seminar (full day)",
        lede: "The multipurpose hall for a full day of plenaries and breakout groups.",
        includes: [
          "Hall in theatre or breakout layout",
          "Screen, projector and sound",
          "Equipped kitchen for your caterer",
          "Outdoor space for breaks and walking lunch",
        ],
      },
    },
  },
  {
    id: "workshopday",
    hours: 8,
    fromPrice: 500,
    capacity: "20–150",
    copy: {
      nl: {
        title: "Seminarie + boerderijatelier",
        lede: "Vergaderen in de voormiddag, in de namiddag de handen uit de mouwen met een animator.",
        includes: [
          "Zaal of chalet voor het werkgedeelte",
          "Begeleid atelier: moestuin, dieren of bouwen",
          "Twee animatoren",
          "Weide beschikbaar bij mooi weer",
        ],
      },
      fr: {
        title: "Séminaire + atelier ferme",
        lede: "Réunion le matin, l'après-midi les mains dans la terre avec un animateur.",
        includes: [
          "Salle ou chalet pour la partie travail",
          "Atelier encadré : potager, animaux ou construction",
          "Deux animateurs",
          "Prairie disponible par beau temps",
        ],
      },
      en: {
        title: "Seminar + farm workshop",
        lede: "Meet in the morning, roll up your sleeves with a facilitator in the afternoon.",
        includes: [
          "Hall or chalet for the working part",
          "Guided workshop: garden, animals or building",
          "Two facilitators",
          "Meadow available in good weather",
        ],
      },
    },
  },
];

export const SEMINAR_CATERING: Record<Lang, string[]> = {
  nl: [
    "Ontbijt of koffieonthaal — op aanvraag",
    "Warme of koude lunch, seizoensgebonden — op aanvraag",
    "Pauzes met koffie, thee, fruit en cake — op aanvraag",
    "Afsluitende drink met lokale dranken — op aanvraag",
    "Je eigen traiteur is welkom in de uitgeruste keuken",
  ],
  fr: [
    "Petit-déjeuner ou accueil café — sur demande",
    "Lunch chaud ou froid, de saison — sur demande",
    "Pauses café, thé, fruits et cake — sur demande",
    "Drink de clôture avec des boissons locales — sur demande",
    "Votre traiteur est bienvenu dans la cuisine équipée",
  ],
  en: [
    "Breakfast or coffee welcome — on request",
    "Hot or cold seasonal lunch — on request",
    "Breaks with coffee, tea, fruit and cake — on request",
    "Closing drinks with local beverages — on request",
    "Your own caterer is welcome in the equipped kitchen",
  ],
};

export const SEMINAR_NOTES: Record<Lang, string[]> = {
  nl: [
    "Vanafprijzen gelden voor de ruimte; catering en animatie rekenen we apart aan.",
    "Op 5 minuten van Brussel-Centraal, vlot met MIVB en met fietsenstalling op het terrein.",
    "Bij een volledige privatisering van de boerderij: € 3000 voor 10 uur, tot 150 personen.",
    "Facturatie met bestelbon of referentie is mogelijk.",
  ],
  fr: [
    "Les prix de départ concernent l'espace ; catering et animation sont facturés séparément.",
    "À 5 minutes de Bruxelles-Central, accessible en STIB, parking vélos sur place.",
    "Privatisation complète de la ferme : 3000 € pour 10 heures, jusqu'à 150 personnes.",
    "Facturation avec bon de commande ou référence possible.",
  ],
  en: [
    "Starting prices cover the space; catering and facilitation are charged separately.",
    "Five minutes from Brussels-Central, easy by public transport, bicycle parking on site.",
    "Full privatisation of the farm: €3000 for 10 hours, up to 150 people.",
    "Invoicing with a purchase order or reference is possible.",
  ],
};
