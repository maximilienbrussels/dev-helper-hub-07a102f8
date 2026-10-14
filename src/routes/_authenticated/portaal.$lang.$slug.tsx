import { createFileRoute, redirect } from "@tanstack/react-router";
import { DEFAULT_LANG, isLang, pageFromSlug, pathFor } from "@/lib/portal-routes";

/** Oude URL /portaal/nl/vandaag → nieuwe structuur /nl/vandaag. */
export const Route = createFileRoute("/_authenticated/portaal/$lang/$slug")({
  beforeLoad: ({ params }) => {
    const lang = isLang(params.lang) ? params.lang : DEFAULT_LANG;
    const page = pageFromSlug(lang, params.slug) ?? "today";
    throw redirect({ href: pathFor(lang, page), replace: true, statusCode: 301 });
  },
});
