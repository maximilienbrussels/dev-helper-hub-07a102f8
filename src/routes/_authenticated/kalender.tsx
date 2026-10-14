import { createFileRoute, redirect } from "@tanstack/react-router";
import { DEFAULT_LANG, pathFor } from "@/lib/portal-routes";

/** Legacy single-segment URL; redirects to the language-prefixed portal route. */
export const Route = createFileRoute("/_authenticated/kalender")({
  beforeLoad: () => {
    throw redirect({ href: pathFor(DEFAULT_LANG, "calendar"), replace: true, statusCode: 301 });
  },
});
