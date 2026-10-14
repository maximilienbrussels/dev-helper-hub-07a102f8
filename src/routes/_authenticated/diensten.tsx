import { createFileRoute, redirect } from "@tanstack/react-router";
import { DEFAULT_LANG, pathFor } from "@/lib/portal-routes";

/** Legacy single-segment URL; redirects to the language-prefixed portal route. */
export const Route = createFileRoute("/_authenticated/diensten")({
  beforeLoad: () => {
    throw redirect({ href: pathFor(DEFAULT_LANG, "services"), replace: true, statusCode: 301 });
  },
});
