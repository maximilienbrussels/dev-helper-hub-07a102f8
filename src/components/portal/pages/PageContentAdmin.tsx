/**
 * Beheer van de inhoud van de "Boeken & huren"-pagina's (hero + blokken).
 * Gebruikt binnen SitePage.tsx.
 */
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { ImagePickerModal } from "@/components/portal/media/ImagePickerModal";
import { ImageUploader } from "@/components/portal/media/ImageUploader";
import { MultiImageUploader } from "@/components/portal/media/MultiImageUploader";

import type { MediaAsset } from "@/lib/media.functions";
import {
  fetchPageContent,
  savePageHeroContent,
  savePageBlockContent,
  deletePageBlockContent,
  reorderPageBlockContent,
  savePageGalleryContent,
} from "@/lib/page-content.functions";
import {
  PAGE_CONTENT_KEYS,
  PAGE_CONTENT_LABELS,
  type LocalizedText,
  type PageBlockContent,
  type PageContentKey,
} from "@/lib/page-content";
import { handleImageError } from "@/lib/image-fallback";

type BlockDraft = {
  id: string | null;
  pageKey: PageContentKey;
  sortOrder: number;
  active: boolean;
  imageUrl: string | null;
  titleNl: string; titleFr: string; titleEn: string;
  textNl: string; textFr: string; textEn: string;
  price: number | null;
  priceLabelNl: string; priceLabelFr: string; priceLabelEn: string;
};

function emptyBlock(pageKey: PageContentKey, sortOrder: number): BlockDraft {
  return {
    id: null,
    pageKey,
    sortOrder,
    active: true,
    imageUrl: null,
    titleNl: "", titleFr: "", titleEn: "",
    textNl: "", textFr: "", textEn: "",
    price: null,
    priceLabelNl: "", priceLabelFr: "", priceLabelEn: "",
  };
}

function blockToDraft(b: PageBlockContent, pageKey: PageContentKey): BlockDraft {
  return {
    id: b.id.startsWith("default-") ? null : b.id,
    pageKey,
    sortOrder: b.sortOrder,
    active: b.active,
    imageUrl: b.imageUrl,
    titleNl: b.title.nl, titleFr: b.title.fr, titleEn: b.title.en,
    textNl: b.text.nl, textFr: b.text.fr, textEn: b.text.en,
    price: b.price,
    priceLabelNl: b.priceLabel.nl, priceLabelFr: b.priceLabel.fr, priceLabelEn: b.priceLabel.en,
  };
}

