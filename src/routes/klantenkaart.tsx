import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/klantenkaart")({
  beforeLoad: () => {
    throw redirect({ to: "/mijn-hoefjes" });
  },
});
