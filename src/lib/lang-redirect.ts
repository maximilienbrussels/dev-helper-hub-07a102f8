import { redirect } from "@tanstack/react-router";

import { detectLang } from "@/lib/lang-detect";
import {
  ALIAS_SLUGS,
  LANGS,
  SUB_SLUGS,
  pathFor,
  slugToKeyAnyLang,
  subPathFor,
  subSlugToId,
  type PageKey,
} from "@/lib/routes-i18n";

/**
 * Verwijst een taalloos adres (bv. /legal) door naar de gelokaliseerde versie
 * in de taal van de bezoeker (Accept-Language op de server, opgeslagen keuze of
 * navigator.language in de browser).
 */
export async function redirectToLocalized(
  key: PageKey,
  options: { sub?: string; search?: boolean } = {},
): Promise<never> {
  const lang = await detectLang();
  const href = options.sub ? subPathFor(key, lang, options.sub) : pathFor(key, lang);
  throw redirect({ href, replace: true, ...(options.search ? { search: true } : {}) });
}

/** Extra taalloze/verkorte adressen die naar een pagina verwijzen. */
const EXTRA_SLUGS: Record<string, PageKey> = {
  legal: "legal",
  impressum: "legal",
  cookies: "cookies",
  cookiebeleid: "cookies",
  status: "status",
  pers: "press",
  privacy: "privacy",
  terms: "terms",
  jobs: "jobs",
  press: "press",
  faq: "faq",
  contact: "contact",
  shop: "shop",
  webshop: "shop",
  login: "login",
  register: "register",
  account: "account",
  news: "news",
  events: "events",
  agenda: "events",
  partners: "partners",
  volunteers: "volunteers",
  support: "support",
  about: "about",
  visit: "visit",
  animals: "animals",
  education: "education",
  rental: "rental",
  camps: "camps",
  compost: "compost",
  academy: "academy",
  resources: "resources",
  transparency: "transparency",
  social: "social",
  pass: "pass",
  fairtech: "fairtech",
};

/** Zoekt bij welke pagina een taalloze slug hoort (in eender welke taal). */
export function pageKeyForAnySlug(slug: string): PageKey | null {
  const direct = slugToKeyAnyLang(slug);
  if (direct) return direct.key;
  for (const lang of LANGS) {
    const alias = ALIAS_SLUGS[lang][slug];
    if (alias) return alias;
  }
  return EXTRA_SLUGS[slug] ?? null;
}

/** Zoekt het interne id van een subpagina, ongeacht de taal van de slug. */
export function subIdForAnySlug(key: PageKey, slug: string): string | null {
  for (const lang of LANGS) {
    const id = subSlugToId(key, lang, slug);
    if (id) return id;
  }
  const table = SUB_SLUGS[key];
  return table && slug in table ? slug : null;
}
