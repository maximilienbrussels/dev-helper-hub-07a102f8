import { createMiddleware } from "@tanstack/react-start";
import { readSessionToken } from "@/lib/neon-auth-compat";

/**
 * Voegt (indien beschikbaar) onze eigen sessietoken toe aan serverFn-RPC's.
 * Zonder sessie gaat het verzoek gewoon zonder Authorization-header door.
 */
export const attachAuthToken = createMiddleware({ type: "function" }).client(async ({ next }) => {
  const token = typeof window === "undefined" ? null : readSessionToken();
  return next({ headers: token ? { Authorization: `Bearer ${token}` } : {} });
});
