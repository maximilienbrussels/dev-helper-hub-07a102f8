import { createFileRoute, redirect } from "@tanstack/react-router";
import { DEFAULT_LANG, pathFor } from "@/lib/portal-routes";

/** Legacy single-segment URL; redirects to the language-prefixed portal route. */
export const Route = createFileRoute("/_authenticated/team")({
  beforeLoad: () => {
    throw redirect({ href: pathFor(DEFAULT_LANG, "team"), replace: true, statusCode: 301 });
  },
});
