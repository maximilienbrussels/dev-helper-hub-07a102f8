/**
 * Generatieve UI in de chat: Maxim zet [[route:<vertrekpunt>]] in zijn antwoord
 * en deze component haalt de feitelijke route op en tekent ze op een kaart.
 * Zo verzint de assistent nooit straten, bochten of bruggen.
 * Ligt het vertrekpunt verder dan 5 km, dan tonen we live openbaar vervoer.
 */
import { Suspense, lazy, useEffect, useState } from "react";
import { Bike, Expand, Footprints, MapPin, TrainFront } from "lucide-react";
import { Lightbox } from "@/components/chat/Lightbox";
import { useIsMobile } from "@/hooks/use-mobile";

import type { RouteMapResult, RouteProfile } from "@/routes/api/route-map";
import { MAPS_URL } from "@/components/chat/MapsLink";
import { RouteQrCode } from "@/components/chat/RouteQrCode";
import type { Lang } from "@/lib/i18n";

const RouteMapCanvas = lazy(() => import("@/components/chat/RouteMapCanvas"));

const COPY: Record<Lang, Record<string, string>> = {
  nl: {
    loading: "Route wordt berekend…",
    error: "Ik vond dat vertrekpunt niet terug op de kaart. Kan je je gemeente of straat iets preciezer typen?",
    walk: "Te voet",
    bike: "Met de fiets",
    open: "Open in Google Maps",
    min: "min",
    far: "Dat is meer dan 5 km stappen — neem beter het openbaar vervoer:",
    showMap: "Toon de kaart toch",
    enlarge: "Kaart in het groot",
    transitLoading: "Live vertrektijden worden opgehaald…",
  },
  fr: {
    loading: "Calcul de l'itinéraire…",
    error: "Je n'ai pas retrouvé ce point de départ sur la carte. Pouvez-vous préciser la commune ou la rue ?",
    walk: "À pied",
    bike: "À vélo",
    open: "Ouvrir dans Google Maps",
    min: "min",
    far: "Cela fait plus de 5 km à pied — prenez plutôt les transports en commun :",
    showMap: "Afficher quand même la carte",
    enlarge: "Agrandir la carte",
    transitLoading: "Chargement des horaires en direct…",
  },
  en: {
    loading: "Calculating the route…",
    error: "I couldn't find that starting point on the map. Could you type your town or street a bit more precisely?",
    walk: "Walking",
    bike: "Cycling",
    open: "Open in Google Maps",
    min: "min",
    far: "That's more than 5 km on foot — public transport is the better option:",
    showMap: "Show the map anyway",
    enlarge: "Enlarge the map",
    transitLoading: "Loading live departures…",
  },
};

const TRANSIT_MODES: Record<Lang, string> = {
  nl: "Openbaar vervoer",
  fr: "Transports en commun",
  en: "Public transport",
};

/** Haalt [[route:...]] uit een antwoord en geeft de opgekuiste tekst terug. */
export function extractRouteMarker(text: string): { clean: string; start: string } | null {
  const match = text.match(/\[\[route:\s*([^\]]+)\]\]/i);
  if (!match?.[1]) return null;
  return { clean: text.replace(/\[\[route:[^\]]*\]\]/gi, "").trim(), start: match[1].trim() };
}

/**
 * Vangnet: haalt een vertrekpunt uit de vraag van de bezoeker wanneer de
 * assistent zelf geen [[route:…]] meegeeft, zodat de kaart toch verschijnt.
 */
