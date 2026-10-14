import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-middleware";
import { requirePermission } from "@/lib/portal-permissions";
import { safeError } from "@/lib/safe-error";

export type AuditRow = {
  id: string;
  created_at: string;
  actor_email: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  summary: string | null;
};

export type TrashRow = {
  kind: "booking" | "media" | "product";
  id: string;
  label: string;
  deleted_at: string;
};

async function sql() {
  const { db } = await import("./neon.server");
  return db();
}

/** Wijzigingslogboek, nieuwste eerst. */
export const listAuditLog = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input: unknown) =>
    z
      .object({
        entity: z.string().max(40).optional(),
        limit: z.number().int().min(1).max(200).default(100),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }): Promise<AuditRow[]> => {
    try {
      await requirePermission(context, "view_audit");
      const db = await sql();
      const rows = data.entity
        ? await db`
            select id::text, created_at, actor_email, action, entity, entity_id, summary
            from audit_log where entity = ${data.entity}
            order by created_at desc limit ${data.limit}
          `
        : await db`
            select id::text, created_at, actor_email, action, entity, entity_id, summary
            from audit_log order by created_at desc limit ${data.limit}
          `;
      return rows as AuditRow[];
    } catch (error) {
      throw safeError(error, "Het logboek kon niet geladen worden.");
    }
  });

/** Alles wat de laatste 30 dagen zacht verwijderd is. */
export const listTrash = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<TrashRow[]> => {
    try {
      await requirePermission(context, "view_audit");
      const db = await sql();
      const rows = (await db`
        select 'booking' as kind, id::text as id,
               coalesce(nullif(client_name, ''), 'Boeking') as label, deleted_at
          from bookings where deleted_at is not null
        union all
        select 'media', id::text, coalesce(nullif(title, ''), filename, 'Media'), deleted_at
          from media_assets where deleted_at is not null
        union all
        select 'product', id::text, coalesce(nullif(title, ''), 'Product'), deleted_at
          from products where deleted_at is not null
        order by deleted_at desc limit 200
      `) as TrashRow[];
      return rows;
    } catch (error) {
      throw safeError(error, "De prullenbak kon niet geladen worden.");
    }
  });

const KIND_TABLE: Record<TrashRow["kind"], string> = {
  booking: "bookings",
  media: "media_assets",
  product: "products",
};

const PERMISSION_FOR: Record<TrashRow["kind"], string> = {
  booking: "manage_requests",
  media: "manage_media",
  product: "manage_products",
};

/** Zet een zacht verwijderd item terug. */
export const restoreItem = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input: unknown) =>
    z.object({ kind: z.enum(["booking", "media", "product"]), id: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    try {
      await requirePermission(context, PERMISSION_FOR[data.kind]);
      const db = await sql();
      const table = KIND_TABLE[data.kind];
      if (table === "bookings") {
        await db`update bookings set deleted_at = null where id = ${data.id}::uuid`;
      } else if (table === "media_assets") {
        await db`update media_assets set deleted_at = null where id = ${data.id}::uuid`;
      } else {
        await db`update products set deleted_at = null where id::text = ${data.id}`;
      }
      const { recordAudit } = await import("./audit.server");
      await recordAudit({
        actorId: context.userId,
        actorEmail: (context.claims as { email?: string } | null)?.email ?? null,
        action: "restore",
        entity: data.kind,
        entityId: data.id,
        summary: `${data.kind} hersteld uit de prullenbak`,
      });
      return { ok: true as const };
    } catch (error) {
      throw safeError(error, "Herstellen lukte niet.");
    }
  });
