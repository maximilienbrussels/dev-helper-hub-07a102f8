/**
 * Publieke beeldcomponent met een verzorgde placeholder.
 * Toont een boerderijpatroon wanneer er geen beeld is (image_url == null) of
 * wanneer het bestand niet geladen kan worden (bv. verwijderd uit de bucket).
 */
import { useEffect, useState } from "react";
import { Leaf } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  src?: string | null;
  alt?: string;
  className?: string;
  wrapperClassName?: string;
  loading?: "lazy" | "eager";
  label?: string;
};

export function FarmImage({
  src,
  alt = "",
  className,
  wrapperClassName,
  loading = "lazy",
  label,
}: Props) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  const show = Boolean(src) && !failed;

  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-muted", wrapperClassName)}>
      {show ? (
        <img
          src={src as string}
          alt={alt}
          loading={loading}
          decoding="async"
          onError={() => setFailed(true)}
          className={cn("h-full w-full object-cover", className)}
        />
      ) : (
        <div
          aria-hidden={!label}
          role={label ? "img" : undefined}
          aria-label={label}
          className="flex h-full w-full items-center justify-center bg-[color:var(--color-surface-forest)]/10"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, color-mix(in srgb, var(--color-terracotta) 12%, transparent) 0 10px, transparent 10px 24px)",
          }}
        >
          <Leaf className="size-8 text-[color:var(--color-terracotta)]/60" />
        </div>
      )}
    </div>
  );
}
