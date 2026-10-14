/**
 * Gebrande A4-factuur voor webshopbestellingen (server-only gebruik).
 *
 * Bedragen zijn altijd inclusief btw; de netto- en btw-bedragen worden per
 * regel teruggerekend. Het resultaat is base64 zodat het rechtstreeks als
 * Brevo-bijlage kan meegaan én naar Scaleway Object Storage kan.
 */
import { LEGAL_ENTITY } from "@/lib/legal-content";

export type InvoiceItem = {
  description: string;
  quantity: number;
  /** Eenheidsprijs inclusief btw, in cent. */
  unitPriceCent: number;
  /** Btw-tarief in procent (6 voor voeding, 21 voor overige). */
  vatRate: number;
};

export type WebshopInvoiceData = {
  invoiceNumber: string;
  issuedAt: Date;
  customerName: string;
  customerEmail: string;
  customerAddress?: string;
  paymentMethod: string;
  reference?: string;
  /** Publieke bestelreferentie (MP-2026-8F3A2). */
  orderReference?: string;
  /** Betaald of nog in afwachting: bepaalt de badge en de voettekst. */
  paid?: boolean;
  items: InvoiceItem[];
  lang: "nl" | "fr" | "en";
};

export type InvoiceTotals = {
  netCent: number;
  vatCent: number;
  totalCent: number;
  perRate: { rate: number; netCent: number; vatCent: number }[];
};

const COPY = {
  nl: {
    title: "FACTUUR",
    number: "Factuurnummer",
    date: "Betaaldatum",
    method: "Betaalwijze",
    ref: "Mededeling",
    billed: "Gefactureerd aan",
    desc: "Omschrijving",
    qty: "Aantal",
    unit: "Eenheidsprijs",
    lineTotal: "Totaal",
    subtotal: "Subtotaal excl. btw",
    vat: "Btw",
    total: "Totaal betaald (incl. btw)",
    paid: "Betaald via Stripe — dit document geldt als betalingsbewijs.",
    thanks:
      "Dank je wel voor je aankoop op de stadsboerderij. Je steunt lokale, seizoensgebonden en verpakkingsarme landbouw midden in Brussel.",
    legal: "Vrijgesteld van zegelrecht. Klachten binnen 8 dagen na factuurdatum.",
    vatNr: "Ondernemingsnummer / btw",
    orderRef: "Bestelreferentie",
    totalDue: "Totaal te betalen (incl. btw)",
    issued: "Factuurdatum",
    badgePaid: "BETAALD",
    badgePending: "IN AFWACHTING VAN BETALING",
    vatRate: "Btw",
    paidVia: (m: string) => `Betaald via ${m}`,
    pendingVia: (m: string) => `Te betalen via ${m}`,
    pendingNote: "Deze factuur is nog niet voldaan. Gebruik de bestelreferentie als mededeling.",
  },
  fr: {
    title: "FACTURE",
    number: "Numéro de facture",
    date: "Date de paiement",
    method: "Moyen de paiement",
    ref: "Communication",
    billed: "Facturé à",
    desc: "Description",
    qty: "Quantité",
    unit: "Prix unitaire",
    lineTotal: "Total",
    subtotal: "Sous-total hors TVA",
    vat: "TVA",
    total: "Total payé (TVA comprise)",
    paid: "Payé via Stripe — ce document tient lieu de preuve de paiement.",
    thanks:
      "Merci pour votre achat à la ferme urbaine. Vous soutenez une agriculture locale, de saison et sans emballage superflu au cœur de Bruxelles.",
    legal: "Réclamations dans les 8 jours suivant la date de facture.",
    vatNr: "Numéro d'entreprise / TVA",
    orderRef: "Référence de commande",
    totalDue: "Total à payer (TVA incl.)",
    issued: "Date de facture",
    badgePaid: "PAYÉ",
    badgePending: "EN ATTENTE DE PAIEMENT",
    vatRate: "TVA",
    paidVia: (m: string) => `Payé via ${m}`,
    pendingVia: (m: string) => `À payer via ${m}`,
    pendingNote: "Cette facture n'est pas encore payée. Utilisez la référence de commande en communication.",
  },
  en: {
    title: "INVOICE",
    number: "Invoice number",
    date: "Payment date",
    method: "Payment method",
    ref: "Reference",
    billed: "Billed to",
    desc: "Description",
    qty: "Qty",
    unit: "Unit price",
    lineTotal: "Total",
    subtotal: "Subtotal excl. VAT",
    vat: "VAT",
    total: "Total paid (incl. VAT)",
    paid: "Paid via Stripe — this document serves as proof of payment.",
    thanks:
      "Thank you for shopping at the city farm. You support local, seasonal and low-packaging agriculture in the heart of Brussels.",
    legal: "Complaints within 8 days of the invoice date.",
    vatNr: "Company / VAT number",
    orderRef: "Order reference",
    totalDue: "Total due (incl. VAT)",
    issued: "Invoice date",
    badgePaid: "PAID",
    badgePending: "AWAITING PAYMENT",
    vatRate: "VAT",
    paidVia: (m: string) => `Paid via ${m}`,
    pendingVia: (m: string) => `To be paid via ${m}`,
    pendingNote: "This invoice is not settled yet. Use the order reference as payment reference.",
  },
} as const;

