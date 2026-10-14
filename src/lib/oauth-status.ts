/**
 * Browser-helper: welke sociale inlogmethodes zijn effectief geconfigureerd?
 * Zo tonen we nooit een knop die enkel tot een foutmelding leidt.
 */
import { useEffect, useState } from "react";
import type { OAuthProvider } from "@/components/auth/oauth-providers";

export type ProviderState = {
  id: OAuthProvider;
  configured: boolean;
  missing: string[];
  startPath: string;
  callbackUrl: string;
};

export type ProvidersReport = {
  origin: string;
  database: boolean;
  providers: ProviderState[];
};

export async function fetchProviderStatus(): Promise<ProvidersReport | null> {
  try {
    const res = await fetch("/api/auth/providers", { headers: { accept: "application/json" } });
    if (!res.ok) return null;
    return (await res.json()) as ProvidersReport;
  } catch {
    return null;
  }
}

/** Lijst met bruikbare providers (leeg tot de status geladen is). */
export function useConfiguredProviders(): {
  ready: boolean;
  available: OAuthProvider[];
  report: ProvidersReport | null;
} {
  const [report, setReport] = useState<ProvidersReport | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    void fetchProviderStatus().then((r) => {
      if (!active) return;
      setReport(r);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  return {
    ready,
    report,
    available: (report?.providers ?? []).filter((p) => p.configured).map((p) => p.id),
  };
}

/** Start de echte serverflow (client secrets blijven op de server). */
export function startOAuth(
  provider: OAuthProvider,
  next: string,
  instance?: string,
  options?: { link?: boolean },
) {
  const params = new URLSearchParams({
    next: next.startsWith("/") ? next : "/account",
  });
  // Koppelmodus: hang de aanbieder aan het al aangemelde account.
  if (options?.link) params.set("link", "1");
  // Mastodon is federatief: het gekozen domein bepaalt waar we heen sturen.
  if (instance) params.set("instance", instance);
  // Eén gedeelde ingang; de server kiest de juiste aanbiederflow.
  window.location.assign(`/api/auth/login/${provider}?${params.toString()}`);
}
