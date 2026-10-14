import { createFileRoute, redirect } from "@tanstack/react-router";
import { pathFor } from "@/lib/routes-i18n";
import { detectLang } from "@/lib/lang-detect";

/** Oude, niet-gelokaliseerde URL: stuur door naar /{taal}/academie/{slug}. */
export const Route = createFileRoute("/academy/$slug")({
  beforeLoad: async ({ params }) => {
    const lang = await detectLang();
    throw redirect({ href: pathFor("academy", lang, params.slug), replace: true });
  },
});