const money = (cent: number) => `€ ${(cent / 100).toFixed(2).replace(".", ",")}`;

/** `INV-2026-0042` — jaartal plus het bestelnummer, dus altijd uniek en stabiel. */
export function invoiceNumber(orderId: number, issuedAt: Date = new Date()): string {
  return `INV-${issuedAt.getFullYear()}-${String(orderId).padStart(4, "0")}`;
}

/** Netto, btw en totaal — per tarief en globaal. */
export function invoiceTotals(items: InvoiceItem[]): InvoiceTotals {
  const buckets = new Map<number, { netCent: number; vatCent: number }>();
  let totalCent = 0;
  for (const item of items) {
    const gross = item.unitPriceCent * item.quantity;
    const net = Math.round(gross / (1 + item.vatRate / 100));
    const bucket = buckets.get(item.vatRate) ?? { netCent: 0, vatCent: 0 };
    bucket.netCent += net;
    bucket.vatCent += gross - net;
    buckets.set(item.vatRate, bucket);
    totalCent += gross;
  }
  const perRate = [...buckets.entries()]
    .map(([rate, value]) => ({ rate, ...value }))
    .sort((a, b) => a.rate - b.rate);
  return {
    netCent: perRate.reduce((s, r) => s + r.netCent, 0),
    vatCent: perRate.reduce((s, r) => s + r.vatCent, 0),
    totalCent,
    perRate,
  };
}

