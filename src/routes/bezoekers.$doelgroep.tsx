import { createFileRoute, notFound } from "@tanstack/react-router";
import { HubLandingTemplate, HubNotFound } from "@/components/HubLandingTemplate";
import { SchoolAnimations } from "@/components/SchoolAnimations";
import { BirthdayPackages } from "@/components/BirthdayPackages";
import { getHubEntry, hasHubSlug } from "@/lib/hub-content";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/bezoekers/$doelgroep")({
  loader: ({ params }) => {
    if (!hasHubSlug("bezoekers", params.doelgroep)) throw notFound();
    return { slug: params.doelgroep };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Bezoekers — Maximilien" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const entry = getHubEntry("bezoekers", loaderData.slug, "nl")!;
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
  component: BezoekersPage,
  notFoundComponent: BezoekersNotFound,
});

function BezoekersPage() {
  const { slug } = Route.useLoaderData();
  const { lang } = useT();
  const entry = getHubEntry("bezoekers", slug, lang)!;
  return (
    <HubLandingTemplate
      entry={entry}
      inbox={slug}
      showPlan
      extra={
        slug === "school" ? (
          <SchoolAnimations />
        ) : slug === "familie" ? (
          <BirthdayPackages />
        ) : undefined
      }
    />
  );
}

function BezoekersNotFound() {
  return <HubNotFound eyebrow="Bezoekers" />;
}
