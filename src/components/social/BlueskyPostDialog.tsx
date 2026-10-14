import { useEffect } from "react";
import { createPortal } from "react-dom";
import { ExternalLink, X } from "lucide-react";
import { BlueskyIcon } from "@/components/social/BlueskyIcon";
import { useT, type Lang } from "@/lib/i18n";
import { BSKY_PROFILE_URL, absoluteDate, type BskyPost } from "@/lib/bluesky";
import { handleImageError } from "@/lib/image-fallback";

const COPY: Record<Lang, { close: string; open: string }> = {
  nl: { close: "Sluiten", open: "Openen op Bluesky" },
  fr: { close: "Fermer", open: "Ouvrir sur Bluesky" },
  en: { close: "Close", open: "Open on Bluesky" },
};

/** Volledige weergave van één bericht — opent bij klik op de kaart. */
export function BlueskyPostDialog({
  post,
  avatar,
  onClose,
}: {
  post: BskyPost;
  avatar?: string;
  onClose: () => void;
}) {
  const { lang } = useT();
  const c = COPY[lang];
  const src = avatar ?? post.author.avatar;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={post.author.displayName}
      className="fixed inset-0 z-[90] flex items-end justify-center bg-foreground/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-border bg-card p-5 text-card-foreground shadow-2xl sm:rounded-3xl sm:p-8"
      >
        <div className="flex items-start gap-3">
          <a
            href={BSKY_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 overflow-hidden rounded-full border border-border bg-secondary"
          >
            {src ? (
              <img loading="lazy"
                src={src}
                alt={post.author.displayName}
                width={48}
                height={48}
                className="h-12 w-12 object-cover"
                onError={handleImageError}
              />
            ) : (
              <span className="grid h-12 w-12 place-items-center font-serif text-lg italic">M</span>
            )}
          </a>
          <div className="min-w-0 flex-1">
            <a
              href={BSKY_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block truncate font-serif text-xl italic leading-tight hover:underline"
            >
              {post.author.displayName}
            </a>
            <p className="truncate text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              @{post.author.handle}
              <span className="mx-1.5 opacity-40">·</span>
              <time dateTime={post.createdAt}>{absoluteDate(post.createdAt, lang)}</time>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={c.close}
            className="shrink-0 rounded-full border border-border bg-background p-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        {post.text && (
          <p className="mt-5 whitespace-pre-wrap text-base leading-relaxed text-foreground/90">
            {post.text}
          </p>
        )}

        {post.video ? (
          <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-black/80">
            <video
              controls
              playsInline
              preload="metadata"
              poster={post.video.thumbnail}
              src={post.video.playlist}
              className="max-h-[60vh] w-full"
            >
              <track kind="captions" />
            </video>
          </div>
        ) : post.images.length > 0 ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {post.images.map((img, i) => (
              <img
                key={img.url}
                src={img.url}
                alt={img.alt}
                loading="lazy"
                className={`w-full rounded-2xl border border-border object-cover ${
                  post.images.length === 1 || (post.images.length === 3 && i === 0)
                    ? "sm:col-span-2 max-h-[60vh]"
                    : "aspect-[4/3]"
                }`}
                onError={handleImageError}
              />
            ))}
          </div>
        ) : null}

        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-primary px-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-foreground transition-opacity hover:opacity-90"
        >
          <BlueskyIcon className="h-3.5 w-3.5" />
          {c.open}
          <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        </a>
      </div>
    </div>,
    document.body,
  );
}
