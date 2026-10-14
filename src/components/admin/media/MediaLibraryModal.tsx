import { useCallback, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Folder, Loader2, Search, Sparkles, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { handleImageError } from "@/lib/image-fallback";
import {
  findSimilarScalewayMedia,
  listScalewayMedia,
  readFileForUpload,
  uploadScalewayMedia,
  type MediaObject,
  type SimilarMatch,
} from "@/lib/api/scaleway";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (object: MediaObject) => void;
  defaultPrefix?: string;
};

/** Mediabibliotheek op Scaleway: bladeren, zoeken, uploaden en dubbels vinden. */
export function MediaLibraryModal({ open, onOpenChange, onSelect, defaultPrefix = "" }: Props) {
  const queryClient = useQueryClient();
  const [prefix, setPrefix] = useState(defaultPrefix);
  const [search, setSearch] = useState("");
  const [similar, setSimilar] = useState<{ from: string; matches: SimilarMatch[] } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const listing = useQuery({
    queryKey: ["scaleway", "list", prefix],
    queryFn: () => listScalewayMedia({ prefix, limit: 200 }),
    enabled: open,
  });

  const crumbs = useMemo(() => {
    const parts = prefix ? prefix.split("/") : [];
    return [{ label: "Start", value: "" }].concat(
      parts.map((part, index) => ({ label: part, value: parts.slice(0, index + 1).join("/") })),
    );
  }, [prefix]);

  const visible = useMemo(() => {
    const source = similar ? similar.matches : (listing.data?.objects ?? []);
    const needle = search.trim().toLowerCase();
    return needle ? source.filter((o) => o.key.toLowerCase().includes(needle)) : source;
  }, [similar, listing.data, search]);

  const findSimilar = useMutation({
    mutationFn: (object: MediaObject) => findSimilarScalewayMedia({ key: object.key, size: object.size }),
    onSuccess: (result, object) => {
      setSimilar({ from: object.name, matches: result.matches });
      if (result.matches.length === 0) toast.info("Geen gelijkaardige foto's gevonden.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const upload = useMutation({
    mutationFn: async (files: File[]) => {
      const uploaded: MediaObject[] = [];
      for (const file of files) {
        const prepared = await readFileForUpload(file);
        const check = await findSimilarScalewayMedia({
          filename: prepared.filename,
          size: prepared.size,
          width: prepared.width,
          height: prepared.height,
          prefix: prefix || undefined,
        }).catch(() => ({ matches: [], exactDuplicate: null }));

        if (check.exactDuplicate) {
          const reuse = window.confirm(
            `⚠️ Deze foto lijkt al te bestaan (${check.exactDuplicate.name}). Klik op OK om de bestaande foto te hergebruiken, of op Annuleren om toch te uploaden.`,
          );
          if (reuse) {
            uploaded.push(check.exactDuplicate);
            continue;
          }
        }

        const result = await uploadScalewayMedia({
          folder: prefix || "products",
          filename: prepared.filename,
          contentType: prepared.contentType,
          dataBase64: prepared.dataBase64,
        });
        uploaded.push(result.object);
      }
      return uploaded;
    },
    onSuccess: (objects) => {
      toast.success(`${objects.length} foto('s) klaar.`);
      void queryClient.invalidateQueries({ queryKey: ["scaleway", "list"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const files = Array.from(event.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
      if (files.length > 0) upload.mutate(files);
    },
    [upload],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Kies uit mediabibliotheek</DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          {crumbs.map((crumb, index) => (
            <span key={crumb.value} className="flex items-center gap-2">
              {index > 0 ? <span className="text-muted-foreground">/</span> : null}
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => {
                  setSimilar(null);
                  setPrefix(crumb.value);
                }}
              >
                {crumb.label}
              </button>
            </span>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-48">
            <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Zoek op bestandsnaam of map"
              className="pl-8"
            />
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              if (files.length > 0) upload.mutate(files);
              e.target.value = "";
            }}
          />
          <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={upload.isPending}>
            {upload.isPending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            Uploaden
          </Button>
          {similar ? (
            <Button variant="ghost" size="sm" onClick={() => setSimilar(null)}>
              <X className="size-4" /> Toon alles
            </Button>
          ) : null}
        </div>

        {similar ? (
          <p className="text-sm text-muted-foreground">
            Gelijkaardig aan <strong>{similar.from}</strong> — {similar.matches.length} resultaten.
          </p>
        ) : null}

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className="max-h-[55vh] overflow-y-auto rounded-md border border-dashed border-border p-3"
        >
          {listing.isError ? (
            <p className="text-sm text-destructive">{(listing.error as Error).message}</p>
          ) : listing.isLoading ? (
            <p className="text-sm text-muted-foreground">Bezig met laden…</p>
          ) : (
            <>
              {!similar && listing.data?.folders.length ? (
                <ul className="mb-3 flex flex-wrap gap-2">
                  {listing.data.folders.map((folder) => (
                    <li key={folder}>
                      <button
                        type="button"
                        onClick={() => setPrefix(folder)}
                        className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
                      >
                        <Folder className="size-4" /> {folder.split("/").pop()}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}

              {visible.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Geen foto's gevonden. Sleep bestanden hierheen om te uploaden.
                </p>
              ) : (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {visible.map((object) => (
                    <li key={object.key} className="group overflow-hidden rounded-md border border-border">
                      <button
                        type="button"
                        onClick={() => {
                          onSelect(object);
                          onOpenChange(false);
                        }}
                        className="block w-full"
                      >
                        <img
                          loading="lazy"
                          onError={handleImageError}
                          src={object.url}
                          alt={object.name}
                          className="aspect-square w-full object-cover"
                        />
                      </button>
                      <div className="space-y-1 p-2">
                        <p className="truncate text-xs" title={object.key}>
                          {object.name}
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 w-full text-xs"
                          disabled={findSimilar.isPending}
                          onClick={() => findSimilar.mutate(object)}
                        >
                          <Sparkles className="size-3" /> Gelijkaardig zoeken
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
