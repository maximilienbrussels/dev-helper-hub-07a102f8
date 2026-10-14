import { createFileRoute, redirect } from "@tanstack/react-router";
import { detectLang } from "@/lib/lang-detect";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Maximilien — Stadsboerderij in Brussel" },
    { name: "description", content: "Ontdek de dieren, activiteiten en Academy van stadsboerderij Maximilien in Brussel." },
    { property: "og:title", content: "Maximilien — Stadsboerderij in Brussel" },
    { property: "og:description", content: "Bezoek stadsboerderij Maximilien en ontdek onze activiteiten en Academy." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  beforeLoad: async () => {
    const lang = await detectLang();
    throw redirect({ to: "/$lang", params: { lang }, replace: true });
  },
});
