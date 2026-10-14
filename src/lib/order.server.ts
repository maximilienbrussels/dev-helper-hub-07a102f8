import { packagingOptionsForId } from "@/data/products";
import type { OrderInput } from "./order-schema";
import { structuredCommunication } from "./payment-reference";
import { generateOrderReference } from "./order-reference";
import { PACKAGING_FEES_CENTS, PACKAGING_OPTION } from "@/components/checkout/CheckoutPackaging";

export const ORG_ID = 1;

export type OrderResult = {
  order_id: number;
  /** Onraadbare sleutel om deze bestelling online te betalen. */
  pay_token: string;
  order_reference: string;
  packaging_fee_cents: number;
  structured_communication: string;
  total_price_cents: number;
  emailed: boolean;
  /** "paid" volgt na Stripe; "pending_pickup" bij betalen aan de kassa. */
  payment_status: "pending" | "pending_pickup";
  packaging_option: "BYO" | "PAPER_BAG" | "COTTON_BAG";
  /** Beveiligde afhaalpas (UUID + HMAC): QR-afbeelding en PDF. */
  pickup_qr_url: string | null;
  pickup_pass_url: string | null;
};

/**
 * Zoekt een referentie die nog niet in de databank staat. Na enkele pogingen
 * valt de functie terug op de laatst gegenereerde code: de unieke index in
 * Postgres blijft hoe dan ook de eindcontrole.
 */
async function reserveOrderReference(): Promise<string> {
  const { dbAdmin } = await import("@/lib/db-admin.server");
  let reference = generateOrderReference();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    reference = generateOrderReference();
    const { data } = await dbAdmin
      .from("orders")
      .select("id")
      .eq("order_reference", reference)
      .maybeSingle();
    if (!data) return reference;
  }
  return reference;
}


/**
 * Slaat een bestelling server-side op. Prijzen komen altijd uit de database:
 * de browser kan geen bedragen of ontvangeradressen manipuleren.
 */
