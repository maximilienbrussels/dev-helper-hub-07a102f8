import { createFileRoute } from "@tanstack/react-router";

/** PDF-download van het Peter/Meterschap-certificaat. */
export const Route = createFileRoute("/api/sponsorship/certificate/$certificateId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const certificateId = String(params.certificateId ?? "");
        if (!certificateId) return new Response("Not found", { status: 404 });

        const { sponsorshipByCertificateId, tierById } = await import("@/lib/sponsorship.server");
        const row = await sponsorshipByCertificateId(certificateId);
        if (!row || row.status !== "paid") return new Response("Not found", { status: 404 });

        const { buildSponsorshipCertificatePdf } = await import("@/lib/sponsorship-cert.server");
        const tier = tierById(row.tier);
        const lang = (["nl", "fr", "en"].includes(row.lang) ? row.lang : "nl") as
          | "nl"
          | "fr"
          | "en";
        const pdf = await buildSponsorshipCertificatePdf({
          sponsorName: row.sponsor_name,
          animalName: row.animal_name,
          tierLabel: tier?.label[lang] ?? row.tier,
          certificateId: row.certificate_id ?? certificateId,
          date: row.paid_at ? new Date(row.paid_at) : new Date(row.created_at),
          lang,
        });

        return new Response(new Blob([pdf as BlobPart], { type: "application/pdf" }), {
          headers: {
            "content-type": "application/pdf",
            "content-disposition": `attachment; filename="certificaat-peter-meter-${certificateId}.pdf"`,
            "cache-control": "private, max-age=0, no-store",
          },
        });
      },
    },
  },
});
