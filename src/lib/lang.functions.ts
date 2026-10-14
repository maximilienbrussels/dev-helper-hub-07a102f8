import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { DEFAULT_LANG, isLang, pickLang, type Lang } from "@/lib/routes-i18n";

const COOKIE_NAME = "ferme.lang";

function langFromCookie(header: string | null): Lang | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === COOKIE_NAME) {
      const value = decodeURIComponent(rest.join("=")).trim();
      if (isLang(value)) return value as Lang;
    }
  }
  return null;
}

/**
 * Taalvoorkeur van de bezoeker (server-side): eerst de bewaarde keuze in de
 * cookie, daarna de Accept-Language header, anders het Nederlands.
 */
export const getPreferredLang = createServerFn({ method: "GET" }).handler(() => {
  try {
    const req = getRequest();
    return (
      langFromCookie(req?.headers.get("cookie") ?? null) ??
      pickLang(req?.headers.get("accept-language"))
    );
  } catch {
    return DEFAULT_LANG;
  }
});
