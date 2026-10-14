/**
 * Live weer voor de boerderij (Brussel 1000) via Open-Meteo.
 *
 * Eén bron voor zowel de weerbadge op de homepagina (/api/weather) als de
 * paginacontext van Maxim (/api/chat). Het resultaat blijft 10 minuten in het
 * geheugen staan zodat we Open-Meteo niet bij elke bezoeker opnieuw bevragen.
 */

export type WeatherLang = "nl" | "fr" | "en";

export type FarmWeather = {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  weatherCode: number;
  /** Kans op neerslag in het huidige uur (%), null wanneer onbekend. */
  rainChance: number | null;
  icon: string;
  condition: Record<WeatherLang, string>;
  /** Tijdstip waarop deze meting is opgehaald (ISO). */
  fetchedAt: string;
};

const LAT = 50.856;
const LON = 4.351;
const URL =
  `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
  "&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m" +
  "&hourly=precipitation_probability&forecast_days=1&timezone=Europe%2FBrussels";

/** Cache van 10 minuten (revalidate: 600). */
export const WEATHER_TTL_SECONDS = 600;
const TIMEOUT_MS = 5_000;

type Cached = { at: number; data: FarmWeather };
let cache: Cached | null = null;
let inFlight: Promise<FarmWeather | null> | null = null;

type CodeInfo = { icon: string; condition: Record<WeatherLang, string> };

/** WMO-weercodes naar leesbare status + icoon. */
export function describeCode(code: number): CodeInfo {
  const map: { max: number; info: CodeInfo }[] = [
    { max: 0, info: { icon: "☀️", condition: { nl: "Zonnig", fr: "Ensoleillé", en: "Sunny" } } },
    { max: 1, info: { icon: "🌤️", condition: { nl: "Overwegend zonnig", fr: "Plutôt ensoleillé", en: "Mostly sunny" } } },
    { max: 3, info: { icon: "⛅", condition: { nl: "Bewolkt", fr: "Nuageux", en: "Cloudy" } } },
    { max: 48, info: { icon: "🌫️", condition: { nl: "Nevelig", fr: "Brumeux", en: "Foggy" } } },
    { max: 57, info: { icon: "🌦️", condition: { nl: "Lichte motregen", fr: "Bruine légère", en: "Light drizzle" } } },
    { max: 65, info: { icon: "🌧️", condition: { nl: "Regen", fr: "Pluie", en: "Rain" } } },
    { max: 69, info: { icon: "🌧️", condition: { nl: "Ijzelregen", fr: "Pluie verglaçante", en: "Freezing rain" } } },
    { max: 79, info: { icon: "❄️", condition: { nl: "Sneeuw", fr: "Neige", en: "Snow" } } },
    { max: 82, info: { icon: "🌧️", condition: { nl: "Regenbuien", fr: "Averses", en: "Rain showers" } } },
    { max: 86, info: { icon: "🌨️", condition: { nl: "Sneeuwbuien", fr: "Averses de neige", en: "Snow showers" } } },
    { max: 99, info: { icon: "⛈️", condition: { nl: "Onweer", fr: "Orage", en: "Thunderstorm" } } },
  ];
  return (
    map.find((entry) => code <= entry.max)?.info ?? {
      icon: "🌡️",
      condition: { nl: "Wisselend", fr: "Variable", en: "Changeable" },
    }
  );
}

type OpenMeteoResponse = {
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    apparent_temperature?: number;
    precipitation?: number;
    weather_code?: number;
    wind_speed_10m?: number;
    time?: string;
  };
  hourly?: { time?: string[]; precipitation_probability?: (number | null)[] };
};

/** Kans op neerslag in het uur dat nu loopt. */
function currentRainChance(data: OpenMeteoResponse): number | null {
  const times = data.hourly?.time;
  const probs = data.hourly?.precipitation_probability;
  if (!Array.isArray(times) || !Array.isArray(probs)) return null;
  const nowHour = (data.current?.time ?? new Date().toISOString()).slice(0, 13);
  const index = times.findIndex((t) => t.slice(0, 13) === nowHour);
  const value = probs[index >= 0 ? index : 0];
  return typeof value === "number" ? Math.round(value) : null;
}

async function load(): Promise<FarmWeather | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(URL, { signal: controller.signal });
    if (!res.ok) {
      console.error("[weather] Open-Meteo-fout", res.status);
      return null;
    }
    const json = (await res.json()) as OpenMeteoResponse;
    const current = json.current;
    if (!current || typeof current.temperature_2m !== "number") return null;
    const code = typeof current.weather_code === "number" ? current.weather_code : 0;
    const info = describeCode(code);
    return {
      temperature: Math.round(current.temperature_2m),
      apparentTemperature: Math.round(current.apparent_temperature ?? current.temperature_2m),
      humidity: Math.round(current.relative_humidity_2m ?? 0),
      precipitation: current.precipitation ?? 0,
      windSpeed: Math.round(current.wind_speed_10m ?? 0),
      weatherCode: code,
      rainChance: currentRainChance(json),
      icon: info.icon,
      condition: info.condition,
      fetchedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error("[weather] Open-Meteo onbereikbaar", err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Live weer met cache van 10 minuten; bij een storing het laatst bekende weer. */
export async function getFarmWeather(): Promise<FarmWeather | null> {
  const now = Date.now();
  if (cache && now - cache.at < WEATHER_TTL_SECONDS * 1_000) return cache.data;
  if (!inFlight) {
    inFlight = load().finally(() => {
      inFlight = null;
    });
  }
  const fresh = await inFlight;
  if (fresh) {
    cache = { at: Date.now(), data: fresh };
    return fresh;
  }
  return cache?.data ?? null;
}

/** Eén regel weercontext voor de system prompt van Maxim. */
export function weatherPromptLine(w: FarmWeather): string {
  const rain = w.rainChance == null ? "onbekend" : `${w.rainChance}%`;
  return (
    `- LIVE WEER OP DE BOERDERIJ (Brussel 1000): ${w.temperature}°C, ${w.condition.nl.toLowerCase()}, ` +
    `voelt als ${w.apparentTemperature}°C, wind ${w.windSpeed} km/u, kans op neerslag ${rain}. ` +
    "Gebruik dit alleen wanneer de bezoeker naar het weer, kleding of een bezoekmoment vraagt, en geef dan warm bezoekadvies (bv. laarzen bij regen, water en schaduw bij hitte). Verzin nooit een voorspelling voor later."
  );
}
