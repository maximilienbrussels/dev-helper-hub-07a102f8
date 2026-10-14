/**
 * Openingsuren → schema.org (JSON-LD) en leesbare weekregels.
 * Zuivere functies: bruikbaar op server (SSR/JSON-LD) en in de browser.
 *
 * Officiële uren van La Ferme du parc Maximilien:
 * dinsdag t/m zaterdag 09:30 – 17:00 (zondag en maandag gesloten).
 */
import type { OpeningExceptionDbRow, OpeningHourDbRow, Season } from "./opening-hours";

export type DayHours = { weekday: number; opens: string | null; closes: string | null };

export const SCHEMA_DAY = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

const DAY_LABEL: Record<"nl" | "fr" | "en", string[]> = {
  nl: ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"],
  fr: ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
};

export const CLOSED_LABEL: Record<"nl" | "fr" | "en", string> = {
  nl: "Gesloten",
  fr: "Fermé",
  en: "Closed",
};

export const HOURS_TITLE: Record<"nl" | "fr" | "en", string> = {
  nl: "Openingstijden",
  fr: "Heures d'ouverture",
  en: "Opening hours",
};

/** Officiële weekuren — vangnet wanneer de databank (nog) leeg is. */
export const OFFICIAL_WEEK: DayHours[] = [0, 1, 2, 3, 4, 5, 6].map((weekday) =>
  weekday >= 2 && weekday <= 6
    ? { weekday, opens: "09:30", closes: "17:00" }
    : { weekday, opens: null, closes: null },
);

/** Weekuren voor één seizoen op basis van databankrijen, met officiële terugval. */
export function weekFromRows(rows: OpeningHourDbRow[], season: Season): DayHours[] {
  const seasonRows = rows.filter((r) => r.season === season);
  if (seasonRows.length === 0) return OFFICIAL_WEEK;
  return [0, 1, 2, 3, 4, 5, 6].map((weekday) => {
    const row = seasonRows.find((r) => r.weekday === weekday);
    if (!row || !row.isOpen || !row.openTime || !row.closeTime) {
      return { weekday, opens: null, closes: null };
    }
    return { weekday, opens: row.openTime, closes: row.closeTime };
  });
}

/** Groepeert opeenvolgende dagen met dezelfde uren tot OpeningHoursSpecification-blokken. */
export function openingHoursSpecification(week: DayHours[]) {
  const groups = new Map<string, number[]>();
  for (const day of week) {
    if (!day.opens || !day.closes) continue;
    const key = `${day.opens}-${day.closes}`;
    groups.set(key, [...(groups.get(key) ?? []), day.weekday]);
  }
  return [...groups.entries()].map(([key, days]) => {
    const [opens = "", closes = ""] = key.split("-");
    return {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: days
        .sort((a, b) => a - b)
        .map((d) => `https://schema.org/${SCHEMA_DAY[d]}`),
      opens,
      closes,
    };
  });
}

/** Uitzonderingen (sluitingsdagen of afwijkende uren) als specialOpeningHoursSpecification. */
export function specialOpeningHoursSpecification(exceptions: OpeningExceptionDbRow[]) {
  return exceptions.map((e) => ({
    "@type": "OpeningHoursSpecification",
    validFrom: e.dateFrom,
    validThrough: e.dateTo,
    opens: e.closed ? "00:00" : (e.openTime ?? "00:00"),
    closes: e.closed ? "00:00" : (e.closeTime ?? "00:00"),
  }));
}

/** Leesbare weekregels, met opeenvolgende gelijke dagen samengevoegd. */
export function weekLines(week: DayHours[], lang: "nl" | "fr" | "en") {
  const labels = DAY_LABEL[lang];
  // Weekvolgorde maandag → zondag.
  const ordered = [1, 2, 3, 4, 5, 6, 0].map(
    (d) => week.find((w) => w.weekday === d) ?? { weekday: d, opens: null, closes: null },
  );
  const lines: { label: string; value: string; open: boolean }[] = [];
  let start = 0;
  for (let i = 0; i < ordered.length; i += 1) {
    const current = ordered[i]!;
    const next = ordered[i + 1];
    const same = next && next.opens === current.opens && next.closes === current.closes;
    if (same) continue;
    const first = ordered[start]!;
    const label =
      start === i
        ? (labels[first.weekday] ?? "")
        : `${labels[first.weekday] ?? ""} – ${labels[current.weekday] ?? ""}`;
    lines.push({
      label,
      value:
        current.opens && current.closes
          ? `${current.opens} – ${current.closes}`
          : CLOSED_LABEL[lang],
      open: Boolean(current.opens && current.closes),
    });
    start = i + 1;
  }
  return lines;
}

/** Google Business Profile `regularHours`-payload. */
export function googleRegularHours(week: DayHours[]) {
  const GOOGLE_DAY = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];
  return {
    periods: week
      .filter((d) => d.opens && d.closes)
      .map((d) => {
        const [oh = "0", om = "0"] = (d.opens ?? "").split(":");
        const [ch = "0", cm = "0"] = (d.closes ?? "").split(":");
        return {
          openDay: GOOGLE_DAY[d.weekday],
          closeDay: GOOGLE_DAY[d.weekday],
          openTime: { hours: Number(oh), minutes: Number(om) },
          closeTime: { hours: Number(ch), minutes: Number(cm) },
        };
      }),
  };
}

/** Google Business Profile `specialHours`-payload op basis van uitzonderingen. */
export function googleSpecialHours(exceptions: OpeningExceptionDbRow[]) {
  const toDate = (iso: string) => {
    const [y = "1970", m = "01", d = "01"] = iso.split("-");
    return { year: Number(y), month: Number(m), day: Number(d) };
  };
  return {
    specialHourPeriods: exceptions.map((e) => {
      const [oh = "0", om = "0"] = (e.openTime ?? "00:00").split(":");
      const [ch = "0", cm = "0"] = (e.closeTime ?? "00:00").split(":");
      return {
        startDate: toDate(e.dateFrom),
        endDate: toDate(e.dateTo),
        closed: e.closed,
        ...(e.closed
          ? {}
          : {
              openTime: { hours: Number(oh), minutes: Number(om) },
              closeTime: { hours: Number(ch), minutes: Number(cm) },
            }),
      };
    }),
  };
}
