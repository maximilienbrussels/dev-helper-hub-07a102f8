/**
 * Data-laag voor het "Berichten"-tabblad: verborgen externe berichten +
 * eigen berichten (CRUD), met cache-invalidatie.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  createSocialPost,
  deleteSocialPost,
  hardDeleteBlueskyPost,
  hideSocialPost,
  listHiddenSocialPosts,
  listSocialPosts,
  unhideSocialPost,
  updateSocialPost,
  type HiddenPost,
  type SocialPost,
} from "@/lib/social-admin.functions";
import { clearBlueskyCache } from "@/lib/bluesky";

export const HIDDEN_QUERY_KEY = ["portal", "social", "hidden"] as const;
export const POSTS_QUERY_KEY = ["portal", "social", "posts"] as const;

export function useHiddenPosts() {
  const queryClient = useQueryClient();
  const list = useServerFn(listHiddenSocialPosts);
  const hide = useServerFn(hideSocialPost);
  const unhide = useServerFn(unhideSocialPost);

  const query = useQuery<HiddenPost[]>({
    queryKey: HIDDEN_QUERY_KEY,
    queryFn: () => list(),
    staleTime: 15_000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: HIDDEN_QUERY_KEY });

  const hideMutation = useMutation({
    mutationFn: (input: { platform: string; postId: string; reden?: string }) =>
      hide({ data: { platform: input.platform, postId: input.postId, reden: input.reden ?? "" } }),
    onSuccess: () => void invalidate(),
    onError: (e: Error) => toast.error(e.message),
  });

  const unhideMutation = useMutation({
    mutationFn: (input: { platform: string; postId: string }) => unhide({ data: input }),
    onSuccess: () => void invalidate(),
    onError: (e: Error) => toast.error(e.message),
  });

  const hardDelete = useServerFn(hardDeleteBlueskyPost);
  const hardDeleteMutation = useMutation({
    mutationFn: (postUri: string) => hardDelete({ data: { postUri } }),
    onSuccess: () => {
      clearBlueskyCache();
      void invalidate();
      void queryClient.invalidateQueries({ queryKey: ["bluesky"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    hidden: query.data ?? [],
    isLoading: query.isLoading,
    hideMutation,
    unhideMutation,
    hardDeleteMutation,
    isHidden: (platform: string, postId: string) =>
      (query.data ?? []).some((h) => h.platform === platform && h.postId === postId),
  };
}

export function useSocialPosts() {
  const queryClient = useQueryClient();
  const list = useServerFn(listSocialPosts);
  const create = useServerFn(createSocialPost);
  const update = useServerFn(updateSocialPost);
  const remove = useServerFn(deleteSocialPost);

  const query = useQuery<SocialPost[]>({
    queryKey: POSTS_QUERY_KEY,
    queryFn: () => list(),
    staleTime: 15_000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: POSTS_QUERY_KEY });

  const createMutation = useMutation({
    mutationFn: (input: Omit<SocialPost, "id" | "platform" | "createdAt" | "updatedAt">) =>
      create({
        data: {
          tekstNl: input.tekstNl,
          tekstFr: input.tekstFr,
          tekstEn: input.tekstEn,
          mediaUrl: input.mediaUrl,
          mediaId: input.mediaId,
          link: input.link,
          gepubliceerdOp: input.gepubliceerdOp,
          actief: input.actief,
        },
      }),
    onSuccess: () => void invalidate(),
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: (input: Omit<SocialPost, "platform" | "createdAt" | "updatedAt">) =>
      update({
        data: {
          id: input.id,
          tekstNl: input.tekstNl,
          tekstFr: input.tekstFr,
          tekstEn: input.tekstEn,
          mediaUrl: input.mediaUrl,
          mediaId: input.mediaId,
          link: input.link,
          gepubliceerdOp: input.gepubliceerdOp,
          actief: input.actief,
        },
      }),
    onSuccess: () => void invalidate(),
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => void invalidate(),
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    posts: query.data ?? [],
    isLoading: query.isLoading,
    createMutation,
    updateMutation,
    deleteMutation,
  };
}
