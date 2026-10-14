/**
 * "Opslag"-tab in de beeldkiezer: bladert rechtstreeks door de Scaleway-bucket
 * (mappen + bestanden) en registreert bestanden met één klik in de bibliotheek,
 * zodat ze meteen als `MediaAsset` bruikbaar zijn.
 */
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronRight, Folder, FolderPlus, ImageOff, Loader2, Check, Plus } from "lucide-react";
import { listScalewayMedia, type MediaObject } from "@/lib/api/scaleway";
import {
  listRegisteredStorageKeys,
  registerStorageObject,
  registerStorageObjects,
  type MediaAsset,
} from "@/lib/media.functions";
import { MEDIA_QUERY_KEY } from "./useMediaLibrary";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  canManage: boolean;
  /** Wordt aangeroepen zodra een bestand in de bibliotheek staat (nieuw of al bestaand). */
  onRegistered: (asset: MediaAsset) => void;
  selectedKey?: string | null;
};

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} kB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

const IMAGE_RE = /\.(jpe?g|png|webp|gif|avif|svg)$/i;

export function StorageBrowser({ canManage, onRegistered, selectedKey }: Props) {
  const queryClient = useQueryClient();
  const [prefix, setPrefix] = useState("");

  const listing = useQuery({
    queryKey: ["portal", "storage", prefix],
    queryFn: () => listScalewayMedia({ prefix, limit: 200 }),
    staleTime: 30_000,
  });
  const registered = useQuery({
    queryKey: ["portal", "storage", "registered"],
    queryFn: () => listRegisteredStorageKeys(),
    staleTime: 30_000,
  });

  const afterRegister = () => {
    void queryClient.invalidateQueries({ queryKey: MEDIA_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: ["portal", "storage", "registered"] });
  };

  const registerOne = useMutation({
    mutationFn: (key: string) => registerStorageObject({ data: { key } }),
    onSuccess: (asset) => {
      afterRegister();
      onRegistered(asset);
    },
    onError: (e: Error) => toast.error(e.message || "Registreren mislukt."),
  });

  const registerFolder = useMutation({
    mutationFn: (keys: string[]) => registerStorageObjects({ data: { keys } }),
    onSuccess: (r) => {
      afterRegister();
      toast.success(
        r.failed.length
          ? `${r.assets.length} beelden toegevoegd, ${r.failed.length} mislukt.`
          : `${r.assets.length} beelden toegevoegd aan de bibliotheek.`,
      );
    },
    onError: (e: Error) => toast.error(e.message || "Registreren mislukt."),
  });

  const crumbs = prefix.split("/").filter(Boolean);
  const objects = (listing.data?.objects ?? []).filter((o) => IMAGE_RE.test(o.key));
  const unregistered = objects.filter((o) => !registered.data?.[o.key]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <nav aria-label="Map" className="flex flex-wrap items-center gap-1 text-sm">
        <button
          type="button"
          className="rounded px-1.5 py-0.5 hover:bg-muted"
          onClick={() => setPrefix("")}
        >
          Bucket
        </button>
        {crumbs.map((c, i) => {
          const target = crumbs.slice(0, i + 1).join("/") + "/";
          return (
            <span key={target} className="flex items-center gap-1">
              <ChevronRight className="size-3 text-muted-foreground" />
              <button
                type="button"
                className="rounded px-1.5 py-0.5 hover:bg-muted"
                onClick={() => setPrefix(target)}
              >
                {c}
              </button>
            </span>
          );
        })}
        <span className="ml-auto text-xs text-muted-foreground">
          {objects.length} beelden · {listing.data?.folders.length ?? 0} mappen
        </span>
        {canManage && unregistered.length > 0 ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={registerFolder.isPending}
            onClick={() => registerFolder.mutate(unregistered.map((o) => o.key))}
          >
            {registerFolder.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FolderPlus className="size-4" />
            )}
            Alle beelden in deze map toevoegen ({unregistered.length})
          </Button>
        ) : null}
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {listing.isLoading ? (
          <p className="text-sm text-muted-foreground">Opslag laden…</p>
        ) : listing.isError ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm">
            <p className="font-medium text-destructive">De opslag kon niet gelezen worden.</p>
            <p className="mt-1 text-muted-foreground">
              {listing.error instanceof Error ? listing.error.message : "Onbekende fout"}
            </p>
            <Button type="button" size="sm" variant="outline" className="mt-3" onClick={() => void listing.refetch()}>
              Opnieuw proberen
            </Button>
          </div>
        ) : (
          <>
            {listing.data && listing.data.folders.length > 0 ? (
              <ul className="mb-3 flex flex-wrap gap-2">
                {listing.data.folders.map((f) => {
                  const name = f.replace(prefix, "").replace(/\/$/, "");
                  return (
                    <li key={f}>
                      <button
                        type="button"
                        onClick={() => setPrefix(f)}
                        className="flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-sm hover:bg-muted"
                      >
                        <Folder className="size-4 text-muted-foreground" /> {name}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}

            {objects.length === 0 ? (
              <div className="grid place-items-center rounded-lg border border-dashed border-border p-10 text-center">
                <ImageOff className="size-7 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Geen beelden in deze map — open een submap hierboven.
                </p>
              </div>
            ) : (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {objects.map((o) => (
                  <StorageTile
                    key={o.key}
                    object={o}
                    registeredId={registered.data?.[o.key] ?? null}
                    active={selectedKey === o.key}
                    busy={registerOne.isPending && registerOne.variables === o.key}
                    canManage={canManage}
                    onPick={() => registerOne.mutate(o.key)}
                  />
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StorageTile({
  object,
  registeredId,
  active,
  busy,
  canManage,
  onPick,
}: {
  object: MediaObject;
  registeredId: string | null;
  active: boolean;
  busy: boolean;
  canManage: boolean;
  onPick: () => void;
}) {
  const disabled = busy || (!registeredId && !canManage);
  return (
    <li>
      <button
        type="button"
        disabled={disabled}
        onClick={onPick}
        aria-pressed={active}
        title={object.key}
        className={cn(
          "group relative block w-full overflow-hidden rounded-lg border bg-muted text-left transition",
          active ? "border-primary ring-2 ring-primary/40" : "border-border hover:border-primary/50",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <img
          src={object.url}
          alt={object.name}
          loading="lazy"
          className="aspect-square w-full object-cover"
        />
        <span
          className={cn(
            "absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
            registeredId ? "bg-primary text-primary-foreground" : "bg-background/90 text-foreground",
          )}
        >
          {busy ? (
            <Loader2 className="size-3 animate-spin" />
          ) : registeredId ? (
            <>
              <Check className="size-3" /> In bibliotheek
            </>
          ) : (
            <>
              <Plus className="size-3" /> Toevoegen
            </>
          )}
        </span>
        <span className="block truncate px-2 py-1.5 text-xs">
          {object.name}
          <span className="ml-1 text-muted-foreground">{formatBytes(object.size)}</span>
        </span>
      </button>
    </li>
  );
}
