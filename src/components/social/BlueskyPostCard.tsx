import { Fragment, useState, type ReactNode } from "react";
import { Heart, MessageCircle, Repeat2 } from "lucide-react";
import { BlueskyLightbox } from "@/components/social/BlueskyLightbox";
import { BlueskyPostDialog } from "@/components/social/BlueskyPostDialog";
import { cn } from "@/lib/utils";

import { useT, type Lang } from "@/lib/i18n";
import { BSKY_PROFILE_URL, absoluteDate, relativeTime, type BskyPost } from "@/lib/bluesky";
import { handleImageError } from "@/lib/image-fallback";

const COPY: Record<
  Lang,
  {
    view: string;
    onBluesky: string;
    likes: string;
    reposts: string;
    replies: string;
    openImage: string;
  }
> = {
  nl: {
    view: "Bekijk op Bluesky",
    onBluesky: "Bluesky",
    likes: "vind-ik-leuks",
    reposts: "reposts",
    replies: "reacties",
    openImage: "Foto vergroten",
  },
  fr: {
    view: "Voir sur Bluesky",
    onBluesky: "Bluesky",
    likes: "j'aime",
    reposts: "repartages",
    replies: "réponses",
    openImage: "Agrandir la photo",
  },
  en: {
    view: "View on Bluesky",
    onBluesky: "Bluesky",
    likes: "likes",
    reposts: "reposts",
    replies: "replies",
    openImage: "Enlarge photo",
  },
};

/** Tekst met werkende links, hashtags en mentions. */
function RichText({ post }: { post: BskyPost }) {
  const nodes: ReactNode[] = [];
  let cursor = 0;
  post.facets.forEach((facet, i) => {
    if (facet.start > cursor)
      nodes.push(<Fragment key={`t${i}`}>{post.text.slice(cursor, facet.start)}</Fragment>);
    nodes.push(
      <a
        key={`f${i}`}
        href={facet.value}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-[color:var(--color-terracotta)] underline decoration-[color:var(--color-terracotta)]/30 underline-offset-2 transition-colors hover:decoration-[color:var(--color-terracotta)]"
      >
        {post.text.slice(facet.start, facet.end)}
      </a>,
    );
    cursor = facet.end;
  });
  if (cursor < post.text.length)
    nodes.push(<Fragment key="tail">{post.text.slice(cursor)}</Fragment>);
  return (
    <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90">{nodes}</p>
  );
}

/** Klikbare foto met subtiele ALT-badge, net als in de Bluesky-app. */
function Thumb({
  src,
  alt,
  label,
  className,
  onOpen,
}: {
  src: string;
  alt: string;
  label: string;
  className?: string;
  onOpen: () => void;
}) {
  return (
    <div className="group/img relative overflow-hidden rounded-xl border border-border bg-secondary">
      <button
        type="button"
        onClick={onOpen}
        aria-label={alt ? `${label}: ${alt}` : label}
        className="block w-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className={cn(
            "w-full object-cover transition-transform duration-700 group-hover/img:scale-[1.03]",
            className,
          )}
          onError={handleImageError}
        />
      </button>
      {alt && (
        <span
          title={alt}
          className="pointer-events-auto absolute bottom-2 left-2 max-w-[85%] cursor-help truncate rounded-md bg-foreground/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-background backdrop-blur-sm transition-colors hover:bg-foreground/85"
        >
          ALT
        </span>
      )}
    </div>
  );
}

function Media({
  post,
  compact = false,
  onOpen,
}: {
  post: BskyPost;
  compact?: boolean;
  onOpen: (index: number) => void;
}) {
  const { lang } = useT();
  const label = COPY[lang].openImage;
  const frame = compact ? "max-h-64" : "max-h-[32rem]";
  if (post.video) {
    return (
      <div className={cn("overflow-hidden rounded-2xl border border-border bg-secondary", frame)}>
        <video
          controls
          playsInline
          preload="metadata"
          poster={post.video.thumbnail}
          src={post.video.playlist}
          className="h-full w-full bg-black/80"
        >
          <track kind="captions" />
        </video>
      </div>
    );
  }
  if (post.images.length === 0) return null;
  if (post.images.length === 1) {
    const img = post.images[0];
    return (
      <Thumb
        src={img.url}
        alt={img.alt}
        label={label}
        onOpen={() => onOpen(0)}
        className={compact ? "h-64" : "max-h-[32rem]"}
      />
    );
  }
  return (
    <div className="grid grid-cols-2 gap-2">
      {post.images.map((img, i) => (
        <div key={img.url} className={cn(post.images.length === 3 && i === 0 ? "col-span-2" : "")}>
          <Thumb
            src={img.url}
            alt={img.alt}
            label={label}
            onOpen={() => onOpen(i)}
            className="aspect-[4/3] h-full"
          />
        </div>
      ))}
    </div>
  );
}

