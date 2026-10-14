import { SITE_URL, pathFor, type Lang } from "@/lib/routes-i18n";

/**
 * Korte-linkarchitectuur.
 *
 * - Korte code:  https://bxl.li/7        (nummer per academy)
 * - Slug-code:   https://bxl.li/schaap   (slug van de academy)
 * Beide landen op /{code} en worden door de smart router doorgestuurd naar
 * de gelokaliseerde canonieke URL /{taal}/academie/{slug}.
 */
export const SHORT_DOMAIN = "https://bxl.li";

/** Canonieke, gelokaliseerde URL van een academy. */
export function academyPath(slug: string, lang: Lang): string {
  return pathFor("academy", lang, slug);
}

export function academyUrl(slug: string, lang: Lang): string {
  return `${SITE_URL}${academyPath(slug, lang)}`;
}

/** Korte link op basis van het nummer, met de slug als leesbare reserve. */
export function shortAcademyUrl(code: number | null | undefined, slug: string): string {
  return `${SHORT_DOMAIN}/${code ?? slug}`;
}

/** Korte link naar een dierprofiel (QR aan het hok). */
export function shortAnimalUrl(animalId: number | string): string {
  return `${SHORT_DOMAIN}/d/${animalId}`;
}

export function animalUrl(animalId: number | string): string {
  return `${SITE_URL}/qr/${animalId}`;
}