/** Beheer van hero + blokken van één "Boeken & huren"-pagina, met paginakiezer. */
export function PageContentAdmin() {
  const qc = useQueryClient();
  const [pageKey, setPageKey] = useState<PageContentKey>(PAGE_CONTENT_KEYS[0]);
  const queryKey = ["page-content", pageKey];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchPageContent({ data: { key: pageKey } }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey });
  const onError = (e: unknown) =>
    toast.error(e instanceof Error ? e.message : "Bewaren mislukt.");

  const heroMutation = useMutation({
    mutationFn: (input: {
      heroImageUrl: string | null;
      titleNl: string; titleFr: string; titleEn: string;
      textNl: string; textFr: string; textEn: string;
    }) => savePageHeroContent({ data: { key: pageKey, ...input } }),
    onSuccess: () => {
      toast.success("Hero bewaard.");
      void invalidate();
    },
    onError,
  });

  const blockMutation = useMutation({
    mutationFn: (input: BlockDraft) => savePageBlockContent({ data: input }),
    onSuccess: () => {
      toast.success("Blok bewaard.");
      void invalidate();
    },
    onError,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePageBlockContent({ data: { id } }),
    onSuccess: () => {
      toast.success("Blok verwijderd.");
      void invalidate();
    },
    onError,
  });

  const reorderMutation = useMutation({
    mutationFn: (ids: string[]) => reorderPageBlockContent({ data: { ids } }),
    onSuccess: () => void invalidate(),
    onError,
  });

  const [heroDraft, setHeroDraft] = useState<Record<string, string> | null>(null);
  const hero = data?.hero ?? null;
  const heroForm = useMemo(
    () =>
      heroDraft ?? {
        titleNl: hero?.title.nl ?? "", titleFr: hero?.title.fr ?? "", titleEn: hero?.title.en ?? "",
        textNl: hero?.text.nl ?? "", textFr: hero?.text.fr ?? "", textEn: hero?.text.en ?? "",
      },
    [heroDraft, hero],
  );
  const setHero = (key: string, value: string) => setHeroDraft({ ...heroForm, [key]: value });

  const galleryMutation = useMutation({
    mutationFn: (urls: string[]) => savePageGalleryContent({ data: { key: pageKey, urls } }),
    onSuccess: () => {
      toast.success("Galerij bewaard.");
      setGalleryDraft(null);
      void invalidate();
    },
    onError,
  });

  const [galleryDraft, setGalleryDraft] = useState<string[] | null>(null);
  const gallery = galleryDraft ?? data?.gallery ?? [];

  const [heroPicker, setHeroPicker] = useState(false);
  const [heroImageUrl, setHeroImageUrl] = useState<string | null | undefined>(undefined);
  const effectiveHeroImage = heroImageUrl !== undefined ? heroImageUrl : (hero?.imageUrl ?? null);

  const [editing, setEditing] = useState<BlockDraft | null>(null);
  const [deleting, setDeleting] = useState<PageBlockContent | null>(null);

  function switchPage(key: PageContentKey) {
    setPageKey(key);
    setHeroDraft(null);
    setHeroImageUrl(undefined);
    setGalleryDraft(null);
  }

  const blocks = data?.blocks ?? [];

  function move(index: number, dir: -1 | 1) {
    const next = [...blocks];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    reorderMutation.mutate(next.map((b) => b.id).filter((id) => !id.startsWith("default-")));
    if (next.some((b) => b.id.startsWith("default-"))) {
      toast.info("Deze pagina wordt eerst bewaard met haar standaardblokken bij de eerste wijziging.");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Label className="text-sm font-medium">Pagina</Label>
        <Select value={pageKey} onValueChange={(v) => switchPage(v as PageContentKey)}>
          <SelectTrigger className="h-9 w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_CONTENT_KEYS.map((k) => (
              <SelectItem key={k} value={k}>
                {PAGE_CONTENT_LABELS[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading || !data ? (
        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Laden…
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-border bg-surface p-4">
            <h3 className="text-sm font-semibold">Sfeerbeeld & intro</h3>
            <div className="mt-3 flex flex-wrap items-start gap-4">
              <div className="w-56 shrink-0 space-y-2">
                <ImageUploader
                  value={effectiveHeroImage}
                  onChange={(url) => setHeroImageUrl(url)}
                  folder={pageKey}
                  label="Sfeerbeeld opladen"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => setHeroPicker(true)}
                >
                  Kies uit mediabibliotheek
                </Button>
              </div>

              <div className="min-w-64 flex-1 space-y-3">
                <Tabs defaultValue="nl">
                  <TabsList>
                    <TabsTrigger value="nl">NL</TabsTrigger>
                    <TabsTrigger value="fr">FR</TabsTrigger>
                    <TabsTrigger value="en">EN</TabsTrigger>
                  </TabsList>
                  {(["nl", "fr", "en"] as const).map((l) => (
                    <TabsContent key={l} value={l} className="space-y-2 pt-2">
                      <Input
                        placeholder={`Titel (${l.toUpperCase()})`}
                        value={heroForm[`title${l[0].toUpperCase()}${l.slice(1)}`]}
                        onChange={(e) => setHero(`title${l[0].toUpperCase()}${l.slice(1)}`, e.target.value)}
                      />
                      <Textarea
                        rows={3}
                        placeholder={`Tekst (${l.toUpperCase()})`}
                        value={heroForm[`text${l[0].toUpperCase()}${l.slice(1)}`]}
                        onChange={(e) => setHero(`text${l[0].toUpperCase()}${l.slice(1)}`, e.target.value)}
                      />
                    </TabsContent>
                  ))}
                </Tabs>
                <Button
                  size="sm"
                  disabled={heroMutation.isPending}
                  onClick={() =>
                    heroMutation.mutate({
                      heroImageUrl: effectiveHeroImage,
                      titleNl: heroForm.titleNl, titleFr: heroForm.titleFr, titleEn: heroForm.titleEn,
                      textNl: heroForm.textNl, textFr: heroForm.textFr, textEn: heroForm.textEn,
                    })
                  }
                >
                  Hero bewaren
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">Fotogalerij ({gallery.length})</h3>
                <p className="text-xs text-muted-foreground">
                  Deze foto's verschijnen in de publieke galerij op {PAGE_CONTENT_LABELS[pageKey]}.
                </p>
              </div>
              <Button
                size="sm"
                disabled={galleryMutation.isPending || galleryDraft === null}
                onClick={() => galleryMutation.mutate(gallery)}
              >
                {galleryMutation.isPending ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : null}
                Galerij bewaren
              </Button>
            </div>
            <MultiImageUploader
              value={gallery}
              onChange={(urls) => setGalleryDraft(urls)}
              folder={`${pageKey}/galerij`}
              disabled={galleryMutation.isPending}
            />
          </div>

          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Blokken ({blocks.length})</h3>
              <Button size="sm" onClick={() => setEditing(emptyBlock(pageKey, blocks.length))}>
                <Plus className="mr-1.5 size-4" /> Blok toevoegen
              </Button>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {blocks.map((b, index) => (
                <li key={b.id} className="flex gap-3 rounded-lg border border-border bg-card p-3">
                  <div className="h-16 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
                    {b.imageUrl ? (
                      <img loading="lazy" onError={handleImageError} src={b.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{b.title.nl || "(geen titel)"}</p>
                    <p className="line-clamp-1 text-xs text-muted-foreground">{b.text.nl}</p>
                    <p className="mt-1 text-xs font-medium">
                      {b.price !== null ? `€ ${b.price} ${b.priceLabel.nl}` : "—"}
                      {!b.active && <span className="ml-2 text-muted-foreground">(inactief)</span>}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <Button
                      size="icon"
                      variant="outline"
                      className="size-7"
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                    >
                      <ArrowUp className="size-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="size-7"
                      disabled={index === blocks.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      <ArrowDown className="size-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="size-7"
                      onClick={() => setEditing(blockToDraft(b, pageKey))}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button size="icon" variant="outline" className="size-7" onClick={() => setDeleting(b)}>
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      <ImagePickerModal
        open={heroPicker}
        onOpenChange={setHeroPicker}
        uploadCategory="general"
        onSelect={(asset: MediaAsset) => setHeroImageUrl(asset.url)}
        title="Sfeerbeeld kiezen"
      />

      <BlockEditor
        draft={editing}
        onClose={() => setEditing(null)}
        onSave={(d) => {
          blockMutation.mutate(d);
          setEditing(null);
        }}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Blok verwijderen</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je "{deleting?.title.nl}" wilt verwijderen? Dit kan niet ongedaan
              gemaakt worden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleting && !deleting.id.startsWith("default-")) deleteMutation.mutate(deleting.id);
                setDeleting(null);
              }}
            >
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BlockEditor({
  draft,
  onClose,
  onSave,
}: {
  draft: BlockDraft | null;
  onClose: () => void;
  onSave: (d: BlockDraft) => void;
}) {
  const [local, setLocal] = useState<BlockDraft | null>(draft);
  const [picker, setPicker] = useState(false);
  if (draft && local !== draft && local?.id !== draft.id) setLocal(draft);
  if (!draft || !local) return null;

  const set = <K extends keyof BlockDraft>(key: K, value: BlockDraft[K]) =>
    setLocal({ ...local, [key]: value });

  return (
    <Dialog open={!!draft} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{local.id ? "Blok bewerken" : "Blok toevoegen"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <ImageUploader
            value={local.imageUrl}
            onChange={(url) => set("imageUrl", url)}
            folder="events"
            label="Afbeelding"
          />
          <Button type="button" variant="outline" size="sm" onClick={() => setPicker(true)}>
            <ImagePlus className="size-4" /> Kies uit mediabibliotheek
          </Button>


          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Prijs (€)</Label>
              <Input
                type="number"
                min={0}
                value={local.price ?? ""}
                onChange={(e) => set("price", e.target.value === "" ? null : Number(e.target.value))}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2.5">
              <span className="text-sm font-medium">Actief</span>
              <Switch checked={local.active} onCheckedChange={(v) => set("active", v)} />
            </div>
          </div>

          <Tabs defaultValue="nl">
            <TabsList className="w-full">
              <TabsTrigger value="nl" className="flex-1">NL</TabsTrigger>
              <TabsTrigger value="fr" className="flex-1">FR</TabsTrigger>
              <TabsTrigger value="en" className="flex-1">EN</TabsTrigger>
            </TabsList>
            {(["nl", "fr", "en"] as const).map((l) => {
              const cap = `${l[0].toUpperCase()}${l.slice(1)}` as "Nl" | "Fr" | "En";
              return (
                <TabsContent key={l} value={l} className="space-y-3 pt-3">
                  <div>
                    <Label>Titel</Label>
                    <Input
                      maxLength={200}
                      value={local[`title${cap}`]}
                      onChange={(e) => set(`title${cap}`, e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Tekst</Label>
                    <Textarea
                      rows={4}
                      maxLength={2000}
                      value={local[`text${cap}`]}
                      onChange={(e) => set(`text${cap}`, e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Prijslabel (bv. "per groep")</Label>
                    <Input
                      maxLength={80}
                      value={local[`priceLabel${cap}`]}
                      onChange={(e) => set(`priceLabel${cap}`, e.target.value)}
                    />
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuleren
          </Button>
          <Button onClick={() => onSave(local)}>Bewaren</Button>
        </DialogFooter>
      </DialogContent>

      <ImagePickerModal
        open={picker}
        onOpenChange={setPicker}
        uploadCategory="general"
        onSelect={(asset: MediaAsset) => set("imageUrl", asset.url)}
        title="Afbeelding kiezen"
      />
    </Dialog>
  );
}
