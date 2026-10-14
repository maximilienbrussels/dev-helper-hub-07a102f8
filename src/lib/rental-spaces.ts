import type { Lang } from "./i18n";

/** Tijdsloten waarop een verhuur kan starten. */
export const RENTAL_TIME_SLOTS = ["08:00", "09:00", "13:00", "14:00"] as const;

export type RentalDuration = "half" | "full";

export type RentalSpace = {
  slug: string;
  /** Halve dag (null = niet beschikbaar) */
  halfDay: number | null;
  /** Hele dag */
  fullDay: number;
  /** Vaste duur in uren voor privatisering */
  fixedHours?: number;
  capacity: string;
  featured?: boolean;
  copy: Record<
    Lang,
    {
      title: string;
      lede: string;
      details: string[];
    }
  >;
};

/** Wat standaard inbegrepen is bij elke ruimtehuur. */
export const RENTAL_INCLUDED: Record<Lang, string[]> = {
  nl: [
    "Toegang tot de uitgeruste keuken met servies en keukengerei",
    "Gefilterd water, thee en koffie ter beschikking",
    "Sanitair en vestiaire",
    "Fietsenstalling in een beveiligde zone op het terrein",
    "Vlot bereikbaar met het openbaar vervoer",
  ],
  fr: [
    "Accès à la cuisine équipée avec vaisselle et ustensiles",
    "Eau filtrée, thé et café mis à disposition",
    "Sanitaires et vestiaires",
    "Espace vélos sécurisé à l'intérieur de la ferme",
    "Accès facile en transports en commun",
  ],
  en: [
    "Access to the equipped kitchen with crockery and utensils",
    "Filtered water, tea and coffee available",
    "Toilets and cloakroom",
    "Secure bicycle parking inside the farm",
    "Easy to reach by public transport",
  ],
};

/** Extra's die enkel bij volledige privatisering horen. */
export const PRIVATISATION_EXTRAS: Record<Lang, string[]> = {
  nl: [
    "5 brouwerijtafels met banken inbegrepen",
    "3 privé parkeerplaatsen aan de ingang van de boerderij",
    "1 medewerker van de boerderij aanwezig voor opening, sluiting en praktische ondersteuning",
    "Exclusief gebruik van het volledige terrein tot 150 personen",
  ],
  fr: [
    "Cinq tables brasseur avec leurs bancs incluses",
    "Trois emplacements de parking privés à l'entrée de la ferme",
    "Un employé de la ferme présent pour l'ouverture, la fermeture et le soutien pratique",
    "Usage exclusif de l'ensemble du site jusqu'à 150 personnes",
  ],
  en: [
    "Five brewery tables with benches included",
    "Three private parking spaces at the farm entrance",
    "One farm staff member present for opening, closing and practical support",
    "Exclusive use of the whole site for up to 150 people",
  ],
};

/** Wat de huurder zelf voorziet + praktische afspraken. */
export const RENTAL_RULES: Record<Lang, string[]> = {
  nl: [
    "Zelf te voorzien: catering, geluidsinstallatie, extra meubilair en decoratie of opbouw.",
    "Opruimen en schoonmaken gebeurt binnen de gehuurde tijdstippen.",
    "De afgesproken uren en het aangekondigde aantal deelnemers worden strikt gerespecteerd.",
    "Respect voor het ecologische kader en het welzijn van de dieren is vanzelfsprekend.",
    "De lokalen worden proper en in hun oorspronkelijke staat achtergelaten; anders volgt een herstelfactuur.",
  ],
  fr: [
    "À prévoir de votre côté : catering, sonorisation, mobilier supplémentaire, décoration et montage.",
    "Le rangement et le nettoyage se font dans les heures de location réservées.",
    "Les horaires convenus et le nombre de participants annoncé sont strictement respectés.",
    "Le respect du cadre écologique et du bien-être des animaux est indispensable.",
    "Les lieux sont rendus propres et dans leur état initial ; à défaut, des frais de remise en état seront facturés.",
  ],
  en: [
    "To arrange yourself: catering, sound system, extra furniture, decoration and set-up.",
    "Tidying and cleaning happen within the booked rental hours.",
    "Agreed times and the announced number of participants are strictly respected.",
    "Respect for the ecological setting and animal welfare is essential.",
    "Spaces are left clean and in their original state; otherwise restoration costs are charged.",
  ],
};

