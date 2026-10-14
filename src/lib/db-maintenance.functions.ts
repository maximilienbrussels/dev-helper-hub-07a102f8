/**
 * Databankonderhoud vanuit het beheerportaal.
 *
 * Waarom: op productie worden de SQL-migraties niet automatisch uitgevoerd,
 * waardoor beheerpagina's fouten gaven zoals
 * `relation "social_hidden_posts" does not exist`. Een beheerder met het recht
 * `manage_rights` kan de migraties hier veilig (idempotent) uitvoeren.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/lib/auth-middleware";
import { requirePermission } from "@/lib/portal-permissions";

export type MigrationReport = Awaited<
  ReturnType<typeof import("./dev-migrations.server").runMigrations>
>;

export const runDatabaseUpdate = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    await requirePermission(context, "manage_rights");
    const { runMigrations } = await import("./dev-migrations.server");
    return await runMigrations();
  });

/** Korte statuscheck: staat de databank klaar en welke tabellen bestaan er? */
export const fetchDatabaseStatus = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    await requirePermission(context, "manage_rights");
    const { db, hasDatabase } = await import("./neon.server");
    if (!hasDatabase()) return { connected: false, tables: [] as string[] };
    const rows = (await db()`
      select table_name from information_schema.tables where table_schema = 'public'
      order by table_name
    `) as unknown as { table_name: string }[];
    return { connected: true, tables: rows.map((r) => r.table_name) };
  });
