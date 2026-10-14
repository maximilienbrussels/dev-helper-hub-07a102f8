import { createFileRoute, redirect } from "@tanstack/react-router";

/** Alias: /academie/certificaat/:id -> de A4-certificaatpagina. */
export const Route = createFileRoute("/academie/certificaat/$id")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/certificaat/$id", params: { id: params.id } });
  },
});
