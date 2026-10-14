/**
 * Browser-helpers voor de mediabibliotheek: bestand → base64 + afmetingen.
 * Wordt gedeeld door MediaPage en ImagePickerModal.
 */
import { MEDIA_MAX_BYTES } from "./media.functions";

export type PreparedUpload = {
  filename: string;
  mimeType: string;
  dataBase64: string;
  width: number | null;
  height: number | null;
};

export const ACCEPTED_IMAGE_TYPES =
  "image/jpeg,image/png,image/webp,image/gif,image/avif,image/svg+xml";

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Bestand kon niet gelezen worden."));
    reader.readAsDataURL(file);
  });
}

function readDimensions(file: File): Promise<{ width: number | null; height: number | null }> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !file.type.startsWith("image/")) {
      resolve({ width: null, height: null });
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth || null,
        height: img.naturalHeight || null,
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ width: null, height: null });
    };
    img.src = url;
  });
}

/** Valideert en zet een File om naar het payload-formaat van uploadMedia/replaceMedia. */
export async function prepareUpload(file: File): Promise<PreparedUpload> {
  if (!file.type.startsWith("image/")) {
    throw new Error(`"${file.name}" is geen afbeelding.`);
  }
  if (file.size > MEDIA_MAX_BYTES) {
    throw new Error(`"${file.name}" is groter dan 8 MB.`);
  }
  const [dataUrl, dims] = await Promise.all([readAsDataUrl(file), readDimensions(file)]);
  const comma = dataUrl.indexOf(",");
  return {
    filename: file.name.slice(0, 200),
    mimeType: file.type,
    dataBase64: comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl,
    width: dims.width,
    height: dims.height,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} kB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Absolute URL van een asset (handig om te kopiëren naar externe tools). */
export function absoluteMediaUrl(relative: string): string {
  if (typeof window === "undefined") return relative;
  return new URL(relative, window.location.origin).toString();
}

/** Naam zonder extensie als voorstel voor de titel. */
export function titleFromFilename(filename: string): string {
  return filename
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[-_]+/g, " ")
    .trim();
}
