import { Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery, queryOptions } from "@tanstack/react-query";
import { useState } from "react";
import { NavHeader } from "@/components/NavHeader";
import { LocalLink } from "@/components/LocalLink";
import { pathFor } from "@/lib/routes-i18n";
import { ProductStoryDialog } from "@/components/ProductStoryDialog";
import { useT, formatT, type Lang } from "@/lib/i18n";
import { productTitle, productDescription } from "@/lib/product-i18n";
import { cn } from "@/lib/utils";
import {
  AVAILABILITY_BADGE_CLASS,
  AVAILABILITY_MEDIA_CLASS,
  availabilityCopy,
  normalizeAvailability,
} from "@/lib/product-status";
import { storyForProduct } from "@/data/product-stories";

import { getProducts, type ProductDTO } from "@/lib/data.functions";
import { addToCartAndOpen } from "@/lib/cart";
import { imageForProduct, slugForProduct, detailForId } from "@/data/products";
import heroShopAsset from "@/assets/foto/foto-moestuin-bakken.jpg.asset.json";
const heroShop = heroShopAsset.url;
import { Leaf, RotateCcw, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { handleImageError } from "@/lib/image-fallback";

export const productsQO = queryOptions({ queryKey: ["products"], queryFn: () => getProducts() });

const shopHeroQO = queryOptions({
  queryKey: ["shop-hero"],
  queryFn: async () => {
    const { getShopHero } = await import("@/lib/shop-admin.functions");
    return getShopHero();
  },
});

const COPY: Record<Lang, { heroAlt: string }> = {
  nl: { heroAlt: "Lokale hoeveproducten op tafel" },
  fr: { heroAlt: "Produits fermiers locaux sur une table" },
  en: { heroAlt: "Local farm products on a table" },
};


function formatEuro(cents: number): string {
  return `€${(cents / 100).toFixed(2).replace(".", ",")}`;
}

export function ShopPage() {
  const { data: products } = useSuspenseQuery(productsQO);
  const { data: hero } = useQuery(shopHeroQO);
  const { t, lang } = useT();
  const c = COPY[lang];
  const [storyProduct, setStoryProduct] = useState<ProductDTO | null>(null);
  const [heroBroken, setHeroBroken] = useState(false);
  const heroImage = !heroBroken && hero?.url ? hero.url : heroShop;

  const handleAdd = (p: ProductDTO) => {
    addToCartAndOpen(p.id);
    toast.success(formatT(t("shop.added"), { title: productTitle(p, lang) }));
  };

  return (
    <div className="min-h-screen bg-background">
      <NavHeader />
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-0 md:grid-cols-2">
          <div className="flex flex-col justify-center border-b border-border px-4 py-10 md:border-b-0 md:border-r md:px-8 md:py-16">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {t("shop.eyebrow")}
            </p>
            <h1 className="mt-6 text-4xl font-bold leading-[1.05] tracking-tight md:text-5xl">
              {t("shop.title")}
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
              {t("shop.lede")}
            </p>
            <div className="mt-8 flex flex-wrap gap-4 text-xs uppercase tracking-[0.15em] text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <Leaf className="h-4 w-4 text-primary" /> {t("shop.packagingFree")}
              </span>
              <span className="inline-flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-primary" /> {t("shop.deposit")}
              </span>
            </div>
          </div>
          <div className="relative aspect-[16/12] overflow-hidden bg-[color:var(--color-surface-forest)] md:aspect-auto">
            <img
              onError={(e) => {
                if (!heroBroken && hero?.url) {
                  setHeroBroken(true);
                  return;
                }
                handleImageError(e);
              }}
              src={heroImage}
              alt={hero?.alt || c.heroAlt}
              width={1600}
              height={912}
              loading="eager"
              fetchPriority="high"
              decoding="sync"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border pb-4">
          <p className="text-[10px] uppercase tracking-[0.25em] text-[color:var(--color-terracotta,theme(colors.primary))]">
            {t("shop.offer")}
          </p>
          <h2 className="font-serif text-3xl italic md:text-4xl">
            {formatT(t("shop.count"), { n: products.length })}
          </h2>
        </div>
        <ul className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onAdd={handleAdd}
              onOpenStory={setStoryProduct}
              t={t}
            />
          ))}
        </ul>
        {products.length === 0 && (
          <p className="mt-12 text-center text-sm text-muted-foreground">{t("shop.empty")}</p>
        )}
      </main>
      <ProductStoryDialog
        product={storyProduct}
        onOpenChange={(open) => !open && setStoryProduct(null)}
      />
    </div>
  );
}

