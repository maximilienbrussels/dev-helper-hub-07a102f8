import type { Lang } from "@/lib/i18n";
import { academyDescription, academyName, type MultilingualAcademy } from "@/lib/academy-i18n";

/** Alle categorieën van de academykaarten, in weergavevolgorde. */
export const ACADEMY_CATEGORIES = [
  "boerderij",
  "knaagdieren",
  "pluimvee",
  "vogels",
  "huisdieren",
  "moestuin",
  "stadsnatuur",
  "vijver",
  "etiquette",
  "biodiversiteit",
  "exoten",
  "invertebraten",
  "valkuilen",
] as const;

export type AcademyCategory = (typeof ACADEMY_CATEGORIES)[number];

/** De categorie met de waarschuwingsknop '⚠️ Impulsaankopen & valkuilen'. */
export const WARNING_CATEGORY: AcademyCategory = "valkuilen";

export type FilterableAcademy = MultilingualAcademy & {
  slug: string;
  categorie: string;
};

/** Kleine letters zonder accenten, zodat 'Hérisson' ook op 'herisson' matcht. */
export function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Zoekt in de naam en beschrijving van alle drie de talen plus de slug. */
export function matchesQuery(a: FilterableAcademy, query: string, lang: Lang): boolean {
  const q = normalize(query.trim());
  if (!q) return true;
  const haystack = normalize(
    [
      a.diersoort_naam,
      a.diersoort_naam_fr ?? "",
      a.diersoort_naam_en ?? "",
      academyName(a, lang),
      academyDescription(a, lang) ?? "",
      a.slug,
    ].join(" "),
  );
  return haystack.includes(q);
}

/** Filtert op categorie + zoekterm. De categorie is taalonafhankelijk. */
export function filterAcademies<T extends FilterableAcademy>(
  academies: T[],
  options: { category?: string; query?: string; lang: Lang },
): T[] {
  const category = options.category ?? "all";
  const query = options.query ?? "";
  return academies.filter((a) => {
    if (category !== "all" && a.categorie !== category) return false;
    return matchesQuery(a, query, options.lang);
  });
}

/** Aantal academies per categorie (plus 'all'), onafhankelijk van de taal. */
export function countByCategory(academies: FilterableAcademy[]): Record<string, number> {
  const counts: Record<string, number> = { all: academies.length };
  for (const a of academies) counts[a.categorie] = (counts[a.categorie] ?? 0) + 1;
  return counts;
}

/** Enkel categorieën die effectief academies bevatten, in vaste volgorde. */
export function usedCategories(academies: FilterableAcademy[]): AcademyCategory[] {
  return ACADEMY_CATEGORIES.filter((c) => academies.some((a) => a.categorie === c));
}
