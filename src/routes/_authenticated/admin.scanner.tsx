import { createFileRoute, redirect } from "@tanstack/react-router";

/** Alias: /admin/scanner opent dezelfde baliescanner als /admin/scan. */
export const Route = createFileRoute("/_authenticated/admin/scanner")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/scan", replace: true });
  },
});
