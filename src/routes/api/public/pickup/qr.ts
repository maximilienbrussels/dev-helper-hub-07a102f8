import { createFileRoute } from "@tanstack/react-router";

/**
 * PNG van de afhaal-QR. Enkel geleverd wanneer het HMAC-token klopt, zodat
 * niemand codes van andere bestellingen kan opvragen.
 */
export const Route = createFileRoute("/api/public/pickup/qr")({
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
        const { pickupQrPng } = await import("@/lib/orders/pickup-pass.server");
        const png = await pickupQrPng(orderId, token);
        if (!png) return new Response("Unavailable", { status: 503 });
        return new Response(new Uint8Array(png), {
          headers: {
            "content-type": "image/png",
            "cache-control": "private, max-age=86400",
            "x-robots-tag": "noindex",
          },
        });
      },
    },
  },
});
