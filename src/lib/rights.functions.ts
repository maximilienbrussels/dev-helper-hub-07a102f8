import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-middleware";


export {
  PERMISSIONS,
  BUILTIN_ROLES,
  FULL_ACCESS_ROLES,
  type Permission,
} from "@/lib/rights-catalog";
import {
  PERMISSIONS,
  BUILTIN_ROLES,
  FULL_ACCESS_ROLES,
  type Permission,
} from "@/lib/rights-catalog";



export type RoleKey = string;

export type RoleInfo = {
  role: RoleKey;
  labels: { nl: string; fr: string; en: string };
  builtin: boolean;
  sortOrder: number;
};

export type RightsSnapshot = {
  roles: RoleInfo[];
  matrix: { role: RoleKey; permission: Permission; allowed: boolean }[];
  myRoles: RoleKey[];
  myPermissions: Permission[];
  isOwner: boolean;
};

export type PortalUser = {
  id: string;
  email: string;
  name: string;
  active: boolean;
  roles: RoleKey[];
};

const ROLE_KEY = /^[a-z][a-z0-9_]{2,30}$/;

/* ------------------------------------------------------------------ helpers */

type Ctx = { userId: string; claims: unknown };

async function sql() {
  const { db } = await import("./neon.server");
  return db();
}

/**
 * Alle rechten van de ingelogde gebruiker. Steunt op dezelfde centrale
 * controle als de API-routes (`permission-core.server.ts`), zodat de knoppen
 * in de interface en de server nooit van mening verschillen.
 */
async function loadMyRights(
  context: Ctx,
): Promise<{ roles: RoleKey[]; permissions: Permission[]; isOwner: boolean; email: string | null }> {
  const { resolveAccess, loadGrantedPermissions } = await import("./permission-core.server");
  const access = await resolveAccess({ userId: context.userId, claims: context.claims });

  if (access.fullAccess) {
    const withOwner = [...new Set<RoleKey>([...access.roles, "owner"])];
    return { roles: withOwner, permissions: [...PERMISSIONS], isOwner: true, email: access.email };
  }

  const granted = await loadGrantedPermissions(access.roles);
  const permissions = granted.filter((p): p is Permission =>
    (PERMISSIONS as readonly string[]).includes(p),
  );
  return { roles: access.roles, permissions, isOwner: false, email: access.email };
}

/** Werpt een fout wanneer de gebruiker het recht niet heeft. */
async function assertRight(context: Ctx, permission: Permission) {
  const mine = await loadMyRights(context);
  if (mine.isOwner) return mine;
  if (!mine.permissions.includes(permission)) throw new Error("Forbidden: onvoldoende rechten.");
  return mine;
}

async function loadRoles(): Promise<RoleInfo[]> {
  const db = await sql();
  const rows = (await db`
    select role, label_nl, label_fr, label_en, builtin, sort_order
    from role_meta order by sort_order, role
  `) as Array<{
    role: string;
    label_nl: string;
    label_fr: string;
    label_en: string;
    builtin: boolean;
    sort_order: number;
  }>;
  return rows.map((r) => ({
    role: r.role,
    labels: { nl: r.label_nl, fr: r.label_fr, en: r.label_en },
    builtin: r.builtin,
    sortOrder: r.sort_order,
  }));
}

/* ------------------------------------------------------------------- reads */

/** Rollen, rechtenmatrix en de rechten van de ingelogde medewerker. */
export const fetchRights = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<RightsSnapshot> => {
    const mine = await loadMyRights(context);
    const db = await sql();

    let roles: RoleInfo[] = [];
    try {
      roles = await loadRoles();
    } catch {
      roles = BUILTIN_ROLES.map((r, i) => ({
        role: r,
        labels: { nl: r, fr: r, en: r },
        builtin: true,
        sortOrder: i * 10,
      }));
    }

    let matrix: RightsSnapshot["matrix"] = [];
    try {
      const rows = (await db`
        select role::text as role, permission, allowed from role_permissions
      `) as Array<{ role: string; permission: string; allowed: boolean }>;
      matrix = rows.map((r) => ({
        role: r.role,
        permission: r.permission as Permission,
        allowed: r.allowed,
      }));
    } catch {
      matrix = [];
    }

    return {
      roles,
      matrix,
      myRoles: mine.roles,
      myPermissions: mine.permissions,
      isOwner: mine.isOwner,
    };
  });

