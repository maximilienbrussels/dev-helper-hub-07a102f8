/**
 * Live Villo!-fietsen bij de boerderij (station Schipperijkaai / Batelage).
 *
 * Eén bron voor zowel /api/villo (widgets) als de paginacontext van Maxim
 * (/api/chat). Het resultaat blijft 5 minuten in het geheugen staan zodat we
 * CityBikes niet bij elke bezoeker opnieuw bevragen.
 */

export type VilloLang = "nl" | "fr" | "en";

export type VilloStation = {
  name: string;
  bikes: number;
  freeSlots: number;
  distanceLabel: string;
  fetchedAt: string;
};

const URL_CITYBIKES = "https://api.citybik.es/v2/networks/villo";
/** Boerderij aan het kanaal (Schipperijkaai 2, 1000 Brussel). */
const FARM_LAT = 50.856;
const FARM_LON = 4.351;
/** Station naast de hoofdingang aan het kanaal. */
const STATION_MATCH = /(werfkaai|batelage)/i;

export const VILLO_TTL_SECONDS = 300;
const TIMEOUT_MS = 5_000;

type Cached = { at: number; data: VilloStation };
let cache: Cached | null = null;
let inFlight: Promise<VilloStation | null> | null = null;

type CityBikesStation = {
  name?: string;
  free_bikes?: number;
  empty_slots?: number;
  latitude?: number;
  longitude?: number;
};

/** Hemelsbrede afstand in meters (klein genoeg voor een platte benadering). */
function distanceM(lat?: number, lon?: number): number {
  if (typeof lat !== "number" || typeof lon !== "number") return Number.POSITIVE_INFINITY;
  const dy = (lat - FARM_LAT) * 111_320;
  const dx = (lon - FARM_LON) * 111_320 * Math.cos((FARM_LAT * Math.PI) / 180);
  return Math.hypot(dx, dy);
}

async function fetchStation(): Promise<VilloStation | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(URL_CITYBIKES, { signal: ctrl.signal });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      network?: { stations?: CityBikesStation[] };
    };
    const stations = json.network?.stations ?? [];
    // Eerst op naam (Schipperijkaai / Batelage); anders het dichtstbijzijnde station.
    const nearest = stations
      .slice()
      .sort((a, b) => distanceM(a.latitude, a.longitude) - distanceM(b.latitude, b.longitude))[0];
    const found = stations.find((s) => STATION_MATCH.test(s.name ?? "")) ?? nearest;
    if (!found) return null;
    const meters = distanceM(found.latitude, found.longitude);
    const data: VilloStation = {
      name: found.name ?? "Schipperijkaai / Batelage",
      bikes: Math.max(0, Math.round(found.free_bikes ?? 0)),
      freeSlots: Math.max(0, Math.round(found.empty_slots ?? 0)),
      distanceLabel: Number.isFinite(meters)
        ? `±${Math.max(1, Math.round(meters / 80))} min te voet van de hoofdingang`
        : "op wandelafstand van de hoofdingang",
      fetchedAt: new Date().toISOString(),
    };
    cache = { at: Date.now(), data };
    return data;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Live Villo!-beschikbaarheid, met cache van 5 minuten. */
export async function getVilloStation(): Promise<VilloStation | null> {
  if (cache && Date.now() - cache.at < VILLO_TTL_SECONDS * 1000) return cache.data;
  if (inFlight) return inFlight;
  inFlight = fetchStation().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

/** Eén regel context voor het taalmodel (nooit door de browser aanleverbaar). */
export function villoPromptLine(v: VilloStation): string {
  return `Live Villo! bij de boerderij (${v.name}): ${v.bikes} fietsen beschikbaar, ${v.freeSlots} vrije plaatsen. Vermeld dit enkel wanneer de bezoeker over fietsen of vervoer vraagt.`;
}
