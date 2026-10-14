/**
 * Eenvoudige fullscreen-weergave voor alles wat Maxim deelt: foto's, kaarten
 * en planningen. Sluit met Escape, met de knop of door naast de inhoud te
 * klikken.
 */
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export function Lightbox({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title ?? "Vergrote weergave"}
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Sluiten"
        className="absolute right-4 top-4 grid size-11 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25"
      >
        <X className="size-5" />
      </button>
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90dvh] w-full max-w-5xl overflow-auto rounded-2xl"
      >
        {title ? (
          <p className="mb-2 text-center text-sm font-semibold text-white/90">{title}</p>
        ) : null}
        {children}
      </div>
    </div>,
    document.body,
  );
}

/** Foto die je aanklikt om ze schermvullend te bekijken. */
export function ZoomableImage({
  src,
  alt,
  className,
  onError,
}: {
  src: string;
  alt: string;
  className?: string;
  onError?: React.ReactEventHandler<HTMLImageElement>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block cursor-zoom-in"
        aria-label={alt || "Foto vergroten"}
      >
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={className}
          {...(onError ? { onError } : {})}
        />
      </button>
      <Lightbox open={open} onClose={() => setOpen(false)} {...(alt ? { title: alt } : {})}>
        <img src={src} alt={alt} className="mx-auto max-h-[85dvh] w-auto rounded-xl object-contain" />
      </Lightbox>
    </>
  );
}
