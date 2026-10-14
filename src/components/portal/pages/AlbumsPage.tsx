/**
 * Fotoalbums — beheerpagina.
 *
 * Per album (thema of één dier) kan het team foto's toevoegen, herschikken,
 * het bijschrift in NL/FR/EN aanpassen en foto's definitief verwijderen
 * (ook uit de Europese opslag). De site toont ze meteen in de carrousels.
 */
import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Star, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/portal/portal-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePermissions } from "@/lib/use-permissions";
import { getAnimals } from "@/lib/data.functions";
import { PHOTO_ALBUMS } from "@/lib/photo-albums";
import { setAnimalImage } from "@/lib/animals-admin.functions";
import { animalAlbumKey } from "@/lib/use-album-photos";
import {
  addAlbumPhotos,
  deleteAlbumPhoto,
  listAlbumPhotos,
  reorderAlbumPhotos,
  updateAlbumPhoto,
  type AlbumPhoto,
  type AlbumPhotoMap,
} from "@/lib/album-photos.functions";
import { UPLOAD_ACCEPT, uploadToStorage } from "@/lib/storage-client";
import { handleImageError } from "@/lib/image-fallback";
import { cn } from "@/lib/utils";

const THEME_LABELS: Record<string, string> = {
  ezels: "Ezels",
  geiten: "Geiten",
  schapen: "Schapen",
  kippen: "Kippen",
  eenden: "Eenden",
  konijnen: "Konijnen",
  pauwen: "Pauwen",
  pony: "Pony's & paarden",
  alpacas: "Alpaca's",
  moestuin: "Moestuin",
  boomgaard: "Boomgaard",
  erf: "Het erf",
  cavias: "Cavia's & knaagdieren",
  vijver: "De vijver",
  paden: "Paden & park",
  kinderen: "Kinderen op bezoek",
  speeltuin: "Speeltuin",
  educatie: "Educatie & workshops",
};

const ALBUM_QUERY_KEY = ["album-photos"] as const;

