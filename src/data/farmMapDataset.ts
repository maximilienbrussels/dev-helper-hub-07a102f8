/**
 * Eén bron van waarheid voor de officiële plattegrond van de boerderij:
 * de 15 genummerde zones (dieren, tuinen, voorzieningen) met hun positie op
 * de kaart (percentages), soortinfo, bewoners, voedingsregels en geluid.
 *
 * Bezoekersingang: Schipperijkaai / Quai du Batelage.
 */
import type { Lang } from "@/lib/i18n";

export type FarmZoneCategory = "animal" | "garden" | "facility";

export interface FarmZone {
  id: number;
  slug: string;
  nameNl: string;
  nameFr: string;
  nameEn: string;
  category: FarmZoneCategory;
  icon: string;
  /** Relatieve positie op de kaartafbeelding, in procenten. */
  mapCoords: { x: number; y: number };
  species?: string;
  /** Sleutelwoord om de zone aan de dieren uit de databank te koppelen. */
  speciesMatch?: RegExp;
  names?: string[];
  descriptionNl: string;
  descriptionFr: string;
  descriptionEn: string;
  dietRules?: string;
  dietRulesFr?: string;
  dietRulesEn?: string;
  soundEmoji?: string;
  /** Afstand tot de bezoekersingang, in stappen (indicatief). */
  stepsFromEntrance?: number;
}

/** Bezoekersingang op de kaart (Schipperijkaai / Quai du Batelage). */
export const ENTRANCE = {
  mapCoords: { x: 74, y: 44 },
  nameNl: "Ingang bezoekers · Schipperijkaai",
  nameFr: "Entrée visiteurs · Quai du Batelage",
  nameEn: "Visitor entrance · Schipperijkaai",
  ctaNl: "Jouw wandelroute start hier!",
  ctaFr: "Votre promenade commence ici !",
  ctaEn: "Your walking route starts here!",
};

