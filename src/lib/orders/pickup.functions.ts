/**
 * Afhalingen valideren (enkel voor teamleden met `manage_orders`).
 *
 * Zowel de camerascan (QR met UUID + HMAC) als de handmatige code aan de balie
 * komen uit op exact dezelfde controle- en afboekingsfunctie (`collectOrder`).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-middleware";
import { requirePermission } from "@/lib/portal-permissions";
import type { CollectResult, PickupOrderSummary } from "./pickup-desk.server";

export type RedeemResult =
  | {
      ok: true;
      order: {
        reference: string | null;
        pickupCode: string | null;
        customerName: string | null;
        pickupSlot: string | null;
        totalCents: number;
        wasPayOnPickup: boolean;
        byo: boolean;
        items: { title: string; quantity: number }[];
      };
    }
  | { ok: false; reason: "invalid" | "used" | "cancelled" };

export type PendingPickup = PickupOrderSummary;

function present(result: CollectResult): RedeemResult {
  if (!result.ok) return result;
  const o = result.order;
  return {
    ok: true,
    order: {
      reference: o.reference,
      pickupCode: o.pickupCode,
      customerName: o.customerName,
      pickupSlot: o.pickupSlot,
      totalCents: o.totalCents,
      wasPayOnPickup: o.wasPayOnPickup,
      byo: o.byo,
      items: o.items,
    },
  };
}

type Ctx = { claims: unknown; userId: string | null };

function actorOf(context: Ctx) {
  return {
    email: (context.claims as { email?: string } | null)?.email ?? null,
    userId: context.userId ?? null,
  };
}

const qrSchema = z.object({
  orderId: z.string().trim().min(36).max(36),
  token: z.string().trim().min(64).max(64),
});

/** Camera / QR-link: UUID + handtekening. */
export const redeemPickupQr = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => qrSchema.parse(d))
  .handler(async ({ data, context }): Promise<RedeemResult> => {
    await requirePermission(context, "manage_orders");

    const { verifyPickupToken } = await import("./secure-qr");
    if (!(await verifyPickupToken(data.orderId, data.token))) {
      return { ok: false, reason: "invalid" };
    }

    const { loadPickupOrder } = await import("./pickup-pass.server");
    const order = await loadPickupOrder(data.orderId);
    if (!order) return { ok: false, reason: "invalid" };

    const { collectOrder } = await import("./pickup-desk.server");
    return present(await collectOrder(order.id, actorOf(context), "QR gescand"));
  });

const codeSchema = z.object({ code: z.string().trim().min(4).max(32) });

/** Balie: de korte code (of volledige referentie) onder de QR intypen. */
export const redeemPickupCode = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => codeSchema.parse(d))
  .handler(async ({ data, context }): Promise<RedeemResult> => {
    await requirePermission(context, "manage_orders");
    const { findOrderByCode, collectOrder } = await import("./pickup-desk.server");
    const row = await findOrderByCode(data.code);
    if (!row) return { ok: false, reason: "invalid" };
    return present(await collectOrder(Number(row.id), actorOf(context), "Code ingetikt aan de balie"));
  });

const idSchema = z.object({ orderId: z.number().int().positive() });

/** Balie: rechtstreeks afvinken in de lijst met openstaande afhalingen. */
export const markPickupCollected = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => idSchema.parse(d))
  .handler(async ({ data, context }): Promise<RedeemResult> => {
    await requirePermission(context, "manage_orders");
    const { collectOrder } = await import("./pickup-desk.server");
    return present(await collectOrder(data.orderId, actorOf(context), "Manueel afgevinkt aan de balie"));
  });

/** Alle bestellingen die nog wachten om opgehaald te worden. */
export const listPendingPickups = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<PendingPickup[]> => {
    await requirePermission(context, "manage_orders");
    const { listPendingOrders } = await import("./pickup-desk.server");
    return listPendingOrders();
  });
