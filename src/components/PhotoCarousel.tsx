/**
 * Swipebare fotocarrousel met scroll-snap.
 * - Mobiel: vegen met de vinger.
 * - Desktop: pijltjes + stipjes; optioneel automatisch doorschuiven.
 * Puur presentatie, alle kleuren via de design tokens.
 */
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { handleImageError } from "@/lib/image-fallback";
import { focusFor } from "@/lib/photo-focus";

export type CarouselPhoto = { src: string; alt: string; caption?: string };

export function PhotoCarousel({
  photos,
  title,
  autoPlay = false,
  interval = 5000,
  className,
  aspect = "aspect-[4/3]",
  perView = "sm:basis-1/2 lg:basis-1/3",
}: {
  photos: CarouselPhoto[];
  title?: string;
  autoPlay?: boolean;
  interval?: number;
  className?: string;
  aspect?: string;
  /** Tailwind basis-classes voor het aantal foto's naast elkaar. */
  perView?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const scrollToIndex = useCallback((i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const child = track.children[i] as HTMLElement | undefined;
    if (child) track.scrollTo({ left: child.offsetLeft - track.offsetLeft, behavior: "smooth" });
  }, []);

  const step = useCallback(
    (dir: 1 | -1) => {
      const next = (index + dir + photos.length) % photos.length;
      setIndex(next);
      scrollToIndex(next);
    },
    [index, photos.length, scrollToIndex],
  );

  // Houd de actieve stip gelijk met wat er in beeld staat.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const items = Array.from(track.children) as HTMLElement[];
        const mid = track.scrollLeft + track.clientWidth / 2;
        let best = 0;
        let bestDist = Infinity;
        items.forEach((el, i) => {
          const c = el.offsetLeft - track.offsetLeft + el.clientWidth / 2;
          const d = Math.abs(c - mid);
          if (d < bestDist) {
            bestDist = d;
            best = i;
          }
        });
        setIndex(best);
      });
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      track.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    if (!autoPlay || paused || photos.length < 2) return;
    const id = window.setInterval(() => step(1), interval);
    return () => window.clearInterval(id);
  }, [autoPlay, paused, interval, step, photos.length]);

  if (photos.length === 0) return null;

  return (
    <div
      className={cn("relative", className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {title ? <h2 className="font-serif text-2xl text-foreground">{title}</h2> : null}

      <div
        ref={trackRef}
        className={cn(
          "mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-2",
          "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        {photos.map((p) => {
          const [deskPos, mobilePos] = focusFor(p.src);
          return (
          <figure
            key={p.src + p.alt}
            className={cn("min-w-0 shrink-0 basis-[85%] snap-center", perView)}
            style={
              { "--pc-pos": mobilePos, "--pc-pos-md": deskPos } as React.CSSProperties
            }
          >
            <img
              src={p.src}
              alt={p.alt}
              loading="lazy"
              decoding="async"
              onError={handleImageError}
              className={cn(
                "w-full rounded-2xl border border-border object-cover",
                "object-[var(--pc-pos)] md:object-[var(--pc-pos-md)]",
                aspect,
              )}
            />
            {p.caption ? (
              <figcaption className="mt-2 text-xs text-muted-foreground">{p.caption}</figcaption>
            ) : null}
          </figure>
          );
        })}
      </div>

      {photos.length > 1 ? (
        <div className="mt-1 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            {photos.length > 8 ? (
              <span className="text-xs tabular-nums text-muted-foreground">
                {index + 1} / {photos.length}
              </span>
            ) : (
              photos.map((p, i) => (
              <button
                key={`dot-${p.src}`}
                type="button"
                aria-label={`${i + 1} / ${photos.length}`}
                onClick={() => {
                  setIndex(i);
                  scrollToIndex(i);
                }}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === index ? "w-5 bg-primary" : "w-1.5 bg-border",
                )}
              />
              ))
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Vorige foto"
              className="grid size-9 place-items-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-muted"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Volgende foto"
              className="grid size-9 place-items-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-muted"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
