import { useState } from "react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Star, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MediaLibraryModal } from "@/components/admin/media/MediaLibraryModal";
import { handleImageError } from "@/lib/image-fallback";
import {
  addProductImage,
  deleteProductImageFile,
  getPortalProductImages,
  removeProductImage,
  reorderProductImages,
  setProductImageRole,
} from "@/lib/shop-admin.functions";

type ProductImageRow = {
  id: number;
  product_id: number;
  media_id: string | null;
  url: string | null;
  alt: string | null;
  position: number;
  is_primary: boolean;
  is_hover: boolean;
  file_key: string | null;
};

function imageSrc(row: ProductImageRow): string {
  return row.url ?? (row.media_id ? `/api/public/media/${row.media_id}` : "");
}

/** Volledig fotobeheer per product: koppelen, ordenen, hoofd-/hoverbeeld en wissen. */
export function ProductMediaManager({ productId }: { productId: number }) {
  const queryClient = useQueryClient();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [dragId, setDragId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ProductImageRow | null>(null);

  const queryKey = ["portal", "product-images", productId];
  const images = useQuery({
    queryKey,
    queryFn: async () => (await getPortalProductImages({ data: { productId } })) as ProductImageRow[],
  });
  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const add = useMutation({
    mutationFn: async (input: { url: string; alt?: string; file_key?: string }) => {
      await addProductImage({ data: { product_id: productId, ...input } });
    },
    onSuccess: () => {
      toast.success("Foto toegevoegd.");
      void invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const unlink = useMutation({
    mutationFn: async (id: number) => {
      await removeProductImage({ data: { id } });
    },
    onSuccess: () => {
      toast.success("Foto losgekoppeld van dit product.");
      void invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const wipe = useMutation({
    mutationFn: async (id: number) => {
      await deleteProductImageFile({ data: { id } });
    },
    onSuccess: () => {
      toast.success("Foto definitief verwijderd.");
      setConfirmDelete(null);
      void invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const setRole = useMutation({
    mutationFn: async (input: { id: number; role: "primary" | "hover"; value: boolean }) => {
      await setProductImageRole({ data: { product_id: productId, ...input } });
    },
    onSuccess: () => void invalidate(),
    onError: (error: Error) => toast.error(error.message),
  });

  const reorder = useMutation({
    mutationFn: async (rows: ProductImageRow[]) => {
      await reorderProductImages({ data: { ids: rows.map((row) => row.id) } });
    },
    onSuccess: () => void invalidate(),
    onError: (error: Error) => toast.error(error.message),
  });

  const rows = images.data ?? [];

  const moveTo = (from: number, to: number) => {
    if (to < 0 || to >= rows.length || from === to) return;
    const next = [...rows];
    const [moved] = next.splice(from, 1);
    if (!moved) return;
    next.splice(to, 0, moved);
    reorder.mutate(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Foto's van dit product</p>
        <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
          <ImagePlus className="size-4" /> Kies uit mediabibliotheek
        </Button>
      </div>

      {images.isError ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {(images.error as Error).message}
        </p>
      ) : images.isLoading ? (
        <p className="text-sm text-muted-foreground">Bezig met laden…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nog geen foto's gekoppeld.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {rows.map((row, index) => (
            <li
              key={row.id}
              draggable
              onDragStart={() => setDragId(row.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragId === null) return;
                const from = rows.findIndex((r) => r.id === dragId);
                setDragId(null);
                moveTo(from, index);
              }}
              className="group relative overflow-hidden rounded-md border border-border bg-muted"
            >
              <img
                loading="lazy"
                onError={handleImageError}
                src={imageSrc(row)}
                alt={row.alt ?? ""}
                className="aspect-square w-full object-cover"
              />

              <div className="absolute left-1 top-1 flex flex-wrap gap-1">
                {row.is_primary ? (
                  <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                    ⭐ Hoofd
                  </span>
                ) : null}
                {row.is_hover ? (
                  <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-secondary-foreground">
                    🖼️ Hover
                  </span>
                ) : null}
              </div>

              <div className="absolute right-1 top-1 flex gap-1 opacity-0 transition group-hover:opacity-100">
                <button
                  type="button"
                  title="Foto loskoppelen (bestand blijft bewaard)"
                  onClick={() => unlink.mutate(row.id)}
                  className="rounded bg-background/90 p-1 hover:bg-background"
                >
                  <X className="size-3.5" />
                </button>
                <button
                  type="button"
                  title="Definitief verwijderen uit de opslag"
                  onClick={() => setConfirmDelete(row)}
                  className="rounded bg-background/90 p-1 text-destructive hover:bg-background"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>

              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-background/85 p-1 opacity-0 transition group-hover:opacity-100">
                <button
                  type="button"
                  title="Naar links"
                  disabled={index === 0}
                  onClick={() => moveTo(index, index - 1)}
                  className="rounded p-1 hover:bg-muted disabled:opacity-30"
                >
                  <ArrowLeft className="size-3.5" />
                </button>
                <button
                  type="button"
                  title="Hoofdfoto"
                  onClick={() => setRole.mutate({ id: row.id, role: "primary", value: !row.is_primary })}
                  className={`rounded p-1 hover:bg-muted ${row.is_primary ? "text-primary" : ""}`}
                >
                  <Star className="size-3.5" />
                </button>
                <button
                  type="button"
                  title="Hoverfoto"
                  onClick={() => setRole.mutate({ id: row.id, role: "hover", value: !row.is_hover })}
                  className={`rounded p-1 text-xs hover:bg-muted ${row.is_hover ? "text-primary" : ""}`}
                >
                  🖼️
                </button>
                <button
                  type="button"
                  title="Naar rechts"
                  disabled={index === rows.length - 1}
                  onClick={() => moveTo(index, index + 1)}
                  className="rounded p-1 hover:bg-muted disabled:opacity-30"
                >
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <MediaLibraryModal
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        defaultPrefix="products"
        onSelect={(object) => add.mutate({ url: object.url, alt: object.name, file_key: object.key })}
      />

      <AlertDialog open={confirmDelete !== null} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Foto definitief verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              Deze foto wordt uit de opslag gewist en verdwijnt overal waar ze gebruikt wordt. Dit kan
              niet ongedaan gemaakt worden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (confirmDelete) wipe.mutate(confirmDelete.id);
              }}
            >
              {wipe.isPending ? <Loader2 className="size-4 animate-spin" /> : null} Definitief wissen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
