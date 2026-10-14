/**
 * Sfeerfoto's van de boerderij, opgehaald uit de Europese beeldopslag
 * (Scaleway Object Storage, regio Parijs). De grote openingsfoto van de
 * homepagina staat hier bewust NIET in: die blijft lokaal en hardgecodeerd.
 */
const BASE = "https://maximilien-media.s3.fr-par.scw.cloud/site";

type Photo = { key: string; alt: Record<"nl" | "fr" | "en", string> };

const PHOTOS: Photo[] = [
  {
    key: "foto-alpacas-weide.jpg",
    alt: {
      nl: "Alpaca's in de weide van de boerderij",
      fr: "Alpagas dans la prairie de la ferme",
      en: "Alpacas in the farm meadow",
    },
  },
  {
    key: "foto-geit-madeliefjes.jpg",
    alt: {
      nl: "Geit tussen de madeliefjes",
      fr: "Chèvre parmi les pâquerettes",
      en: "Goat among the daisies",
    },
  },
  {
    key: "foto-pony-boom.jpg",
    alt: {
      nl: "Pony onder een boom",
      fr: "Poney sous un arbre",
      en: "Pony under a tree",
    },
  },
  {
    key: "foto-pauw-pronkend.jpg",
    alt: {
      nl: "Pronkende pauw op het erf",
      fr: "Paon faisant la roue dans la cour",
      en: "Peacock displaying its tail in the yard",
    },
  },
  {
    key: "foto-moestuin-bakken.jpg",
    alt: {
      nl: "Moestuinbakken met groenten",
      fr: "Bacs du potager remplis de légumes",
      en: "Raised vegetable beds",
    },
  },
  {
    key: "foto-schapen.jpg",
    alt: {
      nl: "Schapen in het park",
      fr: "Moutons dans le parc",
      en: "Sheep in the park",
    },
  },
  {
    key: "sfeer-kinderen-zaden.jpg",
    alt: {
      nl: "Kinderen zaaien zaden in de moestuin",
      fr: "Des enfants sèment des graines au potager",
      en: "Children sowing seeds in the vegetable garden",
    },
  },
  {
    key: "foto-erf-pad.jpg",
    alt: {
      nl: "Het pad over het erf van de boerderij",
      fr: "Le chemin traversant la cour de la ferme",
      en: "The path across the farmyard",
    },
  },
];

export const FARM_GALLERY = PHOTOS.map((p) => ({
  url: `${BASE}/${p.key}`,
  alt: p.alt,
}));

export const farmGalleryUrls = () => FARM_GALLERY.map((p) => p.url);