function ProductCard({
  product,
  onAdd,
  onOpenStory,
  t,
}: {
  product: ProductDTO;
  onAdd: (p: ProductDTO) => void;
  onOpenStory: (p: ProductDTO) => void;
  t: (k: string) => string;
}) {
  const { lang } = useT();
  const title = productTitle(product, lang);
  const description = productDescription(product, lang);
  const image = imageForProduct(product);
  const slug = slugForProduct(product);
  const detail = detailForId(product.id);
  const status = normalizeAvailability(product.availability);
  const statusCopy = availabilityCopy(status, lang);
  const hasStory = Boolean(storyForProduct(product.id));
  const isAvailable = status === "available";
  const opensStory = hasStory || !isAvailable;

  const body = (
    <>
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted">
        {image ? (
          <img onError={handleImageError}
            src={image}
            alt={title}
            loading="lazy"
            className={cn(
              "h-full w-full object-cover transition group-hover:scale-[1.03]",
              AVAILABILITY_MEDIA_CLASS[status],
            )}
          />
        ) : (
          <div
            className={cn(
              "flex h-full w-full items-center justify-center bg-muted/40",
              AVAILABILITY_MEDIA_CLASS[status],
            )}
          >
            <Leaf className="h-8 w-8 text-muted-foreground/40" />
          </div>
        )}
        {status === "out_of_stock" && (
          <div className="pointer-events-none absolute inset-0 rounded-xl bg-foreground/20" />
        )}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {detail?.sustainabilityImpact.bioCertified && <Chip>{t("shop.badge.bio")}</Chip>}
          {product.is_packaging_free && <Chip>{t("shop.badge.packaging")}</Chip>}
          {product.c2c_eligible && <Chip>{t("shop.badge.deposit")}</Chip>}
        </div>
        {!isAvailable && (
          <span
            className={cn(
              "absolute right-2 top-2 rounded-full border px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm",
              AVAILABILITY_BADGE_CLASS[status],
            )}
          >
            {statusCopy.badge}
          </span>
        )}
      </div>

      <div className={cn("flex flex-1 flex-col p-3 md:p-4", !isAvailable && "opacity-70")}>
        <h3 className="line-clamp-1 text-sm font-semibold leading-snug sm:text-base">{title}</h3>
        {description && (
          <p className="mt-2 hidden flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-2 md:block">
            {description}
          </p>
        )}
      </div>
    </>
  );

  return (
    <li className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary hover:shadow-md">
      {opensStory ? (
        <button
          type="button"
          onClick={() => onOpenStory(product)}
          className="flex flex-1 flex-col text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {body}
        </button>
      ) : (
        <LocalLink
          to={pathFor("product", lang, slug)}
          className="flex flex-1 flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {body}
        </LocalLink>
      )}

      <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2.5 md:px-4 md:py-3">
        <span
          className={cn(
            "font-mono text-sm font-semibold md:text-base",
            !isAvailable && "text-muted-foreground",
          )}
        >
          {formatEuro(product.price_cents)}
        </span>
        {isAvailable ? (
          <button
            type="button"
            onClick={() => onAdd(product)}
            aria-label={t("shop.addToCart")}
            className="inline-flex h-10 min-w-[40px] items-center justify-center gap-1.5 rounded-full border border-primary bg-primary px-3 text-xs font-semibold uppercase tracking-[0.15em] text-primary-foreground hover:opacity-90 md:h-11 md:px-4"
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden md:inline">{t("shop.addToCart")}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onOpenStory(product)}
            disabled={status === "out_of_stock"}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-border px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60 md:h-11 md:px-4"
          >
            {statusCopy.cta}
          </button>
        )}
      </div>
    </li>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-background/85 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-foreground/90 backdrop-blur-sm">
      {children}
    </span>
  );
}
