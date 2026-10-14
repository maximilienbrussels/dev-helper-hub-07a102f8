import { createFileRoute, redirect } from "@tanstack/react-router";
import { pathFor } from "@/lib/routes-i18n";
import { detectLang } from "@/lib/lang-detect";

/** Oude, niet-gelokaliseerde URL: stuur door naar /{taal}/academie. */
export const Route = createFileRoute("/academy/")({
  beforeLoad: async () => {
    const lang = await detectLang();
    throw redirect({ href: pathFor("academy", lang), replace: true });
  },
});
