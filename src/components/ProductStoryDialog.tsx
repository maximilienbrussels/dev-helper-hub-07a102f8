import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { storyForProduct } from "@/data/product-stories";
import { imageForProduct } from "@/data/products";
import { productTitle, productDescription } from "@/lib/product-i18n";
import { useT } from "@/lib/i18n";
import {
  availabilityCopy,
  normalizeAvailability,
  AVAILABILITY_BADGE_CLASS,
} from "@/lib/product-status";
import type { ProductDTO } from "@/lib/data.functions";
import { addToCartAndOpen } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { handleImageError } from "@/lib/image-fallback";

function formatEuro(cents: number): string {
  return `€${(cents / 100).toFixed(2).replace(".", ",")}`;
}

/**
 * Diepgaande product-modal met het duurzame verhaal, hervul-instructies
 * en de Brusselse verzamellijn.
 */
export function ProductStoryDialog({
  product,
  onOpenChange,
}: {
  product: ProductDTO | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { lang } = useT();
  if (!product) return <Dialog open={false} onOpenChange={onOpenChange} />;

  const story = storyForProduct(product.id);
  const status = normalizeAvailability(product.availability);
  const copy = availabilityCopy(status, lang);
  const image = imageForProduct(product);
  const title = productTitle(product, lang);
  const description = productDescription(product, lang);

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader className="text-left">
          {story ? (
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {story.eyebrow}
            </p>
          ) : null}
          <DialogTitle className="text-xl leading-tight">{title}</DialogTitle>
          <DialogDescription>{story?.tagline ?? description ?? ""}</DialogDescription>
        </DialogHeader>

        <span
          className={cn(
            "inline-flex w-fit items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
            AVAILABILITY_BADGE_CLASS[status],
          )}
        >
          {copy.badge}
        </span>

        {image ? (
          <img
            src={image}
            alt={title}
            loading="lazy"
            onError={handleImageError}
            className="aspect-[4/3] w-full rounded-xl object-cover"
          />
        ) : null}

        <div className="space-y-4 text-sm leading-relaxed">
          {story ? (
            <>
              <section>
                <h3 className="font-semibold">Het duurzame verhaal</h3>
                <p className="mt-1 text-muted-foreground">{story.story}</p>
              </section>
              <section>
                <h3 className="font-semibold">{story.refill.title}</h3>
                <p className="mt-1 text-muted-foreground">{story.refill.body}</p>
              </section>
              <section className="rounded-xl border border-border bg-muted/40 p-3">
                <h3 className="font-semibold">{story.collection.title}</h3>
                <p className="mt-1 text-muted-foreground">{story.collection.body}</p>
              </section>
              <section>
                <h3 className="font-semibold">Prijs</h3>
                <ul className="mt-1 space-y-1 text-muted-foreground">
                  {story.pricing.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </section>
            </>
          ) : (
            <>
              {description ? <p className="text-muted-foreground">{description}</p> : null}
              <p className="font-semibold">{formatEuro(product.price_cents)}</p>
              {product.required_level ? (
                <p className="text-muted-foreground">
                  🏅 Gratis bij het behalen van Level {product.required_level}.
                </p>
              ) : null}
            </>
          )}
        </div>

        <div className="space-y-2 border-t border-border pt-4">
          <Button
            className="w-full"
            disabled={status !== "available"}
            onClick={() => {
              addToCartAndOpen(product.id, 1);
              onOpenChange(false);
            }}
          >
            {status === "available"
              ? `Online reserveren — ${formatEuro(product.price_cents)}`
              : copy.badge}
          </Button>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {product.required_level
              ? `🏅 Heb je Level ${product.required_level} behaald? Toon je digitale paspoort aan de kassa van de stadsboerderij en je krijgt dit item gratis mee — geen online reservatie nodig.`
              : "Je reservatie haal je op aan de kassa van de stadsboerderij. Betalen doe je ter plaatse."}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
