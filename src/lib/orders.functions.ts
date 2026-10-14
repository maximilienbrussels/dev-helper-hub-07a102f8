import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-middleware";
import { combineName } from "@/lib/auth";
import { requirePermission } from "@/lib/portal-permissions";

export const ORDER_STATUSES = [
  "pending",
  "paid",
  "in_preparation",
  "ready",
  "collected",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Wacht op betaling",
  paid: "Betaald",
  in_preparation: "In voorbereiding",
  ready: "Klaar om af te halen",
  collected: "Afgehaald",
  cancelled: "Geannuleerd",
};

/** Detail van één bestelling: bestelregels + statusgeschiedenis. */
export const getOrderDetail = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => z.object({ id: z.number().int().positive() }).parse(d))
  .handler(async ({ data, context }) => {
    const order = await context.supabase
      .from("orders")
      .select(
        "id, order_reference, structured_communication, total_price_cents, pickup_slot, payment_status, payment_method, customer_email, created_at, order_items(id, quantity, price_at_purchase_cents, products(title))",
      )
      .eq("id", data.id)
      .maybeSingle();
    if (order.error) throw new Error(order.error.message);
    if (!order.data) throw new Error("Bestelling niet gevonden.");

    const history = await context.supabase
      .from("order_status_history")
      .select("id, status, note, created_at, changed_by")
      .eq("order_id", data.id)
      .order("created_at", { ascending: false });
    if (history.error) throw new Error(history.error.message);

    const authorIds = [
      ...new Set((history.data ?? []).map((h) => h.changed_by).filter(Boolean)),
    ] as string[];
    const authors = authorIds.length
      ? await context.supabase
          .from("profiles")
          .select("id, first_name, last_name, full_name")
          .in("id", authorIds)
      : { data: [], error: null };

    return {
      order: order.data,
      history: (history.data ?? []).map((h) => ({
        ...h,
        author: (() => {
          const a = (authors.data ?? []).find((a) => a.id === h.changed_by);
          return combineName(a?.first_name, a?.last_name, a?.full_name) ?? "Onbekend";
        })(),
      })),
    };
  });

/** Werkt de status van een bestelling bij en logt de wijziging. */
export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) =>
    z
      .object({
        id: z.number().int().positive(),
        status: z.enum(ORDER_STATUSES),
        note: z.string().trim().max(500).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requirePermission(context, "manage_orders");

    if (data.status === "paid") {
      // "Betaald" zetten start meteen de factuur- en mailpijplijn; die functie
      // zet de bestelling zelf op betaald en werpt nooit.
      const { finalizePaidOrder } = await import("@/lib/order-invoice.server");
      const result = await finalizePaidOrder({ orderId: data.id });
      if (result.skipped === "already_paid") {
        const { error } = await context.supabase
          .from("orders")
          .update({ payment_status: data.status })
          .eq("id", data.id);
        if (error) throw new Error(error.message);
      }
    } else {
      const { error } = await context.supabase
        .from("orders")
        .update({ payment_status: data.status })
        .eq("id", data.id);
      if (error) throw new Error(error.message);
    }

    const { error: logError } = await context.supabase.from("order_status_history").insert({
      order_id: data.id,
      status: data.status,
      note: data.note ?? null,
      changed_by: context.userId,
    });
    if (logError) throw new Error(logError.message);
    return { ok: true };
  });
