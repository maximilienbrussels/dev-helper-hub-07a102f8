/**
 * Herbruikbare beeld-uploader voor het portaal.
 * Uploadt rechtstreeks naar de Europese Scaleway-bucket (Parijs) en geeft de
 * publieke URL terug, die het formulier in Neon Postgres bewaart.
 */
import { useRef, useState, type DragEvent } from "react";
import { ImagePlus, Loader2, RefreshCw, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  UPLOAD_ACCEPT,
  UPLOAD_MAX_BYTES,
  deleteFromStorage,
  isStorageUrl,
  uploadToStorage,
} from "@/lib/storage-client";
import { handleImageError } from "@/lib/image-fallback";

type Props = {
  value: string | null;
  onChange: (newUrl: string | null) => void;
  folder: string;
  label?: string;
  disabled?: boolean;
  className?: string;
};

export function ImageUploader({ value, onChange, folder, label, disabled, className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);

  const uploading = progress !== null;

  const handleFile = async (file: File) => {
    if (file.size > UPLOAD_MAX_BYTES) {
      toast.error("Dit bestand is groter dan 5 MB.");
      return;
    }
    const previous = value;
    setProgress(0);
    try {
      const { publicUrl } = await uploadToStorage(file, folder, setProgress);
      onChange(publicUrl);
      toast.success("Afbeelding opgeladen.");
      if (previous && isStorageUrl(previous)) {
        void deleteFromStorage(previous).catch(() => undefined);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Opladen mislukt.");
    } finally {
      setProgress(null);
    }
  };

  const pick = (list: FileList | null) => {
    const file = list?.[0];
    if (!file || disabled || uploading) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Kies een afbeelding (JPG, PNG of WebP).");
      return;
    }
    void handleFile(file);
  };

  const remove = async () => {
    if (!value) return;
    setBusy(true);
    try {
      if (isStorageUrl(value)) await deleteFromStorage(value);
      onChange(null);
      toast.success("Afbeelding verwijderd.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Verwijderen mislukt.");
    } finally {
      setBusy(false);
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setOver(false);
    pick(e.dataTransfer.files);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label ? <p className="text-sm font-semibold">{label}</p> : null}

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {value ? (
          <div>
            <div className="aspect-video w-full bg-muted">
              <img loading="lazy"
                src={value}
                alt=""
                className="h-full w-full object-cover object-[50%_40%]"
                onError={handleImageError}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t border-border p-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={disabled || uploading || busy}
                onClick={() => inputRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
                Afbeelding vervangen
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={disabled || uploading || busy}
                onClick={() => void remove()}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                Verwijder afbeelding
              </Button>
            </div>
          </div>
        ) : (
          <div
            role="button"
            tabIndex={0}
            onClick={() => !disabled && !uploading && inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(true);
            }}
            onDragLeave={() => setOver(false)}
            onDrop={onDrop}
            className={cn(
              "flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 p-6 text-center text-sm transition",
              over ? "bg-primary/10" : "bg-muted/40 hover:bg-muted",
              (disabled || uploading) && "pointer-events-none opacity-60",
            )}
          >
            {uploading ? (
              <Loader2 className="size-6 animate-spin text-primary" />
            ) : (
              <UploadCloud className="size-6 text-primary" />
            )}
            <span className="font-medium">Sleep een afbeelding hierheen</span>
            <span className="text-xs text-muted-foreground">
              of klik om te bladeren — JPG, PNG of WebP, max. 5 MB
            </span>
            <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary">
              <ImagePlus className="size-3.5" /> Bestand kiezen
            </span>
          </div>
        )}

        {uploading ? (
          <div className="border-t border-border p-2">
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Opladen… {progress}%</p>
          </div>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={UPLOAD_ACCEPT}
        className="hidden"
        onChange={(e) => {
          pick(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