/** Bouwt de A4-factuur en geeft die terug als base64-PDF (null bij fout). */
export async function buildWebshopInvoicePdf(data: WebshopInvoiceData): Promise<string | null> {
  try {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const t = COPY[data.lang] ?? COPY.nl;
    const totals = invoiceTotals(data.items);
    const paid = data.paid !== false;

    // Huisstijl: donkergroene accenten op wit papier.
    const GREEN: [number, number, number] = [27, 67, 50];
    const MINT: [number, number, number] = [232, 245, 233];
    const AMBER: [number, number, number] = [180, 118, 20];
    const GREY: [number, number, number] = [110, 116, 112];

    const left = 18;
    const right = 192;
    const width = right - left;

    // ---------------------------------------------------------------- kop
    doc.setFillColor(...GREEN).rect(0, 0, 210, 34, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold").setFontSize(15).text(LEGAL_ENTITY.name, left, 15);
    doc.setFont("helvetica", "normal").setFontSize(8.5);
    doc.text(LEGAL_ENTITY.address, left, 21);
    doc.text(`${t.vatNr}: ${LEGAL_ENTITY.vat}`, left, 25.5);
    doc.text("contact@maximilien.brussels — maximilien.brussels", left, 30);
    doc.setFont("helvetica", "bold").setFontSize(20).text(t.title, right, 17, { align: "right" });
    doc.setFont("helvetica", "normal").setFontSize(9);
    doc.text(data.invoiceNumber, right, 24, { align: "right" });

    doc.setTextColor(30, 30, 30);

    // -------------------------------------------------- badge + metagegevens
    const badge = paid ? t.badgePaid : t.badgePending;
    const badgeColor = paid ? GREEN : AMBER;
    doc.setFont("helvetica", "bold").setFontSize(8.5);
    const badgeWidth = doc.getTextWidth(badge) + 10;
    doc.setFillColor(...badgeColor).roundedRect(right - badgeWidth, 42, badgeWidth, 8, 2, 2, "F");
    doc.setTextColor(255, 255, 255).text(badge, right - badgeWidth / 2, 47.4, { align: "center" });
    doc.setTextColor(30, 30, 30);

    doc.setFont("helvetica", "bold").setFontSize(9.5).text(t.billed, left, 46);
    doc.setFont("helvetica", "normal").setFontSize(9);
    let y = 51.5;
    for (const line of [data.customerName, data.customerAddress ?? "", data.customerEmail].filter(
      Boolean,
    )) {
      doc.text(String(line), left, y);
      y += 4.8;
    }

    let my = 56;
    doc.setFontSize(9);
    for (const [label, value] of [
      [t.number, data.invoiceNumber],
      [t.orderRef, data.orderReference ?? "—"],
      [t.issued, data.issuedAt.toISOString().slice(0, 10)],
      [t.method, data.paymentMethod],
      ...(data.reference ? [[t.ref, data.reference]] : []),
    ] as [string, string][]) {
      doc.setTextColor(...GREY).text(label, right - 52, my, { align: "right" });
      doc.setTextColor(30, 30, 30).setFont("helvetica", "bold");
      doc.text(String(value), right, my, { align: "right" });
      doc.setFont("helvetica", "normal");
      my += 5;
    }

    y = Math.max(y, my) + 8;

    // ------------------------------------------------------------- tabelkop
    const colQty = 112;
    const colUnit = 138;
    const colVat = 158;
    doc.setFillColor(...MINT).rect(left, y - 5.5, width, 8, "F");
    doc.setFont("helvetica", "bold").setFontSize(8.5).setTextColor(...GREEN);
    doc.text(t.desc, left + 2, y);
    doc.text(t.qty, colQty, y, { align: "right" });
    doc.text(t.unit, colUnit, y, { align: "right" });
    doc.text(t.vatRate, colVat, y, { align: "right" });
    doc.text(t.lineTotal, right - 2, y, { align: "right" });
    doc.setFont("helvetica", "normal").setTextColor(30, 30, 30).setFontSize(9);
    y += 8;

    for (const item of data.items) {
      const label = doc.splitTextToSize(item.description, 88) as string[];
      const net = Math.round(item.unitPriceCent / (1 + item.vatRate / 100));
      doc.text(label, left + 2, y);
      doc.text(String(item.quantity), colQty, y, { align: "right" });
      doc.text(money(net), colUnit, y, { align: "right" });
      doc.text(`${item.vatRate}%`, colVat, y, { align: "right" });
      doc.text(money(item.unitPriceCent * item.quantity), right - 2, y, { align: "right" });
      const rowHeight = Math.max(6.5, label.length * 4.6);
      doc.setDrawColor(226, 232, 226).line(left, y + rowHeight - 4, right, y + rowHeight - 4);
      y += rowHeight;
      if (y > 240) {
        doc.addPage();
        y = 25;
      }
    }

    // -------------------------------------------------------------- totalen
    y += 6;
    const totalsLeft = 120;
    doc.setFontSize(9);
    doc.text(t.subtotal, totalsLeft, y);
    doc.text(money(totals.netCent), right, y, { align: "right" });
    for (const rate of totals.perRate) {
      y += 5.5;
      doc.text(`${t.vat} ${rate.rate}%`, totalsLeft, y);
      doc.text(money(rate.vatCent), right, y, { align: "right" });
    }
    y += 4;
    doc.setFillColor(...MINT).rect(totalsLeft - 4, y, right - totalsLeft + 6, 11, "F");
    y += 7.5;
    doc.setFont("helvetica", "bold").setFontSize(10.5).setTextColor(...GREEN);
    doc.text(paid ? t.total : t.totalDue, totalsLeft, y);
    doc.text(money(totals.totalCent), right, y, { align: "right" });
    doc.setFont("helvetica", "normal").setTextColor(30, 30, 30).setFontSize(9);

    // ------------------------------------------------------------- voettekst
    y += 14;
    doc.text(paid ? t.paidVia(data.paymentMethod) : t.pendingVia(data.paymentMethod), left, y);
    if (!paid) {
      y += 5.5;
      doc.setTextColor(...AMBER).text(doc.splitTextToSize(t.pendingNote, 170) as string[], left, y);
      doc.setTextColor(30, 30, 30);
    }
    y += 8;
    doc.setFillColor(...MINT).rect(left, y - 5, width, 14, "F");
    doc.setTextColor(...GREEN).setFontSize(8.5);
    doc.text(doc.splitTextToSize(t.thanks, width - 8) as string[], left + 4, y);
    doc.setTextColor(...GREY).setFontSize(7.5);
    doc.text(`${LEGAL_ENTITY.name} — ${LEGAL_ENTITY.vat} — ${t.legal}`, left, 287);

    const output = doc.output("datauristring");
    return output.split(",")[1] ?? null;
  } catch (error) {
    console.error("[invoice-generator] genereren mislukt", error);
    return null;
  }
}


/** Bewaart de factuur in de bucket (`invoices/INV-XXXX.pdf`); null bij fout. */
export async function storeInvoicePdf(
  invoiceNr: string,
  base64: string,
): Promise<string | null> {
  try {
    const { putObject } = await import("@/lib/s3.server");
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return await putObject({
      fileKey: `invoices/${invoiceNr}.pdf`,
      body: bytes,
      contentType: "application/pdf",
    });
  } catch (error) {
    console.error("[invoice-generator] opslaan in objectopslag mislukt", error);
    return null;
  }
}
