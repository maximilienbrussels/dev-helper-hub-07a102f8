/**
 * Browser-helpers voor uploads naar de Europese Scaleway-bucket.
 * De bytes gaan rechtstreeks van de browser naar Scaleway (pre-signed PUT).
 */
import { neonSupabaseCompat as supabase } from "@/lib/neon-auth-compat";

export const UPLOAD_ACCEPT = "image/jpeg,image/png,image/webp,image/avif";
export const UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
const MAX_WIDTH = 1920;

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }) as never);
  const token = data?.session?.access_token;
  return {
    "content-type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/** Verkleint een beeld tot max. 1920 px breed (JPEG/PNG/WebP; SVG en GIF blijven ongemoeid). */
export async function compressImage(file: File): Promise<File> {
  if (typeof window === "undefined") return file;
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return file;
  try {
    const bitmap = await createImageBitmap(file);
    if (bitmap.width <= MAX_WIDTH) return file;
    const scale = MAX_WIDTH / bitmap.width;
    const canvas = document.createElement("canvas");
    canvas.width = MAX_WIDTH;
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.85),
    );
    if (!blob) return file;
    const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
    return new File([blob], name, { type: "image/webp" });
  } catch {
    return file;
  }
}

export type UploadResult = { publicUrl: string; fileKey: string };

/** Vraagt een pre-signed URL en uploadt met voortgang. */
export async function uploadToStorage(
  file: File,
  folder: string,
  onProgress?: (percent: number) => void,
): Promise<UploadResult> {
  if (file.size > UPLOAD_MAX_BYTES) {
    throw new Error("Dit bestand is groter dan 5 MB.");
  }
  const prepared = await compressImage(file);

  const res = await fetch("/api/storage/upload-url", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ fileName: prepared.name, fileType: prepared.type, folder }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload voorbereiden mislukt [${res.status}]: ${text}`);
  }
  const { uploadUrl, fileKey, publicUrl, headers } = (await res.json()) as {
    uploadUrl: string;
    fileKey: string;
    publicUrl: string;
    headers?: Record<string, string>;
  };

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    // Exact dezelfde headers als bij het ondertekenen, anders faalt de handtekening.
    const putHeaders = headers ?? { "content-type": prepared.type };
    for (const [k, v] of Object.entries(putHeaders)) xhr.setRequestHeader(k, v);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Upload naar opslag mislukt [${xhr.status}]`));
    xhr.onerror = () => reject(new Error("Upload naar opslag mislukt (netwerkfout)."));
    xhr.send(prepared);
  });

  onProgress?.(100);
  return { publicUrl, fileKey };
}

/** Verwijdert een bestand uit de bucket op basis van zijn publieke URL. */
export async function deleteFromStorage(publicUrl: string): Promise<void> {
  const res = await fetch("/api/storage/delete", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ publicUrl }),
  });
  if (!res.ok) throw new Error(`Verwijderen mislukt [${res.status}]: ${await res.text()}`);
}

/** True voor URL's die in onze eigen mediabucket staan. */
export function isStorageUrl(url: string | null | undefined): boolean {
  return Boolean(url && /\.scw\.cloud\//.test(url));
}
