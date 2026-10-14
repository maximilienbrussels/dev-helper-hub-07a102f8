import { useQuery } from "@tanstack/react-query";

import { fetchSiteConfig } from "@/lib/site-admin.functions";
import {
  DEFAULT_SITE_CONFIG,
  isFeatureEnabled,
  isPageAvailable,
  type FeatureKey,
  type SiteConfig,
} from "@/lib/site-config";

export const siteConfigQuery = {
  queryKey: ["site-config"] as const,
  queryFn: () => fetchSiteConfig(),
  staleTime: 60_000,
};

/** Siteconfiguratie voor de publieke site (met open vangnet). */
export function useSiteConfig(): SiteConfig {
  const { data } = useQuery(siteConfigQuery);
  return data ?? DEFAULT_SITE_CONFIG;
}

/** Staat deze module aan? Onbekend of geen databank = aan. */
export function useFeature(key: FeatureKey): boolean {
  return isFeatureEnabled(useSiteConfig(), key);
}

/** Is deze publieke pagina momenteel bereikbaar? */
export function usePageAvailable(key: string): boolean {
  return isPageAvailable(useSiteConfig(), key);
}

/** Centrale contactgegevens (adres, telefoon, e-mail, socials). */
export function useSiteContact() {
  return useSiteConfig().contact;
}
