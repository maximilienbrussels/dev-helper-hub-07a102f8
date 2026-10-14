/**
 * Publieke kant van het "verbergen"-beheer: haalt de lijst met verborgen
 * (platform, post_id)-combinaties op en biedt een filterhulp.
 */
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { fetchHiddenSocialIds } from "@/lib/social-admin.functions";

export function useHiddenSocialIds(platform: string) {
  const fetchIds = useServerFn(fetchHiddenSocialIds);
  const query = useQuery({
    queryKey: ["social", "hidden-ids"],
    queryFn: () => fetchIds(),
    staleTime: 60_000,
    retry: 1,
  });

  const set = new Set(
    (query.data ?? []).filter((h) => h.platform === platform).map((h) => h.postId),
  );

  return {
    isHidden: (postId: string) => set.has(postId),
    /** Filtert een lijst berichten op basis van een ID-selector. */
    filter: <T,>(items: T[], id: (item: T) => string) => items.filter((i) => !set.has(id(i))),
    isLoading: query.isLoading,
  };
}
