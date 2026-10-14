import { createFileRoute } from "@tanstack/react-router";
import { Index, orgQO, hoursQO, animalsQO } from "@/pages/home";
import { isLang, localizedHead, DEFAULT_LANG, type Lang } from "@/lib/routes-i18n";
import { homeJsonLd } from "@/lib/seo-jsonld";

export const Route = createFileRoute("/$lang/")({
  ssr: "data-only",
  // Fail-safe: een databasefout tijdens SSR mag de pagina niet laten crashen.
  loader: async ({ context }) => {
    const safe = (p: Promise<unknown>) =>
      p.catch((err) => {
        console.error("SSR data loading warning:", err);
        return null;
      });
    await Promise.all([
      safe(context.queryClient.ensureQueryData(orgQO)),
      safe(context.queryClient.ensureQueryData(hoursQO)),
      safe(context.queryClient.ensureQueryData(animalsQO)),
    ]);
  },
  head: ({ params }) => {
    const lang: Lang = isLang(params.lang) ? params.lang : DEFAULT_LANG;
    return localizedHead("home", lang, { jsonLd: [homeJsonLd(lang)] });
  },
  component: Index,
});
