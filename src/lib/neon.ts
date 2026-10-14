import { createClient } from "@neondatabase/neon-js";
import { DEFAULT_NEON_AUTH_URL } from "./neon-auth-url";
import { readSessionToken } from "./neon-auth-compat";

/**
 * Enkel nog de Data API. Authenticatie gebeurt volledig in eigen beheer
 * (Postgres + bcrypt + JWT, zie local-auth.server.ts): er is géén externe
 * auth-provider meer.
 */
export const NEON_AUTH_URL: string =
  (import.meta.env["VITE_NEON_AUTH_URL"] as string | undefined) ?? DEFAULT_NEON_AUTH_URL;

export const NEON_DATA_API_URL: string =
  (import.meta.env["VITE_NEON_DATA_API_URL"] as string | undefined) ??
  NEON_AUTH_URL.replace(".neonauth.", ".apirest.").replace(/\/auth\/?$/, "/rest/v1");

type NeonClient = ReturnType<typeof createClient>;

let instance: NeonClient | null = null;

/**
 * De client wordt LAZY gebouwd: de Worker-runtime verbiedt async I/O en random
 * waarden in global scope.
 */
export function getNeonClient(): NeonClient {
  if (!instance) {
    instance = createClient({
      dataApi: {
        url: NEON_DATA_API_URL,
        // De Data API krijgt onze eigen sessietoken mee wanneer die er is.
        getToken: async () => {
          if (typeof window === "undefined") return "";
          return readSessionToken() ?? "";
        },
      },
    } as unknown as Parameters<typeof createClient>[0]);
  }
  return instance;
}
