/**
 * Beheerde fotoalbums ophalen en samenvoegen met de vaste albums in de code.
 * De site toont dus eerst de foto's uit de code en daarna wat het team zelf
 * heeft toegevoegd via het beheerportaal.
 */
import { useQuery } from "@tanstack/react-query";
import { listAlbumPhotos, type AlbumPhotoMap } from "@/lib/album-photos.functions";
import type { Photo } from "@/lib/photo-albums";
import type { Lang } from "@/lib/routes-i18n";

export const albumPhotosQO = {
  queryKey: ["album-photos"] as const,
  queryFn: () => listAlbumPhotos(),
  staleTime: 5 * 60 * 1000,
};

export function useAlbumPhotos(): AlbumPhotoMap {
  const { data } = useQuery<AlbumPhotoMap>({ ...albumPhotosQO, retry: false });
  return data ?? {};
}

/** Sleutel voor het persoonlijke album van één dier. */
export const animalAlbumKey = (animalId: number | string) => `dier-${animalId}`;

/** Beheerde foto's van één album als carrouselitems. */
export function managedCarousel(map: AlbumPhotoMap, key: string, lang: Lang) {
  return (map[key] ?? []).map((p) => ({
    src: p.url,
    alt: p.alt[lang] || p.alt.nl || "",
  }));
}

/** Vaste foto's uit de code + beheerde foto's, in één lijst zonder dubbels. */
export function mergedCarousel(
  staticPhotos: Photo[],
  map: AlbumPhotoMap,
  keys: string[],
  lang: Lang,
) {
  const items = [
    ...staticPhotos.map((p) => ({ src: p.src, alt: p.alt[lang] })),
    ...keys.flatMap((k) => managedCarousel(map, k, lang)),
  ];
  const seen = new Set<string>();
  return items.filter((i) => (seen.has(i.src) ? false : (seen.add(i.src), true)));
}
