/**
 * Herbruikbare beeldkiezer voor admin-formulieren (producten, academies, diensten …).
 *
 * Gebruik:
 *   <ImagePickerModal open={open} onOpenChange={setOpen} lang={lang}
 *     onSelect={(asset) => setImageUrl(asset.url)} />
 *
 * Geeft een `MediaAsset` terug; de `url` (/api/public/media/<id>) is stabiel en
 * blijft geldig wanneer het beeld later vervangen wordt.
 */
import { useState } from "react";
import { toast } from "sonner";
import { ImageOff } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StorageBrowser } from "./StorageBrowser";
import type { Lang } from "@/lib/portal-types";
import { translate } from "@/lib/portal-i18n";
import type { MediaAsset, MediaCategory } from "@/lib/media.functions";
import { usePermissions } from "@/lib/use-permissions";
import { MediaToolbar } from "./MediaToolbar";
import { MediaDropzone } from "./MediaDropzone";
import { useMediaFilter, useMediaLibrary } from "./useMediaLibrary";
import { MediaTile } from "@/components/portal/pages/MediaPage";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type ImagePickerModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (asset: MediaAsset) => void;
  lang?: Lang;
  /** Standaardcategorie voor nieuwe uploads vanuit de picker. */
  uploadCategory?: MediaCategory;
  /** Voorgeselecteerd asset-ID (bv. huidige productfoto). */
  selectedId?: string | null;
  title?: string;
};

export function ImagePickerModal({
  open,
  onOpenChange,
  onSelect,
  lang = "nl",
  uploadCategory = "general",
  selectedId: initialSelectedId = null,
  title,
}: ImagePickerModalProps) {
  const t = (k: string) => translate(k, lang);
  const { can } = usePermissions();
  const canManage = can("manage_media");

  const { query, assets, uploadMutation } = useMediaLibrary();
  const filter = useMediaFilter(assets);
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);
  const [tab, setTab] = useState<"library" | "storage">("library");
  // Net geregistreerd vanuit de opslag: bruikbaar nog vóór de bibliotheek ververst is.
  const [justRegistered, setJustRegistered] = useState<MediaAsset | null>(null);
  const selected =
    assets.find((a) => a.id === selectedId) ??
    (justRegistered && justRegistered.id === selectedId ? justRegistered : null);

  const confirm = () => {
    if (!selected) return;
    onSelect(selected);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[min(96vw,1000px)] max-w-none flex-col gap-4 sm:max-w-none">
        <DialogHeader>
          <DialogTitle>{title ?? t("media.pick")}</DialogTitle>
          <DialogDescription>{t("media.subtitle")}</DialogDescription>
        </DialogHeader>

        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as "library" | "storage")}
          className="flex min-h-0 flex-1 flex-col gap-3"
        >
          <TabsList className="w-fit">
            <TabsTrigger value="library">Bibliotheek ({assets.length})</TabsTrigger>
            <TabsTrigger value="storage">Opslag (Scaleway)</TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="flex min-h-0 flex-1 flex-col gap-3 data-[state=inactive]:hidden">
            {canManage ? (
              <MediaDropzone
                lang={lang}
                compact
                busy={uploadMutation.isPending}
                onFiles={(files) =>
                  uploadMutation.mutate(
                    { files, category: uploadCategory },
                    {
                      onSuccess: (r) => {
                        toast.success(t("media.uploaded"));
                        const first = r[0];
                        if (first) setSelectedId(first.id);
                      },
                    },
                  )
                }
              />
            ) : null}

            <MediaToolbar
              lang={lang}
              search={filter.search}
              onSearch={filter.setSearch}
              category={filter.category}
              onCategory={filter.setCategory}
              sort={filter.sort}
              onSort={filter.setSort}
              count={filter.filtered.length}
            />

            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              {query.isLoading ? (
                <p className="text-sm text-muted-foreground">Laden…</p>
              ) : query.isError ? (
                <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm">
                  <p className="font-medium text-destructive">De mediabibliotheek kon niet geladen worden.</p>
                  <p className="mt-1 text-muted-foreground">
                    {query.error instanceof Error ? query.error.message : "Onbekende fout"}
                  </p>
                  <Button type="button" size="sm" variant="outline" className="mt-3" onClick={() => void query.refetch()}>
                    Opnieuw proberen
                  </Button>
                </div>
              ) : filter.filtered.length === 0 ? (
                <div className="grid place-items-center rounded-lg border border-dashed border-border p-10 text-center">
                  <ImageOff className="size-7 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    {assets.length === 0 ? t("media.empty") : t("media.noResults")}
                  </p>
                </div>
              ) : (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {filter.filtered.map((asset) => (
                    <li key={asset.id}>
                      <MediaTile
                        asset={asset}
                        active={asset.id === selectedId}
                        onSelect={() => setSelectedId(asset.id)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </TabsContent>

          <TabsContent value="storage" className="flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden">
            <StorageBrowser
              canManage={canManage}
              selectedKey={selected?.storageKey ?? null}
              onRegistered={(asset) => {
                setJustRegistered(asset);
                setSelectedId(asset.id);
              }}
            />
          </TabsContent>
        </Tabs>

        <DialogFooter className="border-t border-border pt-3">
          <div className="mr-auto min-w-0 truncate self-center text-xs text-muted-foreground">
            {selected ? selected.title || selected.filename : null}
          </div>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button type="button" disabled={!selected} onClick={confirm}>
            {t("media.use")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