export async function persistOrder(input: OrderInput): Promise<OrderResult> {
  const { dbAdmin } = await import("@/lib/db-admin.server");

  const ids = [...new Set(input.items.map((i) => i.product_id))];
  const { data: products, error: pErr } = await dbAdmin
    .from("products")
    .select("id, title, price_cents, stock_quantity")
    .eq("organisation_id", ORG_ID)
    .in("id", ids);
  if (pErr) throw pErr;
  if (!products || products.length !== ids.length) {
    throw new Error("Een of meer producten bestaan niet meer.");
  }

  const lines = input.items.map((item) => {
    const product = products.find((p) => p.id === item.product_id)!;
    // De verpakkingstoeslag komt nooit rechtstreeks van de browser: we leiden
    // hem af uit de servercatalogus op basis van de gekozen verpakkingsoptie.
    const allowed = packagingOptionsForId(product.id);
    const chosen = item.packaging_id
      ? (allowed.find((o) => o.id === item.packaging_id) ?? null)
      : null;
    if (item.packaging_id && !chosen) {
      throw new Error("Ongeldige verpakkingsoptie.");
    }
    const offset = chosen?.priceOffset ?? 0;
    const unit = product.price_cents + offset;
    if (unit < 0) throw new Error("Ongeldige prijs.");
    return {
      product_id: product.id,
      titel: product.title,
      quantity: item.quantity,
      price_at_purchase_cents: unit,
    };
  });

  const subtotal = lines.reduce((s, l) => s + l.price_at_purchase_cents * l.quantity, 0);
  // De verpakkingstoeslag komt uit de servertabel, nooit uit de browser.
  const packagingChoice = input.packaging_choice ?? "own_container";
  const packagingFeeCents = PACKAGING_FEES_CENTS[packagingChoice] ?? 0;
  const packagingOption = PACKAGING_OPTION[packagingChoice] ?? "BYO";
  const total = subtotal + packagingFeeCents;

  // Betalen bij afhaling kan enkel wanneer de beheerder dat heeft ingeschakeld.
  const payOnPickup = input.method === "on_pickup";
  let payOnPickupNotice: string | undefined;
  if (payOnPickup) {
    const { loadSiteConfig } = await import("./site-config.server");
    const cfg = await loadSiteConfig();
    if (!cfg.payments.payOnPickupEnabled) {
      throw new Error("Betalen bij afhaling is momenteel niet mogelijk.");
    }
    payOnPickupNotice = cfg.payments.payOnPickupNotice;
  }
  const paymentStatus: "pending" | "pending_pickup" = payOnPickup ? "pending_pickup" : "pending";

  const pickup = input.pickup_iso ? new Date(input.pickup_iso) : new Date(Date.now() + 86_400_000);

  // Unieke publieke referentie (MP-2026-8F3A2); botsingen zijn zeldzaam maar
  // worden hier alsnog opgevangen vóór het opslaan.
  const orderReference = await reserveOrderReference();

  const { data: order, error: oErr } = await dbAdmin
    .from("orders")
    .insert({
      organisation_id: ORG_ID,
      structured_communication: "pending",
      order_reference: orderReference,
      total_price_cents: total,
      pickup_slot: pickup.toISOString(),
      payment_status: paymentStatus,
      payment_method: input.method,
      customer_email: input.email,
      customer_name: input.naam ?? null,
      lang: input.lang ?? "nl",
      packaging_option: packagingOption,
    })
    .select("id, pickup_uuid")
    .single();
  if (oErr) throw oErr;

  // Beveiligde afhaalpas: UUID (nooit het volgnummer) + HMAC-token.
  let pickupQrUrl: string | null = null;
  let pickupPassUrl: string | null = null;
  try {
    const pickupUuid = String((order as { pickup_uuid?: string }).pickup_uuid ?? "");
    if (pickupUuid) {
      const { pickupLinks } = await import("./orders/secure-qr");
      const { mailOrigin } = await import("./email-shell");
      const links = await pickupLinks(pickupUuid, mailOrigin());
      pickupQrUrl = links.qrImageUrl;
      pickupPassUrl = links.passUrl;
    }
  } catch (err) {
    console.error("[order] afhaal-QR ondertekenen mislukt", err);
  }

  const communication = structuredCommunication(1, order.id);
  const { error: uErr } = await dbAdmin
    .from("orders")
    .update({ structured_communication: communication })
    .eq("id", order.id);
  if (uErr) throw uErr;


  const { error: iErr } = await dbAdmin.from("order_items").insert(
    lines.map((l) => ({
      order_id: order.id,
      product_id: l.product_id,
      quantity: l.quantity,
      price_at_purchase_cents: l.price_at_purchase_cents,
    })),
  );
  if (iErr) throw iErr;

  const { logSubmission, markSubmission } = await import(
    "./email-settings.server"
  );
  const orderLines = lines.map((l) => ({
    titel: l.titel,
    aantal: l.quantity,
    prijs_cent: l.price_at_purchase_cents,
  }));

  // Elke bestelling wordt eerst gelogd, zodat het webshopteam ze altijd terugvindt.
  const submissionId = await logSubmission({
    form: "webshop",
    category: "webshop",
    name: input.naam,
    email: input.email,
    subject: `Bestelling ${orderReference}`,
    message: orderLines.map((l) => `${l.aantal} × ${l.titel}`).join("\n"),
    payload: {
      order_id: order.id,
      order_reference: orderReference,

      afhaalmoment: input.afhaalmoment,
      totaal_cent: total,
      packaging_choice: packagingChoice,
      packaging_option: packagingOption,
      packaging_fee_cent: packagingFeeCents,
      payment_status: paymentStatus,
    },
  });

  let emailed = false;
  try {
    const { orderEmail, noticeEmail } = await import("./email.server");
    const { dispatchSubmission } = await import("./email-service.server");
    // Bij overschrijving krijgt de klant de rekeninggegevens mee; online
    // betalingen zijn al voldaan en tonen die blok niet.
    let bank: { begunstigde: string; iban: string; bic: string } | undefined;
    if (input.method === "manual_iban") {
      const { getOrganisation } = await import("./organisation.server");
      const org = await getOrganisation();
      bank = { begunstigde: org.naam, iban: org.iban, bic: org.bic };
    }
    const receipt = orderEmail({
      naam: input.naam,
      ...(bank ? { bank } : {}),
      ordernummer: orderReference,
      code: communication,
      afhaalmoment: input.afhaalmoment,
      totaal_cent: total,
      lang: input.lang ?? "nl",
      lijnen: orderLines,
      qrUrl: pickupQrUrl ?? undefined,
      passUrl: pickupPassUrl ?? undefined,
      byo: packagingOption === "BYO",
      ...(payOnPickup ? { payOnPickup: { notice: payOnPickupNotice ?? "" } } : {}),
    });
    const notice = noticeEmail({
      title: `Nieuwe bestelling ${orderReference}`,

      message: [
        `Naam: ${input.naam}`,
        `E-mail: ${input.email}`,
        `Afhaalmoment: ${input.afhaalmoment}`,
        `Mededeling: ${communication}`,
        `Verpakking: ${packagingOption} (€ ${(packagingFeeCents / 100).toFixed(2)})`,
        `Betaling: ${payOnPickup ? "TE BETALEN BIJ AFHALING" : input.method}`,
        ``,
        ...orderLines.map((l) => `${l.aantal} × ${l.titel}`),
        ``,
        `Totaal: € ${(total / 100).toFixed(2)}`,
      ].join("\n"),
    });
    const out = await dispatchSubmission({
      submissionId,
      category: "webshop",
      admin: { subject: notice.subject, html: notice.html },
      customer: { to: input.email, subject: receipt.subject, html: receipt.html },
      replyTo: input.email,
      kind: "bestelling",
    });
    emailed = out.status !== "failed";
  } catch (err) {
    emailed = false;
    await markSubmission(submissionId, "failed", { error: (err as Error).message });
  }


  const { orderPayToken } = await import("./order-pay-token.server");
  return {
    order_id: order.id,
    pay_token: await orderPayToken(order.id),
    order_reference: orderReference,
    packaging_fee_cents: packagingFeeCents,
    structured_communication: communication,
    total_price_cents: total,
    emailed,
    payment_status: paymentStatus,
    packaging_option: packagingOption,
    pickup_qr_url: pickupQrUrl,
    pickup_pass_url: pickupPassUrl,
  };

}
