import { createFileRoute } from "@tanstack/react-router";

/** Server-side uitvoering: Open-Meteo wordt nooit door de browser bevraagd. */
export const runtime = "nodejs";

export const Route = createFileRoute("/api/weather")({
  server: {
    handlers: {
      GET: async () => {
        const { getFarmWeather, WEATHER_TTL_SECONDS } = await import("@/lib/weather.server");
        const weather = await getFarmWeather();
        if (!weather) {
          return new Response(JSON.stringify({ error: "weather_unavailable" }), {
            status: 503,
            headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
          });
        }
        return new Response(JSON.stringify(weather), {
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            // Server-side cache van 10 minuten (revalidate: 600).
            "Cache-Control": `public, max-age=60, s-maxage=${WEATHER_TTL_SECONDS}, stale-while-revalidate=${WEATHER_TTL_SECONDS}`,
          },
        });
      },
    },
  },
});
