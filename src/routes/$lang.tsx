import { createFileRoute, Outlet, notFound, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { useT } from "@/lib/i18n";
import { isLang, pathFor, type Lang } from "@/lib/routes-i18n";
import { academiesQO } from "@/lib/academy-query";
import { detectLang } from "@/lib/lang-detect";
import { pageKeyForAnySlug, redirectToLocalized, subIdForAnySlug } from "@/lib/lang-redirect";

/**
 * Smart router: /nl, /fr, /en zijn taalprefixen. Alles wat geen taal is,
 * wordt behandeld als korte code van een academy (/7 of /schaap) en
 * doorgestuurd naar de gelokaliseerde URL /{taal}/academie/{slug}.
 */
export const Route = createFileRoute("/$lang")({
  ssr: "data-only",
  beforeLoad: async ({ params, context, location }) => {
    if (isLang(params.lang)) return;

    const code = decodeURIComponent(params.lang).toLowerCase();

    // Taalloos adres (bv. /legal, /mentions-legales, /shop/…): doorsturen naar
    // dezelfde pagina in de taal van de bezoeker.
    const key = pageKeyForAnySlug(code);
    if (key) {
      const second = location.pathname.split("/").filter(Boolean)[1];
      const sub = second ? subIdForAnySlug(key, decodeURIComponent(second).toLowerCase()) : null;
      await redirectToLocalized(key, { ...(sub ? { sub } : {}), search: true });
    }

    // Fail-safe: een databasefout tijdens SSR mag de route niet laten crashen.
    const academies = await context.queryClient.ensureQueryData(academiesQO).catch((err) => {
      console.error("SSR data loading warning ($lang shortcode):", err);
      return [];
    });
    const asNumber = Number.parseInt(code, 10);
    const match =
      academies.find((a) => a.slug.toLowerCase() === code) ??
      (Number.isFinite(asNumber)
        ? academies.find((a) => (a as { korte_code?: number | null }).korte_code === asNumber)
        : undefined);

    if (!match) throw notFound();

    const lang: Lang = await detectLang();
    throw redirect({ href: pathFor("academy", lang, match.slug), replace: true });
  },
  component: LangLayout,
});

function LangLayout() {
  const { lang: urlLang } = Route.useParams();
  const { lang, setLang } = useT();

  useEffect(() => {
    if (isLang(urlLang) && urlLang !== lang) setLang(urlLang as Lang);
  }, [urlLang, lang, setLang]);

  return <Outlet />;
}
