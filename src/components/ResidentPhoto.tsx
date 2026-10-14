/**
 * Foto van een bewoner met een verzorgde terugval: nooit een leeg grijs vak.
 */
import { PawPrint } from "lucide-react";
import { handleImageError } from "@/lib/image-fallback";
import { residentPhoto, type ResidentLike } from "@/lib/resident-photo";
import type { AlbumPhotoMap } from "@/lib/album-photos.functions";
import { cn } from "@/lib/utils";

export function ResidentPlaceholder({
  name,
  species,
  className,
}: {
  name: string;
  species?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-2 bg-[color:var(--color-surface-forest)] p-3 text-center text-[color:var(--color-cream)]",
        className,
      )}
    >
      <PawPrint className="size-7 opacity-80" aria-hidden />
      <span className="font-serif text-lg italic leading-tight">{name}</span>
      {species ? (
        <span className="text-[10px] uppercase tracking-[0.2em] opacity-75">{species}</span>
      ) : null}
    </div>
  );
}

export function ResidentPhoto({
  animal,
  albums,
  alt,
  className,
  speciesLabel,
}: {
  animal: ResidentLike;
  albums?: AlbumPhotoMap;
  alt?: string;
  className?: string;
  speciesLabel?: string;
}) {
  const src = residentPhoto(animal, albums ?? {});
  if (!src) {
    return (
      <ResidentPlaceholder
        name={animal.name}
        species={speciesLabel ?? animal.species}
        className={className}
      />
    );
  }
  return (
    <img
      src={src}
      alt={alt ?? `${animal.name} — ${speciesLabel ?? animal.species}`}
      loading="lazy"
      onError={handleImageError}
      className={cn("h-full w-full object-cover object-[50%_35%]", className)}
    />
  );
}
