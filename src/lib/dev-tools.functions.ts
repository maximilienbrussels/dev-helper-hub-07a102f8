/**
 * Server functions voor de Dev Tools-modal (alleen preview/lokaal).
 * Geeft nooit secretwaarden terug — enkel aanwezigheid en diagnostiek.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-middleware";
import { requirePermission } from "@/lib/portal-permissions";

const REQUIRED_TABLES = [
  "portal_admins",
  "user_roles",
  "role_permissions",
  "media_assets",
  "profiles",
  "webauthn_credentials",
] as const;

const SUPERADMIN = "desk@delplanche.cloud";

async function guardPreview() {
  const { isPreviewEnvironment } = await import("./auth-email.server");
  if (!(await isPreviewEnvironment())) {
    throw new Response("Not found", { status: 404 });
  }
}

export type DevStatus = {
  preview: boolean;
  secrets: { key: string; present: boolean; source: "secret" | "override" | "missing" }[];
  database: {
    connection: "SUCCESS" | "FAILED";
    error?: string;
    tablesPresent: string[];
    tablesMissing: string[];
    superadminInPortalAdmins: boolean;
    superadminRoles: string[];
  };
  migrations: string[];
};

export const getDevStatus = createServerFn({ method: "GET" }).handler(async (): Promise<DevStatus> => {
  await guardPreview();
  const { devSecretStatus } = await import("./dev-secrets.server");
  const { migrationFiles } = await import("./dev-migrations.server");
  const { db, hasDatabase } = await import("./neon.server");

  const base = {
    preview: true,
    secrets: devSecretStatus(),
    migrations: migrationFiles().map((f) => f.name),
  };

  if (!hasDatabase()) {
    return {
      ...base,
      database: {
        connection: "FAILED",
        error: "Geen DATABASE_URL beschikbaar.",
        tablesPresent: [],
        tablesMissing: [...REQUIRED_TABLES],
        superadminInPortalAdmins: false,
        superadminRoles: [],
      },
    };
  }

  try {
    const sql = db();
    const rows = (await sql`
      select table_name from information_schema.tables where table_schema = 'public'
    `) as unknown as { table_name: string }[];
    const present = new Set(rows.map((r) => r.table_name));

    let inPortalAdmins = false;
    let roles: string[] = [];
    if (present.has("portal_admins")) {
      const a = (await sql`select email from portal_admins where lower(email) = ${SUPERADMIN}`) as unknown as unknown[];
      inPortalAdmins = a.length > 0;
    }
    if (present.has("user_roles") && present.has("profiles")) {
      const r = (await sql`
        select r.role from user_roles r join profiles p on p.id = r.user_id
        where lower(p.email) = ${SUPERADMIN}
      `) as unknown as { role: string }[];
      roles = r.map((x) => x.role);
    }

    return {
      ...base,
      database: {
        connection: "SUCCESS",
        tablesPresent: REQUIRED_TABLES.filter((t) => present.has(t)),
        tablesMissing: REQUIRED_TABLES.filter((t) => !present.has(t)),
        superadminInPortalAdmins: inPortalAdmins,
        superadminRoles: roles,
      },
    };
  } catch (err) {
    return {
      ...base,
      database: {
        connection: "FAILED",
        error: err instanceof Error ? err.message : String(err),
        tablesPresent: [],
        tablesMissing: [...REQUIRED_TABLES],
        superadminInPortalAdmins: false,
        superadminRoles: [],
      },
    };
  }
});

export const setDevSecret = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) =>
    z
      .object({
        key: z.enum([
          "DATABASE_URL",
          "DATABASE_URL_POOLED",
          "NEON_API_KEY",
          "BREVO_API_KEY",
          "BREVO_SENDER_EMAIL",
          "SMTP_HOST",
          "SMTP_PORT",
          "SMTP_USER",
          "SMTP_PASS",
          "SMTP_FROM",
          "INFOMANIAK_AI_API_KEY",
          "INFOMANIAK_PRODUCT_ID",
          "STRIPE_SECRET_KEY",
          "STRIPE_PUBLISHABLE_KEY",
          "STRIPE_WEBHOOK_SECRET",
          "JWT_SECRET",
        ]),
        value: z.string().max(2000),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await guardPreview();
    await requirePermission(context, "manage_settings");
    const { setDevSecretOverride } = await import("./dev-secrets.server");
    setDevSecretOverride(data.key, data.value);
    return { ok: true as const };
  });

export const runDevMigrations = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
  await guardPreview();
  await requirePermission(context, "manage_settings");
  const { runMigrations } = await import("./dev-migrations.server");
  return runMigrations();
  });
