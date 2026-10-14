import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Check, Copy, ImageOff, Loader2, Lock, RefreshCw, Trash2, Undo2, X } from "lucide-react";
import { usePortal } from "@/lib/portal-store";
import { usePermissions } from "@/lib/use-permissions";
import { translate } from "@/lib/portal-i18n";
import {
  MEDIA_CATEGORIES,
  MEDIA_CATEGORY_LABELS,
  hardDeleteMedia,
  listTrashedMedia,
  restoreMedia,
  type MediaAsset,
  type MediaCategory,
} from "@/lib/media.functions";
import { ACCEPTED_IMAGE_TYPES, absoluteMediaUrl, formatBytes } from "@/lib/media-client";
import { LOCALE } from "@/lib/portal-routes";
import { PageHeader } from "@/components/portal/portal-ui";
import { MediaToolbar } from "@/components/portal/media/MediaToolbar";
import { MediaDropzone } from "@/components/portal/media/MediaDropzone";
import { useMediaFilter, useMediaLibrary } from "@/components/portal/media/useMediaLibrary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { cn } from "@/lib/utils";
import { handleImageError } from "@/lib/image-fallback";

export function MediaPage() {
  const { lang } = usePortal();
  const t = (k: string) => translate(k, lang);
  const { can, isLoading: rightsLoading } = usePermissions();
  const canManage = can("manage_media");

  const { query, assets, uploadMutation, replaceMutation, metaMutation, deleteMutation } =
    useMediaLibrary();
  const filter = useMediaFilter(assets);

  const [uploadCategory, setUploadCategory] = useState<MediaCategory>("general");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<MediaAsset | null>(null);

  const selected = assets.find((a) => a.id === selectedId) ?? null;

  const queryClient = useQueryClient();
  const listTrash = useServerFn(listTrashedMedia);
  const restoreFn = useServerFn(restoreMedia);
  const hardDeleteFn = useServerFn(hardDeleteMedia);
  const [trashOpen, setTrashOpen] = useState(false);
  const [pendingHardDelete, setPendingHardDelete] = useState<MediaAsset | null>(null);
  const trashQuery = useQuery({
    queryKey: ["portal", "media", "trash"],
    queryFn: () => listTrash(),
    enabled: trashOpen && canManage,
  });
  const restoreMutation = useMutation({
    mutationFn: (id: string) => restoreFn({ data: { id } }),
    onSuccess: () => {
      toast.success(t("media.restored"));
      queryClient.invalidateQueries({ queryKey: ["portal", "media"] });
      queryClient.invalidateQueries({ queryKey: ["portal", "media", "trash"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const hardDeleteMutation = useMutation({
    mutationFn: (id: string) => hardDeleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success(t("media.hardDeleted"));
      queryClient.invalidateQueries({ queryKey: ["portal", "media", "trash"] });
      setPendingHardDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Selectie opruimen als het beeld verdwenen is.
  useEffect(() => {
    if (selectedId && !assets.some((a) => a.id === selectedId)) setSelectedId(null);
  }, [assets, selectedId]);

  const copyUrl = async (asset: MediaAsset) => {
    try {
      await navigator.clipboard.writeText(absoluteMediaUrl(asset.url));
      toast.success(t("media.copied"));
    } catch {
      toast.error(asset.url);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("nav.media")}
        subtitle={t("media.subtitle")}
        action={
          canManage ? (
            <Button variant="outline" size="sm" onClick={() => setTrashOpen((v) => !v)} className="gap-2">
              <Trash2 className="size-4" />
              <span className="hidden sm:inline">{t("media.trash")}</span>
            </Button>
          ) : undefined
        }
      />

      {trashOpen && canManage ? (
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-bold">{t("media.trash")}</h2>
          {trashQuery.isLoading ? (
            <p className="mt-2 text-sm text-muted-foreground">{t("common.loading")}</p>
          ) : (trashQuery.data ?? []).length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">{t("media.trashEmpty")}</p>
          ) : (
            <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {(trashQuery.data ?? []).map((asset) => (
                <li key={asset.id} className="space-y-1.5 rounded-lg border border-border p-2">
                  <div className="aspect-square w-full overflow-hidden rounded-md bg-muted/40">
                    <img loading="lazy" onError={handleImageError} src={asset.url} alt={asset.altText || asset.filename} className="size-full object-cover opacity-70" />
                  </div>
                  <p className="truncate text-xs font-medium">{asset.title || asset.filename}</p>
                  <div className="flex gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1"
                      disabled={restoreMutation.isPending}
                      onClick={() => restoreMutation.mutate(asset.id)}
                    >
                      <Undo2 className="size-3.5" /> {t("media.restore")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setPendingHardDelete(asset)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {!rightsLoading && !canManage ? (
        <p className="inline-flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          <Lock className="size-4" /> {t("media.readOnly")}
        </p>
      ) : null}

      {canManage ? (
        <section className="space-y-2">
          <MediaDropzone
            lang={lang}
            busy={uploadMutation.isPending}
            onFiles={(files) =>
              uploadMutation.mutate(
                { files, category: uploadCategory },
                { onSuccess: (r) => toast.success(`${t("media.uploaded")} (${r.length})`) },
              )
            }
          />
          <div className="flex items-center gap-2 text-sm">
            <Label htmlFor="upload-category" className="text-muted-foreground">
              {t("media.category")}
            </Label>
            <Select
              value={uploadCategory}
              onValueChange={(v) => setUploadCategory(v as MediaCategory)}
            >
              <SelectTrigger id="upload-category" className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEDIA_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {MEDIA_CATEGORY_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>
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

      <div className={cn("grid gap-6", selected && "lg:grid-cols-[minmax(0,1fr)_360px]")}>
        <section aria-label={t("nav.media")}>
          {query.isLoading ? (
            <p className="text-sm text-muted-foreground">Laden…</p>
          ) : query.isError ? (
            <p className="text-sm text-destructive">{(query.error as Error).message}</p>
          ) : filter.filtered.length === 0 ? (
            <div className="grid place-items-center rounded-lg border border-dashed border-border p-12 text-center">
              <ImageOff className="size-8 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">
                {assets.length === 0 ? t("media.empty") : t("media.noResults")}
              </p>
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {filter.filtered.map((asset) => (
                <li key={asset.id}>
                  <MediaTile
                    asset={asset}
                    active={asset.id === selectedId}
                    onSelect={() => setSelectedId(asset.id === selectedId ? null : asset.id)}
                    onCopy={() => void copyUrl(asset)}
                    copyLabel={t("media.copyUrl")}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        {selected ? (
          <MediaDetail
            key={selected.id}
            asset={selected}
            lang={lang}
            canManage={canManage}
            saving={metaMutation.isPending}
            replacing={replaceMutation.isPending}
            onClose={() => setSelectedId(null)}
            onCopy={() => void copyUrl(selected)}
            onSave={(values) =>
              metaMutation.mutate(
                { id: selected.id, ...values },
                { onSuccess: () => toast.success(t("media.saved")) },
              )
            }
            onReplace={(file) =>
              replaceMutation.mutate(
                { id: selected.id, file },
                { onSuccess: () => toast.success(t("media.replaced")) },
              )
            }
            onDelete={() => setPendingDelete(selected)}
          />
        ) : null}
      </div>

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("media.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete ? (
                <span className="mb-2 block font-medium text-foreground">
                  {pendingDelete.title || pendingDelete.filename}
                </span>
              ) : null}
              {t("media.deleteBody")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (!pendingDelete) return;
                deleteMutation.mutate(pendingDelete.id, {
                  onSuccess: () => {
                    toast.success(t("media.deleted"));
                    setPendingDelete(null);
                  },
                });
              }}
            >
              {deleteMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {t("media.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!pendingHardDelete} onOpenChange={(o) => !o && setPendingHardDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("media.hardDeleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingHardDelete ? (
                <span className="mb-2 block font-medium text-foreground">
                  {pendingHardDelete.title || pendingHardDelete.filename}
                </span>
              ) : null}
              {t("media.hardDeleteBody")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={hardDeleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (!pendingHardDelete) return;
                hardDeleteMutation.mutate(pendingHardDelete.id);
              }}
            >
              {hardDeleteMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {t("media.hardDelete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function MediaTile({
  asset,
  active,
  onSelect,
  onCopy,
  copyLabel,
}: {
  asset: MediaAsset;
  active?: boolean;
  onSelect: () => void;
  onCopy?: () => void;
  copyLabel?: string;
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-lg border bg-card transition-shadow",
        active ? "border-primary ring-2 ring-primary/30" : "border-border hover:shadow-md",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={active}
        className="block w-full text-left"
      >
        <div className="aspect-square w-full bg-muted/40">
          <img onError={handleImageError}
            src={`${asset.url}?v=${encodeURIComponent(asset.updatedAt)}`}
            alt={asset.altText || asset.title || asset.filename}
            loading="lazy"
            className="size-full object-cover"
          />
        </div>
        <div className="space-y-0.5 p-2">
          <p className="truncate text-xs font-medium">{asset.title || asset.filename}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {MEDIA_CATEGORY_LABELS[asset.category]} · {formatBytes(asset.byteSize)}
          </p>
        </div>
      </button>
      {onCopy ? (
        <button
          type="button"
          onClick={onCopy}
          title={copyLabel}
          aria-label={copyLabel}
          className="absolute top-1.5 right-1.5 rounded-md border border-border bg-card/90 p-1.5 opacity-0 shadow transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        >
          <Copy className="size-3.5" />
        </button>
      ) : null}
      {!asset.altText ? (
        <span
          title="Alt-tekst ontbreekt"
          className="absolute top-1.5 left-1.5 rounded bg-warning px-1.5 py-0.5 text-[10px] font-bold text-warning-foreground"
        >
          ALT
        </span>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */

type MetaValues = { title: string; description: string; altText: string; category: MediaCategory };

function MediaDetail({
  asset,
  lang,
  canManage,
  saving,
  replacing,
  onClose,
  onCopy,
  onSave,
  onReplace,
  onDelete,
}: {
  asset: MediaAsset;
  lang: "nl" | "fr" | "en";
  canManage: boolean;
  saving: boolean;
  replacing: boolean;
  onClose: () => void;
  onCopy: () => void;
  onSave: (values: MetaValues) => void;
  onReplace: (file: File) => void;
  onDelete: () => void;
}) {
  const t = (k: string) => translate(k, lang);
  const [values, setValues] = useState<MetaValues>({
    title: asset.title,
    description: asset.description,
    altText: asset.altText,
    category: asset.category,
  });
  const replaceRef = useRef<HTMLInputElement>(null);
  const dirty =
    values.title !== asset.title ||
    values.description !== asset.description ||
    values.altText !== asset.altText ||
    values.category !== asset.category;

  const added = new Date(asset.createdAt).toLocaleDateString(LOCALE[lang], {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <aside className="h-fit space-y-4 rounded-lg border border-border bg-card p-4 lg:sticky lg:top-20">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-sm font-semibold">{t("media.details")}</h2>
        <Button variant="ghost" size="icon" className="size-7" onClick={onClose} aria-label={t("common.close")}>
          <X className="size-4" />
        </Button>
      </div>

      <div className="overflow-hidden rounded-md border border-border bg-muted/40">
        <img loading="lazy" onError={handleImageError}
          src={`${asset.url}?v=${encodeURIComponent(asset.updatedAt)}`}
          alt={asset.altText || asset.title || asset.filename}
          className="max-h-56 w-full object-contain"
        />
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <dt>{t("media.dimensions")}</dt>
        <dd className="text-foreground tabular-nums">
          {asset.width && asset.height ? `${asset.width} × ${asset.height}` : "—"} ·{" "}
          {formatBytes(asset.byteSize)}
        </dd>
        <dt>{t("media.uploadedOn")}</dt>
        <dd className="text-foreground">{added}</dd>
        <dt>URL</dt>
        <dd className="truncate font-mono text-[11px] text-foreground">{asset.url}</dd>
      </dl>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCopy}>
          <Copy className="size-3.5" /> {t("media.copyUrl")}
        </Button>
        {canManage ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={replacing}
              onClick={() => replaceRef.current?.click()}
              title={t("media.replaceHint")}
            >
              {replacing ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RefreshCw className="size-3.5" />
              )}{" "}
              {t("media.replace")}
            </Button>
            <input
              ref={replaceRef}
              type="file"
              accept={ACCEPTED_IMAGE_TYPES}
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onReplace(f);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="size-3.5" /> {t("media.delete")}
            </Button>
          </>
        ) : null}
      </div>
      {canManage ? <p className="text-[11px] text-muted-foreground">{t("media.replaceHint")}</p> : null}

      <form
        className="space-y-3 border-t border-border pt-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSave(values);
        }}
      >
        <div className="space-y-1">
          <Label htmlFor="media-title">{t("media.title")}</Label>
          <Input
            id="media-title"
            value={values.title}
            disabled={!canManage}
            maxLength={200}
            onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="media-alt">{t("media.alt")}</Label>
          <Input
            id="media-alt"
            value={values.altText}
            disabled={!canManage}
            maxLength={500}
            onChange={(e) => setValues((v) => ({ ...v, altText: e.target.value }))}
          />
          <p className="text-[11px] text-muted-foreground">{t("media.altHint")}</p>
        </div>
        <div className="space-y-1">
          <Label htmlFor="media-description">{t("media.description")}</Label>
          <Textarea
            id="media-description"
            value={values.description}
            disabled={!canManage}
            maxLength={2000}
            rows={3}
            onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="media-category">{t("media.category")}</Label>
          <Select
            value={values.category}
            disabled={!canManage}
            onValueChange={(c) => setValues((v) => ({ ...v, category: c as MediaCategory }))}
          >
            <SelectTrigger id="media-category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MEDIA_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {MEDIA_CATEGORY_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {canManage ? (
          <Button type="submit" size="sm" disabled={!dirty || saving} className="w-full">
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}{" "}
            {t("common.save")}
          </Button>
        ) : null}
      </form>
    </aside>
  );
}
