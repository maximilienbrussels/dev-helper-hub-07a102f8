/**
 * Extra talen achter het wereldbolletje. De URL blijft /en/… (Engels is de
 * drager); teksten komen uit de handvertaalde woordenboeken hieronder.
 * Een taal verschijnt pas in het menu als `ready` true is (volledig vertaald).
 * Voorvertonen kan altijd met ?taal=<code> op een /en/-pagina.
 */
import de from "./de";
import dePublic from "./de-public";
import deResources from "./de-resources";
import deCamps from "./de-camps";
import ar from "./ar";
import arPublic from "./ar-public";
import arCamps from "./ar-camps";

export type ExtraLang = "de" | "ar" | "tr" | "es" | "it" | "pt" | "pl" | "ro" | "zgh";

export type ExtraLangMeta = {
  code: ExtraLang;
  /** Naam in de taal zelf. */
  native: string;
  english: string;
  /** Korte code op de knop. */
  short: string;
  htmlLang: string;
  locale: string;
  dir: "ltr" | "rtl";
  ready: boolean;
};

export const EXTRA_LANGS: ExtraLangMeta[] = [
  { code: "de", native: "Deutsch", english: "German", short: "DE", htmlLang: "de", locale: "de-BE", dir: "ltr", ready: false },
  { code: "ar", native: "العربية", english: "Arabic", short: "AR", htmlLang: "ar", locale: "ar", dir: "rtl", ready: false },
  { code: "tr", native: "Türkçe", english: "Turkish", short: "TR", htmlLang: "tr", locale: "tr-TR", dir: "ltr", ready: false },
  { code: "es", native: "Español", english: "Spanish", short: "ES", htmlLang: "es", locale: "es-ES", dir: "ltr", ready: false },
  { code: "it", native: "Italiano", english: "Italian", short: "IT", htmlLang: "it", locale: "it-IT", dir: "ltr", ready: false },
  { code: "pt", native: "Português", english: "Portuguese", short: "PT", htmlLang: "pt", locale: "pt-PT", dir: "ltr", ready: false },
  { code: "pl", native: "Polski", english: "Polish", short: "PL", htmlLang: "pl", locale: "pl-PL", dir: "ltr", ready: false },
  { code: "ro", native: "Română", english: "Romanian", short: "RO", htmlLang: "ro", locale: "ro-RO", dir: "ltr", ready: false },
  { code: "zgh", native: "ⵜⴰⵎⴰⵣⵉⵖⵜ · Tamaziɣt", english: "Tamazight (Berber)", short: "ⵣ", htmlLang: "zgh", locale: "fr-MA", dir: "ltr", ready: false },
];

export const EXTRA_DICTS: Partial<Record<ExtraLang, Record<string, string>>> = { de, ar };

export function isExtraLang(v: string | null | undefined): v is ExtraLang {
  return EXTRA_LANGS.some((x) => x.code === v);
}

/** Alle geplande talen; onafgewerkte talen blijven zichtbaar als "binnenkort". */
export function visibleExtraLangs(_active: ExtraLang | null): ExtraLangMeta[] {
  return EXTRA_LANGS;
}

import dePhrases from "./de-phrases";

/**
 * Zinnen die rechtstreeks in een pagina staan (nl/fr/en naast elkaar) worden
 * vertaald op basis van hun Engelse tekst. Ontbreekt een vertaling, dan blijft
 * het Engels staan.
 */
export const EXTRA_PHRASES: Partial<Record<ExtraLang, Record<string, string>>> = {
  de: { ...dePhrases, ...dePublic, ...deResources, ...deCamps },
  ar: { ...arPublic, ...arCamps },
};

export function translatePhrase(extra: ExtraLang | null | undefined, en: string): string {
  if (!extra) return en;
  return EXTRA_PHRASES[extra]?.[en] ?? en;
}

/** Past `tx` recursief toe op alle teksten in een object of lijst. */
export function deepTx<T>(tx: (s: string) => string, v: T): T {
  if (typeof v === "string") return tx(v) as T;
  if (Array.isArray(v)) return v.map((x) => deepTx(tx, x)) as T;
  if (v && typeof v === "object")
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, deepTx(tx, x)])) as T;
  return v;
}
