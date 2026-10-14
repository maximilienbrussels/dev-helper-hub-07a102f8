/**
 * Fotoalbums van de boerderij.
 * Eén plek waar alle echte foto's staan met hun drietalige omschrijving, zodat
 * pagina's en de dierenfiches er een carrousel van kunnen maken. Nieuwe foto's
 * hier toevoegen (en eventueel aan een album/soort hangen) is genoeg.
 */
import type { Lang } from "@/lib/routes-i18n";
import { lib } from "@/lib/photo-library";

import fotoEzelAaien from "@/assets/foto/foto-ezel-aaien.jpg.asset.json";
import fotoKippenRen from "@/assets/foto/foto-kippen-ren.jpg.asset.json";
import fotoEendenVijver from "@/assets/foto/foto-eenden-vijver.jpg.asset.json";
import fotoKonijnStal from "@/assets/foto/foto-konijn-stal.jpg.asset.json";
import fotoKinderenGeleKoe from "@/assets/foto/foto-kinderen-gele-koe.jpg.asset.json";
import fotoMoestuinZonnebloem from "@/assets/foto/foto-moestuin-zonnebloem.jpg.asset.json";
import fotoMoestuinCourgette from "@/assets/foto/foto-moestuin-courgette.jpg.asset.json";
import fotoMoestuinCourgettePlant from "@/assets/foto/foto-moestuin-courgetteplant.jpg.asset.json";
import fotoBoomgaardPeren from "@/assets/foto/foto-boomgaard-peren.jpg.asset.json";
import fotoBoomgaardPerenboom from "@/assets/foto/foto-boomgaard-perenboom.jpg.asset.json";

import fotoGeitenGroep from "@/assets/foto/foto-geiten-groep.jpg.asset.json";
import fotoGeitMadeliefjes from "@/assets/foto/foto-geit-madeliefjes.jpg.asset.json";
import fotoGeit from "@/assets/foto/foto-geit.jpg.asset.json";
import fotoSchapen from "@/assets/foto/foto-schapen.jpg.asset.json";
import fotoEzel from "@/assets/foto/foto-ezel.jpg.asset.json";
import fotoPauwPronkend from "@/assets/foto/foto-pauw-pronkend.jpg.asset.json";
import fotoPauw from "@/assets/foto/foto-pauw.jpg.asset.json";
import fotoPonyBoom from "@/assets/foto/foto-pony-boom.jpg.asset.json";
import fotoPonyHerfst from "@/assets/foto/foto-pony-herfst.jpg.asset.json";
import fotoAlpacasTwee from "@/assets/foto/foto-alpacas-twee.jpg.asset.json";
import fotoAlpacasRust from "@/assets/foto/foto-alpacas-rust.jpg.asset.json";
import fotoAlpacasWeide from "@/assets/foto/foto-alpacas-weide.jpg.asset.json";
import fotoMoestuinBakken from "@/assets/foto/foto-moestuin-bakken.jpg.asset.json";
import fotoErfPad from "@/assets/foto/foto-erf-pad.jpg.asset.json";
import fotoWeideStal from "@/assets/foto/foto-weide-stal.jpg.asset.json";
import fotoTrojaansPaard from "@/assets/foto/foto-trojaans-paard.jpg.asset.json";

type T3 = Record<Lang, string>;
export type Photo = { src: string; alt: T3 };

const P = (src: string, nl: string, fr: string, en: string): Photo => ({
  src,
  alt: { nl, fr, en },
});

