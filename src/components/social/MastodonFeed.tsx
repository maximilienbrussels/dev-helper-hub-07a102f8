import { MastodonIcon } from "@/components/social/MastodonIcon";
import { MASTODON_ACCT, MASTODON_PROFILE_URL, useMastodonFeed } from "@/lib/mastodon";
import { relativeTime } from "@/lib/bluesky";
import { useT, type Lang } from "@/lib/i18n";
import { handleImageError } from "@/lib/image-fallback";

const COPY: Record<Lang, { heading: string; follow: string; error: string; empty: string }> = {
  nl: {
    heading: "Op Mastodon",
    follow: "Volg ons in het fediverse",
    error: "De Mastodon-berichten zijn even niet beschikbaar.",
    empty: "Binnenkort verschijnen hier onze eerste toots.",
  },
  fr: {
    heading: "Sur Mastodon",
    follow: "Suivez-nous dans le fédiverse",
    error: "Les publications Mastodon sont momentanément indisponibles.",
    empty: "Nos premiers pouets apparaîtront bientôt ici.",
  },
  en: {
    heading: "On Mastodon",
    follow: "Follow us in the fediverse",
    error: "Mastodon posts are temporarily unavailable.",
    empty: "Our first toots will appear here soon.",
  },
};

/** Lichtgewicht Mastodon-feed op basis van de openbare API van de instance. */
export function MastodonFeed({
  limit = 6,
  className = "",
}: {
  limit?: number;
  className?: string;
}) {
  const { lang } = useT();
  const c = COPY[lang];
  const { posts, isLoading, isError } = useMastodonFeed(limit);

  return (
    <section
      className={`rounded-3xl border border-border bg-card p-5 text-card-foreground md:p-7 ${className}`}
      aria-labelledby="mastodon-feed-title"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-primary">
            <MastodonIcon className="h-3.5 w-3.5" />
            {c.heading}
          </p>
          <h2 id="mastodon-feed-title" className="font-serif mt-1.5 text-2xl italic md:text-3xl">
            {MASTODON_ACCT}
          </h2>
        </div>
        <a
          href={MASTODON_PROFILE_URL}
          target="_blank"
          rel="me noopener noreferrer"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-border px-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/90 transition-colors hover:border-[color:var(--color-terracotta)]/60 hover:text-[color:var(--color-terracotta)]"
        >
          <MastodonIcon className="h-4 w-4" />
          {c.follow}
        </a>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-2xl border border-border bg-muted/40"
              />
            ))}
          </div>
        ) : isError || posts.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-background/50 p-6 text-center text-sm text-muted-foreground">
            {isError ? c.error : c.empty}
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <li key={post.id} className="rounded-2xl border border-border bg-background/60 p-4">
                <a href={post.url} target="_blank" rel="noopener noreferrer" className="block">
                  <time className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    {relativeTime(post.createdAt, lang)}
                  </time>
                  {post.text ? (
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                      {post.text.length > 240 ? `${post.text.slice(0, 240)}…` : post.text}
                    </p>
                  ) : null}
                  {post.media[0] && post.media[0].type === "image" ? (
                    <img
                      src={post.media[0].preview}
                      alt={post.media[0].alt}
                      loading="lazy"
                      className="mt-3 aspect-[4/3] w-full rounded-xl object-cover"
                      onError={handleImageError}
                    />
                  ) : null}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
