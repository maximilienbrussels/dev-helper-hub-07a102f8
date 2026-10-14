import { useEffect, useRef } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { BlueskyIcon } from "@/components/social/BlueskyIcon";
import { BlueskyPostCard, BlueskyPostSkeleton } from "@/components/social/BlueskyPostCard";
import { BSKY_PROFILE_URL, useBlueskyFeed, useBlueskyInfiniteFeed } from "@/lib/bluesky";
import { useT, type Lang } from "@/lib/i18n";

const COPY: Record<
  Lang,
  {
    error: string;
    errorTitle: string;
    retry: string;
    onBluesky: string;
    empty: string;
    more: string;
    loading: string;
    end: string;
  }
> = {
  nl: {
    errorTitle: "We zijn momenteel druk op de boerderij!",
    error: "De berichten laden even niet. Bekijk onze updates ondertussen rechtstreeks op Bluesky.",
    retry: "Opnieuw proberen",
    onBluesky: "Bekijk op Bluesky",
    empty: "Er staan nog geen berichten op ons Bluesky-kanaal. Kom binnenkort terug!",
    more: "Laad meer berichten",
    loading: "Bezig met laden…",
    end: "Je bent helemaal bij.",
  },
  fr: {
    errorTitle: "Nous sommes occupés à la ferme !",
    error:
      "Les publications ne se chargent pas pour le moment. Découvrez nos actualités directement sur Bluesky.",
    retry: "Réessayer",
    onBluesky: "Voir sur Bluesky",
    empty: "Aucune publication sur notre canal Bluesky pour l'instant. Revenez bientôt !",
    more: "Charger plus de publications",
    loading: "Chargement…",
    end: "Vous avez tout vu.",
  },
  en: {
    errorTitle: "We're busy on the farm right now!",
    error: "Posts aren't loading at the moment. Check our updates straight on Bluesky.",
    retry: "Try again",
    onBluesky: "View on Bluesky",
    empty: "No posts on our Bluesky channel yet. Check back soon!",
    more: "Load more posts",
    loading: "Loading…",
    end: "You're all caught up.",
  },
};

function FeedFallback({ lang, onRetry }: { lang: Lang; onRetry: () => void }) {
  const c = COPY[lang];
  return (
    <div className="rounded-3xl border border-border bg-card p-8 text-center text-card-foreground md:p-12">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-secondary text-[color:var(--color-terracotta)]">
        <BlueskyIcon className="h-5 w-5" />
      </span>
      <p className="font-serif mt-4 text-2xl italic">{c.errorTitle}</p>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
        {c.error}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-border px-5 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors hover:bg-secondary"
        >
          <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          {c.retry}
        </button>
        <a
          href={BSKY_PROFILE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-primary px-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-foreground transition-opacity hover:opacity-90"
        >
          <BlueskyIcon className="h-3.5 w-3.5" />
          {c.onBluesky}
        </a>
      </div>
    </div>
  );
}

/** Compacte, niet-gepagineerde grid (bv. voor secties op andere pagina's). */
export function BlueskyFeedGrid({
  limit = 24,
  compact = false,
}: {
  limit?: number;
  compact?: boolean;
}) {
  const { lang } = useT();
  const c = COPY[lang];
  const { posts, profile, isLoading, isError, refetch } = useBlueskyFeed(limit);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: compact ? 3 : 6 }).map((_, i) => (
          <BlueskyPostSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) return <FeedFallback lang={lang} onRetry={() => void refetch()} />;

  if (posts.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-card/60 p-10 text-center">
        <p className="font-serif text-xl italic text-muted-foreground">{c.empty}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {posts.slice(0, limit).map((post) => (
        <BlueskyPostCard key={post.uri} post={post} avatar={profile?.avatar} compact={compact} />
      ))}
    </div>
  );
}

/** Gepagineerde grid met "laad meer" — gebruikt op /social. */
export function BlueskyFeedPaginated({ pageSize = 12 }: { pageSize?: number }) {
  const { lang } = useT();
  const c = COPY[lang];
  const { posts, profile, isLoading, isError, hasMore, isLoadingMore, loadMore, refetch } =
    useBlueskyInfiniteFeed(pageSize);
  const sentinel = useRef<HTMLDivElement | null>(null);

  // Oudere berichten laden zodra de onderkant van de lijst in beeld komt.
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore || isLoadingMore) return;
    const io = new IntersectionObserver(
      (entries) => entries[0]?.isIntersecting && void loadMore(),
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, isLoadingMore, loadMore, posts.length]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <BlueskyPostSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError && posts.length === 0)
    return <FeedFallback lang={lang} onRetry={() => void refetch()} />;

  if (posts.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-card/60 p-10 text-center">
        <p className="font-serif text-xl italic text-muted-foreground">{c.empty}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {posts.map((post) => (
          <BlueskyPostCard key={post.uri} post={post} avatar={profile?.avatar} />
        ))}
      </div>

      <div ref={sentinel} aria-hidden className="h-1 w-full" />

      <div className="mt-10 flex flex-col items-center gap-3">
        {hasMore ? (
          <button
            type="button"
            onClick={() => void loadMore()}
            disabled={isLoadingMore}
            className="inline-flex min-h-[48px] items-center gap-2.5 rounded-full border border-border bg-card px-7 text-[11px] font-semibold uppercase tracking-[0.2em] text-card-foreground transition-all hover:-translate-y-0.5 hover:border-[color:var(--color-terracotta)]/50 hover:shadow-[0_18px_40px_-28px_rgba(0,0,0,0.45)] disabled:cursor-wait disabled:opacity-70"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} aria-hidden />
                {c.loading}
              </>
            ) : (
              <>
                <BlueskyIcon className="h-3.5 w-3.5" />
                {c.more}
              </>
            )}
          </button>
        ) : (
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{c.end}</p>
        )}
        {isError && <p className="text-xs text-muted-foreground">{c.error}</p>}
      </div>
    </>
  );
}
