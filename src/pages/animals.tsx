import { LocalLink } from "@/components/LocalLink";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { NavHeader } from "@/components/NavHeader";
import { useT } from "@/lib/i18n";
import { getAnimals } from "@/lib/data.functions";
import { ResidentPhoto } from "@/components/ResidentPhoto";
import { animalSlug, pathFor, speciesIn, type Lang } from "@/lib/routes-i18n";
import { PhotoCarousel } from "@/components/PhotoCarousel";
import {
  FARM_HIGHLIGHTS,
  PHOTO_ALBUMS,
  albumForSpecies,
  albumKeyForSpecies,
} from "@/lib/photo-albums";
import { animalAlbumKey, mergedCarousel, useAlbumPhotos } from "@/lib/use-album-photos";
import { handleImageError } from "@/lib/image-fallback";
import { InteractiveMap } from "@/components/InteractiveMap";

export const animalsQO = queryOptions({ queryKey: ["animals"], queryFn: () => getAnimals() });

const COPY: Record<
  Lang,
  {
    title: string;
    lede: string;
    back: string;
    meet: string;
    visitCta: string;
    gallery: string;
    gardenGallery: string;
    album: string;
  }
> = {
  nl: {
    title: "Onze dieren",
    lede: "Geiten, schapen, ezels, kippen en konijnen — allemaal met hun eigen karakter en verhaal.",
    back: "Terug naar alle dieren",
    meet: "Maak kennis",
    visitCta: "Plan je bezoek",
    gallery: "Foto's van de boerderij",
    gardenGallery: "Moestuin, boomgaard & erf",
    album: "Album",
  },
  fr: {
    title: "Nos animaux",
    lede: "Chèvres, moutons, ânes, poules et lapins — chacun avec son caractère et son histoire.",
    back: "Retour à tous les animaux",
    meet: "Faire connaissance",
    visitCta: "Préparez votre visite",
    gallery: "Photos de la ferme",
    gardenGallery: "Potager, verger & cour",
    album: "Album",
  },
  en: {
    title: "Our animals",
    lede: "Goats, sheep, donkeys, chickens and rabbits — each with their own character and story.",
    back: "Back to all animals",
    meet: "Meet them",
    visitCta: "Plan your visit",
    gallery: "Photos from the farm",
    gardenGallery: "Kitchen garden, orchard & yard",
    album: "Album",
  },
};


export function AnimalsPage() {
  const { lang, tx } = useT();
  const source = COPY[lang];
  const c = Object.fromEntries(Object.entries(source).map(([key, value]) => [key, tx(value)])) as typeof source;
  const { data: animals } = useSuspenseQuery(animalsQO);
  const managed = useAlbumPhotos();

  return (
    <div className="min-h-screen bg-background">
      <NavHeader />
      <main className="mx-auto w-full max-w-4xl px-5 py-10">
        <h1 className="font-serif text-4xl text-foreground">{c.title}</h1>
        <p className="mt-3 text-muted-foreground">{c.lede}</p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {(animals ?? []).map((a) => (
            <LocalLink
              key={a.id}
              to={pathFor("animals", lang, animalSlug(a, lang))}
              className="group overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-lg"
            >
              <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
                <ResidentPhoto
                  animal={a}
                  albums={managed}
                  speciesLabel={speciesIn(a.species, lang)}
                />
              </div>
              <div className="p-4">
                <h2 className="font-serif text-xl text-foreground">{a.name}</h2>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {speciesIn(a.species, lang)}
                </p>
              </div>
            </LocalLink>
          ))}
        </div>

        <section className="mt-12">
          <PhotoCarousel
            title={c.gallery}
            photos={mergedCarousel(
              FARM_HIGHLIGHTS,
              managed,
              [
                "ezels",
                "geiten",
                "schapen",
                "kippen",
                "eenden",
                "konijnen",
                "cavias",
                "pauwen",
                "alpacas",
                "pony",
              ],
              lang,
            )}
            autoPlay
          />
        </section>

        <section className="mt-12">
          <PhotoCarousel
            title={c.gardenGallery}
            photos={mergedCarousel(
              [
                ...PHOTO_ALBUMS.moestuin!,
                ...PHOTO_ALBUMS.boomgaard!,
                ...PHOTO_ALBUMS.erf!,
                ...PHOTO_ALBUMS.vijver!,
                ...PHOTO_ALBUMS.paden!,
              ],
              managed,
              ["moestuin", "boomgaard", "erf", "vijver", "paden"],
              lang,
            )}
          />
        </section>


        <div className="mt-10">
          <LocalLink
            to={pathFor("visit", lang)}
            className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground"
          >
            {c.visitCta}
          </LocalLink>
        </div>
        <section className="mt-12">
          <InteractiveMap />
        </section>
      </main>
    </div>
  );
}

export function AnimalDetailPage({ slug }: { slug: string }) {
  const { lang, tx } = useT();
  const source = COPY[lang];
  const c = Object.fromEntries(Object.entries(source).map(([key, value]) => [key, tx(value)])) as typeof source;
  const { data: animals } = useSuspenseQuery(animalsQO);
  const animal = (animals ?? []).find((a) => animalSlug(a, lang) === slug);
  const managed = useAlbumPhotos();
  const speciesKey = animal ? albumKeyForSpecies(animal.species) : null;
  const album = animal
    ? mergedCarousel(
        albumForSpecies(animal.species),
        managed,
        [animalAlbumKey(animal.id), ...(speciesKey ? [speciesKey] : [])],
        lang,
      )
    : [];

  if (!animal) {
    return (
      <div className="min-h-screen bg-background">
        <NavHeader />
        <main className="mx-auto w-full max-w-3xl px-5 py-16 text-center">
          <h1 className="font-serif text-3xl text-foreground">404</h1>
          <LocalLink
            to={pathFor("animals", lang)}
            className="mt-4 inline-block text-sm text-primary underline"
          >
            {c.back}
          </LocalLink>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavHeader />
      <main className="mx-auto w-full max-w-3xl px-5 py-10">
        <LocalLink
          to={pathFor("animals", lang)}
          className="text-sm text-muted-foreground underline"
        >
          ← {c.back}
        </LocalLink>
        <div className="mt-4 aspect-video w-full overflow-hidden rounded-2xl bg-muted">
          <ResidentPhoto
            animal={animal}
            albums={managed}
            speciesLabel={speciesIn(animal.species, lang)}
          />
        </div>
        <h1 className="mt-6 font-serif text-4xl text-foreground">{animal.name}</h1>
        <p className="text-sm uppercase tracking-wide text-muted-foreground">
          {speciesIn(animal.species, lang)}
        </p>
        {animal.description ? (
          <p className="mt-4 leading-relaxed text-foreground/90">{animal.description}</p>
        ) : null}

        {album.length > 0 ? (
          <section className="mt-10">
            <PhotoCarousel
              title={`${c.album} — ${animal.name}`}
              photos={album}
              perView="sm:basis-1/2"
            />
          </section>
        ) : null}
      </main>
    </div>
  );
}
