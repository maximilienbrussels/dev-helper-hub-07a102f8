/**
 * Afhaalpas (server-only): QR-PNG en A5-PDF voor één bestelling.
 * De QR bevat de ondertekende scan-URL (zie secure-qr.ts).
 */
import { pickupScanUrl } from "./secure-qr";

export type PickupPassOrder = {
  pickup_uuid: string;
  pickup_code: string | null;
  order_reference: string | null;
  customer_name: string | null;
  customer_email: string | null;
  pickup_slot: string;
  total_price_cents: number;
  payment_status: string;
  packaging_option: string | null;
  lang: string | null;
  items: { title: string; quantity: number; price_cents: number }[];
};

export const BYO_NOTICE = {
  nl: {
    title: "🌱 BRING YOUR OWN PACKAGING",
    body: "Vergeet niet je eigen herbruikbare zak, emmer of doos mee te brengen bij het ophalen op de stadsboerderij!",
  },
  fr: {
    title: "🌱 BRING YOUR OWN PACKAGING",
    body: "N'oubliez pas d'apporter votre propre sac, seau ou boîte réutilisable lors du retrait à la ferme urbaine !",
  },
  en: {
    title: "🌱 BRING YOUR OWN PACKAGING",
    body: "Don't forget to bring your own reusable bag, bucket or box when collecting at the city farm!",
  },
} as const;

export const PAYMENT_BADGE = {
  paid: { nl: "BETAALD", fr: "PAYÉ", en: "PAID", color: "#2F5D3A" },
  pending_pickup: {
    nl: "TE BETALEN BIJ AFHALING",
    fr: "À PAYER AU RETRAIT",
    en: "PAY ON PICKUP",
    color: "#B45309",
  },
  collected: { nl: "AFGEHAALD", fr: "RETIRÉ", en: "COLLECTED", color: "#2F5D3A" },
  pending: { nl: "WACHT OP BETALING", fr: "EN ATTENTE DE PAIEMENT", en: "AWAITING PAYMENT", color: "#6B7280" },
} as const;

export type PassLang = "nl" | "fr" | "en";

export function passLang(v: string | null | undefined): PassLang {
  return v === "fr" || v === "en" ? v : "nl";
}

export function paymentBadge(status: string, lang: PassLang): { label: string; color: string } {
  const b = (PAYMENT_BADGE as Record<string, { nl: string; fr: string; en: string; color: string }>)[status] ??
    PAYMENT_BADGE.pending;
  return { label: b[lang], color: b.color };
}

export function isByo(packagingOption: string | null | undefined): boolean {
  return !packagingOption || packagingOption === "BYO";
}

export async function pickupQrPng(orderUuid: string, token: string, size = 512): Promise<Buffer | null> {
  try {
    const QRCode = (await import("qrcode")).default;
    const dataUrl = await QRCode.toDataURL(pickupScanUrl(orderUuid, token), {
      width: size,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#1b3a24", light: "#ffffff" },
    });
    const b64 = dataUrl.split(",")[1];
    return b64 ? Buffer.from(b64, "base64") : null;
  } catch (error) {
    console.error("[pickup-pass] QR genereren mislukt", error);
    return null;
  }
}

const COPY = {
  nl: {
    title: "AFHAALPAS",
    ref: "Bestelling",
    pickup: "Afhaalmoment",
    total: "Totaal",
    items: "Inhoud",
    hint: "Toon deze QR-code aan het team op de stadsboerderij.",
    payHint: "Betaal contant of via Payconiq aan de kassa bij het ophalen.",
    where: "Maximilien · Quai du Batelage 4, 1000 Brussel",
  },
  fr: {
    title: "PASS DE RETRAIT",
    ref: "Commande",
    pickup: "Moment de retrait",
    total: "Total",
    items: "Contenu",
    hint: "Montrez ce QR code à l'équipe de la ferme urbaine.",
    payHint: "Payez en espèces ou via Payconiq à la caisse lors du retrait.",
    where: "Maximilien · Quai du Batelage 4, 1000 Bruxelles",
  },
  en: {
    title: "PICKUP PASS",
    ref: "Order",
    pickup: "Pickup time",
    total: "Total",
    items: "Contents",
    hint: "Show this QR code to the team at the city farm.",
    payHint: "Pay in cash or via Payconiq at the counter when collecting.",
    where: "Maximilien · Quai du Batelage 4, 1000 Brussels",
  },
} as const;

