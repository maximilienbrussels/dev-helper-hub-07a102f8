import type { Lang } from "@/lib/i18n";

export type ProductAvailability = "available" | "coming_soon" | "out_of_stock";

export function normalizeAvailability(value: unknown): ProductAvailability {
  return value === "coming_soon" || value === "out_of_stock" ? value : "available";
}

/** Grijstinten/opacity per status, zoals afgesproken in de shop-richtlijnen. */
export const AVAILABILITY_MEDIA_CLASS: Record<ProductAvailability, string> = {
  available: "",
  coming_soon: "grayscale-[0.8] opacity-60",
  out_of_stock: "grayscale opacity-50",
};

export const AVAILABILITY_BADGE_CLASS: Record<ProductAvailability, string> = {
  available: "bg-success/15 text-success border-success/30",
  coming_soon: "bg-warning/20 text-warning-foreground border-warning/40",
  out_of_stock: "bg-muted text-muted-foreground border-border",
};

type StatusCopy = { badge: string; cta: string };

const COPY: Record<Lang, Record<ProductAvailability, StatusCopy>> = {
  nl: {
    available: { badge: "✅ Op voorraad", cta: "In mand" },
    coming_soon: { badge: "⏳ Binnenkort", cta: "Bekijk details" },
    out_of_stock: { badge: "❌ Tijdelijk uitverkocht", cta: "Bekijk details" },
  },
  fr: {
    available: { badge: "✅ En stock", cta: "Au panier" },
    coming_soon: { badge: "⏳ Bientôt", cta: "Voir les détails" },
    out_of_stock: { badge: "❌ Temporairement épuisé", cta: "Voir les détails" },
  },
  en: {
    available: { badge: "✅ In stock", cta: "Add" },
    coming_soon: { badge: "⏳ Coming soon", cta: "View details" },
    out_of_stock: { badge: "❌ Temporarily sold out", cta: "View details" },
  },
};

export function availabilityCopy(status: ProductAvailability, lang: Lang): StatusCopy {
  return COPY[lang][status];
}

export const ADMIN_AVAILABILITY_OPTIONS: { value: ProductAvailability; labelKey: string }[] = [
  { value: "available", labelKey: "shop.availability.available" },
  { value: "coming_soon", labelKey: "shop.availability.comingSoon" },
  { value: "out_of_stock", labelKey: "shop.availability.outOfStock" },
];
