import { useRef, useState, type DragEvent } from "react";
import { Loader2, UploadCloud } from "lucide-react";
import type { Lang } from "@/lib/portal-types";
import { translate } from "@/lib/portal-i18n";
import { ACCEPTED_IMAGE_TYPES } from "@/lib/media-client";
import { cn } from "@/lib/utils";

type Props = {
  lang: Lang;
  busy?: boolean;
  disabled?: boolean;
  multiple?: boolean;
  compact?: boolean;
  onFiles: (files: File[]) => void;
};

/** Drag-and-drop uploader met klik-fallback. */
export function MediaDropzone({ lang, busy, disabled, multiple = true, compact, onFiles }: Props) {
  const t = (k: string) => translate(k, lang);
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const pick = (list: FileList | null) => {
    if (!list || disabled) return;
    const files = Array.from(list).filter((f) => f.type.startsWith("image/"));
    if (files.length) onFiles(multiple ? files : files.slice(0, 1));
  };

  const onDrop = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    setOver(false);
    pick(e.dataTransfer.files);
  };

  return (
    <button
      type="button"
      disabled={disabled || busy}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      className={cn(
        "flex w-full flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed text-center transition-colors",
        compact ? "px-4 py-4" : "px-6 py-10",
        over ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted/40",
        (disabled || busy) && "cursor-not-allowed opacity-60",
      )}
    >
      {busy ? (
        <Loader2 className="size-6 animate-spin text-primary" />
      ) : (
        <UploadCloud className="size-6 text-primary" />
      )}
      <span className="text-sm font-medium">{t("media.dropHere")}</span>
      <span className="text-xs text-muted-foreground">{t("media.dropHint")}</span>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES}
        multiple={multiple}
        className="sr-only"
        onChange={(e) => {
          pick(e.target.files);
          e.target.value = "";
        }}
      />
    </button>
  );
}
