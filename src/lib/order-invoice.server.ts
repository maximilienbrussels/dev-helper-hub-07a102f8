/**
 * Afhandeling van een betaalde webshopbestelling:
 *   1. bestelling in Neon van `pending` naar `paid`,
 *   2. gebrande PDF-factuur genereren (`INV-2026-XXXX`),
 *   3. kopie bewaren in de bucket (`invoices/INV-XXXX.pdf`),
 *   4. bevestigingsmail met PDF-bijlage naar de klant én naar de webshopinbox.
 *
 * Server-only. De functie werpt nooit: een mislukte mail mag een geslaagde
 * betaling nooit ongedaan maken; alles komt in het serverlog terecht.
 */
import { brevoEnv, brevoReplyTo, brevoSender } from "@/lib/brevo";
import type { InvoiceItem } from "@/lib/invoice-generator";

export type OrderInvoiceResult = {
  invoiceNumber: string | null;
  pdfUrl: string | null;
  emailed: boolean;
  skipped?: "already_paid" | "unknown_order";
};

type BrevoAttachment = { name: string; content: string };

/** Eén Brevo-mail met optionele PDF-bijlage; `false` bij elke fout. */
async function sendBrevoMail(opts: {
  to: string[];
  subject: string;
  html: string;
  attachment?: BrevoAttachment[];
  replyTo?: string;
}): Promise<boolean> {
  const apiKey = brevoEnv("BREVO_API_KEY");
  if (!apiKey) {
    console.warn("[order-invoice] BREVO_API_KEY ontbreekt — mail overgeslagen");
    return false;
  }
  try {
    const { brevoRoute } = await import("@/lib/brevo");
    const route = brevoRoute(apiKey, brevoEnv("LOVABLE_API_KEY"));
    const response = await fetch(route.url("smtp/email"), {
      method: "POST",
      headers: route.headers,
      body: JSON.stringify({
        sender: brevoSender(),
        replyTo: brevoReplyTo(opts.replyTo),
        to: opts.to.filter(Boolean).map((email) => ({ email })),
        subject: opts.subject,
        htmlContent: opts.html,
        ...(opts.attachment?.length ? { attachment: opts.attachment } : {}),
      }),
    });
    if (!response.ok) {
      console.error(
        `[order-invoice] Brevo ${response.status}: ${(await response.text()).slice(0, 400)}`,
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error("[order-invoice] Brevo-oproep mislukt", error);
    return false;
  }
}

/** Leesbare betaalwijze voor op de factuur. */
function methodLabel(method: string | null | undefined): string {
  const map: Record<string, string> = {
    bancontact: "Stripe — Bancontact",
    card: "Stripe — Kaart (Visa/Mastercard)",
    ideal: "Stripe — iDEAL",
    wero: "Stripe — Wero",
    cartes_bancaires: "Stripe — Cartes Bancaires",
    sepa_credit_transfer: "Stripe — SEPA-overschrijving",
  };
  return map[String(method ?? "")] ?? "Stripe";
}

/**
 * Zet de bestelling op betaald en start de factuur- en mailpijplijn.
 * Idempotent: een tweede webhook voor dezelfde bestelling doet niets meer.
 */
export async function finalizePaidOrder(input: {
  orderId: number;
  paymentMethod?: string | null;
  lang?: "nl" | "fr" | "en";
}): Promise<OrderInvoiceResult> {
  const { dbAdmin } = await import("@/lib/db-admin.server");

  const { data: order, error } = await dbAdmin
    .from("orders")
    .select(
      "id, order_reference, total_price_cents, customer_email, customer_name, payment_status, payment_method, structured_communication, pickup_slot, lang",
    )
    .eq("id", input.orderId)
    .single();
  if (error || !order) {
    console.error("[order-invoice] onbekende bestelling", input.orderId, error);
    return { invoiceNumber: null, pdfUrl: null, emailed: false, skipped: "unknown_order" };
  }
  if (order.payment_status === "paid") {
    return { invoiceNumber: null, pdfUrl: null, emailed: false, skipped: "already_paid" };
  }

  await dbAdmin
    .from("orders")
    .update({
      payment_status: "paid",
      paid_at: new Date().toISOString(),
      ...(input.paymentMethod ? { payment_method: input.paymentMethod } : {}),
    })
    .eq("id", order.id);

  // Bestellijnen met producttitels ophalen.
  const { data: rows } = await dbAdmin
    .from("order_items")
    .select("quantity, price_at_purchase_cents, product_id")
    .eq("order_id", order.id);
  const lines = rows ?? [];
  const productIds = [...new Set(lines.map((l) => l.product_id).filter(Boolean))] as number[];
  const { data: products } = productIds.length
    ? await dbAdmin.from("products").select("id, title").in("id", productIds)
    : { data: [] as { id: number; title: string }[] };

  const items: InvoiceItem[] = lines.map((line) => ({
    description: products?.find((p) => p.id === line.product_id)?.title ?? "Hoevewinkelproduct",
    quantity: line.quantity,
    unitPriceCent: line.price_at_purchase_cents,
    vatRate: 6,
  }));

  // Het verschil met het ordertotaal is de verpakkingstoeslag (21% btw).
  const itemsTotal = items.reduce((sum, i) => sum + i.unitPriceCent * i.quantity, 0);
  const extra = order.total_price_cents - itemsTotal;
  if (extra > 0) {
    items.push({ description: "Verpakking", quantity: 1, unitPriceCent: extra, vatRate: 21 });
  }

  const lang = (input.lang ??
    (["nl", "fr", "en"].includes(String(order.lang)) ? order.lang : "nl")) as "nl" | "fr" | "en";
  const method = methodLabel(input.paymentMethod ?? order.payment_method);
  const customerEmail = String(order.customer_email ?? "");
  const customerName = String(order.customer_name ?? customerEmail.split("@")[0] ?? "");

  const { buildWebshopInvoicePdf, invoiceNumber, storeInvoicePdf } = await import(
    "@/lib/invoice-generator"
  );
  const issuedAt = new Date();
  const { invoiceNumberForReference, displayOrderReference } = await import(
    "@/lib/order-reference"
  );
  const reference = displayOrderReference(order.order_reference as string | null, order.id);
  // Factuurnummer volgt exact de bestelreferentie: MP-2026-8F3A2 → INV-2026-8F3A2.
  const invoiceNr = order.order_reference
    ? invoiceNumberForReference(String(order.order_reference))
    : invoiceNumber(order.id, issuedAt);
  const pdf = await buildWebshopInvoicePdf({
    invoiceNumber: invoiceNr,
    orderReference: reference,
    paid: true,
    issuedAt,
    customerName,
    customerEmail,
    paymentMethod: method,
    ...(order.structured_communication
      ? { reference: String(order.structured_communication) }
      : {}),
    items,
    lang,
  });
  const pdfUrl = pdf ? await storeInvoicePdf(invoiceNr, pdf) : null;
  // Factuurnummer en downloadlink bewaren voor het klantenportaal.
  await dbAdmin
    .from("orders")
    .update({ invoice_number: invoiceNr, ...(pdfUrl ? { invoice_url: pdfUrl } : {}) })
    .eq("id", order.id)
    .then((r) => {
      if (r.error) console.error("[order-invoice] invoice_url bewaren mislukt", r.error);
    });
  const attachment: BrevoAttachment[] = pdf
    ? [{ name: `Factuur-${invoiceNr}.pdf`, content: pdf }]
    : [];

  // Mails opbouwen met de bestaande huisstijlsjablonen.
  const { orderEmail, noticeEmail } = await import("@/lib/email.server");
  const receipt = orderEmail({
    naam: customerName,
    ordernummer: reference,
    code: String(order.structured_communication ?? ""),
    afhaalmoment: order.pickup_slot ? new Date(order.pickup_slot).toLocaleString("nl-BE") : "",
    totaal_cent: order.total_price_cents,
    lang,
    lijnen: items.map((i) => ({
      titel: i.description,
      aantal: i.quantity,
      prijs_cent: i.unitPriceCent,
    })),
  });
  const notice = noticeEmail({
    title: `Betaalde bestelling ${reference} — ${invoiceNr}`,
    message: [
      `Klant: ${customerName} <${customerEmail}>`,
      `Betaalwijze: ${method}`,
      `Mededeling: ${order.structured_communication ?? "—"}`,
      pdfUrl ? `Factuur: ${pdfUrl}` : "Factuur: enkel als bijlage",
      ``,
      ...items.map((i) => `${i.quantity} × ${i.description}`),
      ``,
      `Totaal: € ${(order.total_price_cents / 100).toFixed(2)}`,
    ].join("\n"),
  });

  const { categoryRecipients } = await import("@/lib/email-service.server");
  const adminTo = await categoryRecipients("webshop");

  const customerSent = customerEmail
    ? await sendBrevoMail({
        to: [customerEmail],
        subject: `${receipt.subject} — ${invoiceNr}`,
        html: receipt.html,
        attachment,
      })
    : false;
  const adminSent = await sendBrevoMail({
    to: adminTo,
    subject: notice.subject,
    html: notice.html,
    attachment,
    ...(customerEmail ? { replyTo: customerEmail } : {}),
  });

  return { invoiceNumber: invoiceNr, pdfUrl, emailed: customerSent || adminSent };
}
