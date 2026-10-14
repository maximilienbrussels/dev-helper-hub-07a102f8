/**
 * Automatische migratierunner (preview/dev): voert de SQL-bestanden uit
 * `neon/migrations/` sequentieel uit tegen de live Neon-databank.
 *
 * De bestanden worden bij build-time meegebundeld (geen filesystem in de edge
 * runtime). Statements worden gesplitst met respect voor dollar-quoting
 * ($$ ... $$) en string-literals, want de HTTP-driver voert één statement per
 * request uit.
 */

const files = import.meta.glob("../../neon/migrations/*.sql", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const SUPERADMIN = "desk@delplanche.cloud";

export function migrationFiles(): { name: string; sql: string }[] {
  return Object.entries(files)
    .map(([path, sql]) => ({ name: path.split("/").pop() ?? path, sql }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Splitst een SQL-script in losse statements. */
export function splitSqlStatements(sql: string): string[] {
  const out: string[] = [];
  let buf = "";
  let i = 0;
  let inSingle = false;
  let inLineComment = false;
  let inBlockComment = false;
  let dollarTag: string | null = null;

  while (i < sql.length) {
    const ch = sql[i]!;
    const next = sql[i + 1];

    if (inLineComment) {
      buf += ch;
      if (ch === "\n") inLineComment = false;
      i++;
      continue;
    }
    if (inBlockComment) {
      buf += ch;
      if (ch === "*" && next === "/") {
        buf += next;
        i += 2;
        inBlockComment = false;
        continue;
      }
      i++;
      continue;
    }
    if (dollarTag) {
      if (sql.startsWith(dollarTag, i)) {
        buf += dollarTag;
        i += dollarTag.length;
        dollarTag = null;
        continue;
      }
      buf += ch;
      i++;
      continue;
    }
    if (inSingle) {
      buf += ch;
      if (ch === "'") {
        if (next === "'") {
          buf += next;
          i += 2;
          continue;
        }
        inSingle = false;
      }
      i++;
      continue;
    }
    if (ch === "-" && next === "-") {
      buf += "--";
      i += 2;
      inLineComment = true;
      continue;
    }
    if (ch === "/" && next === "*") {
      buf += "/*";
      i += 2;
      inBlockComment = true;
      continue;
    }
    if (ch === "'") {
      inSingle = true;
      buf += ch;
      i++;
      continue;
    }
    if (ch === "$") {
      const m = /^\$[A-Za-z_][A-Za-z0-9_]*\$|^\$\$/.exec(sql.slice(i));
      if (m) {
        dollarTag = m[0];
        buf += dollarTag;
        i += dollarTag.length;
        continue;
      }
    }
    if (ch === ";") {
      if (buf.trim()) out.push(buf.trim());
      buf = "";
      i++;
      continue;
    }
    buf += ch;
    i++;
  }
  if (buf.trim()) out.push(buf.trim());
  return out.filter((s) => !/^(--|\/\*)/.test(s) || /[a-z]/i.test(s.replace(/--.*$/gm, "")));
}

export type MigrationResult = {
  file: string;
  statements: number;
  status: "OK" | "FAILED";
  error?: string;
};

export type RunMigrationsReport = {
  connection: "SUCCESS" | "FAILED";
  error?: string;
  applied: MigrationResult[];
  superadmin: {
    email: string;
    inPortalAdmins: boolean;
    roles: string[];
    note?: string;
  } | null;
};

export async function runMigrations(): Promise<RunMigrationsReport> {
  const { db, hasDatabase } = await import("./neon.server");
  if (!hasDatabase()) {
    return {
      connection: "FAILED",
      error: "Geen DATABASE_URL beschikbaar (secret of tijdelijke override).",
      applied: [],
      superadmin: null,
    };
  }
  const sqlClient = db();
  const applied: MigrationResult[] = [];

  for (const file of migrationFiles()) {
    const statements = splitSqlStatements(file.sql);
    try {
      for (const stmt of statements) {
        await sqlClient.query(stmt);
      }
      applied.push({ file: file.name, statements: statements.length, status: "OK" });
    } catch (err) {
      applied.push({
        file: file.name,
        statements: statements.length,
        status: "FAILED",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Superadmin altijd hydrateren.
  try {
    await sqlClient.query(
      `insert into portal_admins (email, role, active)
       values ($1, 'admin', true)
       on conflict (email) do update set active = true`,
      [SUPERADMIN],
    );
  } catch {
    /* tabel of kolommen kunnen afwijken — de verificatie hieronder toont dat */
  }
  try {
    await sqlClient.query(
      `insert into user_roles (user_id, role)
       select p.id, 'super_admin'::app_role from profiles p where lower(p.email) = $1
       on conflict do nothing`,
      [SUPERADMIN],
    );
  } catch {
    /* profielrij bestaat pas na eerste aanmelding */
  }

  let superadmin: RunMigrationsReport["superadmin"] = null;
  try {
    const adminRows = (await sqlClient.query(
      `select email from portal_admins where lower(email) = $1`,
      [SUPERADMIN],
    )) as unknown as { email: string }[];
    const roleRows = (await sqlClient.query(
      `select r.role from user_roles r join profiles p on p.id = r.user_id where lower(p.email) = $1`,
      [SUPERADMIN],
    )) as unknown as { role: string }[];
    superadmin = {
      email: SUPERADMIN,
      inPortalAdmins: adminRows.length > 0,
      roles: roleRows.map((r) => r.role),
      note:
        roleRows.length === 0
          ? "Rol super_admin wordt toegekend zodra het profiel bestaat (trigger bij eerste aanmelding)."
          : undefined,
    };
  } catch (err) {
    return {
      connection: "SUCCESS",
      error: err instanceof Error ? err.message : String(err),
      applied,
      superadmin: null,
    };
  }

  return { connection: "SUCCESS", applied, superadmin };
}
