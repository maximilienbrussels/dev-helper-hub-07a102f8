/**
 * Welke foto tonen we voor een bewoner?
 *
 * Volgorde: eigen profielfoto → laatste foto uit het persoonlijke album →
 * laatste foto uit het thema-album van de soort → vaste boerderijfoto van
 * die soort → niets (dan toont de site een illustratie in de huisstijl).
 */
import type { AlbumPhotoMap } from "@/lib/album-photos.functions";
import { albumKeyForSpecies, albumForSpecies } from "@/lib/photo-albums";
import { imageForSpecies } from "@/lib/animal-images";
import { animalAlbumKey } from "@/lib/use-album-photos";

export type ResidentLike = {
  id: number | string;
  name: string;
  species: string;
  image_url?: string | null;
};

function lastPhoto(map: AlbumPhotoMap, key: string | null): string | null {
  if (!key) return null;
  const list = map[key];
  if (!list || list.length === 0) return null;
  return list[list.length - 1]!.url;
}

/** De beste beschikbare foto-URL voor dit dier, of null. */
export function residentPhoto(animal: ResidentLike, map: AlbumPhotoMap = {}): string | null {
  if (animal.image_url) return animal.image_url;
  const own = lastPhoto(map, animalAlbumKey(animal.id));
  if (own) return own;
  const theme = lastPhoto(map, albumKeyForSpecies(animal.species));
  if (theme) return theme;
  const staticAlbum = albumForSpecies(animal.species);
  if (staticAlbum.length) return staticAlbum[staticAlbum.length - 1]!.src;
  return imageForSpecies(animal.species);
}
