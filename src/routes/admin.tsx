import { createFileRoute, redirect } from "@tanstack/react-router";

/** Stable Manager alias; authentication forwards signed-in staff to their portal. */
export const Route = createFileRoute("/admin")({
  beforeLoad: () => {
    throw redirect({ to: "/auth", replace: true });
  },
});