function euro(cents: number): string {
  return `€ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

/** A5 PDF met QR, status, BYO-herinnering en bestellijnen. */
export async function buildPickupPassPdf(
  order: PickupPassOrder,
  token: string,
  payOnPickupNotice?: string,
): Promise<Uint8Array | null> {
  try {
    const { jsPDF } = await import("jspdf");
    const lang = passLang(order.lang);
    const t = COPY[lang];
    const doc = new jsPDF({ unit: "mm", format: "a5" });
    const left = 14;
    const width = 148 - left * 2;
    let y = 18;

    doc.setFont("helvetica", "bold").setFontSize(18).setTextColor("#1b3a24");
    doc.text(t.title, left, y);
    doc.setFont("helvetica", "normal").setFontSize(9).setTextColor("#6B7280");
    y += 5;
    doc.text(t.where, left, y);

    // Statusbadge rechtsboven.
    const badge = paymentBadge(order.payment_status, lang);
    doc.setFillColor(badge.color);
    doc.setFont("helvetica", "bold").setFontSize(8).setTextColor("#ffffff");
    const bw = doc.getTextWidth(badge.label) + 8;
    doc.roundedRect(148 - left - bw, 12, bw, 8, 2, 2, "F");
    doc.text(badge.label, 148 - left - bw / 2, 17.3, { align: "center" });

    y += 10;
    doc.setTextColor("#1b3a24").setFont("helvetica", "normal").setFontSize(10);
    doc.text(`${t.ref}: ${order.order_reference ?? "—"}`, left, y);
    y += 5;
    const when = new Date(order.pickup_slot).toLocaleString(
      lang === "fr" ? "fr-BE" : lang === "en" ? "en-GB" : "nl-BE",
      { dateStyle: "full", timeStyle: "short" },
    );
    doc.text(`${t.pickup}: ${when}`, left, y);

    // QR
    const png = await pickupQrPng(order.pickup_uuid, token, 400);
    if (png) {
      const qrSize = 58;
      y += 6;
      doc.addImage(png.toString("base64"), "PNG", (148 - qrSize) / 2, y, qrSize, qrSize);
      y += qrSize + 4;
      if (order.pickup_code) {
        doc.setFont("helvetica", "bold").setFontSize(16).setTextColor("#1b3a24");
        doc.text(order.pickup_code, 74, y + 2, { align: "center" });
        y += 7;
      }
      doc.setFont("helvetica", "normal").setFontSize(8).setTextColor("#6B7280");
      doc.text(t.hint, 74, y, { align: "center" });
      y += 6;
    }

    // Betalen bij afhaling
    if (order.payment_status === "pending_pickup") {
      doc.setFillColor("#FEF3C7");
      doc.setDrawColor("#F59E0B");
      doc.roundedRect(left, y, width, 14, 2, 2, "FD");
      doc.setFont("helvetica", "bold").setFontSize(9).setTextColor("#92400E");
      doc.text(badge.label, left + 4, y + 5.5);
      doc.setFont("helvetica", "normal").setFontSize(8);
      const lines = doc.splitTextToSize(payOnPickupNotice?.trim() || t.payHint, width - 8) as string[];
      doc.text(lines.slice(0, 2), left + 4, y + 10);
      y += 18;
    }

    // BYO-herinnering
    if (isByo(order.packaging_option)) {
      doc.setFillColor("#ECFDF5");
      doc.setDrawColor("#2F5D3A");
      doc.roundedRect(left, y, width, 16, 2, 2, "FD");
      doc.setFont("helvetica", "bold").setFontSize(9).setTextColor("#1b3a24");
      doc.text(BYO_NOTICE[lang].title.replace("🌱 ", ""), left + 4, y + 5.5);
      doc.setFont("helvetica", "normal").setFontSize(8);
      const lines = doc.splitTextToSize(BYO_NOTICE[lang].body, width - 8) as string[];
      doc.text(lines.slice(0, 2), left + 4, y + 10);
      y += 20;
    }

    // Bestellijnen
    doc.setFont("helvetica", "bold").setFontSize(9).setTextColor("#1b3a24");
    doc.text(t.items, left, y);
    y += 5;
    doc.setFont("helvetica", "normal").setFontSize(8.5);
    for (const it of order.items.slice(0, 12)) {
      doc.text(`${it.quantity} × ${it.title}`, left, y);
      doc.text(euro(it.price_cents * it.quantity), 148 - left, y, { align: "right" });
      y += 4.5;
    }
    y += 2;
    doc.setFont("helvetica", "bold").setFontSize(10);
    doc.text(t.total, left, y);
    doc.text(euro(order.total_price_cents), 148 - left, y, { align: "right" });

    return new Uint8Array(doc.output("arraybuffer"));
  } catch (error) {
    console.error("[pickup-pass] PDF genereren mislukt", error);
    return null;
  }
}

/** Haalt de bestelling + lijnen op via het UUID (nooit via het volgnummer). */
export async function loadPickupOrder(orderUuid: string): Promise<(PickupPassOrder & { id: number }) | null> {
  const { dbAdmin } = await import("@/lib/db-admin.server");
  const { data: order, error } = await dbAdmin
    .from("orders")
    .select(
      "id, pickup_uuid, pickup_code, order_reference, customer_name, customer_email, pickup_slot, total_price_cents, payment_status, packaging_option, lang",
    )
    .eq("pickup_uuid", orderUuid.toLowerCase())
    .maybeSingle();
  if (error || !order) return null;

  const { data: rows } = await dbAdmin
    .from("order_items")
    .select("quantity, price_at_purchase_cents, product_id")
    .eq("order_id", order.id);
  const lines = rows ?? [];
  const ids = [...new Set(lines.map((l) => l.product_id).filter(Boolean))] as number[];
  const { data: products } = ids.length
    ? await dbAdmin.from("products").select("id, title").in("id", ids)
    : { data: [] as { id: number; title: string }[] };

  return {
    ...(order as PickupPassOrder & { id: number }),
    items: lines.map((l) => ({
      title: products?.find((p) => p.id === l.product_id)?.title ?? "Product",
      quantity: l.quantity,
      price_cents: l.price_at_purchase_cents,
    })),
  };
}
