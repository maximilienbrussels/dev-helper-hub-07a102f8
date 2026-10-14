import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

/**
 * Vereist een ingelogde gebruiker voor een server function.
 *
 * De token is een door onszelf ondertekende JWT (zie local-auth.server.ts).
 * Zet in de context:
 *  - `supabase`: Data API-client met dezelfde token (voor bestaande queries);
 *  - `userId` en `claims`: identiteit uit de gevalideerde token.
 */
export const requireAuth = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const request = getRequest();
  const header = request?.headers?.get("authorization");
  if (!header || !header.startsWith("Bearer ")) {
    throw new Error("Je bent niet (meer) aangemeld. Log opnieuw in.");
  }
  const token = header.slice("Bearer ".length).trim();
  if (!token) throw new Error("Je bent niet (meer) aangemeld. Log opnieuw in.");

  const { verifyAuthToken, dataApiClient } = await import("./neon-data.server");
  const claims = await verifyAuthToken(token);

  return next({
    context: {
      supabase: dataApiClient(token),
      userId: String(claims.sub),
      claims,
    },
  });
});
