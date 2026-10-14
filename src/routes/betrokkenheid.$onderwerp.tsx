import { createFileRoute, notFound } from "@tanstack/react-router";
import { HubLandingTemplate, HubNotFound } from "@/components/HubLandingTemplate";
import { getHubEntry, hasHubSlug } from "@/lib/hub-content";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/betrokkenheid/$onderwerp")({
  loader: ({ params }) => {
    if (!hasHubSlug("betrokkenheid", params.onderwerp)) throw notFound();
    return { slug: params.onderwerp };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Betrokkenheid — Maximilien" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const entry = getHubEntry("betrokkenheid", loaderData.slug, "nl")!;
    const desc = entry.lede.slice(0, 155);
    return {
      meta: [
        { title: `${entry.title} — Maximilien` },
        { name: "description", content: desc },
        { property: "og:title", content: entry.title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
      ],
    };
  },
  component: BetrokkenheidPage,
  notFoundComponent: BetrokkenheidNotFound,
});

function BetrokkenheidPage() {
  const { slug } = Route.useLoaderData();
  const { lang } = useT();
  const entry = getHubEntry("betrokkenheid", slug, lang)!;
  return <HubLandingTemplate entry={entry} inbox={slug} />;
}

function BetrokkenheidNotFound() {
  return <HubNotFound eyebrow="Betrokkenheid" />;
}
