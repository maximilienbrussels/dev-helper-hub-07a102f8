/**
 * A4-factuur (PDF) voor zaalverhuur, teambuilding en privatiseringen.
 * Server-only; het resultaat is base64 en gaat als bijlage mee met Brevo.
 */
import { LEGAL_ENTITY } from "@/lib/legal-content";

export type InvoiceLine = { description: string; amountCent: number };

export type InvoiceData = {
  reference: string;
  issuedAt: Date;
  customerName: string;
  customerEmail: string;
  customerAddress?: string;
  lines: InvoiceLine[];
  vatRate: number;
  lang: "nl" | "fr" | "en";
  iban?: string;
  bic?: string;
  note?: string;
};

const COPY = {
  nl: {
    title: "FACTUUR",
    ref: "Factuurnummer",
    date: "Factuurdatum",
    billed: "Gefactureerd aan",
    desc: "Omschrijving",
    excl: "Bedrag excl. btw",
    subtotal: "Subtotaal excl. btw",
    vat: "Btw",
    total: "Totaal te betalen",
    paid: "Betaald via Stripe — dit document dient als bewijs van betaling.",
    vatNr: "Ondernemingsnummer / btw",
  },
  fr: {
    title: "FACTURE",
    ref: "Numéro de facture",
    date: "Date de facture",
    billed: "Facturé à",
    desc: "Description",
    excl: "Montant hors TVA",
    subtotal: "Sous-total hors TVA",
    vat: "TVA",
    total: "Total à payer",
    paid: "Payé via Stripe — ce document tient lieu de preuve de paiement.",
    vatNr: "Numéro d'entreprise / TVA",
  },
  en: {
    title: "INVOICE",
    ref: "Invoice number",
    date: "Invoice date",
    billed: "Billed to",
    desc: "Description",
    excl: "Amount excl. VAT",
    subtotal: "Subtotal excl. VAT",
    vat: "VAT",
    total: "Total due",
    paid: "Paid via Stripe — this document serves as proof of payment.",
    vatNr: "Company / VAT number",
  },
} as const;

const money = (cent: number) => `€ ${(cent / 100).toFixed(2).replace(".", ",")}`;

/** Berekent subtotaal, btw en totaal (bedragen zijn inclusief btw). */
export function invoiceTotals(lines: InvoiceLine[], vatRate: number) {
  const totalCent = lines.reduce((sum, line) => sum + line.amountCent, 0);
  const netCent = Math.round(totalCent / (1 + vatRate / 100));
  return { netCent, vatCent: totalCent - netCent, totalCent };
}

/** Bouwt de A4-factuur en geeft die terug als base64-PDF. */
export async function buildInvoicePdfBase64(data: InvoiceData): Promise<string | null> {
  try {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const t = COPY[data.lang] ?? COPY.nl;
    const totals = invoiceTotals(data.lines, data.vatRate);
    const left = 18;
    let y = 22;

    doc.setFont("helvetica", "bold").setFontSize(18);
    doc.text(t.title, left, y);
    doc.setFont("helvetica", "normal").setFontSize(10);
    y += 10;
    doc.text(`${t.ref}: ${data.reference}`, left, y);
    y += 5;
    doc.text(`${t.date}: ${data.issuedAt.toISOString().slice(0, 10)}`, left, y);

    // Ondernemingsgegevens rechtsboven.
    doc.setFontSize(9);
    const right = 192;
    let ry = 22;
    for (const line of [
      LEGAL_ENTITY.name,
      LEGAL_ENTITY.address,
      `${t.vatNr}: ${LEGAL_ENTITY.vat}`,
      data.iban ? `IBAN: ${data.iban}` : "",
      data.bic ? `BIC: ${data.bic}` : "",
      "hallo@maximilien.brussels",
    ].filter(Boolean)) {
      doc.text(String(line), right, ry, { align: "right" });
      ry += 4.5;
    }

    y += 14;
    doc.setFont("helvetica", "bold").setFontSize(10).text(t.billed, left, y);
    doc.setFont("helvetica", "normal");
    y += 5;
    for (const line of [data.customerName, data.customerAddress ?? "", data.customerEmail].filter(
      Boolean,
    )) {
      doc.text(String(line), left, y);
      y += 5;
    }

    y += 8;
    doc.setDrawColor(180).line(left, y, right, y);
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.text(t.desc, left, y);
    doc.text(t.excl, right, y, { align: "right" });
    doc.setFont("helvetica", "normal");
    y += 3;
    doc.line(left, y, right, y);
    y += 7;

    for (const line of data.lines) {
      const net = Math.round(line.amountCent / (1 + data.vatRate / 100));
      doc.text(doc.splitTextToSize(line.description, 120) as string[], left, y);
      doc.text(money(net), right, y, { align: "right" });
      y += 7;
    }

    y += 3;
    doc.line(120, y, right, y);
    y += 6;
    doc.text(t.subtotal, 120, y);
    doc.text(money(totals.netCent), right, y, { align: "right" });
    y += 6;
    doc.text(`${t.vat} ${data.vatRate}%`, 120, y);
    doc.text(money(totals.vatCent), right, y, { align: "right" });
    y += 7;
    doc.setFont("helvetica", "bold");
    doc.text(t.total, 120, y);
    doc.text(money(totals.totalCent), right, y, { align: "right" });
    doc.setFont("helvetica", "normal").setFontSize(9);

    y += 12;
    doc.text(t.paid, left, y);
    if (data.note) {
      y += 6;
      doc.text(doc.splitTextToSize(data.note, 170) as string[], left, y);
    }

    const output = doc.output("datauristring");
    return output.split(",")[1] ?? null;
  } catch (error) {
    console.error("[invoice-pdf] genereren mislukt", error);
    return null;
  }
}
