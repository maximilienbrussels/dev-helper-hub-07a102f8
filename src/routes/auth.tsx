import { createFileRoute, Outlet } from "@tanstack/react-router";

/** Layout for the staff portal auth screens (/auth and /auth/reset-password). */
export const Route = createFileRoute("/auth")({
  component: () => <Outlet />,
});
