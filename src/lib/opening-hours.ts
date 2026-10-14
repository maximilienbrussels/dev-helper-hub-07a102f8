/**
 * Openingsuren van de stadsboerderij — kalender-/tijdbewust.
 * Zomer (1 apr – 31 okt): di t/m za 09:30–17:00 (zo & ma gesloten).
 * Winter (1 nov – 31 mrt): di t/m vr 10:00–16:30 (za, zo & ma gesloten).
 */

export type Season = "zomer" | "winter";

export type OpeningInfo = {
  season: Season;
  /** 0 = zondag ... 6 = zaterdag */
  weekday: number;
  dayNameNl: string;
  dateLabelNl: string;
  timeLabel: string;
  openToday: boolean;
  todayHours: string | null;
  nextOpenDayNl: string;
  nextOpenHours: string;
  scheduleNl: string;
};

const DAYS_NL = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];

/** Datum-/tijdonderdelen in de tijdzone Europe/Brussels. */
function brusselsParts(date: Date) {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Brussels",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]));
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return {
    year: Number(parts["year"]),
    month: Number(parts["month"]),
    day: Number(parts["day"]),
    hour: Number(parts["hour"]),
    minute: Number(parts["minute"]),
    weekday: weekdayMap[parts["weekday"] ?? "Mon"] ?? 1,
  };
}

export function seasonFor(month: number): Season {
  return month >= 4 && month <= 10 ? "zomer" : "winter";
}

/** Openingsuren voor één weekdag, of null als er gesloten is. */
export function hoursFor(weekday: number, season: Season): string | null {
  if (season === "zomer") {
    return weekday >= 2 && weekday <= 6 ? "09:30 – 17:00" : null;
  }
  return weekday >= 2 && weekday <= 5 ? "10:00 – 16:30" : null;
}

export function openingInfo(now: Date = new Date()): OpeningInfo {
  const p = brusselsParts(now);
  const season = seasonFor(p.month);
  const todayHours = hoursFor(p.weekday, season);

  let nextDay = p.weekday;
  let nextHours: string | null = null;
  for (let i = 1; i <= 7; i += 1) {
    nextDay = (p.weekday + i) % 7;
    nextHours = hoursFor(nextDay, season);
    if (nextHours) break;
  }

  const pad = (n: number) => String(n).padStart(2, "0");

  return {
    season,
    weekday: p.weekday,
    dayNameNl: DAYS_NL[p.weekday] ?? "dag",
    dateLabelNl: `${p.day}/${pad(p.month)}/${p.year}`,
    timeLabel: `${pad(p.hour)}:${pad(p.minute)}`,
    openToday: todayHours !== null,
    todayHours,
    nextOpenDayNl: DAYS_NL[nextDay] ?? "dinsdag",
    nextOpenHours: nextHours ?? "09:30 – 17:00",
    scheduleNl:
      season === "zomer"
        ? "zomerschema (1 apr – 31 okt): dinsdag t/m zaterdag 09:30–17:00, zondag en maandag gesloten"
        : "winterschema (1 nov – 31 mrt): dinsdag t/m vrijdag 10:00–16:30, zaterdag, zondag en maandag gesloten",
  };
}

/** Compacte, feitelijke tekst voor de systeemprompt van de chatbot. */
export function openingPromptBlock(now: Date = new Date()): string {
  const i = openingInfo(now);
  return [
    `- VANDAAG: ${i.dayNameNl} ${i.dateLabelNl}, ${i.timeLabel} (Europe/Brussels).`,
    `- ACTIEF SCHEMA: ${i.scheduleNl}.`,
    i.openToday
      ? `- STATUS: vandaag OPEN van ${i.todayHours}. Sta je nu buiten die uren, zeg dat de boerderij vandaag ${i.todayHours} open is.`
      : `- STATUS: vandaag GESLOTEN. Eerstvolgende opening: ${i.nextOpenDayNl} ${i.nextOpenHours}.`,
    "- Reken dag-vragen ('zijn jullie morgen open?') altijd vanaf de datum hierboven en verzin nooit andere uren.",
  ].join("\n");
}

/* ------------------------------------------------------------------------ */
/* Databankvariant: de tabellen `opening_hours` en `opening_exceptions` zijn */
/* de bron van waarheid; bovenstaande statische waarden dienen als fallback  */
/* wanneer er (nog) geen rijen in de databank staan.                        */
/* ------------------------------------------------------------------------ */

export type OpeningHourDbRow = {
  weekday: number;
  season: Season;
  isOpen: boolean;
  openTime: string | null;
  closeTime: string | null;
};

export type OpeningExceptionDbRow = {
  dateFrom: string;
  dateTo: string;
  closed: boolean;
  openTime: string | null;
  closeTime: string | null;
};

/** Openingsuren voor één weekdag/seizoen op basis van databankrijen, met de
 * statische waarden als terugval wanneer de tabel leeg is. */
export function hoursForFromRows(
  weekday: number,
  season: Season,
  rows: OpeningHourDbRow[],
): string | null {
  if (rows.length === 0) return hoursFor(weekday, season);
  const row = rows.find((r) => r.weekday === weekday && r.season === season);
  if (!row) return hoursFor(weekday, season);
  if (!row.isOpen || !row.openTime || !row.closeTime) return null;
  return `${row.openTime} – ${row.closeTime}`;
}

/** Uitzondering (sluiting of afwijkende uren) die op een datum van toepassing is. */
export function exceptionForDate(
  dateIso: string,
  exceptions: OpeningExceptionDbRow[],
): OpeningExceptionDbRow | null {
  return exceptions.find((e) => dateIso >= e.dateFrom && dateIso <= e.dateTo) ?? null;
}

/** Openingsuren voor een specifieke datum, rekening houdend met uitzonderingen. */
export function hoursForDate(
  dateIso: string,
  weekday: number,
  season: Season,
  rows: OpeningHourDbRow[],
  exceptions: OpeningExceptionDbRow[],
): string | null {
  const exception = exceptionForDate(dateIso, exceptions);
  if (exception) {
    if (exception.closed) return null;
    if (exception.openTime && exception.closeTime) {
      return `${exception.openTime} – ${exception.closeTime}`;
    }
  }
  return hoursForFromRows(weekday, season, rows);
}