/** Alle portaalgebruikers met hun rollen. */
export const fetchPortalUsers = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<PortalUser[]> => {
    await assertRight(context, "view_team");
    const db = await sql();
    const rows = (await db`
      select p.id::text as id,
             coalesce(p.email, '') as email,
             coalesce(nullif(trim(coalesce(p.full_name, concat_ws(' ', p.first_name, p.last_name))), ''), p.email, '') as name,
             p.active,
             coalesce(array_agg(ur.role::text) filter (where ur.role is not null), '{}') as roles
      from profiles p
      left join user_roles ur on ur.user_id = p.id
      group by p.id, p.email, p.full_name, p.first_name, p.last_name, p.active
      having count(ur.role) > 0 or exists (select 1 from portal_admins pa where lower(pa.email) = lower(coalesce(p.email, '')))
      order by p.active desc, name
    `) as Array<{
      id: string;
      email: string;
      name: string;
      active: boolean;
      roles: string[];
    }>;
    return rows.map((r) => ({ ...r, roles: r.roles ?? [] }));
  });

/* ------------------------------------------------------------------ writes */

/**
 * Verhindert dat iemand zichzelf buitensluit: je mag "Rechtenmatrix beheren"
 * niet afnemen van een rol wanneer dat je laatste toegang tot de rechten is.
 */
async function assertNoSelfLockout(context: Ctx, role: string) {
  const mine = await loadMyRights(context);
  if (mine.isOwner) return;
  const db = await sql();
  const roles = mine.roles;
  if (!roles.includes(role)) return;

  const others = roles.filter((r) => r !== role);
  if (others.length > 0) {
    const kept = (await db`
      select 1 from role_permissions
      where allowed and permission = 'manage_rights' and role::text = any(${others})
      limit 1
    `) as unknown[];
    if (kept.length > 0) return;
  }
  throw new Error(
    "Je kan 'Rechtenmatrix beheren' niet afnemen van je eigen rol: je zou jezelf buitensluiten.",
  );
}

/** Zet één recht aan of uit voor één rol. */
export const setRolePermission = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) =>
    z
      .object({
        role: z.string().regex(ROLE_KEY),
        permission: z.enum(PERMISSIONS),
        allowed: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertRight(context, "manage_rights");
    if ((FULL_ACCESS_ROLES as readonly string[]).includes(data.role)) {
      throw new Error("Deze rol heeft altijd alle rechten en kan niet beperkt worden.");
    }
    if (data.permission === "manage_rights" && !data.allowed) {
      await assertNoSelfLockout(context, data.role);
    }
    const db = await sql();
    await db`
      insert into role_permissions (role, permission, allowed, updated_at)
      values (${data.role}::app_role, ${data.permission}, ${data.allowed}, now())
      on conflict (role, permission) do update set allowed = excluded.allowed, updated_at = now()
    `;
    return { ok: true };
  });

/** Alle rechten van één rol in één keer opslaan. */
export const saveRolePermissions = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) =>
    z
      .object({
        role: z.string().regex(ROLE_KEY),
        permissions: z.array(z.enum(PERMISSIONS)),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertRight(context, "manage_rights");
    if ((FULL_ACCESS_ROLES as readonly string[]).includes(data.role)) {
      throw new Error("Deze rol heeft altijd alle rechten en kan niet beperkt worden.");
    }
    if (!data.permissions.includes("manage_rights")) {
      await assertNoSelfLockout(context, data.role);
    }
    const db = await sql();
    for (const permission of PERMISSIONS) {
      const allowed = data.permissions.includes(permission);
      await db`
        insert into role_permissions (role, permission, allowed, updated_at)
        values (${data.role}::app_role, ${permission}, ${allowed}, now())
        on conflict (role, permission) do update set allowed = excluded.allowed, updated_at = now()
      `;
    }
    return { ok: true };
  });

