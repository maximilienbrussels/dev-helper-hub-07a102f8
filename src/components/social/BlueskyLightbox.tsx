import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT, type Lang } from "@/lib/i18n";
import type { BskyImage } from "@/lib/bluesky";
import { handleImageError } from "@/lib/image-fallback";

const COPY: Record<
  Lang,
  { close: string; prev: string; next: string; counter: (a: number, b: number) => string }
> = {
  nl: {
    close: "Sluiten",
    prev: "Vorige foto",
    next: "Volgende foto",
    counter: (a, b) => `Foto ${a} van ${b}`,
  },
  fr: {
    close: "Fermer",
    prev: "Photo précédente",
    next: "Photo suivante",
    counter: (a, b) => `Photo ${a} sur ${b}`,
  },
  en: {
    close: "Close",
    prev: "Previous photo",
    next: "Next photo",
    counter: (a, b) => `Photo ${a} of ${b}`,
  },
};

export function BlueskyLightbox({
  images,
  index,
  onClose,
  onIndexChange,
}: {
  images: BskyImage[];
  index: number;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}) {
  const { lang } = useT();
  const c = COPY[lang];
  const total = images.length;
  const touchStart = useRef<number | null>(null);
  const [mounted, setMounted] = useState(false);

  const go = useCallback(
    (delta: number) => {
      if (total < 2) return;
      onIndexChange((index + delta + total) % total);
    },
    [index, onIndexChange, total],
  );

  useEffect(() => {
    setMounted(true);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [go, onClose]);

  const current = images[index];
  if (!current || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={c.counter(index + 1, total)}
      onClick={onClose}
      onTouchStart={(e) => {
        touchStart.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const start = touchStart.current;
        const end = e.changedTouches[0]?.clientX ?? null;
        touchStart.current = null;
        if (start === null || end === null) return;
        const dx = end - start;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      }}
      className={cn(
        "fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-foreground/90 p-4 backdrop-blur-sm transition-opacity duration-200 md:p-10",
        mounted ? "opacity-100" : "opacity-0",
      )}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={c.close}
        className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-full border border-background/25 bg-background/10 text-background backdrop-blur transition-colors hover:bg-background/25 md:right-6 md:top-6"
      >
        <X className="h-5 w-5" strokeWidth={2} aria-hidden />
      </button>

      {total > 1 && (
        <>
          <button
            type="button"
            aria-label={c.prev}
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
            className="absolute left-2 top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-background/25 bg-background/10 text-background backdrop-blur transition-colors hover:bg-background/25 md:left-6"
          >
            <ChevronLeft className="h-6 w-6" strokeWidth={1.75} aria-hidden />
          </button>
          <button
            type="button"
            aria-label={c.next}
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
            className="absolute right-2 top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-background/25 bg-background/10 text-background backdrop-blur transition-colors hover:bg-background/25 md:right-6"
          >
            <ChevronRight className="h-6 w-6" strokeWidth={1.75} aria-hidden />
          </button>
        </>
      )}

      <figure
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-full min-h-0 w-full max-w-5xl flex-col items-center gap-4"
      >
        <img loading="lazy"
          key={current.url}
          src={current.url}
          alt={current.alt || ""}
          className="max-h-[75vh] w-auto max-w-full rounded-2xl object-contain shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)] duration-300 animate-in fade-in zoom-in-95"
          onError={handleImageError}
        />
        {current.alt && (
          <figcaption className="max-w-2xl text-center text-xs leading-relaxed text-background/80">
            {current.alt}
          </figcaption>
        )}
      </figure>

      {total > 1 && (
        <div className="mt-5 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              aria-label={c.counter(i + 1, total)}
              aria-current={i === index}
              onClick={() => onIndexChange(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === index ? "w-6 bg-background" : "w-1.5 bg-background/40 hover:bg-background/70",
              )}
            />
          ))}
        </div>
      )}
    </div>,
    document.body,
  );
}
