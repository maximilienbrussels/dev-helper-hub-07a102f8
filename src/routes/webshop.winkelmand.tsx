import { createFileRoute, redirect } from "@tanstack/react-router";

/** Annuleert de klant bij Stripe, dan komt die terug in de hoevewinkel. */
export const Route = createFileRoute("/webshop/winkelmand")({
  beforeLoad: () => {
    throw redirect({
      to: "/$lang/$",
      params: { lang: "nl", _splat: "hoevewinkel" },
      search: { winkelmand: "1" } as never,
      replace: true,
    });
  },
});
