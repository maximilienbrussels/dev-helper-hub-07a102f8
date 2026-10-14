import { createFileRoute, redirect } from "@tanstack/react-router";

/** English operational alias; the canonical Field App remains under /veld. */
export const Route = createFileRoute("/field")({
  beforeLoad: () => {
    throw redirect({ to: "/veld", replace: true });
  },
});