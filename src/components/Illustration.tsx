import { cn } from "@/lib/utils";
import { handleImageError } from "@/lib/image-fallback";

export function Illustration({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={handleImageError}
      className={cn(
        "rounded-2xl border border-border bg-[color:var(--color-cream)] object-contain",
        className,
      )}
    />
  );
}
