/**
 * Client-side PDF-download van een geverifieerd certificaat, gegenereerd
 * met `jspdf` (zelfde bibliotheek als `pdf-invoice.server.ts`). Bewust géén
 * `window.print()`: dit levert een echt, deelbaar PDF-bestand op.
 *
 * Het blad draagt altijd het watermerk "geverifieerd exemplaar", zodat een
 * afdruk nooit met het originele certificaat verward kan worden.
 */
export type VerifiedCertPdfData = {
  code: string;
  naam: string;
  academy: string | null;
  score: string | null;
  behaaldOp: string;
  verifyUrl: string;
};

export async function downloadVerifiedCertificatePdf(data: VerifiedCertPdfData): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  const left = 24;
  let y = 40;

  // Watermerk eerst, zodat de tekst er leesbaar bovenop komt.
  doc.setFont("helvetica", "bold").setFontSize(56);
  doc.setTextColor(214, 222, 214);
  doc.text("GEVERIFIEERD EXEMPLAAR", 148, 120, { align: "center", angle: 24 });
  doc.setTextColor(20, 30, 22);

  doc.setFont("helvetica", "bold").setFontSize(11);
  doc.text("LA FERME DU PARC MAXIMILIEN", left, 24);
  doc.setFont("helvetica", "normal").setFontSize(9);
  doc.text("Stadsboerderij Maximiliaan · Brussel", left, 30);

  doc.setFont("helvetica", "bold").setFontSize(28);
  doc.text("Certificaat van deelname", left, y);
  y += 16;

  doc.setFont("helvetica", "normal").setFontSize(14);
  doc.text("Uitgereikt aan", left, y);
  y += 10;
  doc.setFont("helvetica", "bold").setFontSize(22);
  doc.text(data.naam || "—", left, y);
  y += 12;

  doc.setFont("helvetica", "normal").setFontSize(12);
  const date = new Date(data.behaaldOp).toLocaleDateString("nl-BE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  doc.text(`${data.academy ?? "—"} Academy · Score ${data.score ?? "—"} · Behaald op ${date}`, left, y);
  y += 18;

  doc.setFont("helvetica", "normal").setFontSize(10);
  doc.text(`Certificaatreferentie: #${data.code}`, left, y);
  y += 6;
  doc.text(`Verifieer online: ${data.verifyUrl}`, left, y);
  y += 6;
  doc.text(
    "Dit document is een geverifieerd exemplaar, afgedrukt via de publieke verificatiepagina.",
    left,
    y,
  );

  doc.save(`certificaat-${data.code}.pdf`);
}