/** Alle foto's per thema. */
export const PHOTO_ALBUMS: Record<string, Photo[]> = {
  ezels: [
    P(fotoEzelAaien.url, "Een kind aait de ezel in de stal", "Un enfant caresse l'âne à l'étable", "A child pets the donkey in the stable"),
    P(fotoEzel.url, "Onze ezel op het erf", "Notre âne dans la cour", "Our donkey in the yard"),
  ],
  geiten: [
    P(fotoGeitenGroep.url, "De geitenkudde bij het hooi", "Le troupeau de chèvres près du foin", "The goat herd at the hay"),
    P(fotoGeitMadeliefjes.url, "Geit tussen de madeliefjes", "Chèvre parmi les pâquerettes", "Goat among the daisies"),
    P(fotoGeit.url, "Geit in de weide", "Chèvre au pré", "Goat in the meadow"),
  ],
  schapen: [
    P(fotoSchapen.url, "De schapen in de weide", "Les moutons au pré", "The sheep in the meadow"),
    P(fotoWeideStal.url, "De weide met de stal", "Le pré et l'étable", "The meadow with the stable"),
  ],
  kippen: [
    P(fotoKippenRen.url, "Kippen scharrelen in de ren", "Les poules grattent dans l'enclos", "Chickens scratching in the run"),
  ],
  eenden: [
    P(fotoEendenVijver.url, "Eenden op de vijver bij de pomp", "Canards sur la mare près de la pompe", "Ducks on the pond by the pump"),
  ],
  konijnen: [
    P(fotoKonijnStal.url, "Een wit konijn springt door de stal", "Un lapin blanc bondit dans l'étable", "A white rabbit hopping through the stable"),
  ],
  pauwen: [
    P(fotoPauwPronkend.url, "Pauw die pronkt", "Paon qui fait la roue", "Peacock displaying"),
    P(fotoPauw.url, "De pauw op het erf", "Le paon dans la cour", "The peacock in the yard"),
  ],
  pony: [
    P(fotoPonyBoom.url, "De pony onder de boom", "Le poney sous l'arbre", "The pony under the tree"),
    P(fotoPonyHerfst.url, "De pony in de herfst", "Le poney en automne", "The pony in autumn"),
  ],
  alpacas: [
    P(fotoAlpacasTwee.url, "Twee alpaca's", "Deux alpagas", "Two alpacas"),
    P(fotoAlpacasRust.url, "Alpaca's rusten in de schaduw", "Alpagas au repos à l'ombre", "Alpacas resting in the shade"),
    P(fotoAlpacasWeide.url, "Alpaca's in de weide", "Alpagas au pré", "Alpacas in the meadow"),
  ],
  moestuin: [
    P(fotoMoestuinZonnebloem.url, "Zonnebloemen boven de moestuinbakken", "Tournesols au-dessus des bacs du potager", "Sunflowers above the garden beds"),
    P(fotoMoestuinCourgettePlant.url, "Courgetteplant in volle groei", "Plant de courgette en pleine croissance", "Courgette plant in full growth"),
    P(fotoMoestuinCourgette.url, "Een rijpe courgette tussen de bladeren", "Une courgette mûre entre les feuilles", "A ripe courgette between the leaves"),
    P(fotoMoestuinBakken.url, "De moestuinbakken in de zomer", "Les bacs du potager en été", "The garden beds in summer"),
  ],
  boomgaard: [
    P(fotoBoomgaardPerenboom.url, "Peren aan de leiboom", "Poires sur l'arbre palissé", "Pears on the espalier tree"),
    P(fotoBoomgaardPeren.url, "Rijpende peren in de boomgaard", "Poires mûrissantes au verger", "Ripening pears in the orchard"),
  ],
  erf: [
    P(fotoKinderenGeleKoe.url, "Kinderen bij de gele koe op het erf", "Des enfants près de la vache jaune", "Children by the yellow cow in the yard"),
    P(fotoErfPad.url, "Het erf met de woontorens op de achtergrond", "La cour et les tours en arrière-plan", "The farmyard with the towers behind"),
    P(fotoTrojaansPaard.url, "Het houten paard op het erf", "Le cheval en bois dans la cour", "The wooden horse in the yard"),
  ],
};

/**
 * Nieuwe fotobibliotheek (Scaleway, map `bibliotheek/`) per album.
 * De bibliotheekfoto's komen eerst — dat zijn de opgeschoonde, uitgesneden
 * beelden — daarna de oudere foto's uit `src/assets/foto`.
 */