export const FARM_MAP_DATA: FarmZone[] = [
  {
    id: 1,
    slug: "kippen-hanen",
    nameNl: "Kippen & Hanen",
    nameFr: "Les Poules & Coqs",
    nameEn: "Chickens & Roosters",
    category: "animal",
    icon: "🐓",
    mapCoords: { x: 55, y: 48 },
    species: "Brabants Hoen & Mechels Hoen",
    speciesMatch: /(kip|haan|poule|coq|chicken|rooster)/i,
    descriptionNl: "Scharrelen vrolijk rond op het centrale erf en leggen dagelijks verse eitjes.",
    descriptionFr: "Picorent joyeusement dans la cour centrale et pondent chaque jour des œufs frais.",
    descriptionEn: "Happily scratch around the central yard and lay fresh eggs every day.",
    dietRules: "⚠️ Voer alleen goedgekeurd graan. Geen verwerkt eten!",
    dietRulesFr: "⚠️ Uniquement du grain approuvé. Pas de nourriture transformée !",
    dietRulesEn: "⚠️ Approved grain only. No processed food!",
    soundEmoji: "TOK TOK! 🐔",
    stepsFromEntrance: 120,
  },
  {
    id: 2,
    slug: "konijnen",
    nameNl: "Konijnen",
    nameFr: "Les Lapins",
    nameEn: "Rabbits",
    category: "animal",
    icon: "🐇",
    mapCoords: { x: 42, y: 18 },
    species: "Vlaamse Reus & Dwergkonijnen",
    speciesMatch: /(konijn|lapin|rabbit)/i,
    descriptionNl: "Huppelen rond in hun beschermde ren nabij de personeelsingang.",
    descriptionFr: "Gambadent dans leur enclos protégé près de l'entrée du personnel.",
    descriptionEn: "Hop around in their sheltered run near the staff entrance.",
    dietRules: "⚠️ Uitsluitend vers hooi en knabbelgroenten. ABSOLUUT GEEN BROOD!",
    dietRulesFr: "⚠️ Uniquement du foin frais et des légumes à grignoter. SURTOUT PAS DE PAIN !",
    dietRulesEn: "⚠️ Fresh hay and nibbling vegetables only. ABSOLUTELY NO BREAD!",
    soundEmoji: "SNUFFEL 🐰",
    stepsFromEntrance: 260,
  },
  {
    id: 3,
    slug: "eenden-ganzen",
    nameNl: "Eenden & Ganzen",
    nameFr: "Les Canards & Oies",
    nameEn: "Ducks & Geese",
    category: "animal",
    icon: "🦆",
    mapCoords: { x: 38, y: 32 },
    species: "Brusselse Kwak-eenden & Huisganzen",
    speciesMatch: /(eend|gans|canard|oie|duck|goose)/i,
    descriptionNl: "Genieten van hun grote vijver midden op het terrein.",
    descriptionFr: "Profitent de leur grande mare au milieu du terrain.",
    descriptionEn: "Enjoy their big pond in the middle of the grounds.",
    dietRules: "⚠️ Geen witbrood! Dat veroorzaakt vleugelvergroeiing (engelvleugels).",
    dietRulesFr: "⚠️ Pas de pain blanc ! Il provoque une déformation des ailes (ailes d'ange).",
    dietRulesEn: "⚠️ No white bread! It causes wing deformities (angel wing).",
    soundEmoji: "KWAK KWAK! 🦆",
    stepsFromEntrance: 220,
  },
  {
    id: 4,
    slug: "ezels",
    nameNl: "Ezels",
    nameFr: "Les Ânes",
    nameEn: "Donkeys",
    category: "animal",
    icon: "🫏",
    mapCoords: { x: 62, y: 35 },
    species: "Poitou & Provence Ezels",
    speciesMatch: /(ezel|âne|ane|donkey)/i,
    names: ["Boudewijn"],
    descriptionNl: "Onze rustige bewakers van de hoofdingang aan de Schipperijkaai.",
    descriptionFr: "Nos calmes gardiens de l'entrée principale, quai du Batelage.",
    descriptionEn: "Our calm guardians of the main entrance on the Schipperijkaai.",
    dietRules: "⚠️ ERNSTIGE WAARSCHUWING: geen brood of suikerklontjes geven! Gevaar voor hoefbevangenheid.",
    dietRulesFr: "⚠️ AVERTISSEMENT : pas de pain ni de sucre ! Risque de fourbure.",
    dietRulesEn: "⚠️ SERIOUS WARNING: no bread or sugar cubes! Risk of laminitis.",
    soundEmoji: "I-AAAH! 🫏",
    stepsFromEntrance: 60,
  },
  {
    id: 5,
    slug: "geiten",
    nameNl: "Geiten",
    nameFr: "Les Chèvres",
    nameEn: "Goats",
    category: "animal",
    icon: "🐐",
    mapCoords: { x: 60, y: 52 },
    species: "Dwerggeiten & Belgische Landgeit",
    speciesMatch: /(geit|chèvre|chevre|goat)/i,
    names: ["Basiel", "Bella", "Margot"],
    descriptionNl: "Nieuwsgierige klimmers vlak bij het centrale plein en de toiletten.",
    descriptionFr: "Grimpeuses curieuses tout près de la place centrale et des toilettes.",
    descriptionEn: "Curious climbers right next to the central square and the toilets.",
    dietRules: "⚠️ Mogen enkel takken en speciaal boerderijvoer knabbelen.",
    dietRulesFr: "⚠️ Uniquement des branches et de la nourriture spéciale de la ferme.",
    dietRulesEn: "⚠️ Branches and special farm feed only.",
    soundEmoji: "MEEE-E-E! 🐐",
    stepsFromEntrance: 110,
  },
  {
    id: 6,
    slug: "schapen",
    nameNl: "Schapen",
    nameFr: "Les Moutons",
    nameEn: "Sheep",
    category: "animal",
    icon: "🐑",
    mapCoords: { x: 58, y: 56 },
    species: "Houtlandschaap & Melkschapen",
    speciesMatch: /(schaap|schapen|lam|mouton|agneau|sheep|lamb)/i,
    descriptionNl: "Begrazen de grote zuidelijke weides richting de Boudewijnlaan.",
    descriptionFr: "Paissent les grandes prairies du sud vers le boulevard Baudouin.",
    descriptionEn: "Graze the large southern meadows towards the Boudewijnlaan.",
    dietRules: "⚠️ Gras en hooi. Geen voer van bezoekers.",
    dietRulesFr: "⚠️ Herbe et foin. Pas de nourriture des visiteurs.",
    dietRulesEn: "⚠️ Grass and hay. No visitor food.",
    soundEmoji: "BÄÄÄH! 🐑",
    stepsFromEntrance: 130,
  },
  {
    id: 7,
    slug: "alpacas",
    nameNl: "Alpaca's",
    nameFr: "Les Alpagas",
    nameEn: "Alpacas",
    category: "animal",
    icon: "🦙",
    mapCoords: { x: 60, y: 62 },
    species: "Huacaya Alpaca",
    speciesMatch: /(alpaca|alpaga)/i,
    descriptionNl: "Zachte bewoners met een nieuwsgierig karakter op de zuidweide.",
    descriptionFr: "Doux habitants au caractère curieux de la prairie sud.",
    descriptionEn: "Gentle residents with a curious character on the south meadow.",
    dietRules: "⚠️ Niet voeren zonder toezicht van een boer.",
    dietRulesFr: "⚠️ Ne pas nourrir sans la surveillance d'un fermier.",
    dietRulesEn: "⚠️ Do not feed without a farmer present.",
    soundEmoji: "HUMMM... 🦙",
    stepsFromEntrance: 160,
  },
  {
    id: 8,
    slug: "pauwen",
    nameNl: "Pauwen",
    nameFr: "Les Paons",
    nameEn: "Peacocks",
    category: "animal",
    icon: "🦚",
    mapCoords: { x: 44, y: 54 },
    species: "Blauwe Pauw",
    speciesMatch: /(pauw|paon|peacock)/i,
    descriptionNl: "Lopen vrij rond over het hele erf en tonen hun prachtige veren.",
    descriptionFr: "Se promènent librement dans toute la ferme et déploient leurs magnifiques plumes.",
    descriptionEn: "Roam freely across the whole farm and show off their magnificent feathers.",
    dietRules: "⚠️ Laten scharrelen, niet opjagen.",
    dietRulesFr: "⚠️ Laissez-les picorer, ne les pourchassez pas.",
    dietRulesEn: "⚠️ Let them roam, don't chase them.",
    soundEmoji: "E-O! 🦚",
    stepsFromEntrance: 200,
  },
  {
    id: 9,
    slug: "ponys",
    nameNl: "Pony's",
    nameFr: "Les Poneys",
    nameEn: "Ponies",
    category: "animal",
    icon: "🐴",
    mapCoords: { x: 40, y: 68 },
    species: "Shetland & Welsh Pony",
    speciesMatch: /(pony|paard|cheval|poney|horse)/i,
    descriptionNl: "Te vinden in de zuidelijke paddock nabij het speelplein.",
    descriptionFr: "À retrouver dans le paddock sud, près de la plaine de jeux.",
    descriptionEn: "Found in the southern paddock next to the playground.",
    dietRules: "⚠️ Strikt dieet van de boer! Geen appels of brood.",
    dietRulesFr: "⚠️ Régime strict du fermier ! Pas de pommes ni de pain.",
    dietRulesEn: "⚠️ Strict farmer's diet! No apples or bread.",
    soundEmoji: "HINNNIK! 🐴",
    stepsFromEntrance: 240,
  },
  {
    id: 10,
    slug: "bijenkorven",
    nameNl: "De Bijenkorven",
    nameFr: "Les Ruches",
    nameEn: "The Beehives",
    category: "animal",
    icon: "🐝",
    mapCoords: { x: 48, y: 28 },
    species: "Brusselse Stadsbijen",
    speciesMatch: /(bij|abeille|bee)/i,
    descriptionNl: "Zorgen voor de bestuiving van onze moestuin en heerlijke honing.",
    descriptionFr: "Assurent la pollinisation de notre potager et un délicieux miel.",
    descriptionEn: "Pollinate our vegetable garden and make delicious honey.",
    dietRules: "⚠️ Bewaar afstand van de korven.",
    dietRulesFr: "⚠️ Gardez vos distances avec les ruches.",
    dietRulesEn: "⚠️ Keep your distance from the hives.",
    soundEmoji: "ZZZZZZ... 🐝",
    stepsFromEntrance: 190,
  },
  {
    id: 11,
    slug: "maxi-moestuin",
    nameNl: "De Maxi'Moestuin",
    nameFr: "Le Maxi'Potager",
    nameEn: "The Maxi'Garden",
    category: "garden",
    icon: "🥦",
    mapCoords: { x: 32, y: 38 },
    descriptionNl: "Onze grote educatieve stadsmoestuin.",
    descriptionFr: "Notre grand potager éducatif urbain.",
    descriptionEn: "Our big educational city vegetable garden.",
  },
  {
    id: 12,
    slug: "weide",
    nameNl: "De Weide",
    nameFr: "La Prairie",
    nameEn: "The Meadow",
    category: "garden",
    icon: "🌾",
    mapCoords: { x: 28, y: 48 },
    descriptionNl: "Open grasland voor ecologische begrazing.",
    descriptionFr: "Prairie ouverte pour le pâturage écologique.",
    descriptionEn: "Open grassland for ecological grazing.",
  },
  {
    id: 13,
    slug: "compost",
    nameNl: "De Compost",
    nameFr: "Le Compost",
    nameEn: "The Compost",
    category: "facility",
    icon: "♻️",
    mapCoords: { x: 42, y: 48 },
    descriptionNl: "Demonstratiecompostering voor de wijk.",
    descriptionFr: "Site de compostage de démonstration pour le quartier.",
    descriptionEn: "Demonstration composting for the neighbourhood.",
  },
  {
    id: 14,
    slug: "moestuin",
    nameNl: "De Moestuin",
    nameFr: "Le Potager",
    nameEn: "The Vegetable Garden",
    category: "garden",
    icon: "🥕",
    mapCoords: { x: 22, y: 15 },
    descriptionNl: "Kleine groententuin nabij de personeelsingang.",
    descriptionFr: "Petit potager près de l'entrée du personnel.",
    descriptionEn: "Small vegetable garden near the staff entrance.",
  },
  {
    id: 15,
    slug: "maxi-compost",
    nameNl: "De Maxi'Compost",
    nameFr: "Le Maxi'Compost",
    nameEn: "The Maxi'Compost",
    category: "facility",
    icon: "🪱",
    mapCoords: { x: 80, y: 22 },
    descriptionNl: "Wijkcompostering voor organisch afval.",
    descriptionFr: "Compostage de quartier pour les déchets organiques.",
    descriptionEn: "Neighbourhood composting for organic waste.",
  },
];

