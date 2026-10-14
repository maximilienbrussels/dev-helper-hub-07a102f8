import { createFileRoute } from "@tanstack/react-router";

import { redirectToLocalized } from "@/lib/lang-redirect";

/** Taalloos adres: doorverwijzen naar de taalversie van de perspagina. */
export const Route = createFileRoute("/pers")({
  beforeLoad: () => redirectToLocalized("press"),
});
