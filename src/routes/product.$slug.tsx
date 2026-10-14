import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/product/$slug")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/$lang/$",
      params: { lang: "nl", _splat: `product/${params.slug}` },
      replace: true,
    });
  },
});
