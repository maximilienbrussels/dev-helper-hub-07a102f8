// Rich editorial layer on top of the database products.
// The database holds price/stock/title; this file holds the storytelling
// fields (producer, packaging options, impact, accordion copy) keyed by
// product id so the shop keeps working even when the DB drifts.

import kippenvoerImgAsset from "@/assets/product-kippenvoer.jpg.asset.json";
const kippenvoerImg = kippenvoerImgAsset.url;
import hooiImgAsset from "@/assets/product-hooi.jpg.asset.json";
const hooiImg = hooiImgAsset.url;
import emmerImgAsset from "@/assets/product-emmer.jpg.asset.json";
const emmerImg = emmerImgAsset.url;
import honingImgAsset from "@/assets/product-honing.jpg.asset.json";
const honingImg = honingImgAsset.url;
import compostImgAsset from "@/assets/product-compost.jpg.asset.json";
const compostImg = compostImgAsset.url;
import eierenImgAsset from "@/assets/product-eieren.jpg.asset.json";
const eierenImg = eierenImgAsset.url;
import sfeerErfAsset from "@/assets/foto/foto-erf-pad.jpg.asset.json";
import sfeerMoestuinAsset from "@/assets/foto/foto-moestuin-bakken.jpg.asset.json";
import sfeerBloemenAsset from "@/assets/foto/foto-geit-madeliefjes.jpg.asset.json";
const sfeerErf = sfeerErfAsset.url;
const sfeerMoestuin = sfeerMoestuinAsset.url;
const sfeerBloemen = sfeerBloemenAsset.url;

export type Producer = {
  name: string;
  location: string;
  avatarUrl?: string;
};

export type PackagingOption = {
  id: string;
  label: string;
  /** Extra cost in cents, added on top of the product price. */
  priceOffset: number;
  description: string;
};

export type SustainabilityImpact = {
  plasticSavedGrams: number;
  bioCertified: boolean;
};

export type ProductDetail = {
  /** Matches products.id in the database. */
  id: number;
  slug: string;
  category: string;
  images: string[];
  producer: Producer;
  distanceKm: number;
  packagingOptions: PackagingOption[];
  sustainabilityImpact: SustainabilityImpact;
  ingredients: string[];
  storageInfo: string;
  pickupInfo: string;
  /** Product ids that pair well with this one. */
  frequentlyBoughtTogether: number[];
};

const OWN_PACKAGING: PackagingOption = {
  id: "own",
  label: "Eigen verpakking mee",
  priceOffset: 0,
  description: "Breng je eigen zak, doos of pot mee. Volledig verpakkingsvrij.",
};

const WECKPOT: PackagingOption = {
  id: "weckpot",
  label: "Herbruikbare weckpot",
  priceOffset: 250,
  description:
    "Glazen weckpot met €2,50 waarborg — breng hem terug en krijg je waarborg cash terug.",
};

const KRAFT: PackagingOption = {
  id: "kraft",
  label: "Papieren zak",
  priceOffset: 30,
  description: "Composteerbare kraftzak van gerecycleerd papier (+€0,30).",
};

