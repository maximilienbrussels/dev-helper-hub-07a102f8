import { createFileRoute } from "@tanstack/react-router";

import { redirectToLocalized } from "@/lib/lang-redirect";

/** Taalloos adres: doorverwijzen naar de taalversie van de bezoeker. */
export const Route = createFileRoute("/fairtech")({
  beforeLoad: () => redirectToLocalized("fairtech"),
});
