/**
 * Welke inlogmethodes zijn nú aan het actieve account gekoppeld?
 *
 * De bron is de sessie op de server (Neon Auth): daar staat per gebruiker
 * welke aanbieders (Google, GitHub, Mastodon) gekoppeld zijn en of er een
 * wachtwoord is ingesteld. Zo klopt de status meteen na een Google-login.
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getMyIdentities,
  type IdentityProviderId,
  type MyIdentities,
} from "@/lib/identities.functions";

export const AUTH_IDENTITIES_KEY = ["my-identities"] as const;

export function useAuthIdentities() {
  const qc = useQueryClient();
  const query = useQuery<MyIdentities>({
    queryKey: AUTH_IDENTITIES_KEY,
    queryFn: () => getMyIdentities(),
    staleTime: 30_000,
  });

  const providers = query.data?.providers ?? [];
  const linked = new Set<IdentityProviderId>(providers);

  return {
    ...query,
    email: query.data?.email ?? null,
    hasPassword: Boolean(query.data?.hasPassword),
    linkedProviders: providers,
    /** Is deze aanbieder gekoppeld aan het actieve account? */
    isLinked: (provider: IdentityProviderId) => linked.has(provider),
    /**
     * Ontkoppelen mag nooit de laatste inlogmethode weghalen: anders raakt de
     * bezoeker buitengesloten.
     */
    canUnlink: (provider: IdentityProviderId) =>
      Boolean(query.data?.hasPassword) || linked.size > 1 || !linked.has(provider),
    refreshIdentities: () => qc.invalidateQueries({ queryKey: AUTH_IDENTITIES_KEY }),
  };
}
