import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/adoptie")({
  beforeLoad: () => {
    throw redirect({ to: "/academy" });
  },
});
