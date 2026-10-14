import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { fetchRights, type Permission, type RightsSnapshot } from "./rights.functions";

/** Rechten van de ingelogde medewerker, afgeleid uit de rechtenmatrix. */
export function usePermissions() {
  const load = useServerFn(fetchRights);
  const query = useQuery<RightsSnapshot>({
    queryKey: ["portal", "rights"],
    queryFn: () => load(),
    staleTime: 60_000,
  });
  const can = (permission: Permission) => Boolean(query.data?.myPermissions.includes(permission));
  return { ...query, can };
}
