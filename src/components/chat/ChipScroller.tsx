/**
 * Horizontale rij met suggestieknoppen die ook op een pc bruikbaar is:
 * muiswiel scrollt zijwaarts, je kan slepen met de muis en er staan pijlknoppen.
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function ChipScroller({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdges({
      left: el.scrollLeft > 4,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    measure();
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure, children]);

  const nudge = (dir: -1 | 1) => {
    ref.current?.scrollBy({ left: dir * Math.max(160, (ref.current.clientWidth ?? 200) * 0.7), behavior: "smooth" });
  };

  return (
    <div className={"relative " + (className ?? "")}>
      {edges.left ? (
        <button
          type="button"
          aria-label="Vorige suggesties"
          onClick={() => nudge(-1)}
          className="absolute top-1/2 left-0 z-10 hidden -translate-y-1/2 rounded-full border border-border bg-card/95 p-1 shadow-sm sm:block"
        >
          <ChevronLeft className="size-4" />
        </button>
      ) : null}

      <div
        ref={ref}
        onScroll={measure}
        onWheel={(e) => {
          const el = ref.current;
          if (!el) return;
          const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
          if (!delta) return;
          const before = el.scrollLeft;
          el.scrollLeft += delta;
          if (el.scrollLeft !== before) e.preventDefault();
        }}
        onPointerDown={(e) => {
          if (e.pointerType === "touch") return;
          const el = ref.current;
          if (!el) return;
          drag.current = { x: e.clientX, left: el.scrollLeft, moved: false };
        }}
        onPointerMove={(e) => {
          const el = ref.current;
          const d = drag.current;
          if (!el || !d) return;
          const dx = e.clientX - d.x;
          if (Math.abs(dx) > 3) d.moved = true;
          el.scrollLeft = d.left - dx;
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerLeave={() => {
          drag.current = null;
        }}
        onClickCapture={(e) => {
          if (drag.current?.moved) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        className="no-scrollbar flex items-center gap-2 overflow-x-auto px-1 py-2 [scrollbar-width:none]"
      >
        {children}
      </div>

      {edges.right ? (
        <button
          type="button"
          aria-label="Volgende suggesties"
          onClick={() => nudge(1)}
          className="absolute top-1/2 right-0 z-10 hidden -translate-y-1/2 rounded-full border border-border bg-card/95 p-1 shadow-sm sm:block"
        >
          <ChevronRight className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
