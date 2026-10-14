import type { Lang } from "@/lib/i18n";

/** Kiest de eerste niet-lege waarde. */
function pick<T>(values: (T | null | undefined)[], fallback: T): T {
  for (const v of values) {
    if (v !== null && v !== undefined && (typeof v !== "string" || v.trim().length > 0)) return v;
  }
  return fallback;
}

export type MultilingualAcademy = {
  diersoort_naam: string;
  diersoort_naam_fr?: string | null;
  diersoort_naam_en?: string | null;
  beschrijving?: string | null;
  beschrijving_fr?: string | null;
  beschrijving_en?: string | null;
};

export type MultilingualVraag = {
  vraag_tekst: string;
  vraag_tekst_fr?: string | null;
  vraag_tekst_en?: string | null;
  opties: string[];
  opties_fr?: string[] | null;
  opties_en?: string[] | null;
};

export function academyName(a: MultilingualAcademy, lang: Lang): string {
  const byLang = lang === "fr" ? a.diersoort_naam_fr : lang === "en" ? a.diersoort_naam_en : null;
  return pick([byLang], a.diersoort_naam);
}

export function academyDescription(a: MultilingualAcademy, lang: Lang): string | null {
  const byLang = lang === "fr" ? a.beschrijving_fr : lang === "en" ? a.beschrijving_en : null;
  return lang === "nl" ? (a.beschrijving ?? null) : pick([byLang], null as string | null);
}

export function vraagTekst(v: MultilingualVraag, lang: Lang): string {
  const byLang = lang === "fr" ? v.vraag_tekst_fr : lang === "en" ? v.vraag_tekst_en : null;
  return lang === "nl" ? v.vraag_tekst : pick([byLang], "");
}

export function vraagOpties(v: MultilingualVraag, lang: Lang): string[] {
  const byLang = lang === "fr" ? v.opties_fr : lang === "en" ? v.opties_en : null;
  if (byLang && Array.isArray(byLang) && byLang.length === v.opties.length) return byLang;
  return lang === "nl" ? v.opties : [];
}

export type MultilingualFeedback = {
  wist_je_dat?: string | null;
  wist_je_dat_fr?: string | null;
  wist_je_dat_en?: string | null;
};

export function wistJeDat(f: MultilingualFeedback, lang: Lang): string | null {
  const byLang = lang === "fr" ? f.wist_je_dat_fr : lang === "en" ? f.wist_je_dat_en : null;
  return lang === "nl" ? (f.wist_je_dat ?? null) : pick([byLang], null as string | null);
}
