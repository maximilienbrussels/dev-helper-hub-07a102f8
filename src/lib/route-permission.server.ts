/**
 * Gedeelde sessie- én rechtencontrole voor `/api/...`-routes (server-only).
 *
 * Belangrijk: alleen een echte rechtenweigering geeft 403. Andere fouten
 * (databaseverbinding, ontbrekende tabel, onverwachte fout) geven 500 mét de
 * echte foutmelding, zodat de oorzaak zichtbaar is in plaats van verstopt
 * achter een misleidende "Forbidden".
 */

export type RouteGuardAuth = {
  userId: string;
  email: string | null;
  token: string;
  claims: { sub?: string; email?: string };
};

export async function guardApiRoute(
  request: Request,
  permission: string,
): Promise<{ auth: RouteGuardAuth } | { response: Response }> {
  return guardApiRouteAny(request, [permission]);
}

/** Zoals `guardApiRoute`, maar één van de opgegeven rechten volstaat. */
export async function guardApiRouteAny(
  request: Request,
  permissions: readonly string[],
): Promise<{ auth: RouteGuardAuth } | { response: Response }> {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    return {
      response: Response.json(
        { error: "Niet aangemeld. Log opnieuw in.", code: "unauthenticated" },
        { status: 401 },
      ),
    };
  }
  const token = header.slice(7).trim();

  let claims: { sub?: string; email?: string };
  try {
    const { verifyAuthToken } = await import("@/lib/neon-data.server");
    claims = (await verifyAuthToken(token)) as never;
  } catch {
    return {
      response: Response.json(
        { error: "Je sessie is verlopen. Log opnieuw in.", code: "session_expired" },
        { status: 401 },
      ),
    };
  }

  const userId = String(claims.sub ?? "");
  const { assertAnyPermission, isPermissionDenied, resolveAccess } = await import(
    "@/lib/permission-core.server"
  );
  try {
    await assertAnyPermission({ userId, claims }, [...permissions]);
  } catch (error) {
    if (isPermissionDenied(error)) {
      // Geef mee welke rollen de server zag, zodat de melding meteen bruikbaar is.
      let roles: string[] = [];
      let email: string | null = null;
      try {
        const access = await resolveAccess({ userId, claims });
        roles = access.roles;
        email = access.email;
      } catch {
        /* diagnose is best-effort */
      }
      return {
        response: Response.json(
          {
            error: `Je hebt geen rechten voor deze actie (${email ?? "onbekend adres"}, rollen: ${
              roles.length ? roles.join(", ") : "geen"
            }).`,
            code: "permission_denied",
            roles,
            email,
            required: permissions,
          },
          { status: 403 },
        ),
      };
    }
    const message = error instanceof Error ? error.message : "Onbekende fout";
    console.error("[api] rechtencontrole mislukt:", message);
    return {
      response: Response.json(
        { error: `Rechtencontrole mislukt: ${message}`, code: "permission_check_failed" },
        { status: 500 },
      ),
    };
  }

  return { auth: { userId, email: claims.email ?? null, token, claims } };
}
