import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-middleware";
import { optionalText } from "@/lib/validators";

// Eigen bestellingen: orders zijn afgeschermd voor clients, dus we lezen ze
// server-side op basis van het geverifieerde e-mailadres van de gebruiker.
export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const email = (context.claims as { email?: string } | null)?.email;
    if (!email) return [];
    const { dbAdmin } = await import("@/lib/db-admin.server");
    const { data, error } = await dbAdmin
      .from("orders")
      .select(
        "id, order_reference, invoice_number, invoice_url, structured_communication, total_price_cents, pickup_slot, payment_status, payment_method, created_at, pickup_uuid, pickup_code, packaging_option, order_items(id, quantity, price_at_purchase_cents, products(title))",
      )
      .eq("customer_email", email)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;

    // Afhaalpas + afhaal-QR: ondertekende links (UUID + HMAC), nooit het volgnummer.
    const { pickupPassUrl, pickupScanUrl, signPickupToken, isPickupUuid } = await import(
      "@/lib/orders/secure-qr"
    );
    const { mailOrigin } = await import("@/lib/email-shell");
    const origin = mailOrigin();
    return await Promise.all(
      (data ?? []).map(async (o) => {
        const uuid = String((o as { pickup_uuid?: string | null }).pickup_uuid ?? "");
        let pass: string | null = null;
        let qr: string | null = null;
        const open = o.payment_status !== "cancelled" && o.payment_status !== "collected";
        if (uuid && isPickupUuid(uuid) && o.payment_status !== "cancelled") {
          try {
            const token = await signPickupToken(uuid);
            pass = pickupPassUrl(uuid, token, origin);
            if (open) qr = pickupScanUrl(uuid, token, origin);
          } catch {
            pass = null;
            qr = null;
          }
        }
        return { ...o, pickup_pass_url: pass, pickup_qr_url: qr };
      }),
    );
  });

// full_name wordt automatisch afgeleid van first_name/last_name via een
// database trigger — we schrijven hier dus enkel de losse velden.
export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) =>
    z
      .object({
        first_name: z.string().trim().min(1).max(80),
        last_name: optionalText(80),
        phone: optionalText(40),
        street: optionalText(160),
        postal_code: optionalText(16),
        city: optionalText(80),
        notify_orders: z.boolean().optional(),
        notify_academy: z.boolean().optional(),
        notify_newsletter: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("profiles").update(data).eq("id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

// Losse, direct-persisterende toggle voor communicatievoorkeuren zodat een
// schakelaar niet afhankelijk is van de algemene "opslaan"-knop.
export const updateMyNotificationPref = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) =>
    z
      .object({
        key: z.enum(["notify_orders", "notify_academy", "notify_newsletter"]),
        value: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const patch =
      data.key === "notify_orders"
        ? { notify_orders: data.value }
        : data.key === "notify_academy"
          ? { notify_academy: data.value }
          : { notify_newsletter: data.value };
    const { error } = await context.supabase
      .from("profiles")
      .update(patch)
      .eq("id", context.userId);
    if (error) throw error;
    return { ok: true };
  });
