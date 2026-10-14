/**
 * Certificaten aan de balie: opzoeken via QR of korte code, en markeren als
 * afgedrukt. Enkel voor teamleden met `manage_orders` (baliedienst).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-middleware";
import { requirePermission } from "@/lib/portal-permissions";
import type { DeskCertificate } from "@/lib/academy-print-types";

export type CertificateScanResult =
  | { ok: true; certificate: DeskCertificate }
  | { ok: false; reason: "invalid" };

/** Zoekt het certificaat achter een gescande QR of een ingetikte code. */
export const resolveCertificateScan = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => z.object({ value: z.string().trim().min(3).max(400) }).parse(d))
  .handler(async ({ data, context }): Promise<CertificateScanResult> => {
    await requirePermission(context, "manage_orders");
    const { findCertificate } = await import("./academy-print.server");
    const certificate = await findCertificate(data.value);
    if (!certificate) return { ok: false, reason: "invalid" };
    return { ok: true, certificate };
  });

/** Markeert het certificaat als afgedrukt (met tijdstip en medewerker). */
export const markCertificatePrinted = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requirePermission(context, "manage_orders");
    const { setCertificatePrinted } = await import("./academy-print.server");
    const row = await setCertificatePrinted(data.id, context.userId ?? null);
    const { recordAudit } = await import("./audit.server");
    await recordAudit({
      actorId: context.userId ?? null,
      actorEmail: (context.claims as { email?: string } | null)?.email ?? null,
      action: "other",
      entity: "certificaat",
      entityId: data.id,
      summary: "Certificaat afgedrukt aan de balie",
      details: { printCount: row?.print_count ?? null },
    });
    return { printedAt: row?.printed_at ?? null, printCount: row?.print_count ?? 0 };
  });
