import { createFileRoute } from "@tanstack/react-router";

/** Downloadbare PDF-afhaalpas; vereist een geldig HMAC-token. */
export const Route = createFileRoute("/api/public/pickup/pass")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const orderId = url.searchParams.get("orderId") ?? "";
        const token = url.searchParams.get("token") ?? "";
        const { verifyPickupToken } = await import("@/lib/orders/secure-qr");
        if (!(await verifyPickupToken(orderId, token))) {
          return new Response("Not found", { status: 404 });
        }
        const { loadPickupOrder, buildPickupPassPdf } = await import(
          "@/lib/orders/pickup-pass.server"
        );
        const order = await loadPickupOrder(orderId);
        if (!order) return new Response("Not found", { status: 404 });

        let notice: string | undefined;
        try {
          const { loadSiteConfig } = await import("@/lib/site-config.server");
          notice = (await loadSiteConfig()).payments.payOnPickupNotice;
        } catch {
          notice = undefined;
        }

        const pdf = await buildPickupPassPdf(order, token, notice);
        if (!pdf) return new Response("Unavailable", { status: 503 });
        const name = `afhaalpas-${order.order_reference ?? order.id}.pdf`;
        return new Response(new Uint8Array(pdf).buffer as ArrayBuffer, {
          headers: {
            "content-type": "application/pdf",
            "content-disposition": `attachment; filename="${name}"`,
            "cache-control": "private, no-store",
            "x-robots-tag": "noindex",
          },
        });
      },
    },
  },
});
