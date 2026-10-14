/**
 * Server-only bootstrap van de super-admin.
 *
 * Wordt aangeroepen bij elke portaal-toegangscontrole: staat het ingelogde
 * e-mailadres in SUPERADMIN_EMAILS, dan worden de nodige databaserijen
 * automatisch (her)aangemaakt:
 *  - portal_admins  → toegang tot het portaal
 *  - user_roles     → rol `super_admin` voor de gebruiker
 *  - role_permissions → alle rechten aan voor `super_admin`
 *
 * Alles is fail-safe: ontbreekt een tabel of de databaseverbinding, dan wordt
 * de fout gelogd en blijft de toegang op basis van het e-mailadres gelden.
 */
import { db } from "./neon.server";
import { PERMISSIONS } from "./rights.functions";

export async function ensureSuperAdmin(email: string, userId: string | null): Promise<void> {
  const mail = email.trim().toLowerCase();
  const sql = db();

  try {
    await sql`
      insert into portal_admins (email, role, active)
      values (${mail}, 'admin', true)
      on conflict (email) do update set role = 'admin', active = true
    `;
  } catch (error) {
    console.warn("[superadmin] portal_admins bijwerken mislukt:", describe(error));
  }

  if (userId) {
    try {
      // Neon Auth en het publieke applicatieschema zijn afzonderlijk. Maak het
      // profiel daarom bij iedere admin-login zelfherstellend aan vóór de rol
      // (user_roles.user_id verwijst naar profiles.id).
      await sql`
        insert into profiles (id, email, full_name, active, updated_at)
        values (${userId}::uuid, ${mail}, ${mail.split("@")[0]}, true, now())
        on conflict (email) do update
          set active = true, updated_at = now()
      `;
    } catch (error) {
      console.warn("[superadmin] profiel bijwerken mislukt:", describe(error));
    }

    try {
      await sql`
        insert into user_roles (user_id, role)
        values (${userId}::uuid, 'super_admin')
        on conflict do nothing
      `;
    } catch (error) {
      // Sommige installaties kennen enkel 'admin' in het app_role-type.
      try {
        await sql`
          insert into user_roles (user_id, role)
          values (${userId}::uuid, 'admin')
          on conflict do nothing
        `;
      } catch (fallback) {
        console.warn(
          "[superadmin] user_roles bijwerken mislukt:",
          describe(error),
          describe(fallback),
        );
      }
    }
  }

  try {
    for (const permission of PERMISSIONS) {
      await sql`
        insert into role_permissions (role, permission, allowed, updated_at)
        values ('super_admin', ${permission}, true, now())
        on conflict (role, permission) do update set allowed = true, updated_at = now()
      `;
    }
  } catch (error) {
    console.warn("[superadmin] role_permissions bijwerken mislukt:", describe(error));
  }
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
