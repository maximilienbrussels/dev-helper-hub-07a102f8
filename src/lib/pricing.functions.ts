/**
 * Serverfuncties voor de tarieven.
 * Publiek: `fetchPricing` (de site toont de prijzen).
 * Beheer: `savePricing` achter `manage_services`.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireAuth } from "@/lib/auth-middleware";
import { requirePermission } from "./portal-permissions";
import { recordAudit } from "./audit.server";
import { PRICING_DEFAULTS, type PricingMap } from "./pricing";

function actorEmail(context: unknown): string | null {
  return ((context as { claims?: { email?: string } | null })?.claims?.email as string) ?? null;
}

export const fetchPricing = createServerFn({ method: "GET" }).handler(
  async (): Promise<PricingMap> => {
    try {
      const { loadPricing } = await import("./pricing.server");
      return await loadPricing();
    } catch {
      return { ...PRICING_DEFAULTS };
    }
  },
);

export const fetchPricingList = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { listPricing } = await import("./pricing.server");
    return await listPricing();
  } catch {
    const { PRICING_DEFAULT_ITEMS } = await import("./pricing");
    return PRICING_DEFAULT_ITEMS.map((i) => ({ key: i.key, amount: i.amount, label: i.label }));
  }
});

export const savePricing = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) =>
    z.object({ key: z.string().min(1).max(120), amount: z.number().min(0).max(1000000) }).parse(d),
  )
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await requirePermission(context, "manage_services");
    const { savePricingValue } = await import("./pricing.server");
    const email = actorEmail(context);
    await savePricingValue(data.key, data.amount, email);
    await recordAudit({
      actorEmail: email,
      action: "update",
      entity: "pricing_item",
      entityId: data.key,
      summary: `Tarief ${data.key} → € ${data.amount}`,
      details: data,
    });
    return { ok: true };
  });
