import { Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { NavHeader } from "@/components/NavHeader";
import { LocalLink } from "@/components/LocalLink";
import { pathFor } from "@/lib/routes-i18n";
import { useT, formatT } from "@/lib/i18n";
import { productTitle, productDescription } from "@/lib/product-i18n";
import { getProducts, type ProductDTO } from "@/lib/data.functions";
import { addToCartAndOpen } from "@/lib/cart";
import {
  detailForSlug,
  detailForId,
  imageForProduct,
  galleryForProduct,
  slugForProduct,
  type PackagingOption,
} from "@/data/products";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowLeft, ChevronRight, Leaf, MapPin, Minus, Plus, ShoppingBag } from "lucide-react";
import { handleImageError } from "@/lib/image-fallback";

export const productsQO = queryOptions({ queryKey: ["products"], queryFn: () => getProducts() });

function formatEuro(cents: number): string {
  return `€${(cents / 100).toFixed(2).replace(".", ",")}`;
}


export function ProductDetailPage({ slug }: { slug: string }) {
  const { data: products } = useSuspenseQuery(productsQO);
  const { t, lang } = useT();
  const navigate = useNavigate();

  const product = products.find((p) => slugForProduct(p) === slug) ?? null;
  const detail = product ? detailForId(product.id) : detailForSlug(slug);

  const packagingOptions: PackagingOption[] = detail?.packagingOptions ?? [];
  const [packagingId, setPackagingId] = useState(packagingOptions[0]?.id ?? "own");
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <NavHeader />
        <main className="mx-auto max-w-3xl px-4 py-24 text-center">
          <h1 className="text-2xl font-semibold">{t("product.notFound")}</h1>
          <LocalLink
            to={pathFor("shop", lang)}
            className="mt-6 inline-flex min-h-[48px] items-center rounded-full bg-primary px-6 text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground"
          >
            {t("product.breadcrumb.shop")}
          </LocalLink>
        </main>
      </div>
    );
  }

  const selected = packagingOptions.find((o) => o.id === packagingId) ?? null;
  const unitPrice = product.price_cents + (selected?.priceOffset ?? 0);
  const images = galleryForProduct(product);

  const bundle = (detail?.frequentlyBoughtTogether ?? [])
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is ProductDTO => Boolean(p));
  const bundleTotal = unitPrice * qty + bundle.reduce((s, p) => s + p.price_cents, 0);

  const add = () => addToCartAndOpen(product.id, qty, packagingId);
  const addBundle = () => {
    bundle.forEach((p) => addToCartAndOpen(p.id, 1));
    add();
  };

  return (
    <div className="min-h-screen bg-background pb-28 md:pb-0">
      <NavHeader />

      <div className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => navigate({ to: pathFor("shop", lang) as never })}
            aria-label={t("product.back")}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border hover:border-primary hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <nav className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
            <LocalLink to={pathFor("shop", lang)} className="shrink-0 hover:text-primary">
              {t("product.breadcrumb.shop")}
            </LocalLink>
            <ChevronRight className="h-3 w-3 shrink-0" />
            {detail && <span className="shrink-0">{detail.category}</span>}
            {detail && <ChevronRight className="h-3 w-3 shrink-0" />}
            <span className="truncate text-foreground">{productTitle(product, lang)}</span>
          </nav>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-6 md:py-12">
        <div className="grid gap-8 md:grid-cols-2 md:gap-12">
          {/* Galerij */}
          <div>
            <div className="aspect-square w-full overflow-hidden rounded-3xl bg-muted">
              {images[activeImage] ? (
                <img onError={handleImageError}
                  src={images[activeImage]}
                  alt={productTitle(product, lang)}
                  loading="eager"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Leaf className="h-10 w-10 text-muted-foreground/40" />
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-3">
                {images.map((img, i) => (
                  <button
                    key={img}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    aria-label={`${productTitle(product, lang)} ${i + 1}`}
                    className={
                      "h-16 w-16 overflow-hidden rounded-xl border-2 " +
                      (i === activeImage ? "border-primary" : "border-transparent")
                    }
                  >
                    <img onError={handleImageError} src={img} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bestelblok */}
          <div>
            <h1 className="text-3xl font-bold leading-tight tracking-tight md:text-4xl">
              {productTitle(product, lang)}
            </h1>
            <p className="mt-3 font-mono text-2xl font-semibold">{formatEuro(unitPrice)}</p>
            {productDescription(product, lang) && (
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {productDescription(product, lang)}
              </p>
            )}

            {detail && (
              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-border bg-[color:var(--surface-page)] p-4">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0 text-sm">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    {t("product.producer")}
                  </p>
                  <p className="mt-1 font-semibold">{detail.producer.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {detail.producer.location} ·{" "}
                    {formatT(t("product.distance"), { km: detail.distanceKm })}
                  </p>
                </div>
              </div>
            )}

            {packagingOptions.length > 0 && (
              <fieldset className="mt-6">
                <legend className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  {t("product.packaging")}
                </legend>
                <div className="mt-3 grid gap-2">
                  {packagingOptions.map((o) => (
                    <label
                      key={o.id}
                      className={
                        "flex cursor-pointer items-start gap-3 rounded-2xl border p-4 text-sm transition " +
                        (packagingId === o.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50")
                      }
                    >
                      <input
                        type="radio"
                        name="packaging"
                        className="mt-1"
                        checked={packagingId === o.id}
                        onChange={() => setPackagingId(o.id)}
                      />
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-baseline gap-2 font-semibold">
                          {o.label}
                          {o.priceOffset > 0 && (
                            <span className="font-mono text-xs text-muted-foreground">
                              +{formatEuro(o.priceOffset)}
                            </span>
                          )}
                        </span>
                        <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                          {o.description}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            <div className="mt-6 flex items-center gap-4">
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {t("product.quantity")}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="-"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border hover:border-primary hover:text-primary"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center font-mono">{qty}</span>
                <button
                  type="button"
                  aria-label="+"
                  onClick={() => setQty((q) => q + 1)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border hover:border-primary hover:text-primary"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={add}
              className="mt-6 hidden w-full min-h-[56px] items-center justify-center gap-2 rounded-full bg-primary px-6 text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground hover:opacity-90 md:inline-flex"
            >
              <ShoppingBag className="h-4 w-4" />
              {t("shop.addToCart")} · {formatEuro(unitPrice * qty)}
            </button>

            {detail && (
              <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <Leaf className="h-3.5 w-3.5 text-primary" />
                {formatT(t("product.impact"), { g: detail.sustainabilityImpact.plasticSavedGrams })}
              </p>
            )}
            {product.c2c_eligible && (
              <p className="mt-2 text-xs text-muted-foreground">
                {formatT(t("product.deposit"), {
                  amount: formatEuro(product.c2c_refund_value_cents),
                })}
              </p>
            )}
          </div>
        </div>

        {bundle.length > 0 && (
          <section className="mt-12 rounded-3xl border border-border bg-[color:var(--surface-page)] p-5 md:p-8">
            <h2 className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              {t("product.bundle")}
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
              <ul className="flex flex-wrap items-center gap-4">
                {[product, ...bundle].map((p, i) => (
                  <li key={p.id} className="flex items-center gap-4">
                    {i > 0 && <Plus className="h-4 w-4 text-muted-foreground" />}
                    <div className="flex items-center gap-3">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                        {imageForProduct(p) && (
                          <img onError={handleImageError}
                            src={imageForProduct(p) as string}
                            alt={productTitle(p, lang)}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="line-clamp-2 max-w-[8rem] text-xs font-semibold">
                          {productTitle(p, lang)}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {formatEuro(p.price_cents)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={addBundle}
                className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-primary px-6 text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground hover:opacity-90"
              >
                {t("product.bundleAdd")} · {formatEuro(bundleTotal)}
              </button>
            </div>
          </section>
        )}

        {detail && (
          <Accordion type="single" collapsible className="mt-10 max-w-3xl">
            <AccordionItem value="ingredients">
              <AccordionTrigger className="text-sm">{t("product.ingredients")}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                <ul className="list-disc space-y-1 pl-5">
                  {detail.ingredients.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="storage">
              <AccordionTrigger className="text-sm">{t("product.storage")}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {detail.storageInfo}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="pickup">
              <AccordionTrigger className="text-sm">{t("product.pickup")}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {detail.pickupInfo}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </main>

      {/* Sticky mobiele bestelbalk */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <p className="truncate text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {productTitle(product, lang)}
            </p>
            <p className="font-mono text-lg font-semibold">{formatEuro(unitPrice * qty)}</p>
          </div>
          <button
            type="button"
            onClick={add}
            className="inline-flex min-h-[48px] shrink-0 items-center gap-2 rounded-full bg-primary px-5 text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground"
          >
            <ShoppingBag className="h-4 w-4" />
            {t("shop.addToCart")}
          </button>
        </div>
      </div>

    </div>
  );
}