export function zoneName(z: FarmZone, lang: Lang): string {
  return lang === "fr" ? z.nameFr : lang === "en" ? z.nameEn : z.nameNl;
}

export function zoneDescription(z: FarmZone, lang: Lang): string {
  return lang === "fr" ? z.descriptionFr : lang === "en" ? z.descriptionEn : z.descriptionNl;
}

export function zoneDietRules(z: FarmZone, lang: Lang): string | undefined {
  return lang === "fr" ? (z.dietRulesFr ?? z.dietRules) : lang === "en" ? (z.dietRulesEn ?? z.dietRules) : z.dietRules;
}

export function zoneBySlug(slug: string): FarmZone | undefined {
  return FARM_MAP_DATA.find((z) => z.slug === slug);
}

/** Zone voor een diersoort uit de databank (bv. "Ezel" → zone 4). */
export function zoneForSpecies(species: string): FarmZone | undefined {
  return FARM_MAP_DATA.find((z) => z.speciesMatch?.test(species));
}

/** Korte plaatsaanduiding t.o.v. de bezoekersingang. */
export function proximityLabel(z: FarmZone, lang: Lang): string {
  const s = z.stepsFromEntrance ?? 150;
  if (s <= 80) {
    return { nl: "Vlak bij de bezoekersingang", fr: "Tout près de l'entrée visiteurs", en: "Right by the visitor entrance" }[lang];
  }
  if (s <= 150) {
    return { nl: "Op een paar minuten wandelen van de ingang", fr: "À quelques minutes de marche de l'entrée", en: "A few minutes' walk from the entrance" }[lang];
  }
  return { nl: "Achteraan op het terrein, volg de wandelroute", fr: "Au fond du terrain, suivez la promenade", en: "At the back of the grounds, follow the walking route" }[lang];
}
