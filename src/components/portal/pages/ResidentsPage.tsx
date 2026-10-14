/**
 * Bewoners & dieren — beheerpagina.
 *
 * Per dier passen we naam, soort, verhaaltje en de profielfoto aan. De foto
 * kies je uit de mediabibliotheek; wis je ze, dan valt de site terug op het
 * fotoalbum van dat dier.
 */
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ImageIcon, Loader2, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/portal/portal-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MediaLibraryModal } from "@/components/admin/media/MediaLibraryModal";
import { ResidentPhoto } from "@/components/ResidentPhoto";
import { usePermissions } from "@/lib/use-permissions";
import { useAlbumPhotos } from "@/lib/use-album-photos";
import {
  listAnimalsAdmin,
  setAnimalImage,
  updateAnimal,
  type AdminAnimal,
} from "@/lib/animals-admin.functions";

const QUERY_KEY = ["animals-admin"] as const;

export function ResidentsPage() {
  const { can, isLoading: rightsLoading } = usePermissions();
  const canManage = can("manage_media");
  const queryClient = useQueryClient();
  const albums = useAlbumPhotos();

  const list = useServerFn(listAnimalsAdmin);
  const update = useServerFn(updateAnimal);
  const setImage = useServerFn(setAnimalImage);

  const animalsQuery = useQuery<AdminAnimal[]>({ queryKey: QUERY_KEY, queryFn: () => list() });
  const [pickerFor, setPickerFor] = useState<AdminAnimal | null>(null);

  function applied(rows: AdminAnimal[]) {
    queryClient.setQueryData(QUERY_KEY, rows);
    void queryClient.invalidateQueries({ queryKey: ["animals"] });
  }

  const updateMutation = useMutation({
    mutationFn: (input: { id: number; name: string; species: string; description: string }) =>
      update({ data: input }),
    onSuccess: (rows) => {
      applied(rows);
      toast.success("Bewaard.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const imageMutation = useMutation({
    mutationFn: (input: { id: number; imageUrl: string | null }) => setImage({ data: input }),
    onSuccess: (rows) => {
      applied(rows);
      toast.success("Profielfoto bijgewerkt.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (rightsLoading) return <div />;

  const animals = animalsQuery.data ?? [];

  return (
    <div>
      <PageHeader
        title="Bewoners & dieren"
        subtitle="Naam, soort, verhaaltje en profielfoto van elk dier. De profielfoto verschijnt bij 'De bewoners' op de site."
      />

      {!canManage ? (
        <p className="mb-4 text-sm text-muted-foreground">
          Je kan de bewoners bekijken, maar niet aanpassen.
        </p>
      ) : null}

      {animalsQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Bezig met laden…</p>
      ) : animals.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Er staan nog geen dieren in de databank.
        </p>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {animals.map((animal) => (
            <AnimalCard
              key={animal.id}
              animal={animal}
              albums={albums}
              canManage={canManage}
              saving={updateMutation.isPending}
              onSave={(values) => updateMutation.mutate({ id: animal.id, ...values })}
              onPickPhoto={() => setPickerFor(animal)}
              onClearPhoto={() => imageMutation.mutate({ id: animal.id, imageUrl: null })}
            />
          ))}
        </ul>
      )}

      <MediaLibraryModal
        open={pickerFor !== null}
        onOpenChange={(open) => {
          if (!open) setPickerFor(null);
        }}
        defaultPrefix="animals/"
        onSelect={(object) => {
          if (pickerFor) imageMutation.mutate({ id: pickerFor.id, imageUrl: object.url });
          setPickerFor(null);
        }}
      />
    </div>
  );
}

function AnimalCard({
  animal,
  albums,
  canManage,
  saving,
  onSave,
  onPickPhoto,
  onClearPhoto,
}: {
  animal: AdminAnimal;
  albums: ReturnType<typeof useAlbumPhotos>;
  canManage: boolean;
  saving: boolean;
  onSave: (values: { name: string; species: string; description: string }) => void;
  onPickPhoto: () => void;
  onClearPhoto: () => void;
}) {
  const [form, setForm] = useState({
    name: animal.name,
    species: animal.species,
    description: animal.description ?? "",
  });
  const dirty =
    form.name !== animal.name ||
    form.species !== animal.species ||
    form.description !== (animal.description ?? "");

  return (
    <li className="rounded-xl border border-border bg-card p-4">
      <div className="flex gap-4">
        <div className="h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-muted">
          <ResidentPhoto animal={animal} albums={albums} />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <Label className="mb-1 block text-xs">Naam</Label>
            <Input
              value={form.name}
              disabled={!canManage}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <Label className="mb-1 block text-xs">Soort</Label>
            <Input
              value={form.species}
              disabled={!canManage}
              onChange={(e) => setForm({ ...form, species: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="mt-3">
        <Label className="mb-1 block text-xs">Verhaaltje</Label>
        <Textarea
          rows={3}
          value={form.description}
          disabled={!canManage}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" disabled={!canManage} onClick={onPickPhoto}>
          <ImageIcon className="mr-2 size-4" />
          Foto wijzigen
        </Button>
        {animal.image_url ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!canManage}
            onClick={onClearPhoto}
          >
            <Trash2 className="mr-2 size-4" />
            Profielfoto wissen
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">
            Geen eigen profielfoto — de site gebruikt het album.
          </span>
        )}
        <Button
          type="button"
          size="sm"
          className="ml-auto"
          disabled={!canManage || !dirty || saving}
          onClick={() => onSave(form)}
        >
          {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          Bewaren
        </Button>
      </div>
    </li>
  );
}
