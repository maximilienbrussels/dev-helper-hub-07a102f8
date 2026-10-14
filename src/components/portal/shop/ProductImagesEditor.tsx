import { useState } from "react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ImagePlus, Link as LinkIcon, Loader2, X } from "lucide-react";
import { usePortal } from "@/lib/portal-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImagePickerModal } from "@/components/portal/media/ImagePickerModal";
import { ImageUploader } from "@/components/portal/media/ImageUploader";

import type { MediaAsset } from "@/lib/media.functions";
import {
  addProductImage,
  getPortalProductImages,
  removeProductImage,
  reorderProductImages,
} from "@/lib/shop-admin.functions";
import { handleImageError } from "@/lib/image-fallback";

type ProductImageRow = {
  id: number;
  product_id: number;
  media_id: string | null;
  url: string | null;
  alt: string | null;
  position: number;
};

function imageSrc(row: ProductImageRow): string {
  return row.url ?? (row.media_id ? `/api/public/media/${row.media_id}` : "");
}

/** Beheer van de foto's van één product: toevoegen, herschikken en verwijderen. */
export function ProductImagesEditor({ productId }: { productId: number }) {
  const { t, lang } = usePortal();
  const queryClient = useQueryClient();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");

  const queryKey = ["portal", "product-images", productId];

  const images = useQuery({
    queryKey,
    queryFn: async () => (await getPortalProductImages({ data: { productId } })) as ProductImageRow[],
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const addImage = useMutation({
    mutationFn: async (patch: { media_id?: string; url?: string; alt?: string }) => {
      await addProductImage({ data: { product_id: productId, ...patch } });
    },
    onSuccess: () => {
      toast.success(t("shop.toast.imageAdded"));
      setUrlDraft("");
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message || t("shop.toast.imageAddFailed")),
  });

  const removeImage = useMutation({
    mutationFn: async (id: number) => {
      await removeProductImage({ data: { id } });
    },
    onSuccess: () => {
      toast.success(t("shop.toast.imageRemoved"));
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reorder = useMutation({
    mutationFn: async (rows: ProductImageRow[]) => {
      await reorderProductImages({ data: { ids: rows.map((row) => row.id) } });
    },
    onSuccess: () => void invalidate(),
    onError: (e: Error) => toast.error(e.message),
  });

  const move = (index: number, dir: -1 | 1) => {
    const rows = images.data ? [...images.data] : [];
    const target = index + dir;
    if (target < 0 || target >= rows.length) return;
    [rows[index], rows[target]] = [rows[target], rows[index]];
    reorder.mutate(rows);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold">{t("shop.images.title")}</p>

      {images.isError ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {(images.error as Error)?.message || "De foto's konden niet geladen worden."}
        </p>
      ) : images.isLoading ? (
        <p className="text-sm text-muted-foreground">{t("shop.loading")}</p>
      ) : images.data && images.data.length > 0 ? (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.data.map((row, index) => (
            <li
              key={row.id}
              className="group relative aspect-square overflow-hidden rounded-md border border-border bg-muted"
            >
              <img loading="lazy" onError={handleImageError} src={imageSrc(row)} alt={row.alt ?? ""} className="h-full w-full object-cover" />
              {index === 0 ? (
                <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  {t("shop.images.cover")}
                </span>
              ) : null}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-background/80 p-1 opacity-0 transition group-hover:opacity-100">
                <button
                  type="button"
                  aria-label={t("shop.images.moveUp")}
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  className="rounded p-1 hover:bg-muted disabled:opacity-30"
                >
                  <ArrowUp className="size-3" />
                </button>
                <button
                  type="button"
                  aria-label={t("shop.images.moveDown")}
                  disabled={index === (images.data?.length ?? 0) - 1}
                  onClick={() => move(index, 1)}
                  className="rounded p-1 hover:bg-muted disabled:opacity-30"
                >
                  <ArrowDown className="size-3" />
                </button>
                <button
                  type="button"
                  aria-label={t("shop.images.remove")}
                  onClick={() => removeImage.mutate(row.id)}
                  className="rounded p-1 text-destructive hover:bg-destructive/10"
                >
                  <X className="size-3" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{t("shop.images.empty")}</p>
      )}

      <ImageUploader
        value={null}
        onChange={(url) => {
          if (url) addImage.mutate({ url });
        }}
        folder="shop"
        label={t("shop.images.title")}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
          <ImagePlus className="size-4" /> {t("shop.images.addFromLibrary")}
        </Button>

        <div className="flex items-center gap-2">
          <Input
            placeholder={t("shop.images.urlPlaceholder")}
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            className="h-9 w-56"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!urlDraft.trim() || addImage.isPending}
            onClick={() => addImage.mutate({ url: urlDraft.trim() })}
          >
            {addImage.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <LinkIcon className="size-4" />
            )}
            {t("shop.images.add")}
          </Button>
        </div>
      </div>

      <ImagePickerModal
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        lang={lang}
        uploadCategory="general"
        title={t("shop.images.pickerTitle")}
        onSelect={(asset: MediaAsset) =>
          addImage.mutate({ media_id: asset.id, alt: asset.title || undefined })
        }
      />
    </div>
  );
}
