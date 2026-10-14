import { DEFAULT_LANG, pickLang, type Lang } from "@/lib/routes-i18n";
import { getPreferredLang } from "@/lib/lang.functions";

const STORAGE_KEY = "ferme.lang";

/**
 * Bepaalt de taal van de bezoeker, zowel tijdens SSR (Accept-Language)
 * als in de browser (opgeslagen keuze of navigator.language).
 */
export async function detectLang(): Promise<Lang> {
  if (typeof window === "undefined") {
    try {
      return await getPreferredLang();
    } catch {
      return DEFAULT_LANG;
    }
  }
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? pickLang(saved) : pickLang(navigator.language);
  } catch {
    return pickLang(navigator.language);
  }
}
