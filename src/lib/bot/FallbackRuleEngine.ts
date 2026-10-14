/**
 * Deterministische offline-assistent (zonder AI). Wordt gebruikt zodra de
 * AI-backend onbereikbaar is of sleutels ontbreken: dan beantwoordt deze
 * regelmotor de vraag met vaste kennis + eventueel lokaal gecachte gegevens.
 */

export type QuickChip = { id: string; label: string };

export type OfflineAnswer = {
  intent: string;
  reply: string;
  chips: QuickChip[];
  /** true = geen enkel trefwoord herkend, we tonen het keuzemenu. */
  fallback: boolean;
};

export const QUICK_CHIPS: QuickChip[] = [
  { id: "hours", label: "📅 Openingsuren" },
  { id: "prices", label: "💶 Tarieven & zalen" },
  { id: "animals", label: "🐐 Onze bewoners" },
  { id: "route", label: "📍 Adres & bereikbaarheid" },
  { id: "contact", label: "✉️ Bericht sturen naar beheer" },
];

/** Gegevens die de app bij het laden in localStorage kan cachen. */
export type OfflineCache = {
  openingHours?: string;
  rates?: Array<{ label: string; amount: number }>;
  animals?: Array<{ name: string; species?: string }>;
};

const CACHE_KEY = "maxim-offline-cache";

export function cacheOfflineData(data: OfflineCache): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    /* opslag geweigerd: we werken gewoon met de vaste kennis */
  }
}

export function readOfflineCache(): OfflineCache {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as OfflineCache) : {};
  } catch {
    return {};
  }
}

/* --------------------------------- fuzzy matching -------------------------------- */

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0 || n === 0) return Math.max(m, n);
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(
        (prev[j] ?? 0) + 1,
        (cur[j - 1] ?? 0) + 1,
        (prev[j - 1] ?? 0) + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = cur;
  }
  return prev[n] ?? 0;
}

/** Verdraagt tikfouten: "prjsen" matcht nog steeds "prijzen". */
function fuzzyIncludes(words: string[], keyword: string): boolean {
  if (words.some((w) => w.includes(keyword) || keyword.includes(w))) return true;
  const tolerance = keyword.length >= 8 ? 2 : keyword.length >= 5 ? 1 : 0;
  if (tolerance === 0) return false;
  return words.some((w) => Math.abs(w.length - keyword.length) <= tolerance && levenshtein(w, keyword) <= tolerance);
}

const INTENTS: Array<{ id: string; keywords: string[] }> = [
  { id: "hours", keywords: ["openingsuren", "openingstijden", "open", "sluiting", "gesloten", "wanneer", "uren"] },
  { id: "prices", keywords: ["prijs", "prijzen", "tarief", "tarieven", "kosten", "zaalhuur", "huren", "verhuur", "feest"] },
  { id: "animals", keywords: ["dieren", "ezel", "geit", "konijn", "bewoners", "schaap", "kip"] },
  { id: "route", keywords: ["adres", "route", "locatie", "parkeren", "waar", "bereikbaar", "metro", "tram"] },
  { id: "contact", keywords: ["contact", "telefoon", "mail", "bellen", "bericht", "beheer"] },
];

/* ----------------------------------- antwoorden ---------------------------------- */

const ADDRESS = "Schipperijkaai 2 / Quai du Batelage 2, 1000 Brussel";
const EMAIL = "contact@maximilien.brussels";

function answerFor(intent: string, cache: OfflineCache): string {
  switch (intent) {
    case "hours":
      return (
        cache.openingHours ??
        "🕐 De boerderij is doorgaans open van dinsdag tot zondag, 10u–17u (maandag gesloten). Feestdagen kunnen afwijken."
      );
    case "prices": {
      if (cache.rates?.length) {
        const list = cache.rates.map((r) => `• ${r.label}: €${r.amount}`).join("\n");
        return `💶 Onze actuele tarieven:\n${list}`;
      }
      return "💶 Bezoek aan de boerderij is gratis. Voor zaalhuur, workshops en verjaardagsfeestjes gelden aparte tarieven — vraag ze op via " + EMAIL + ".";
    }
    case "animals": {
      if (cache.animals?.length) {
        const list = cache.animals
          .slice(0, 12)
          .map((a) => `• ${a.name}${a.species ? ` (${a.species})` : ""}`)
          .join("\n");
        return `🐐 Onze bewoners:\n${list}`;
      }
      return "🐐 Bij ons wonen onder meer ezels, geiten, schapen, konijnen en kippen. Kom gerust langs om ze te ontmoeten!";
    }
    case "route":
      return `📍 ${ADDRESS}. Vlot bereikbaar met MIVB/STIB (metro Yzer/IJzer of Ribaucourt) en te voet vanaf Brussel-Noord. Parkeren kan beperkt in de buurt.`;
    case "contact":
      return `✉️ Je bereikt het beheer via ${EMAIL}. Laat hieronder je naam, e-mailadres en bericht achter, dan nemen we contact op.`;
    default:
      return "💡 Ik werk momenteel in de snelle offline-stand. Waarmee kan ik je direct helpen?";
  }
}

let lastIntent: string | null = null;

/** Deterministisch antwoord op een vraag, zonder AI. */
export function getOfflineRuleResponse(userMessage: string, cache: OfflineCache = {}): OfflineAnswer {
  const words = userMessage
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);

  let match: string | null = null;
  for (const intent of INTENTS) {
    if (intent.keywords.some((k) => fuzzyIncludes(words, k))) {
      match = intent.id;
      break;
    }
  }

  // Vervolgvraag zonder trefwoorden ("En op zondag?") houdt het vorige onderwerp aan.
  if (!match && lastIntent && words.length <= 6) match = lastIntent;

  if (!match) {
    return {
      intent: "menu",
      reply: answerFor("menu", cache),
      chips: QUICK_CHIPS,
      fallback: true,
    };
  }

  lastIntent = match;
  return { intent: match, reply: answerFor(match, cache), chips: QUICK_CHIPS, fallback: false };
}

export function resetOfflineContext(): void {
  lastIntent = null;
}
