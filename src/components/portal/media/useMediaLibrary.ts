/**
 * Gedeelde data-laag voor MediaPage en ImagePickerModal:
 * lijst + upload/vervang/metadata/verwijder-mutaties met cache-invalidatie.
 */
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  deleteMedia,
  listMedia,
  replaceMedia,
  updateMediaMeta,
  uploadMedia,
  type MediaAsset,
  type MediaCategory,
} from "@/lib/media.functions";
import { prepareUpload, titleFromFilename } from "@/lib/media-client";

export const MEDIA_QUERY_KEY = ["portal", "media"] as const;

export type MediaSort = "newest" | "oldest" | "name" | "size";

export function useMediaLibrary() {
  const queryClient = useQueryClient();
  const list = useServerFn(listMedia);
  const upload = useServerFn(uploadMedia);
  const replace = useServerFn(replaceMedia);
  const updateMeta = useServerFn(updateMediaMeta);
  const remove = useServerFn(deleteMedia);

  const query = useQuery<MediaAsset[]>({
    queryKey: MEDIA_QUERY_KEY,
    queryFn: () => list(),
    staleTime: 30_000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: MEDIA_QUERY_KEY });

  const uploadMutation = useMutation({
    mutationFn: async (input: { files: File[]; category: MediaCategory }) => {
      const results: MediaAsset[] = [];
      for (const file of input.files) {
        const prepared = await prepareUpload(file);
        const asset = await upload({
          data: {
            ...prepared,
            category: input.category,
            title: titleFromFilename(prepared.filename),
            description: "",
            altText: "",
          },
        });
        results.push(asset);
      }
      return results;
    },
    onSuccess: () => void invalidate(),
    onError: (e: Error) => toast.error(e.message),
  });

  const replaceMutation = useMutation({
    mutationFn: async (input: { id: string; file: File }) => {
      const prepared = await prepareUpload(input.file);
      return replace({ data: { id: input.id, ...prepared } });
    },
    onSuccess: (asset) => {
      queryClient.setQueryData<MediaAsset[]>(MEDIA_QUERY_KEY, (old) =>
        old ? old.map((a) => (a.id === asset.id ? asset : a)) : old,
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const metaMutation = useMutation({
    mutationFn: (input: {
      id: string;
      title: string;
      description: string;
      altText: string;
      category: MediaCategory;
    }) => updateMeta({ data: input }),
    onSuccess: (asset) => {
      queryClient.setQueryData<MediaAsset[]>(MEDIA_QUERY_KEY, (old) =>
        old ? old.map((a) => (a.id === asset.id ? asset : a)) : old,
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: (_r, id) => {
      queryClient.setQueryData<MediaAsset[]>(MEDIA_QUERY_KEY, (old) =>
        old ? old.filter((a) => a.id !== id) : old,
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    query,
    assets: query.data ?? [],
    uploadMutation,
    replaceMutation,
    metaMutation,
    deleteMutation,
  };
}

/** Zoek-, filter- en sorteerstatus met afgeleide lijst. */
export function useMediaFilter(assets: MediaAsset[]) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<MediaCategory | "all">("all");
  const [sort, setSort] = useState<MediaSort>("newest");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const items = assets.filter((a) => {
      if (category !== "all" && a.category !== category) return false;
      if (!q) return true;
      return [a.title, a.filename, a.altText, a.description].some((v) =>
        v.toLowerCase().includes(q),
      );
    });
    const sorted = [...items];
    switch (sort) {
      case "oldest":
        sorted.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        break;
      case "name":
        sorted.sort((a, b) => (a.title || a.filename).localeCompare(b.title || b.filename));
        break;
      case "size":
        sorted.sort((a, b) => b.byteSize - a.byteSize);
        break;
      default:
        sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    return sorted;
  }, [assets, search, category, sort]);

  return { search, setSearch, category, setCategory, sort, setSort, filtered };
}
