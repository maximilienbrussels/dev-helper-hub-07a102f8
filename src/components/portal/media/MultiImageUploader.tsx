/**
 * Beheer van een fotogalerij: meerdere bestanden tegelijk uploaden naar de
 * Europese Scaleway-bucket, herordenen via slepen en per beeld verwijderen
 * (het bestand wordt dan ook echt uit de bucket gewist).
 */
import { useRef, useState } from "react";
import { GripVertical, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  UPLOAD_ACCEPT,
  deleteFromStorage,
  isStorageUrl,
  uploadToStorage,
} from "@/lib/storage-client";
import { handleImageError } from "@/lib/image-fallback";

type Props = {
  value: string[];
  onChange: (urls: string[]) => void;
  folder: string;
  label?: string;
  disabled?: boolean;
};

type Pending = { name: string; percent: number };

export function MultiImageUploader({ value, onChange, folder, label, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  async function uploadFiles(files: File[]) {
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (!images.length) return;
    setBusy(true);
    setPending(images.map((f) => ({ name: f.name, percent: 0 })));
    const uploaded: string[] = [];
    for (const [i, file] of images.entries()) {
      try {
        const { publicUrl } = await uploadToStorage(file, folder, (percent) =>
          setPending((prev) => prev.map((p, idx) => (idx === i ? { ...p, percent } : p))),
        );
        uploaded.push(publicUrl);
      } catch (error) {
        toast.error(`${file.name}: ${(error as Error).message}`);
      }
    }
    setPending([]);
    setBusy(false);
    if (uploaded.length) {
      onChange([...value, ...uploaded]);
      toast.success(`${uploaded.length} foto('s) toegevoegd.`);
    }
  }

  async function removeAt(index: number) {
    const url = value[index];
    onChange(value.filter((_, i) => i !== index));
    if (url && isStorageUrl(url)) {
      try {
        await deleteFromStorage(url);
      } catch (error) {
        toast.error(`Verwijderen uit de opslag mislukt: ${(error as Error).message}`);
      }
    }
  }

  function move(from: number, to: number) {
    if (from === to || to < 0 || to >= value.length) return;
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item!);
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {label ? <p className="text-sm font-medium">{label}</p> : null}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!disabled) void uploadFiles(Array.from(e.dataTransfer.files));
        }}
        className={cn(
          "rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground transition-colors",
          dragOver ? "border-primary bg-primary/5" : "border-border",
        )}
      >
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
        <p>Sleep meerdere foto's hierheen, of</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2"
          disabled={disabled || busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
          Foto's kiezen
        </Button>
        <p className="mt-2 text-xs">JPG, PNG of WebP · max. 5 MB per foto</p>
      </div>

      {pending.length > 0 ? (
        <ul className="space-y-2">
          {pending.map((p) => (
            <li key={p.name} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="truncate">{p.name}</span>
                <span>{p.percent}%</span>
              </div>
              <Progress value={p.percent} className="h-1.5" />
            </li>
          ))}
        </ul>
      ) : null}

      {value.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {value.map((url, index) => (
            <li
              key={`${url}-${index}`}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null) move(dragIndex, index);
                setDragIndex(null);
              }}
              className="group relative overflow-hidden rounded-lg border border-border bg-muted"
            >
              <img onError={handleImageError} src={url} alt="" className="aspect-square w-full object-cover" loading="lazy" />
              <span className="absolute left-1 top-1 rounded bg-background/85 px-1.5 py-0.5 text-[10px] font-medium">
                {index + 1}
              </span>
              <span className="absolute right-1 top-1 cursor-grab rounded bg-background/85 p-1">
                <GripVertical className="size-3.5" />
              </span>
              <div className="absolute inset-x-1 bottom-1 flex items-center justify-between gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="size-6"
                    aria-label="Naar links"
                    onClick={() => move(index, index - 1)}
                  >
                    ←
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="size-6"
                    aria-label="Naar rechts"
                    onClick={() => move(index, index + 1)}
                  >
                    →
                  </Button>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="size-6"
                  aria-label="Foto verwijderen"
                  onClick={() => void removeAt(index)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
