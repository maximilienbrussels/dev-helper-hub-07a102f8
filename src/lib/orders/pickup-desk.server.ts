/**
 * Gedeelde afhaal-logica voor balie (handmatige code) én camera (QR).
 * Server-only: praat rechtstreeks met de databank.
 */
import { db } from "@/lib/neon.server";

export type PickupOrderSummary = {
  id: number;
  reference: string | null;
  shortCode: string | null;
  pickupCode: string | null;
  customerName: string | null;
  customerEmail: string | null;
  pickupSlot: string | null;
  totalCents: number;
  payOnPickup: boolean;
  byo: boolean;
  items: { title: string; quantity: number }[];
};

export type CollectResult =
  | { ok: true; order: PickupOrderSummary & { wasPayOnPickup: boolean } }
  | { ok: false; reason: "invalid" | "used" | "cancelled" };

export function isByoOption(option: string | null | undefined): boolean {
  return (option ?? "BYO").toUpperCase() === "BYO";
}

/** Korte code onder de QR: het laatste blok van `MP-2026-8F3A2`. */
export function shortCodeOf(reference: string | null): string | null {
  if (!reference) return null;
  const parts = reference.split("-").filter(Boolean);
  return parts.length ? (parts[parts.length - 1] as string).toUpperCase() : null;
}

function normalizeCode(input: string): string {
  return input.trim().replace(/\s+/g, "").toUpperCase();
}

type OrderRow = {
  id: number;
  order_reference: string | null;
  customer_name: string | null;
  customer_email: string | null;
  pickup_slot: string | null;
  total_price_cents: number;
  payment_status: string | null;
  packaging_option: string | null;
  pickup_code: string | null;
  fulfilled_at: string | null;
};

async function itemsFor(orderId: number): Promise<{ title: string; quantity: number }[]> {
  const rows = (await db()`
    select coalesce(p.title, 'Product') as title, oi.quantity
      from order_items oi
      left join products p on p.id = oi.product_id
     where oi.order_id = ${orderId}
     order by oi.id
  `) as { title: string; quantity: number }[];
  return rows.map((r) => ({ title: r.title, quantity: Number(r.quantity) }));
}

function toSummary(row: OrderRow, items: { title: string; quantity: number }[]): PickupOrderSummary {
  return {
    id: Number(row.id),
    reference: row.order_reference,
    shortCode: row.pickup_code ?? shortCodeOf(row.order_reference),
    pickupCode: row.pickup_code,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    pickupSlot: row.pickup_slot,
    totalCents: Number(row.total_price_cents ?? 0),
    payOnPickup: row.payment_status === "pending_pickup",
    byo: isByoOption(row.packaging_option),
    items,
  };
}

/** Alle bestellingen die nog opgehaald moeten worden (recentste eerst). */
export async function listPendingOrders(limit = 100): Promise<PickupOrderSummary[]> {
  const rows = (await db()`
    select id, order_reference, customer_name, customer_email, pickup_slot,
           total_price_cents, payment_status, packaging_option, pickup_code, fulfilled_at
      from orders
     where fulfilled_at is null
       and coalesce(payment_status, '') not in ('cancelled', 'collected')
     order by coalesce(pickup_slot::text, created_at::text) asc
     limit ${limit}
  `) as OrderRow[];
  const out: PickupOrderSummary[] = [];
  for (const row of rows) out.push(toSummary(row, await itemsFor(Number(row.id))));
  return out;
}

/** Zoekt een bestelling op de volledige referentie of enkel de korte code. */
export async function findOrderByCode(input: string): Promise<OrderRow | null> {
  const code = normalizeCode(input);
  if (code.length < 3 || code.length > 32) return null;
  const rows = (await db()`
    select id, order_reference, customer_name, customer_email, pickup_slot,
           total_price_cents, payment_status, packaging_option, pickup_code, fulfilled_at
      from orders
     where upper(coalesce(pickup_code, '')) = ${code}
        or upper(coalesce(order_reference, '')) = ${code}
        or upper(coalesce(order_reference, '')) like ${"%-" + code}
     order by id desc
     limit 2
  `) as OrderRow[];
  // Bij twijfel (twee bestellingen met dezelfde korte code) geen automatische keuze.
  if (rows.length !== 1) return null;
  return rows[0] ?? null;
}

async function loadOrderById(id: number): Promise<OrderRow | null> {
  const rows = (await db()`
    select id, order_reference, customer_name, customer_email, pickup_slot,
           total_price_cents, payment_status, packaging_option, pickup_code, fulfilled_at
      from orders
     where id = ${id}
     limit 1
  `) as OrderRow[];
  return rows[0] ?? null;
}

/**
 * Dé validatie: controleert of de bestelling nog open staat en zet ze in
 * dezelfde beweging op AFGEHAALD. Zowel camera als balie gebruiken dit.
 */
export async function collectOrder(
  orderId: number,
  actor: { email: string | null; userId: string | null },
  note: string,
): Promise<CollectResult> {
  const row = await loadOrderById(orderId);
  if (!row) return { ok: false, reason: "invalid" };
  if (row.payment_status === "cancelled") return { ok: false, reason: "cancelled" };
  if (row.fulfilled_at || row.payment_status === "collected") return { ok: false, reason: "used" };

  const wasPayOnPickup = row.payment_status === "pending_pickup";
  const now = new Date().toISOString();
  // Atomair: enkel de eerste scan/invoer wint, een tweede raakt 0 rijen.
  const updated = (await db()`
    update orders
       set payment_status = 'collected',
           fulfilled_at = ${now},
           fulfilled_by = ${actor.email},
           paid_at = case when ${wasPayOnPickup} then ${now} else paid_at end
     where id = ${orderId}
       and fulfilled_at is null
       and coalesce(payment_status, '') <> 'collected'
     returning id
  `) as { id: number }[];
  if (updated.length === 0) return { ok: false, reason: "used" };

  await db()`
    insert into order_status_history (order_id, status, note, changed_by)
    values (${orderId}, 'collected', ${note}, ${actor.userId})
  `;

  const summary = toSummary(row, await itemsFor(orderId));
  const collected = { ...summary, wasPayOnPickup };

  // Automatische bevestigingsmail (Brevo). Mag de afhaling nooit blokkeren.
  try {
    const { sendPickupConfirmation } = await import("./pickup-email.server");
    await sendPickupConfirmation(collected);
  } catch (err) {
    console.error(`[pickup] bevestigingsmail mislukt: ${(err as Error).message}`);
  }

  return { ok: true, order: collected };
}
