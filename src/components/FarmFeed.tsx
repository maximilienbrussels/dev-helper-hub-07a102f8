import { ArrowRight } from "lucide-react";
import { BlueskyPostCard, BlueskyPostSkeleton } from "@/components/social/BlueskyPostCard";
import { BlueskyIcon } from "@/components/social/BlueskyIcon";
import { LocalLink } from "@/components/LocalLink";
import { pathFor } from "@/lib/routes-i18n";
import { useBlueskyFeed, BSKY_PROFILE_URL } from "@/lib/bluesky";
import { useT } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

const COPY: Record<Lang, { eyebrow: string; heading: string; cta: string; error: string; empty: string }> = {
  nl: {
    eyebrow: "Live van de boerderij",
    heading: "Laatste nieuws",
    cta: "Naar onze media",
    error: "Berichten zijn even niet beschikbaar — volg ons rechtstreeks op Bluesky.",
    empty: "Binnenkort vind je hier onze nieuwste berichten van het erf.",
  },
  fr: {
    eyebrow: "En direct de la ferme",
    heading: "Dernières actualités",
    cta: "Vers nos médias",
    error: "Publications momentanément indisponibles — suivez-nous sur Bluesky.",
    empty: "Bientôt nos dernières publications de la ferme apparaîtront ici.",
  },
  en: {
    eyebrow: "Live from the farm",
    heading: "Latest news",
    cta: "To our media",
    error: "Posts are temporarily unavailable — follow us directly on Bluesky.",
    empty: "Our latest posts from the yard will appear here soon.",
  },
};

/** Homepage-teaser: de 3 meest recente Bluesky-berichten. */
export function FarmFeed() {
  const { lang } = useT();
  const c = COPY[lang];
  const { posts, profile, isLoading, isError } = useBlueskyFeed(3);

  return (
    <section className="py-2 pb-12" aria-labelledby="farm-feed-title">
      <div className="rounded-3xl border border-border bg-card p-5 text-card-foreground md:p-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-primary">
              <BlueskyIcon className="h-3 w-3" />
              {c.eyebrow}
            </p>
            <h2 id="farm-feed-title" className="font-serif mt-1.5 text-2xl italic md:text-3xl">
              {c.heading}
            </h2>
          </div>
          <LocalLink
            to={pathFor("social", lang)}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-primary px-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-foreground transition-opacity hover:opacity-90"
          >
            {c.cta}
            <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden />
          </LocalLink>
        </div>

        <div className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <BlueskyPostSkeleton key={i} />
              ))}
            </div>
          ) : isError || posts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-background/50 p-8 text-center">
              <p className="text-sm text-muted-foreground">{isError ? c.error : c.empty}</p>
              <a
                href={BSKY_PROFILE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-terracotta)] hover:underline"
              >
                <BlueskyIcon className="h-3.5 w-3.5" />
                @maximilien.site
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.slice(0, 3).map((post) => (
                <BlueskyPostCard key={post.uri} post={post} avatar={profile?.avatar} compact />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