export const PRODUCT_DETAILS: ProductDetail[] = [
  {
    id: 1,
    slug: "biologisch-kippenvoer",
    category: "Dierenvoer",
    images: [kippenvoerImg, sfeerErf, sfeerMoestuin],
    producer: { name: "Molen De Vier Winden", location: "Sint-Jans-Molenbeek" },
    distanceKm: 4,
    packagingOptions: [OWN_PACKAGING, KRAFT],
    sustainabilityImpact: { plasticSavedGrams: 45, bioCertified: true },
    ingredients: ["Tarwe", "Gerst", "Maïs", "Zonnebloempitten", "Schelpengruis"],
    storageInfo: "Droog en donker bewaren in een gesloten bak. Houdbaar tot 9 maanden.",
    pickupInfo: "Zelf scheppen uit de silo in de voederschuur, tijdens de openingsuren.",
    frequentlyBoughtTogether: [2, 3],
  },
  {
    id: 2,
    slug: "hooi-voor-konijnen",
    category: "Dierenvoer",
    images: [hooiImg, sfeerErf],
    producer: { name: "Weides Maximiliaanpark", location: "Brussel 1000" },
    distanceKm: 1,
    packagingOptions: [OWN_PACKAGING, KRAFT],
    sustainabilityImpact: { plasticSavedGrams: 30, bioCertified: true },
    ingredients: ["Grasklaver", "Timotheegras", "Kruidenrijk stadshooi"],
    storageInfo: "Luchtig en droog bewaren. Nooit in plastic — hooi moet ademen.",
    pickupInfo: "Klaargelegd aan de balie van de hoevewinkel.",
    frequentlyBoughtTogether: [1, 5],
  },
  {
    id: 3,
    slug: "emmer-5l-statiegeld",
    category: "Circulair",
    images: [emmerImg, sfeerErf],
    producer: { name: "Repair Atelier Maximilien", location: "Brussel 1000" },
    distanceKm: 0,
    packagingOptions: [OWN_PACKAGING],
    sustainabilityImpact: { plasticSavedGrams: 220, bioCertified: false },
    ingredients: ["Verzinkt staal", "Hergebruikt handvat"],
    storageInfo: "Spoel na gebruik met koud water. Gaat jarenlang mee.",
    pickupInfo: "Retour brengen kan elke openingsdag; je waarborg krijg je meteen terug.",
    frequentlyBoughtTogether: [1, 5],
  },
  {
    id: 4,
    slug: "pot-honing",
    category: "Hoeveproducten",
    images: [honingImg, sfeerBloemen, sfeerMoestuin],
    producer: { name: "Imkerij Daktuin Maximilien", location: "Brussel 1000" },
    distanceKm: 0,
    packagingOptions: [OWN_PACKAGING, WECKPOT],
    sustainabilityImpact: { plasticSavedGrams: 90, bioCertified: true },
    ingredients: ["100% rauwe bloemenhoning uit Brusselse stadsimkerij"],
    storageInfo: "Op kamertemperatuur bewaren, weg van direct zonlicht. Kristallisatie is normaal.",
    pickupInfo: "Af te halen in de hoevewinkel; lege potten breng je terug voor je waarborg.",
    frequentlyBoughtTogether: [6, 5],
  },
  {
    id: 5,
    slug: "compost",
    category: "Tuin",
    images: [compostImg, sfeerMoestuin],
    producer: { name: "Kringloop Maximilien", location: "Brussel 1000" },
    distanceKm: 0,
    packagingOptions: [OWN_PACKAGING, KRAFT],
    sustainabilityImpact: { plasticSavedGrams: 60, bioCertified: true },
    ingredients: ["Gerijpte compost van keuken- en tuinafval uit de wijk"],
    storageInfo: "Vochtig en afgedekt bewaren. Direct te gebruiken in bak of moestuin.",
    pickupInfo: "Zelf scheppen aan de composthoek — schep staat klaar.",
    frequentlyBoughtTogether: [3, 2],
  },
  {
    id: 6,
    slug: "boerderij-eieren",
    category: "Hoeveproducten",
    images: [eierenImg, sfeerErf, sfeerBloemen],
    producer: { name: "Kippenren Maximilien", location: "Brussel 1000" },
    distanceKm: 0,
    packagingOptions: [OWN_PACKAGING, KRAFT],
    sustainabilityImpact: { plasticSavedGrams: 25, bioCertified: true },
    ingredients: ["Verse eieren van vrij scharrelende kippen"],
    storageInfo: "Koel bewaren, niet wassen. Best binnen 3 weken opgebruiken.",
    pickupInfo: "Breng je eigen eierdoos mee; wij vullen ze aan de balie.",
    frequentlyBoughtTogether: [4, 5],
  },
];

const BY_ID = new Map(PRODUCT_DETAILS.map((d) => [d.id, d]));
const BY_SLUG = new Map(PRODUCT_DETAILS.map((d) => [d.slug, d]));

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Editorial detail for a product id, or null when the product is unknown. */
export function detailForId(id: number): ProductDetail | null {
  return BY_ID.get(id) ?? null;
}

export function detailForSlug(slug: string): ProductDetail | null {
  return BY_SLUG.get(slug) ?? null;
}

export function slugForProduct(product: { id: number; title: string }): string {
  return BY_ID.get(product.id)?.slug ?? slugify(product.title);
}

/**
 * Foto voor een productkaart: database-foto's (product_images, dan image_url)
 * zijn de bron van waarheid; de statische storytelling-afbeelding is enkel
 * fallback voor producten die nog geen foto in de database hebben.
 */
export function imageForProduct(product: {
  id: number;
  image_url?: string | null;
  images?: { url: string }[];
}): string | null {
  return product.images?.[0]?.url ?? product.image_url ?? BY_ID.get(product.id)?.images[0] ?? null;
}

/**
 * Volledige galerij voor de productdetailpagina: alle database-foto's,
 * aangevuld met image_url en, enkel als de database geen enkele foto heeft,
 * de statische storytelling-foto's.
 */
export function galleryForProduct(product: {
  id: number;
  image_url?: string | null;
  images?: { url: string }[];
}): string[] {
  const dbImages = (product.images ?? []).map((i) => i.url);
  if (dbImages.length > 0) return dbImages;
  if (product.image_url) return [product.image_url];
  return BY_ID.get(product.id)?.images ?? [];
}

export function packagingOptionsForId(id: number): PackagingOption[] {
  return BY_ID.get(id)?.packagingOptions ?? [OWN_PACKAGING];
}

export function packagingOption(id: number, optionId: string | undefined): PackagingOption | null {
  if (!optionId) return null;
  return packagingOptionsForId(id).find((o) => o.id === optionId) ?? null;
}

/** Free pickup gift threshold used by the cart progress bar (in cents). */
export const FREE_GIFT_THRESHOLD_CENTS = 2000;
