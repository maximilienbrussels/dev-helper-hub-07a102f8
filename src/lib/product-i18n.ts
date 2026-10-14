import type { Lang } from "@/lib/i18n";

/** Minimale vorm van een product met (optionele) meertalige velden. */
export type MultilingualProduct = {
  title: string;
  description?: string | null;
  title_nl?: string | null;
  title_fr?: string | null;
  title_en?: string | null;
  desc_nl?: string | null;
  desc_fr?: string | null;
  desc_en?: string | null;
};

function pick(values: (string | null | undefined)[]): string | null {
  for (const v of values) {
    if (v && v.trim().length > 0) return v;
  }
  return null;
}

/** Producttitel in de actieve taal, met terugval op NL en op het basisveld. */
export function productTitle(p: MultilingualProduct, lang: Lang): string {
  const byLang = lang === "fr" ? p.title_fr : lang === "en" ? p.title_en : p.title_nl;
  return pick([byLang, p.title_nl, p.title]) ?? p.title;
}

/** Productbeschrijving in de actieve taal, met terugval op NL en op het basisveld. */
export function productDescription(p: MultilingualProduct, lang: Lang): string | null {
  const byLang = lang === "fr" ? p.desc_fr : lang === "en" ? p.desc_en : p.desc_nl;
  return pick([byLang, p.desc_nl, p.description ?? null]);
}
