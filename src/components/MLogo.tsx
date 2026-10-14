import logoUrl from "@/assets/logo-maximilienpark.png";
import { handleImageError } from "@/lib/image-fallback";

/**
 * Pixel-exact transparent PNG of the Maximilien horse-'m' mark.
 * The mark is white by nature; we tint via CSS filter only for the "brand" variant,
 * so the underlying shape is never redrawn.
 * `className` should set the height only (e.g. `h-10`); width auto-fits the aspect ratio.
 */
export function MLogo({
  className = "h-10 w-auto",
  title = "Maximilien",
  variant = "brand",
}: {
  className?: string;
  title?: string;
  /**
   * "white" keeps the original white mark (for photo/dark backgrounds).
   * "brand" tints it to the terracotta brand tone (for light backgrounds — default).
   */
  variant?: "white" | "brand";
}) {
  return (
    <img loading="eager" decoding="async"
      src={logoUrl}
      onError={handleImageError}
      alt={title}
      className={
        className +
        " select-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.15)] " +
        (variant === "white"
          ? ""
          : "[filter:brightness(0)_saturate(100%)_invert(38%)_sepia(59%)_saturate(624%)_hue-rotate(340deg)_brightness(92%)_contrast(90%)]")
      }
      draggable={false}
    />
  );
}
