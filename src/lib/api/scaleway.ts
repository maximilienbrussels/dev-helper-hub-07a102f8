/**
 * Browserzijde van de Scaleway-mediabibliotheek (`/api/media/scaleway/*`).
 */
import { apiFetch } from "./client";

export type MediaObject = {
  key: string;
  name: string;
  url: string;
  size: number;
  lastModified: string | null;
  hash: string;
  folder: string;
};

export type MediaListing = {
  prefix: string;
  folders: string[];
  objects: MediaObject[];
  nextToken: string | null;
};

export type SimilarMatch = MediaObject & { score: number; reason: string };

export function listScalewayMedia(input: { prefix?: string; token?: string | null; limit?: number }) {
  const params = new URLSearchParams();
  if (input.prefix) params.set("prefix", input.prefix);
  if (input.token) params.set("token", input.token);
  if (input.limit) params.set("limit", String(input.limit));
  return apiFetch<MediaListing>(`/api/media/scaleway/list?${params.toString()}`);
}

export function findSimilarScalewayMedia(input: {
  key?: string;
  filename?: string;
  size?: number;
  width?: number | null;
  height?: number | null;
  prefix?: string;
}) {
  return apiFetch<{ matches: SimilarMatch[]; exactDuplicate: SimilarMatch | null }>(
    "/api/media/scaleway/similar",
    { method: "POST", body: input },
  );
}

export function uploadScalewayMedia(input: {
  folder: string;
  filename: string;
  contentType: string;
  dataBase64: string;
}) {
  return apiFetch<{ ok: boolean; object: MediaObject }>("/api/media/scaleway/upload", {
    method: "POST",
    body: input,
  });
}

export function deleteScalewayMedia(keys: string[]) {
  return apiFetch<{ ok: boolean; deleted: number }>("/api/media/scaleway/delete", {
    method: "DELETE",
    body: { keys },
  });
}

/** Leest een bestand als base64 (zonder data-URL-prefix) + afmetingen. */
export async function readFileForUpload(file: File): Promise<{
  filename: string;
  contentType: string;
  dataBase64: string;
  size: number;
  width: number | null;
  height: number | null;
}> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Bestand kon niet gelezen worden."));
    reader.readAsDataURL(file);
  });
  const dims = await new Promise<{ width: number | null; height: number | null }>((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth || null, height: img.naturalHeight || null });
    img.onerror = () => resolve({ width: null, height: null });
    img.src = dataUrl;
  });
  return {
    filename: file.name,
    contentType: file.type || "image/jpeg",
    dataBase64: dataUrl.slice(dataUrl.indexOf(",") + 1),
    size: file.size,
    ...dims,
  };
}
