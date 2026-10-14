/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Server-only Neon Data API-client (PostgREST) die namens de ingelogde
 * gebruiker query't: RLS blijft dus gelden, exact zoals voorheen.
 *
 * De token komt uit de Authorization-header van de serverFn-aanvraag
 * (gezet door `attachAuthToken` in src/lib/auth-token-attacher.ts).
 */
import { createClient } from "@neondatabase/neon-js";

import type { DataClient } from "./db-types";
import { DEFAULT_NEON_AUTH_URL } from "./neon-auth-url";

/** Auth-basis-URL van Neon Auth (server-side variant met VITE-fallback). */
export function neonAuthUrl(): string {
  return (
    process.env["NEON_AUTH_URL"] ||
    (import.meta.env["VITE_NEON_AUTH_URL"] as string | undefined) ||
    DEFAULT_NEON_AUTH_URL
  ).replace(/\/+$/, "");
}

/** Data API-URL; afgeleid uit de auth-URL wanneer niet expliciet gezet. */
export function neonDataApiUrl(): string {
  const explicit =
    process.env["NEON_DATA_API_URL"] ||
    (import.meta.env["VITE_NEON_DATA_API_URL"] as string | undefined);
  if (explicit) return explicit.replace(/\/+$/, "");
  const auth = neonAuthUrl();
  return auth.replace(".neonauth.", ".apirest.").replace(/\/auth$/, "/rest/v1");
}

/** Data API-client met een vaste bearer token (gebruiker of anoniem). */
export function dataApiClient(token: string | null): DataClient {
  return createClient({
    dataApi: {
      url: neonDataApiUrl(),
      getToken: async () => token ?? "",
    },
  } as any) as unknown as DataClient;
}

export type AuthClaims = { sub: string; email?: string; [key: string]: unknown };

/**
 * Valideert de sessietoken. De token is door onszelf ondertekend (HS256);
 * lukt die controle niet, dan is de gebruiker niet aangemeld.
 */
export async function verifyAuthToken(token: string): Promise<AuthClaims> {
  const { verifySession } = await import("./local-auth.server");
  try {
    return (await verifySession(token)) as AuthClaims;
  } catch {
    throw new Error("Je sessie is verlopen. Log opnieuw in.");
  }
}

