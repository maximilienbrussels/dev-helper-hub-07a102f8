import { createFileRoute } from "@tanstack/react-router";

import { redirectToLocalized } from "@/lib/lang-redirect";

/** Taalloos adres: doorverwijzen naar de wettelijke vermeldingen. */
export const Route = createFileRoute("/impressum")({
  beforeLoad: () => redirectToLocalized("legal"),
});
