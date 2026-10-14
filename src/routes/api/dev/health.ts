/**
 * Live diagnose van de Neon-databank: /api/dev/health
 *
 * Voert échte SQL uit tegen `DATABASE_URL`, controleert de aanwezigheid van de
 * tabellen die het portaal nodig heeft, leest de kolomnamen van
 * `portal_admins` en `user_roles`, en verifieert of de superadmin bestaat.
 * Geeft nooit secretwaarden terug — enkel of ze aanwezig zijn.
 */
import { createFileRoute } from "@tanstack/react-router";

const REQUIRED_TABLES = [
  "portal_admins",
  "user_roles",
  "role_permissions",
  "media_assets",
  "profiles",
  "webauthn_credentials",
] as const;

const SUPERADMIN = "desk@delplanche.cloud";

type TableRow = { table_schema: string; table_name: string };
type ColumnRow = { table_name: string; column_name: string; data_type: string };

export const Route = createFileRoute("/api/dev/health")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { requireRouteAdmin } = await import("@/lib/route-auth.server");
        const guard = await requireRouteAdmin(request);
        if ("response" in guard) return guard.response;
        const env = process.env;
        const secrets = {
          DATABASE_URL: Boolean(env["DATABASE_URL"]),
          DATABASE_URL_POOLED: Boolean(env["DATABASE_URL_POOLED"]),
          NEON_AUTH_BASE_URL: Boolean(env["NEON_AUTH_BASE_URL"]),
          BREVO_API_KEY: Boolean(env["BREVO_API_KEY"]),
        };
        const missingSecrets = Object.entries(secrets)
          .filter(([, present]) => !present)
          .map(([name]) => name);

        const { db, hasDatabase } = await import("@/lib/neon.server");
        if (!hasDatabase()) {
          return json({
            connection: "FAILED",
            error: "Geen DATABASE_URL gevonden in de projectsecrets.",
            secrets,
            missingSecrets,
          });
        }

        try {
          const sql = db();
          const tableRows = (await sql`
            select table_schema, table_name
            from information_schema.tables
            where table_schema in ('public', 'auth')
          `) as unknown as TableRow[];
          const present = new Set(tableRows.map((r) => r.table_name));

          const columnRows = (await sql`
            select table_name, column_name, data_type
            from information_schema.columns
            where table_schema = 'public'
              and table_name in ('portal_admins', 'user_roles', 'role_permissions')
            order by table_name, ordinal_position
          `) as unknown as ColumnRow[];

          const columns: Record<string, string[]> = {};
          for (const row of columnRows) {
            (columns[row.table_name] ??= []).push(`${row.column_name}:${row.data_type}`);
          }

          const adminRows = (await sql`
            select email, role, active from portal_admins where lower(email) = ${SUPERADMIN}
          `) as unknown as { email: string; role: string; active: boolean }[];

          const roleRows = (await sql`
            select r.role
            from user_roles r
            join profiles p on p.id = r.user_id
            where lower(p.email) = ${SUPERADMIN}
          `) as unknown as { role: string }[];

          const mediaPerms = (await sql`
            select role, permission, allowed
            from role_permissions
            where permission in ('view_media', 'manage_media')
            order by role, permission
          `) as unknown as { role: string; permission: string; allowed: boolean }[];

          return json({
            connection: "SUCCESS",
            tables: {
              verified: REQUIRED_TABLES.filter((t) => present.has(t)),
              missing: REQUIRED_TABLES.filter((t) => !present.has(t)),
              authUsersTable: present.has("users") ? "auth.users aanwezig" : "geen auth.users (Neon Auth beheert gebruikers extern; profiles is de bron)",
            },
            columns,
            superadmin: {
              email: SUPERADMIN,
              inPortalAdmins: adminRows.length > 0,
              portalAdminRow: adminRows[0] ?? null,
              rolesInUserRoles: roleRows.map((r) => r.role),
              note:
                roleRows.length === 0
                  ? "Nog geen profielrij: de rol super_admin wordt automatisch toegekend bij de eerste aanmelding (trigger profiles_grant_superadmin)."
                  : undefined,
            },
            mediaPermissions: mediaPerms,
            secrets,
            missingSecrets,
          });
        } catch (err) {
          return json({
            connection: "FAILED",
            error: err instanceof Error ? err.message : String(err),
            secrets,
            missingSecrets,
          });
        }
      },
    },
  },
});

function json(body: unknown) {
  return new Response(JSON.stringify(body, null, 2), {
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}