/** Nieuwe (eigen) rol aanmaken met meertalige labels. */
export const createRole = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) =>
    z
      .object({
        role: z.string().trim().regex(ROLE_KEY, "Gebruik enkel kleine letters, cijfers en _"),
        labelNl: z.string().trim().min(2).max(60),
        labelFr: z.string().trim().min(2).max(60),
        labelEn: z.string().trim().min(2).max(60),
        permissions: z.array(z.enum(PERMISSIONS)).default([]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertRight(context, "manage_rights");
    const db = await sql();

    const existing = (await db`
      select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid
      where t.typname = 'app_role' and e.enumlabel = ${data.role}
    `) as unknown[];
    if (existing.length === 0) {
      // Enum-waarden kunnen niet als parameter meegegeven worden.
      await (db as unknown as { query: (q: string) => Promise<unknown> }).query(
        `alter type public.app_role add value '${data.role}'`,
      );
    }

    await db`
      insert into role_meta (role, label_nl, label_fr, label_en, builtin, sort_order)
      values (${data.role}, ${data.labelNl}, ${data.labelFr}, ${data.labelEn}, false, 200)
      on conflict (role) do update
        set label_nl = excluded.label_nl, label_fr = excluded.label_fr, label_en = excluded.label_en
    `;

    for (const permission of PERMISSIONS) {
      const allowed = data.permissions.includes(permission);
      await db`
        insert into role_permissions (role, permission, allowed, updated_at)
        values (${data.role}::app_role, ${permission}, ${allowed}, now())
        on conflict (role, permission) do update set allowed = excluded.allowed, updated_at = now()
      `;
    }
    return { ok: true };
  });

/** Labels van een rol bijwerken. */
export const updateRoleLabels = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) =>
    z
      .object({
        role: z.string().regex(ROLE_KEY),
        labelNl: z.string().trim().min(2).max(60),
        labelFr: z.string().trim().min(2).max(60),
        labelEn: z.string().trim().min(2).max(60),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertRight(context, "manage_rights");
    const db = await sql();
    await db`
      update role_meta
      set label_nl = ${data.labelNl}, label_fr = ${data.labelFr}, label_en = ${data.labelEn}
      where role = ${data.role}
    `;
    return { ok: true };
  });

/** Eigen rol verwijderen (ingebouwde rollen blijven). */
export const deleteRole = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => z.object({ role: z.string().regex(ROLE_KEY) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertRight(context, "manage_rights");
    if ((BUILTIN_ROLES as readonly string[]).includes(data.role)) {
      throw new Error("Ingebouwde rollen kunnen niet verwijderd worden.");
    }
    const db = await sql();
    await db`delete from user_roles where role::text = ${data.role}`;
    await db`delete from role_permissions where role::text = ${data.role}`;
    await db`delete from role_meta where role = ${data.role}`;
    return { ok: true };
  });

/** Rollen van één gebruiker vervangen door de aangevinkte set. */
export const setUserRoles = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        roles: z.array(z.string().regex(ROLE_KEY)).max(20),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const mine = await assertRight(context, "manage_team");
    const db = await sql();

    // Enkel een owner kan de owner-rol geven of afnemen.
    const current = (await db`
      select role::text as role from user_roles where user_id = ${data.userId}::uuid
    `) as Array<{ role: string }>;
    const had = current.map((r) => r.role);
    const ownerChange = had.includes("owner") !== data.roles.includes("owner");
    if (ownerChange && !mine.isOwner) {
      throw new Error("Enkel een eigenaar kan de eigenaarsrol beheren.");
    }

    // Nooit de laatste eigenaar verwijderen.
    if (had.includes("owner") && !data.roles.includes("owner")) {
      const owners = (await db`
        select count(*)::int as n from user_roles where role::text = 'owner'
      `) as Array<{ n: number }>;
      if ((owners[0]?.n ?? 0) <= 1) throw new Error("Er moet minstens één eigenaar blijven.");
    }

    const known = new Set((await loadRoles()).map((r) => r.role));
    const roles = data.roles.filter((r) => known.has(r));

    await db`
      delete from user_roles
      where user_id = ${data.userId}::uuid and role::text <> all(${roles.length ? roles : ["__none__"]})
    `;
    for (const role of roles) {
      await db`
        insert into user_roles (user_id, role)
        values (${data.userId}::uuid, ${role}::app_role)
        on conflict do nothing
      `;
    }
    return { ok: true };
  });