/** Subtiele interactietellers. */
function Counters({ post }: { post: BskyPost }) {
  const { lang } = useT();
  const c = COPY[lang];
  const nf = new Intl.NumberFormat(lang === "nl" ? "nl-BE" : lang === "fr" ? "fr-BE" : "en-GB");
  const items = [
    { icon: Heart, value: post.counts.likes, label: c.likes },
    { icon: Repeat2, value: post.counts.reposts, label: c.reposts },
    { icon: MessageCircle, value: post.counts.replies, label: c.replies },
  ];
  return (
    <div className="flex items-center gap-4 text-muted-foreground">
      {items.map(({ icon: Icon, value, label }) => (
        <span
          key={label}
          title={`${nf.format(value)} ${label}`}
          className="inline-flex items-center gap-1.5 text-[12px] tabular-nums transition-colors hover:text-[color:var(--color-terracotta)]"
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
          <span className="sr-only">{label}: </span>
          {nf.format(value)}
        </span>
      ))}
    </div>
  );
}

export function BlueskyPostCard({
  post,
  avatar,
  compact = false,
}: {
  post: BskyPost;
  avatar?: string;
  compact?: boolean;
}) {
  const { lang } = useT();
  const c = COPY[lang];
  const src = avatar ?? post.author.avatar;
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [detail, setDetail] = useState(false);

  return (
    <article
      onClick={() => setDetail(true)}
      className="group flex h-full cursor-pointer flex-col gap-2.5 rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[color:var(--color-terracotta)]/40 hover:shadow-[0_18px_40px_-24px_rgba(0,0,0,0.35)]"
    >
      <header className="flex items-center gap-2.5">
        <a
          href={BSKY_PROFILE_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 overflow-hidden rounded-full border border-border bg-secondary"
        >
          {src ? (
            <img
              src={src}
              alt={post.author.displayName}
              width={36}
              height={36}
              loading="lazy"
              className="h-9 w-9 object-cover"
              onError={handleImageError}
            />
          ) : (
            <span className="grid h-9 w-9 place-items-center font-serif text-base italic">M</span>
          )}
        </a>
        <a
          href={BSKY_PROFILE_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          aria-label={c.onBluesky}
          className="min-w-0 flex-1 leading-tight hover:underline"
        >
          <span className="block truncate font-serif text-base italic">
            {post.author.displayName}
          </span>
          <span className="block truncate text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            @{post.author.handle}
            <span className="mx-1.5 opacity-40">·</span>
            <time dateTime={post.createdAt} title={absoluteDate(post.createdAt, lang)}>
              {relativeTime(post.createdAt, lang)}
            </time>
          </span>
        </a>
      </header>

      {post.text && (
        <div className={compact ? "line-clamp-3" : "line-clamp-5"}>
          <RichText post={post} />
        </div>
      )}

      <div onClick={(e) => e.stopPropagation()}>
        <Media post={post} compact onOpen={(i) => setLightbox(i)} />
      </div>

      <footer className="mt-auto pt-1">
        <Counters post={post} />
      </footer>

      {lightbox !== null && (
        <BlueskyLightbox
          images={post.images}
          index={lightbox}
          onIndexChange={setLightbox}
          onClose={() => setLightbox(null)}
        />
      )}
      {detail && <BlueskyPostDialog post={post} avatar={avatar} onClose={() => setDetail(false)} />}
    </article>
  );
}

export function BlueskyPostSkeleton() {
  return (
    <div className="flex h-full flex-col gap-4 rounded-3xl border border-border bg-card p-5 md:p-6">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 animate-pulse rounded-full bg-secondary" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-1/3 animate-pulse rounded-full bg-secondary" />
          <div className="h-2.5 w-1/2 animate-pulse rounded-full bg-secondary" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full animate-pulse rounded-full bg-secondary" />
        <div className="h-3 w-11/12 animate-pulse rounded-full bg-secondary" />
        <div className="h-3 w-2/3 animate-pulse rounded-full bg-secondary" />
      </div>
      <div className="aspect-[4/3] w-full animate-pulse rounded-2xl bg-secondary" />
      <div className="h-3 w-24 animate-pulse rounded-full bg-secondary" />
    </div>
  );
}