export function AlbumsPage() {
  const { can, isLoading: rightsLoading } = usePermissions();
  const canManage = can("manage_media");
  const queryClient = useQueryClient();

  const list = useServerFn(listAlbumPhotos);
  const add = useServerFn(addAlbumPhotos);
  const update = useServerFn(updateAlbumPhoto);
  const remove = useServerFn(deleteAlbumPhoto);
  const reorder = useServerFn(reorderAlbumPhotos);

  const albumsQuery = useQuery<AlbumPhotoMap>({
    queryKey: ALBUM_QUERY_KEY,
    queryFn: () => list(),
  });
  const animalsQuery = useQuery({ queryKey: ["animals"], queryFn: () => getAnimals() });

  const themeOptions = useMemo(
    () =>
      Object.keys(PHOTO_ALBUMS)
        .map((key) => ({ key, label: THEME_LABELS[key] ?? key }))
        .sort((a, b) => a.label.localeCompare(b.label, "nl")),
    [],
  );
  const animalOptions = useMemo(
    () =>
      (animalsQuery.data ?? [])
        .map((a) => ({
          key: animalAlbumKey(a.id),
          label: `${a.name}${a.species ? ` (${a.species})` : ""}`,
          animal: a,
        }))
        .sort((a, b) => a.label.localeCompare(b.label, "nl")),
    [animalsQuery.data],
  );

  const [albumKey, setAlbumKey] = useState<string>("erf");
  const photos: AlbumPhoto[] = albumsQuery.data?.[albumKey] ?? [];
  const currentAnimal = animalOptions.find((o) => o.key === albumKey)?.animal ?? null;


  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ name: string; percent: number }[]>([]);
  const [busy, setBusy] = useState(false);

  const setData = (map: AlbumPhotoMap) => queryClient.setQueryData(ALBUM_QUERY_KEY, map);

  const addMutation = useMutation({
    mutationFn: (input: {
      albumKey: string;
      photos: {
        url: string;
        storageKey: string | null;
        altNl: string;
        altFr: string;
        altEn: string;
      }[];
    }) => add({ data: input }),
    onSuccess: (map) => {
      setData(map);
      toast.success("Foto's toegevoegd.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const updateMutation = useMutation({
    mutationFn: (input: { id: string; altNl: string; altFr: string; altEn: string }) =>
      update({ data: input }),
    onSuccess: (map) => {
      setData(map);
      toast.success("Bijschrift bewaard.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: (map) => {
      setData(map);
      toast.success("Foto verwijderd.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const reorderMutation = useMutation({
    mutationFn: (ids: string[]) => reorder({ data: { albumKey, ids } }),
    onSuccess: (map) => setData(map),
    onError: (e: Error) => toast.error(e.message),
  });

  const setImage = useServerFn(setAnimalImage);
  const avatarMutation = useMutation({
    mutationFn: (input: { id: number; imageUrl: string }) => setImage({ data: input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["animals"] });
      void queryClient.invalidateQueries({ queryKey: ["animals-admin"] });
      toast.success("Profielfoto ingesteld.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  /** Na een upload in een dierenalbum: aanbieden als profielfoto. */
  function offerAvatar(url: string) {
    const animal = currentAnimal;
    if (!animal || animal.image_url) return;
    toast("Deze foto instellen als profielfoto van " + animal.name + "?", {
      action: {
        label: "Instellen",
        onClick: () => avatarMutation.mutate({ id: animal.id, imageUrl: url }),
      },
      duration: 12000,
    });
  }

  async function uploadFiles(files: File[]) {
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (!images.length) return;
    setBusy(true);
    setPending(images.map((f) => ({ name: f.name, percent: 0 })));
    const uploaded: { url: string; storageKey: string | null }[] = [];
    const folder = albumKey.startsWith("dier-") ? "animals" : "media";
    for (const [i, file] of images.entries()) {
      try {
        const { publicUrl, fileKey } = await uploadToStorage(file, folder, (percent) =>
          setPending((prev) => prev.map((p, idx) => (idx === i ? { ...p, percent } : p))),
        );
        uploaded.push({ url: publicUrl, storageKey: fileKey });
      } catch (error) {
        toast.error(`${file.name}: ${(error as Error).message}`);
      }
    }
    setPending([]);
    setBusy(false);
    if (uploaded.length) {
      addMutation.mutate({
        albumKey,
        photos: uploaded.map((u) => ({ ...u, altNl: "", altFr: "", altEn: "" })),
      });
      offerAvatar(uploaded[0]!.url);
    }
  }

  function move(index: number, dir: -1 | 1) {
    const next = [...photos];
    const to = index + dir;
    if (to < 0 || to >= next.length) return;
    const [item] = next.splice(index, 1);
    next.splice(to, 0, item!);
    reorderMutation.mutate(next.map((p) => p.id));
  }

  if (rightsLoading) return <div />;

  return (
    <div>
      <PageHeader
        title="Fotoalbums"
        subtitle="Voeg foto's toe per thema of per dier. Ze verschijnen meteen in de fotocarrousels op de site."
      />

      <div className="mb-5 flex flex-wrap items-end gap-3">
        <div className="min-w-64">
          <Label className="mb-1.5 block">Album</Label>
          <Select value={albumKey} onValueChange={setAlbumKey}>
            <SelectTrigger>
              <SelectValue placeholder="Kies een album" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Individuele bewoners</SelectLabel>
                {animalOptions.length === 0 ? (
                  <SelectItem value="__geen" disabled>
                    Nog geen dieren in de databank
                  </SelectItem>
                ) : (
                  animalOptions.map((o) => (
                    <SelectItem key={o.key} value={o.key}>
                      {o.label}
                    </SelectItem>
                  ))
                )}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Algemene thema's</SelectLabel>
                {themeOptions.map((o) => (
                  <SelectItem key={o.key} value={o.key}>
                    Thema: {o.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <Button
          type="button"
          disabled={!canManage || busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ImagePlus className="mr-2 size-4" />}
          Foto's toevoegen
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={UPLOAD_ACCEPT}
          multiple
          hidden
          onChange={(e) => {
            void uploadFiles(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
      </div>

      {!canManage ? (
        <p className="mb-4 text-sm text-muted-foreground">
          Je kan de albums bekijken, maar niet aanpassen.
        </p>
      ) : null}

      {pending.length ? (
        <div className="mb-5 space-y-2">
          {pending.map((p) => (
            <div key={p.name} className="space-y-1">
              <p className="truncate text-xs text-muted-foreground">{p.name}</p>
              <Progress value={p.percent} />
            </div>
          ))}
        </div>
      ) : null}

      {albumsQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Bezig met laden…</p>
      ) : photos.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Nog geen eigen foto's in dit album. De site toont voorlopig enkel de vaste foto's.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {photos.map((photo, index) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              first={index === 0}
              last={index === photos.length - 1}
              canManage={canManage}
              onMove={(dir) => move(index, dir)}
              onSave={(alt) => updateMutation.mutate({ id: photo.id, ...alt })}
              onDelete={() => deleteMutation.mutate(photo.id)}
              isAvatar={currentAnimal?.image_url === photo.url}
              onSetAvatar={
                currentAnimal
                  ? () => avatarMutation.mutate({ id: currentAnimal.id, imageUrl: photo.url })
                  : undefined
              }
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function PhotoCard({
  photo,
  first,
  last,
  canManage,
  onMove,
  onSave,
  onDelete,
  onSetAvatar,
  isAvatar,
}: {
  photo: AlbumPhoto;
  first: boolean;
  last: boolean;
  canManage: boolean;
  onMove: (dir: -1 | 1) => void;
  onSave: (alt: { altNl: string; altFr: string; altEn: string }) => void;
  onDelete: () => void;
  onSetAvatar?: (() => void) | undefined;
  isAvatar?: boolean;
}) {
  const [alt, setAlt] = useState({
    altNl: photo.alt.nl,
    altFr: photo.alt.fr,
    altEn: photo.alt.en,
  });
  const dirty =
    alt.altNl !== photo.alt.nl || alt.altFr !== photo.alt.fr || alt.altEn !== photo.alt.en;

  return (
    <li className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="aspect-[4/3] w-full bg-muted">
        <img
          src={photo.url}
          alt={photo.alt.nl}
          onError={handleImageError}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="space-y-2 p-3">
        <Input
          value={alt.altNl}
          onChange={(e) => setAlt({ ...alt, altNl: e.target.value })}
          placeholder="Bijschrift NL"
          disabled={!canManage}
        />
        <Input
          value={alt.altFr}
          onChange={(e) => setAlt({ ...alt, altFr: e.target.value })}
          placeholder="Bijschrift FR"
          disabled={!canManage}
        />
        <Input
          value={alt.altEn}
          onChange={(e) => setAlt({ ...alt, altEn: e.target.value })}
          placeholder="Bijschrift EN"
          disabled={!canManage}
        />
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={!canManage || first}
            onClick={() => onMove(-1)}
            aria-label="Naar voor verplaatsen"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={!canManage || last}
            onClick={() => onMove(1)}
            aria-label="Naar achter verplaatsen"
          >
            <ArrowRight className="size-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            className={cn("ml-auto", !dirty && "opacity-60")}
            disabled={!canManage || !dirty}
            onClick={() => onSave(alt)}
          >
            Bewaren
          </Button>
          {onSetAvatar ? (
            <Button
              type="button"
              variant={isAvatar ? "secondary" : "outline"}
              size="icon"
              disabled={!canManage || isAvatar}
              onClick={() => onSetAvatar()}
              title={isAvatar ? "Dit is de profielfoto" : "Als profielfoto instellen"}
              aria-label="Als profielfoto instellen"
            >
              <Star className={cn("size-4", isAvatar && "fill-current")} />
            </Button>
          ) : null}
          <Button
            type="button"
            variant="destructive"
            size="icon"
            disabled={!canManage}
            onClick={() => onDelete()}
            aria-label="Foto verwijderen"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
    </li>
  );
}
