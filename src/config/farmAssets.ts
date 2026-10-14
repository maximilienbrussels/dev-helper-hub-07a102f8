/**
 * Statisch manifest met ENKEL echte, geverifieerde boerderijfoto's.
 *
 * STRIKTE REGEL: Maxim mag nooit AI-beelden genereren of externe/willekeurige
 * afbeeldings-API's (Unsplash, DALL-E, ...) gebruiken. Alleen bestanden uit dit
 * manifest — publieke bestanden uit /public of geverifieerde projectmedia —
 * mogen in de chat verschijnen.
 */

import moestuinAsset from "@/assets/foto/foto-moestuin-bakken.jpg.asset.json";
import erfAsset from "@/assets/foto/foto-erf-pad.jpg.asset.json";
import weideAsset from "@/assets/foto/foto-weide-stal.jpg.asset.json";

export interface FarmAsset {
  id: string;
  title: string;
  category: "animal" | "zone" | "activity";
  /** Publiek pad of geverifieerde project-media-URL. Nooit AI-gegenereerd. */
  imagePath: string;
  alt: string;
  description: string;
  locationTag?: string;
  /** Trefwoorden (NL/FR/EN) die deze kaart activeren. */
  keywords: string[];
}

export const FARM_ASSETS: Record<string, FarmAsset> = {
  geiten: {
    id: "geiten",
    title: "De Dwerggeiten",
    category: "animal",
    imagePath: "/fiches/dwerggeiten.webp",
    alt: "Dwerggeiten op de weide van Maximilien",
    description: "Nieuwsgierig en dol op aandacht! Te vinden op de grote weide.",
    locationTag: "Grote Weide",
    keywords: ["geit", "geiten", "dwerggeit", "chèvre", "chevre", "biquette", "goat"],
  },
  ezels: {
    id: "ezels",
    title: "Onze Ezels",
    category: "animal",
    imagePath: "/fiches/ezels.webp",
    alt: "De ezels van de stadsboerderij",
    description: "Rustig, lief en altijd in voor een begroeting.",
    locationTag: "Ezelstal",
    keywords: ["ezel", "ezels", "âne", "ane", "anes", "donkey"],
  },
  konijnen: {
    id: "konijnen",
    title: "De Konijnen",
    category: "animal",
    imagePath: "/fiches/konijnen.webp",
    alt: "Konijnen in hun ren op de stadsboerderij",
    description: "Zachte snoetjes vlak bij de ingang — perfect voor kleine bezoekers.",
    locationTag: "Kleine dierenhoek",
    keywords: ["konijn", "konijnen", "lapin", "lapins", "rabbit"],
  },
  schapen: {
    id: "schapen",
    title: "Ouessant-schapen",
    category: "animal",
    imagePath: "/fiches/ouessant-schapen.webp",
    alt: "Ouessant-schapen grazen op de weide",
    description: "De kleinste schapen ter wereld, echte grasmaaiers van dienst.",
    locationTag: "Grote Weide",
    keywords: ["schaap", "schapen", "mouton", "moutons", "sheep", "ouessant"],
  },
  ponys: {
    id: "ponys",
    title: "Shetlandpony's",
    category: "animal",
    imagePath: "/fiches/shetlandponys.webp",
    alt: "Shetlandpony's op de boerderij",
    description: "Klein maar dapper, en altijd samen op pad.",
    locationTag: "Ponyweide",
    keywords: ["pony", "ponys", "pony's", "poney", "shetland", "paard", "cheval", "horse"],
  },
  alpacas: {
    id: "alpacas",
    title: "De Alpaca's",
    category: "animal",
    imagePath: "/fiches/alpacas.webp",
    alt: "Alpaca's op de weide van de stadsboerderij",
    description: "Zachte blikken en nog zachtere vacht — publiekslievelingen.",
    locationTag: "Alpacaweide",
    keywords: ["alpaca", "alpacas", "alpaga", "lama"],
  },
  kippen: {
    id: "kippen",
    title: "Hoenders & Kippen",
    category: "animal",
    imagePath: "/fiches/hoenders.webp",
    alt: "Kippen en hoenders scharrelen op het erf",
    description: "Scharrelen vrolijk rond het erf, vaak op zoek naar wormpjes.",
    locationTag: "Erf",
    keywords: ["kip", "kippen", "hoender", "hoenders", "poule", "poules", "chicken", "hen"],
  },
  eenden: {
    id: "eenden",
    title: "Eenden & Ganzen",
    category: "animal",
    imagePath: "/fiches/eenden.webp",
    alt: "Eenden bij de vijver van de boerderij",
    description: "Luidruchtig gezelschap aan het water, altijd in beweging.",
    locationTag: "Vijverzone",
    keywords: ["eend", "eenden", "gans", "ganzen", "canard", "oie", "duck", "goose"],
  },
  moestuin: {
    id: "moestuin",
    title: "Educatieve Moestuin",
    category: "zone",
    imagePath: moestuinAsset.url,
    alt: "Biologische moestuin in hartje Brussel",
    description: "Seizoensgroenten, kruiden en bijenvriendelijke bloemen.",
    locationTag: "Moestuinzone",
    keywords: ["moestuin", "tuin", "groente", "groenten", "potager", "jardin", "garden", "kruiden"],
  },
  zaalverhuur: {
    id: "zaalverhuur",
    title: "Zaal & Cafetaria",
    category: "zone",
    imagePath: "/og/zaalverhuur.png",
    alt: "Polyvalente zaal van de stadsboerderij",
    description: "Beschikbaar voor evenementen, verjaardagen en workshops.",
    locationTag: "Hoofdgebouw",
    keywords: [
      "zaal",
      "zaalverhuur",
      "cafetaria",
      "cafétaria",
      "salle",
      "location de salle",
      "hall",
      "cafeteria",
      "teambuilding",
      "seminarie",
    ],
  },
  erf: {
    id: "erf",
    title: "Het Erf",
    category: "zone",
    imagePath: erfAsset.url,
    alt: "Het centrale erf van Maximilien",
    description: "Het hart van de boerderij — hier start elk bezoek.",
    locationTag: "Ingang Schipperijkaai 2",
    keywords: ["erf", "ingang", "onthaal", "cour", "entrée", "entree", "yard", "entrance"],
  },
  weide: {
    id: "weide",
    title: "Weide & Stal",
    category: "zone",
    imagePath: weideAsset.url,
    alt: "De grote weide met stal van de stadsboerderij",
    description: "Grote grasvlakte waar de dieren overdag rondlopen.",
    locationTag: "Grote Weide",
    keywords: ["weide", "wei", "stal", "prairie", "étable", "etable", "meadow", "barn"],
  },
};

/** Zoekt de best passende fotokaart bij een tekst. Geeft null als niets past. */
export function findFarmAsset(
  text: string,
  assets: Record<string, FarmAsset> = FARM_ASSETS,
): FarmAsset | null {
  const haystack = text.toLowerCase();
  for (const asset of Object.values(assets)) {
    if (asset.keywords.some((k) => haystack.includes(k))) return asset;
  }
  return null;
}

/** Leest een expliciete markering [[foto:id]] uit een antwoord van Maxim. */
export function extractAssetMarker(
  text: string,
  assets: Record<string, FarmAsset> = FARM_ASSETS,
): { asset: FarmAsset | null; clean: string } {
  const match = /\[\[foto:([a-z0-9_-]+)\]\]/i.exec(text);
  const clean = text.replace(/\[\[foto:[a-z0-9_-]+\]\]/gi, "").trim();
  if (!match) return { asset: null, clean };
  return { asset: assets[match[1]!.toLowerCase()] ?? null, clean };
}
