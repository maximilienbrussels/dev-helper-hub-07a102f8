/**
 * Gestileerde terugvalafbeelding wanneer een beeld-URL niet laadt
 * (bv. verwijderd uit de bucket of ontbrekende opslagconfiguratie).
 * Vervangt het gebroken-beeld-icoon door het boerderijpatroon in huisstijl.
 */
import type { SyntheticEvent } from "react";

const FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs>
    <pattern id="p" width="34" height="34" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="34" height="34" fill="#EFE7DA"/>
      <rect width="10" height="34" fill="#C96F4A" opacity="0.18"/>
    </pattern>
  </defs>
  <rect width="800" height="800" fill="url(#p)"/>
  <path d="M400 300c70 0 120 50 120 120 0 66-54 120-120 120s-120-54-120-120c0-70 50-120 120-120z" fill="#1D3528" opacity="0.10"/>
  <path d="M340 470c0-70 56-126 126-126 0 70-56 126-126 126z" fill="#1D3528" opacity="0.35"/>
</svg>`;

export const IMAGE_FALLBACK_SRC = `data:image/svg+xml;utf8,${encodeURIComponent(FALLBACK_SVG)}`;

/** onError-handler voor <img>: toont de placeholder in plaats van een gebroken beeld. */
export function handleImageError(event: SyntheticEvent<HTMLImageElement>): void {
  const img = event.currentTarget;
  if (img.dataset["fallbackApplied"]) return;
  img.dataset["fallbackApplied"] = "1";
  img.removeAttribute("srcset");
  img.src = IMAGE_FALLBACK_SRC;
}