export const RENTAL_SPACES: RentalSpace[] = [
  {
    slug: "chalet",
    halfDay: 150,
    fullDay: 250,
    capacity: "±30",
    copy: {
      nl: {
        title: "Het Chalet",
        lede: "Gezellige overdekte houten ruimte met eigen koer — ideaal voor workshops en kleinere bijeenkomsten.",
        details: [
          "Overdekt, met aangrenzende privékoer",
          "Perfect voor workshops, vergaderingen of een verjaardag",
          "Verwarmde, knusse sfeer in elk seizoen",
        ],
      },
      fr: {
        title: "Le Chalet",
        lede: "Espace en bois couvert et chaleureux avec sa propre cour — idéal pour ateliers et petites réunions.",
        details: [
          "Couvert, avec cour privative attenante",
          "Parfait pour ateliers, réunions ou anniversaires",
          "Ambiance cosy en toute saison",
        ],
      },
      en: {
        title: "The Chalet",
        lede: "Cosy covered wooden space with its own courtyard — ideal for workshops and smaller gatherings.",
        details: [
          "Covered, with adjoining private courtyard",
          "Perfect for workshops, meetings or a birthday",
          "Warm and cosy in every season",
        ],
      },
    },
  },
  {
    slug: "zaal",
    halfDay: 185,
    fullDay: 300,
    capacity: "±60",
    copy: {
      nl: {
        title: "De Polyvalente Zaal",
        lede: "Ruime binnenzaal met rechtstreekse toegang tot de volledig uitgeruste keuken.",
        details: [
          "Inclusief toegang tot de uitgeruste keuken",
          "Geschikt voor vergaderingen, opleidingen en recepties",
          "Sanitair en vestiaire vlakbij",
        ],
      },
      fr: {
        title: "La Salle polyvalente",
        lede: "Grande salle intérieure avec accès direct à la cuisine entièrement équipée.",
        details: [
          "Accès à la cuisine équipée inclus",
          "Adaptée aux réunions, formations et réceptions",
          "Sanitaires et vestiaires à proximité",
        ],
      },
      en: {
        title: "The Multi-purpose Hall",
        lede: "Spacious indoor hall with direct access to the fully equipped kitchen.",
        details: [
          "Access to the equipped kitchen included",
          "Suited to meetings, trainings and receptions",
          "Toilets and cloakroom nearby",
        ],
      },
    },
  },
  {
    slug: "weide",
    halfDay: 250,
    fullDay: 500,
    capacity: "±150",
    copy: {
      nl: {
        title: "De Weide",
        lede: "Open buitenruimte in het groen, midden in de stad — voor grotere momenten onder de blote hemel.",
        details: [
          "Grote groene buitenruimte in het park",
          "Voor picknicks, festiviteiten of openluchtworkshops",
          "Vlakbij de dieren en de moestuinen",
        ],
      },
      fr: {
        title: "La Prairie",
        lede: "Espace extérieur en pleine verdure, au cœur de la ville — pour les grands moments à ciel ouvert.",
        details: [
          "Grand espace vert extérieur dans le parc",
          "Pour pique-niques, festivités ou ateliers en plein air",
          "À deux pas des animaux et des potagers",
        ],
      },
      en: {
        title: "The Meadow",
        lede: "Open green outdoor space in the middle of the city — for bigger moments under open skies.",
        details: [
          "Large green outdoor area in the park",
          "For picnics, festivities or open-air workshops",
          "Right next to the animals and vegetable gardens",
        ],
      },
    },
  },
  {
    slug: "privatisering",
    halfDay: null,
    fullDay: 3000,
    fixedHours: 10,
    capacity: "150",
    featured: true,
    copy: {
      nl: {
        title: "Volledige privatisering",
        lede: "De hele boerderij exclusief voor jou: 10 uur lang, tot 150 personen, met begeleiding op locatie.",
        details: [
          "10 uur exclusief gebruik van het volledige terrein",
          "Voor huwelijken, bedrijfsfeesten, ceremonies, salons of opnames",
          "Zaal, keuken, chalet, koer en weide inbegrepen",
        ],
      },
      fr: {
        title: "Privatiser la ferme",
        lede: "Toute la ferme rien que pour vous : 10 heures, jusqu'à 150 personnes, avec accompagnement sur place.",
        details: [
          "10 heures d'usage exclusif de l'ensemble du site",
          "Pour mariages, fêtes d'entreprise, cérémonies, salons ou tournages",
          "Salle, cuisine, chalet, cour et prairie inclus",
        ],
      },
      en: {
        title: "Private hire of the whole farm",
        lede: "The entire farm exclusively yours: 10 hours, up to 150 people, with on-site support.",
        details: [
          "10 hours of exclusive use of the whole site",
          "For weddings, company parties, ceremonies, fairs or shoots",
          "Hall, kitchen, chalet, courtyard and meadow included",
        ],
      },
    },
  },
];

export function rentalPrice(space: RentalSpace, duration: RentalDuration): number {
  return duration === "half" && space.halfDay !== null ? space.halfDay : space.fullDay;
}
