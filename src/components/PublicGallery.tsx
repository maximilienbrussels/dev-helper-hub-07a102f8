/**
 * Publieke fotogalerij: responsief raster op desktop, swipebare carrousel op
 * mobiel en een toegankelijke lightbox om in hoge resolutie te bladeren.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { FarmImage } from "@/components/FarmImage";
import { cn } from "@/lib/utils";
import { handleImageError } from "@/lib/image-fallback";

type Props = {
  urls: string[];
  title?: string;
  intro?: string;
  className?: string;
  /** Alt-tekst basis; index wordt toegevoegd. */
  altBase?: string;
};

export function PublicGallery({ urls, title, intro, className, altBase = "Foto" }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const photos = urls.filter(Boolean);
  if (photos.length === 0) return null;

  return (
    <section className={cn("mt-16", className)} aria-label={title ?? "Fotogalerij"}>
      {title ? (
        <h2 className="font-serif text-2xl text-[color:var(--ink-forest)] md:text-3xl">{title}</h2>
      ) : null}
      {intro ? <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{intro}</p> : null}

      {/* Mobiel: overzichtelijk raster — alle foto's meteen zichtbaar, tik om te vergroten */}
      <ul className="mt-6 grid grid-cols-2 gap-3 md:hidden">
        {photos.map((url, i) => (
          <li key={`${url}-${i}`} className={i === 0 ? "col-span-2" : undefined}>
            <button
              type="button"
              onClick={() => setOpenIndex(i)}
              className="block w-full overflow-hidden rounded-2xl border border-border/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-terracotta)]"
              aria-label={`${altBase} ${i + 1} vergroten`}
            >
              <div className={i === 0 ? "aspect-[4/3] w-full" : "aspect-square w-full"}>
                <FarmImage src={url} alt={`${altBase} ${i + 1}`} />
              </div>
            </button>
          </li>
        ))}
      </ul>

      {/* Desktop: raster met subtiel hover-effect */}
      <ul className="mt-6 hidden gap-3 md:grid md:grid-cols-3 lg:grid-cols-4">
        {photos.map((url, i) => (
          <li key={`${url}-${i}`}>
            <button
              type="button"
              onClick={() => setOpenIndex(i)}
              className="group block w-full overflow-hidden rounded-2xl border border-border/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-terracotta)]"
              aria-label={`${altBase} ${i + 1} vergroten`}
            >
              <div className="aspect-[4/3] w-full transition-transform duration-500 ease-out group-hover:scale-[1.04]">
                <FarmImage src={url} alt={`${altBase} ${i + 1}`} />
              </div>
            </button>
          </li>
        ))}
      </ul>

      {openIndex !== null ? (
        <Lightbox
          photos={photos}
          index={openIndex}
          altBase={altBase}
          onIndexChange={setOpenIndex}
          onClose={() => setOpenIndex(null)}
        />
      ) : null}
    </section>
  );
}

function Lightbox({
  photos,
  index,
  altBase,
  onIndexChange,
  onClose,
}: {
  photos: string[];
  index: number;
  altBase: string;
  onIndexChange: (i: number) => void;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchX = useRef<number | null>(null);

  const go = useCallback(
    (dir: -1 | 1) => onIndexChange((index + dir + photos.length) % photos.length),
    [index, photos.length, onIndexChange],
  );

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [go, onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${altBase} ${index + 1} van ${photos.length}`}
      className="fixed inset-0 z-[100] flex flex-col bg-black/92 backdrop-blur-sm"
      onClick={onClose}
      onTouchStart={(e) => {
        touchX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const start = touchX.current;
        const end = e.changedTouches[0]?.clientX ?? null;
        touchX.current = null;
        if (start === null || end === null) return;
        if (Math.abs(end - start) > 50) go(end < start ? 1 : -1);
      }}
    >
      <div className="flex items-center justify-between p-4 text-white/90">
        <span className="text-sm tabular-nums">
          {index + 1} / {photos.length}
        </span>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Sluiten"
          className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center px-2 pb-6">
        <img loading="lazy"
          src={photos[index]}
          alt={`${altBase} ${index + 1}`}
          onClick={(e) => e.stopPropagation()}
          onError={handleImageError}
          className="max-h-full max-w-full rounded-lg object-contain"
        />
      </div>

      {photos.length > 1 ? (
        <>
          <button
            type="button"
            aria-label="Vorige foto"
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <ChevronLeft className="size-6" />
          </button>
          <button
            type="button"
            aria-label="Volgende foto"
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <ChevronRight className="size-6" />
          </button>
        </>
      ) : null}
    </div>
  );
}
