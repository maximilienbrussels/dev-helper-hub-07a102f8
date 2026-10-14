import { useMemo } from "react";
import { stampJitter } from "@/lib/seeded-random";
import { handleImageError } from "@/lib/image-fallback";

/**
 * Generieke, organische inktstempel voor een afbeelding (PNG/SVG met
 * transparante achtergrond). De afwijking is seeded op het unieke ID van de
 * pas/gebruiker, zodat de stempel altijd op exact dezelfde plek blijft staan.
 */
export function OrganicStamp({
  id,
  src,
  alt = "Stempel",
  className = "",
}: {
  id: string;
  src: string;
  alt?: string;
  className?: string;
}) {
  const j = useMemo(() => stampJitter(id), [id]);

  return (
    <div
      className={`inline-block pointer-events-none select-none ${className}`}
      style={{
        transform: `translate(${j.offsetX.toFixed(1)}px, ${j.offsetY.toFixed(1)}px) rotate(${j.rotate.toFixed(2)}deg) scale(${j.scale.toFixed(3)})`,
        opacity: j.opacity,
        mixBlendMode: "multiply",
        filter: "contrast(120%) brightness(95%)",
      }}
      aria-hidden="true"
    >
      <img loading="lazy" src={src} alt={alt} onError={handleImageError} className="h-auto w-full" />
    </div>
  );
}