export function inferRouteStart(userText: string): string | null {
  const text = userText.replace(/\s+/g, " ").trim();
  if (!text) return null;
  const patterns = [
    /\b(?:vanaf|vanuit|van uit|van|depuis|from|starting at|à partir de|a partir de)\s+(?:de\s+|het\s+|la\s+|le\s+)?([\p{L}0-9'’.\- ]{3,60}?)(?=\s+(?:naar|richting|tot|to|vers|jusqu|towards)\b|[,.?!;]|$)/iu,
    /\b(?:ik (?:zit|woon|ben|sta)(?: in| te| aan)?|je suis à|j'habite à|i am (?:in|at)|i live in)\s+([\p{L}0-9'’.\- ]{3,60}?)(?=[,.?!;]|$)/iu,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    const raw = m?.[1]?.trim();
    if (raw && raw.length >= 3 && !/^(hier|here|ici|daar|there)$/i.test(raw)) return raw;
  }
  return null;
}

/** Directe routelink voor op de telefoon (QR-code en knop). */
function mapsDirUrl(data: RouteMapResult | null, profile: RouteProfile): string {
  if (!data) return MAPS_URL;
  const mode = profile === "bike" ? "bicycling" : "walking";
  return `https://www.google.com/maps/dir/?api=1&origin=${data.start.lat},${data.start.lon}&destination=${data.end.lat},${data.end.lon}&travelmode=${mode}`;
}

export function ChatRouteMap({ start, lang }: { start: string; lang: Lang }) {
  const t = COPY[lang] ?? COPY.nl;
  const [profile, setProfile] = useState<RouteProfile>("foot");
  const [data, setData] = useState<RouteMapResult | null>(null);
  const [error, setError] = useState(false);
  const [transit, setTransit] = useState<string | null>(null);
  const [forceMap, setForceMap] = useState(false);
  const [zoom, setZoom] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    let active = true;
    setData(null);
    setError(false);
    void (async () => {
      try {
        const res = await fetch("/api/route-map", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ start, profile }),
        });
        if (!res.ok) throw new Error("route");
        const json = (await res.json()) as RouteMapResult;
        if (active) setData(json);
      } catch {
        if (active) setError(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [start, profile]);

  // Te ver om te stappen? Dan halen we de live MIVB/NMBS-tijden op.
  const farAway = data?.mode === "transit";
  useEffect(() => {
    if (!farAway) return;
    let active = true;
    void (async () => {
      try {
        const res = await fetch(`/api/transit?lang=${lang}`);
        const json = (await res.json()) as { markdown?: string };
        if (active) setTransit(json.markdown ?? "");
      } catch {
        if (active) setTransit("");
      }
    })();
    return () => {
      active = false;
    };
  }, [farAway, lang]);

  if (error) {
    return (
      <p className="mt-2 rounded-xl bg-black/20 px-3 py-2 text-xs text-slate-200">{t["error"]}</p>
    );
  }

  const minutes = data ? Math.max(1, Math.round(data.durationSeconds / 60)) : null;
  const km = data ? (data.distanceMeters / 1000).toFixed(1) : null;
  const showMap = !farAway || forceMap;

  return (
    <div className="mt-2 overflow-hidden rounded-2xl border border-white/15 bg-black/20">
      {farAway ? (
        <div className="px-3 pt-3">
          <p className="flex items-start gap-1.5 text-xs text-slate-200">
            <TrainFront className="mt-0.5 size-3.5 shrink-0" />
            <span>{t["far"]}</span>
          </p>
          <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-slate-300">
            {transit === null ? t["transitLoading"] : transit || TRANSIT_MODES[lang]}
          </p>
          {!forceMap ? (
            <button
              type="button"
              onClick={() => setForceMap(true)}
              className="mt-2 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-slate-100 hover:bg-white/20"
            >
              {t["showMap"]}
            </button>
          ) : null}
        </div>
      ) : null}

      {showMap ? (
        <>
          <div className="flex items-center gap-2 px-3 py-2">
            {(["foot", "bike"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setProfile(p)}
                className={
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition " +
                  (profile === p
                    ? "bg-white text-slate-900"
                    : "bg-white/10 text-slate-200 hover:bg-white/20")
                }
              >
                {p === "foot" ? <Footprints className="size-3.5" /> : <Bike className="size-3.5" />}
                {p === "foot" ? t["walk"] : t["bike"]}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setZoom(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-white/20"
            >
              <Expand className="size-3.5" /> {t["enlarge"]}
            </button>
            {minutes && km ? (
              <span className="ml-auto text-xs text-slate-300">
                {km} km · {minutes} {t["min"]}
              </span>
            ) : null}
          </div>

          {data ? (
            <Suspense
              fallback={<div className="h-64 animate-pulse bg-white/5" aria-label={t["loading"]} />}
            >
              <RouteMapCanvas data={data} lang={lang} />
            </Suspense>
          ) : (
            <div className="h-64 animate-pulse bg-white/5" aria-label={t["loading"]} />
          )}

          {!isMobile ? (
            <div className="pt-3">
              <RouteQrCode url={mapsDirUrl(data, profile)} lang={lang} />
            </div>
          ) : null}

          <a
            href={mapsDirUrl(data, profile)}
            target="_blank"
            rel="noreferrer noopener"
            className="flex items-center gap-1.5 px-3 pb-2 text-xs font-semibold text-slate-100 hover:underline"
          >
            <MapPin className="size-3.5" /> {t["open"]}
          </a>

          <Lightbox open={zoom && !!data} onClose={() => setZoom(false)} title={t["enlarge"]}>
            {data ? (
              <Suspense fallback={<div className="h-[70dvh] animate-pulse rounded-xl bg-white/10" />}>
                <div className="h-[75dvh] overflow-hidden rounded-xl [&_.leaflet-container]:!h-full">
                  <RouteMapCanvas data={data} lang={lang} />
                </div>
              </Suspense>
            ) : null}
          </Lightbox>
        </>
      ) : null}
    </div>
  );
}
