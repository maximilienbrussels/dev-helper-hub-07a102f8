/**
 * Server-only helper voor het wijzigingslogboek.
 *
 * Elke schrijfactie in het portaal roept `recordAudit` aan. Fouten in het
 * logboek mogen de actie zelf nooit blokkeren: ze worden stil opgevangen.
 */
export type AuditEntry = {
  actorId?: string | null;
  actorEmail?: string | null;
  action: "create" | "update" | "delete" | "restore" | "publish" | "other";
  entity: string;
  entityId?: string | number | null;
  summary?: string | null;
  details?: unknown;
};

export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    const { db } = await import("./neon.server");
    const sql = db();
    await sql`
      insert into audit_log (actor_id, actor_email, action, entity, entity_id, summary, details)
      values (
        ${entry.actorId ?? null}::uuid,
        ${entry.actorEmail ?? null},
        ${entry.action},
        ${entry.entity},
        ${entry.entityId == null ? null : String(entry.entityId)},
        ${entry.summary ?? null},
        ${entry.details == null ? null : JSON.stringify(entry.details)}::jsonb
      )
    `;
  } catch (error) {
    console.error("[audit] kon niet loggen:", error);
  }
}
