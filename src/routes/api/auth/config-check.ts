import { createFileRoute } from "@tanstack/react-router";

/**
 * GET /api/auth/config-check — interne gezondheidscontrole voor beheerders.
 *
 * Geeft nooit secretwaarden terug: enkel of de sleutels bestaan, of de
 * Neon-database antwoordt en of de OAuth-redirect-URI's bij dit host-adres
 * passen. Enkel bereikbaar met een geldige beheerderssessie, of met de header
 * `x-config-check-token` gelijk aan `CONFIG_CHECK_TOKEN`.
 */
const REQUIRED_SECRETS: Record<string, string[]> = {
  JWT_SECRET: ["JWT_SECRET", "AUTH_JWT_SECRET"],
  DATABASE_URL: ["NEON_DATABASE_URL", "DATABASE_URL"],
  GOOGLE_CLIENT_ID: ["GOOGLE_CLIENT_ID"],
  GOOGLE_CLIENT_SECRET: ["GOOGLE_CLIENT_SECRET"],
  GITHUB_CLIENT_ID: ["GITHUB_CLIENT_ID"],
  GITHUB_CLIENT_SECRET: ["GITHUB_CLIENT_SECRET"],
  BREVO_API_KEY: ["BREVO_API_KEY"],
  STRIPE_SECRET_KEY: ["STRIPE_SECRET_KEY"],
};

async function isAdminRequest(request: Request): Promise<boolean> {
  const token = process.env["CONFIG_CHECK_TOKEN"];
  if (token && request.headers.get("x-config-check-token") === token) return true;

  // Bearer-sessie (portaal) → dezelfde centrale rechtencontrole als elke andere route.
  if (request.headers.get("authorization")?.startsWith("Bearer ")) {
    const { guardApiRoute } = await import("@/lib/route-permission.server");
    const guard = await guardApiRoute(request, "manage_settings");
    return !("response" in guard);
  }

  // Cookie-sessie (OAuth-login) → zelfde controle op basis van de sessieclaims.
  try {
    const { SESSION_COOKIE, readCookie } = await import("@/lib/google-oauth.server");
    const cookie = readCookie(request, SESSION_COOKIE);
    if (!cookie) return false;
    const { verifySession } = await import("@/lib/local-auth.server");
    const claims = await verifySession(cookie);
    const { hasPermission } = await import("@/lib/permission-core.server");
    return hasPermission({ userId: String(claims.sub ?? ""), claims }, "manage_settings");
  } catch {
    return false;
  }
}

export const Route = createFileRoute("/api/auth/config-check")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const json = (body: unknown, status: number) =>
          new Response(JSON.stringify(body, null, 2), {
            status,
            headers: {
              "content-type": "application/json; charset=utf-8",
              "cache-control": "no-store",
            },
          });

        if (!(await isAdminRequest(request))) {
          return json({ status: "unauthorized" }, 401);
        }

        const secrets: Record<string, boolean> = {};
        const missing: string[] = [];
        for (const [label, names] of Object.entries(REQUIRED_SECRETS)) {
          const present = names.some((name) => Boolean(process.env[name]));
          secrets[label] = present;
          if (!present) missing.push(label);
        }

        // Let op: zonder connection string geeft de stub-client lege arrays
        // terug zonder te falen. Daarom eerst expliciet checken of er een
        // databank ingesteld is, anders zou "db: true" een storing verbergen.
        let db = false;
        let dbError: string | undefined;
        try {
          const { db: sql, hasDatabase } = await import("@/lib/neon.server");
          if (!hasDatabase()) {
            dbError = "Geen databank ingesteld (DATABASE_URL / NEON_DATABASE_URL ontbreekt).";
          } else {
            await sql()`select 1`;
            db = true;
          }
        } catch (error) {
          dbError = error instanceof Error ? error.message : String(error);
        }

        // Mailverzending: Brevo-sleutel of volledige SMTP-instellingen.
        let mailReady = false;
        let mailTransport: "brevo" | "smtp" | null = null;
        let mailError: string | undefined;
        try {
          const { brevoApiKey } = await import("@/lib/brevo-override.server");
          const { smtpConfigStatus } = await import("@/lib/smtp.server");
          const smtp = await smtpConfigStatus();
          if (brevoApiKey()) {
            mailReady = true;
            mailTransport = "brevo";
          } else if (smtp.complete) {
            mailReady = true;
            mailTransport = "smtp";
          } else {
            mailError = "Geen BREVO_API_KEY en geen volledige SMTP-instellingen.";
          }
        } catch (error) {
          mailError = error instanceof Error ? error.message : String(error);
        }

        const { checkAuthConfig } = await import("@/lib/auth-config");
        const { siteOrigin } = await import("@/lib/google-oauth.server");
        const oauth = checkAuthConfig(siteOrigin(request));

        const ok = db && mailReady && missing.length === 0 && oauth.warnings.length === 0;
        if (!ok) {
          console.error("[Config Check]", { missing, dbError, mailError, warnings: oauth.warnings });
        }

        return json(
          {
            status: ok ? "ok" : "error",
            db,
            ...(dbError ? { db_error: dbError } : {}),
            mail: { ready: mailReady, transport: mailTransport },
            ...(mailError ? { mail_error: mailError } : {}),
            secrets_present: missing.length === 0,
            secrets,
            ...(missing.length ? { missing_keys: missing } : {}),
            oauth: {
              origin: oauth.origin,
              host_registered: oauth.hostRegistered,
              providers: oauth.providers,
              warnings: oauth.warnings,
            },
          },
          ok ? 200 : 500,
        );
      },
    },
  },
});
