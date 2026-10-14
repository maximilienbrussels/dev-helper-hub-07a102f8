import { createFileRoute } from "@tanstack/react-router";

/** Server-side uitvoering: CityBikes wordt nooit door de browser bevraagd. */
export const runtime = "nodejs";

export const Route = createFileRoute("/api/villo")({
  server: {
    handlers: {
      GET: async () => {
        const { getVilloStation, VILLO_TTL_SECONDS } = await import("@/lib/villo.server");
        const station = await getVilloStation();
        if (!station) {
          return new Response(JSON.stringify({ error: "villo_unavailable" }), {
            status: 503,
            headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
          });
        }
        return new Response(JSON.stringify(station), {
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": `public, max-age=60, s-maxage=${VILLO_TTL_SECONDS}, stale-while-revalidate=${VILLO_TTL_SECONDS}`,
          },
        });
      },
    },
  },
});