/** Account actief/inactief zetten. */
export const setUserActive = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) =>
    z.object({ userId: z.string().uuid(), active: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertRight(context, "manage_team");
    const db = await sql();
    const rows = (await db`
      select exists (
        select 1 from user_roles where user_id = ${data.userId}::uuid and role::text = 'owner'
      ) as is_owner
    `) as Array<{ is_owner: boolean }>;
    if (rows[0]?.is_owner && !data.active) {
      throw new Error("Een eigenaar kan niet gedeactiveerd worden.");
    }
    await db`
      update profiles set active = ${data.active}, updated_at = now()
      where id = ${data.userId}::uuid
    `;
    return { ok: true };
  });

/** Nieuwe medewerker toevoegen (uitnodiging + aangevinkte rollen). */
export const addPortalUser = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) =>
    z
      .object({
        email: z.string().trim().email().max(255),
        name: z.string().trim().min(2).max(80),
        roles: z.array(z.string().regex(ROLE_KEY)).min(1).max(20),
        lang: z.enum(["nl", "fr", "en"]).default("nl"),
        redirectTo: z.string().url().max(300),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const mine = await assertRight(context, "manage_team");
    if (data.roles.includes("owner") && !mine.isOwner) {
      throw new Error("Enkel een eigenaar kan de eigenaarsrol geven.");
    }

    const db = await sql();
    const email = data.email.trim().toLowerCase();
    const known = new Set((await loadRoles()).map((r) => r.role));
    const roles = data.roles.filter((r) => known.has(r));
    if (roles.length === 0) throw new Error("Kies minstens één geldige rol.");

    const { inviteUser } = await import("./neon-auth-admin.server");
    const invited = await inviteUser({
      email,
      name: data.name,
      redirectTo: data.redirectTo,
    });

    let userId = invited.userId ?? null;
    if (!userId) {
      const rows = (await db`
        select id::text as id from profiles where lower(email) = ${email} limit 1
      `) as Array<{ id: string }>;
      userId = rows[0]?.id ?? null;
    }
    if (!userId && invited.error) throw new Error(invited.error);
    if (!userId) throw new Error("Account kon niet aangemaakt worden.");

    const [first, ...rest] = data.name.split(" ");
    await db`
      insert into profiles (id, email, first_name, last_name, full_name, active, updated_at)
      values (${userId}::uuid, ${email}, ${first ?? ""}, ${rest.join(" ")}, ${data.name}, true, now())
      on conflict (id) do update
        set email = excluded.email,
            first_name = excluded.first_name,
            last_name = excluded.last_name,
            full_name = excluded.full_name,
            active = true,
            updated_at = now()
    `;

    for (const role of roles) {
      await db`
        insert into user_roles (user_id, role)
        values (${userId}::uuid, ${role}::app_role)
        on conflict do nothing
      `;
    }

    try {
      const { sendAuthLink } = await import("./auth-email.server");
      const { normalizeMailLang } = await import("./email-copy");
      await sendAuthLink(
        "invite",
        email,
        data.name,
        "/wachtwoord-herstellen",
        normalizeMailLang(data.lang),
      );
    } catch (error) {
      console.warn("[team] uitnodigingsmail mislukt:", error);
    }

    return { ok: true, userId };
  });