const LIB_FOLDERS: Record<string, string[]> = {
  alpacas: ["dieren/alpacas"],
  geiten: ["dieren/geiten"],
  schapen: ["dieren/schapen"],
  ezels: ["dieren/ezels"],
  pony: ["dieren/ponys"],
  pauwen: ["dieren/pauwen"],
  kippen: ["dieren/kippen"],
  eenden: ["dieren/eenden-ganzen"],
  konijnen: ["dieren/konijnen"],
  cavias: ["dieren/knaagdieren"],
  moestuin: ["tuin/moestuin"],
  boomgaard: ["tuin/boomgaard"],
  vijver: ["natuur/vijver"],
  paden: ["natuur/paden"],
  erf: ["erf/gebouwen", "erf/trojaans-paard"],
  kinderen: ["bezoek/kinderen"],
  speeltuin: ["bezoek/speeltuin"],
  educatie: ["educatie/borden-en-workshops"],
};

for (const [key, folders] of Object.entries(LIB_FOLDERS)) {
  const seen = new Set<string>();
  PHOTO_ALBUMS[key] = [...folders.flatMap((f) => lib(f)), ...(PHOTO_ALBUMS[key] ?? [])].filter(
    (p) => (seen.has(p.src) ? false : (seen.add(p.src), true)),
  );
}

/** Album per diersoort; sleutelwoorden in NL/FR/EN. */
const SPECIES_ALBUM: [string[], string][] = [
  [["ezel", "âne", "ane", "donkey"], "ezels"],
  [["geit", "chèvre", "chevre", "goat"], "geiten"],
  [["schaap", "lam", "mouton", "agneau", "sheep", "lamb"], "schapen"],
  [["kip", "haan", "poule", "coq", "chicken", "hen"], "kippen"],
  [["eend", "canard", "duck", "gans", "oie", "goose"], "eenden"],
  [["konijn", "lapin", "rabbit"], "konijnen"],
  [["cavia", "cochon d'inde", "cochon d’inde", "guinea", "knaagdier", "rongeur"], "cavias"],
  [["pauw", "paon", "peacock"], "pauwen"],
  [["pony", "paard", "cheval", "horse"], "pony"],
  [["alpaca", "alpaga"], "alpacas"],
];

/** Themasleutel per diersoort (bv. "geiten"), of null. */
export function albumKeyForSpecies(species: string): string | null {
  const s = species.toLowerCase();
  for (const [keys, album] of SPECIES_ALBUM) {
    if (keys.some((k) => s.includes(k))) return album;
  }
  return null;
}

export function albumForSpecies(species: string): Photo[] {
  const key = albumKeyForSpecies(species);
  return key ? (PHOTO_ALBUMS[key] ?? []) : [];
}

/** Brede selectie voor de sfeergalerij op de dierenpagina. */
export const FARM_HIGHLIGHTS: Photo[] = [
  ...PHOTO_ALBUMS.geiten!,
  ...PHOTO_ALBUMS.ezels!,
  ...PHOTO_ALBUMS.kippen!,
  ...PHOTO_ALBUMS.eenden!,
  ...PHOTO_ALBUMS.konijnen!,
  ...PHOTO_ALBUMS.cavias!,
  ...PHOTO_ALBUMS.pauwen!,
  ...PHOTO_ALBUMS.alpacas!,
  ...PHOTO_ALBUMS.schapen!,
  ...PHOTO_ALBUMS.pony!,
];

/** Moestuin, boomgaard, vijver, paden en het erf. */
export const GARDEN_HIGHLIGHTS: Photo[] = [
  ...PHOTO_ALBUMS.moestuin!,
  ...PHOTO_ALBUMS.boomgaard!,
  ...PHOTO_ALBUMS.vijver!,
  ...PHOTO_ALBUMS.paden!,
  ...PHOTO_ALBUMS.erf!,
];

/** Bezoek: kinderen, speeltuin en educatie. */
export const VISIT_HIGHLIGHTS: Photo[] = [
  ...PHOTO_ALBUMS.kinderen!,
  ...PHOTO_ALBUMS.speeltuin!,
  ...PHOTO_ALBUMS.educatie!,
];

export function toCarousel(photos: Photo[], lang: Lang) {
  return photos.map((p) => ({ src: p.src, alt: p.alt[lang] }));
}
