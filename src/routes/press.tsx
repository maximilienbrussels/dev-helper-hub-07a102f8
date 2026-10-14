import { createFileRoute } from "@tanstack/react-router";

import { redirectToLocalized } from "@/lib/lang-redirect";

/** International press alias; redirects to the visitor's canonical language URL. */
export const Route = createFileRoute("/press")({
  beforeLoad: () => redirectToLocalized("press"),
});