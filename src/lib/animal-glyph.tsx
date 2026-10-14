import { PawPrint } from "lucide-react";
import { handleImageError } from "@/lib/image-fallback";

/**
 * Eén illustratie per diersoort (getekend, geen emoji).
 * Sleutel = academy-slug (ook gebruikt als `badge_icon` in de database).
 */
const ILLUSTRATION_MODULES = import.meta.glob<{ default: string }>("../assets/academy/*.png", {
  eager: true,
});

export const ANIMAL_ILLUSTRATIONS: Record<string, string> = Object.fromEntries(
  Object.entries(ILLUSTRATION_MODULES).map(([path, mod]) => [
    path
      .split("/")
      .pop()!
      .replace(/\.png$/, ""),
    mod.default,
  ]),
);

/** Synoniemen voor oudere slugs / badge_icon-waarden. */
const ALIASES: Record<string, string> = {
  rat: "tamme-rat",
  tamme_rat: "tamme-rat",
  varken: "minivarken",
  eend: "kwartel",
  schaap: "geit",
  ezel: "geit",
  "aquarium-goudvis": "aquarium-goudvis",
};

export function animalIllustration(slug: string, badgeIcon?: string | null): string | null {
  const keys = [slug, ALIASES[slug], badgeIcon ?? "", badgeIcon ? ALIASES[badgeIcon] : ""];
  for (const k of keys) {
    if (k && ANIMAL_ILLUSTRATIONS[k]) return ANIMAL_ILLUSTRATIONS[k]!;
  }
  return null;
}

/**
 * Toont de diersoort-illustratie. Schaalt altijd binnen de container
 * (object-contain) zodat er nooit iets afgesneden wordt, op mobiel én desktop.
 */
export function AnimalIcon({
  slug,
  badgeIcon,
  className = "",
  glyphClassName = "",
  alt,
}: {
  slug: string;
  badgeIcon?: string | null;
  className?: string;
  /** Behouden voor achterwaartse compatibiliteit; wordt mee toegepast. */
  glyphClassName?: string;
  /** Toegankelijke omschrijving in de actieve taal. */
  alt?: string;
}) {
  const src = animalIllustration(slug, badgeIcon);
  const sizing = className || "h-6 w-6";
  if (src) {
    return (
      <img
        src={src}
        onError={handleImageError}
        alt={alt ?? ""}
        aria-hidden={alt ? undefined : true}
        loading="lazy"
        width={512}
        height={512}
        className={`${sizing} ${glyphClassName} max-h-full max-w-full shrink-0 object-contain`}
      />
    );
  }
  return <PawPrint className={sizing} aria-hidden="true" />;
}
