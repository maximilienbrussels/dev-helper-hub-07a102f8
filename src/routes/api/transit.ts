import { createFileRoute } from "@tanstack/react-router";

/** Server-side uitvoering; de MIVB-sleutel blijft altijd op de server. */
export const runtime = "nodejs";

type Lang = "nl" | "fr" | "en";

type Departure = {
  /** 🚇 / 🚊 / 🚌 / 🚆 */
  icon: string;
  line: string;
  destination: string;
  /** Minuten tot vertrek; null wanneer onbekend. */
  minutes: number | null;
  stop: string;
};

/** iRail is de open NMBS/SNCB-bron voor live vertrektijden (geen sleutel nodig). */
const NMBS_URL =
  "https://api.irail.be/liveboard/?station=Brussels-North&format=json&arrdep=departure&lang=nl";

const TIMEOUT_MS = 4_000;

async function fetchJson(url: string, headers: Record<string, string>): Promise<unknown | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers, signal: controller.signal });
    if (!res.ok) {
      console.error("[transit] fout", url, res.status);
      return null;
    }
    return (await res.json()) as unknown;
  } catch (err) {
    console.error("[transit] onbereikbaar", url, err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function minutesUntil(iso: string | undefined): number | null {
  if (!iso) return null;
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return null;
  return Math.max(0, Math.round((ts - Date.now()) / 60_000));
}

function iconFor(line: string): string {
  if (["1", "2", "5", "6"].includes(line)) return "🚇";
  if (["3", "4", "7", "9", "51", "55", "82", "93"].includes(line)) return "🚊";
  return "🚌";
}


/** NMBS/SNCB live vertrektijden in Brussel-Noord. */
async function nmbsDepartures(): Promise<Departure[]> {
  const data = await fetchJson(NMBS_URL, { Accept: "application/json" });
  const list =
    (data as { departures?: { departure?: unknown[] } } | null)?.departures?.departure ?? [];
  return (list as { vehicle?: string; station?: string; time?: string; delay?: string }[])
    .slice(0, 4)
    .map((d) => {
      const seconds = Number(d.time ?? 0) + Number(d.delay ?? 0);
      const minutes = Number.isFinite(seconds)
        ? Math.max(0, Math.round((seconds * 1000 - Date.now()) / 60_000))
        : null;
      return {
        icon: "🚆",
        line: String(d.vehicle ?? "").split(".").pop() ?? "Trein",
        destination: d.station ?? "",
        minutes,
        stop: "Brussel-Noord / Gare du Nord",
      } satisfies Departure;
    });
}

const STATIC_STEPS: Record<Lang, string[]> = {
  nl: [
    "1. 🚇 Neem metro **2 of 6** tot **IJzer / Yser** — daarna 5 minuten wandelen.",
    "2. 🚆 Of trein tot **Brussel-Noord** — 10 minuten wandelen langs het kanaal.",
    "3. 🚊 Tram **51** en bus **46 / 58** stoppen vlakbij het Maximiliaanpark.",
    "4. 🎉 Je staat aan Schipperijkaai 2, 1000 Brussel — gratis binnen!",
  ],
  fr: [
    "1. 🚇 Prenez le métro **2 ou 6** jusqu'à **Yser / IJzer** — puis 5 minutes à pied.",
    "2. 🚆 Ou le train jusqu'à **Bruxelles-Nord** — 10 minutes à pied le long du canal.",
    "3. 🚊 Le tram **51** et les bus **46 / 58** s'arrêtent près du parc Maximilien.",
    "4. 🎉 Vous voilà Quai du Batelage 2, 1000 Bruxelles — entrée gratuite !",
  ],
  en: [
    "1. 🚇 Take metro **2 or 6** to **IJzer / Yser** — then a 5-minute walk.",
    "2. 🚆 Or the train to **Brussels-North** — a 10-minute walk along the canal.",
    "3. 🚊 Tram **51** and buses **46 / 58** stop right by Maximilian Park.",
    "4. 🎉 You've arrived at Quai du Batelage 2, 1000 Brussels — free entry!",
  ],
};

const HEADERS: Record<Lang, { intro: string; live: string; cols: [string, string, string]; fallback: string }> = {
  nl: {
    intro: "Zo geraak je vlot bij ons aan Schipperijkaai 2, 1000 Brussel:",
    live: "**Live vertrektijden**",
    cols: ["Lijn", "Richting", "Over"],
    fallback: "De live-tijden zijn even niet beschikbaar, maar dit werkt altijd:",
  },
  fr: {
    intro: "Voici comment nous rejoindre au Quai du Batelage 2, 1000 Bruxelles :",
    live: "**Départs en temps réel**",
    cols: ["Ligne", "Direction", "Dans"],
    fallback: "Les horaires en direct sont indisponibles, mais ceci fonctionne toujours :",
  },
  en: {
    intro: "Here's how to reach us at Quai du Batelage 2, 1000 Brussels:",
    live: "**Live departures**",
    cols: ["Line", "Direction", "In"],
    fallback: "Live times are unavailable right now, but this always works:",
  },
};

function toMarkdown(lang: Lang, departures: Departure[]): string {
  const copy = HEADERS[lang];
  if (departures.length === 0) {
    return [copy.fallback, "", ...STATIC_STEPS[lang]].join("\n");
  }
  const rows = departures.map(
    (d) =>
      `| ${d.icon} ${d.line} | ${d.destination || d.stop} | ${
        d.minutes === null ? "—" : `${d.minutes} min`
      } |`,
  );
  return [
    copy.intro,
    "",
    copy.live,
    "",
    `| ${copy.cols[0]} | ${copy.cols[1]} | ${copy.cols[2]} |`,
    "| --- | --- | --- |",
    ...rows,
    "",
    ...STATIC_STEPS[lang],
  ].join("\n");
}

export const Route = createFileRoute("/api/transit")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const raw = url.searchParams.get("lang");
        const lang: Lang = raw === "fr" || raw === "en" ? raw : "nl";

        let departures: Departure[] = [];
        try {
          departures = await nmbsDepartures();
        } catch (err) {
          console.error("[transit] onverwachte fout", err);
          departures = [];
        }


        return Response.json(
          {
            live: departures.length > 0,
            departures,
            markdown: toMarkdown(lang, departures),
            mapsUrl:
              "https://www.google.com/maps/dir/?api=1&destination=Schipperijkaai+2+1000+Brussel",
          },
          { headers: { "Cache-Control": "no-store" } },
        );
      },
    },
  },
});
