/**
 * Publieke openingsstatus: berekent, op basis van de wekelijkse openingsuren
 * en de uitzonderingen uit de databank, of de boerderij nu open is.
 * Zuivere functies — bruikbaar op de server (API-route) en in tests.
 */
import {
  exceptionForDate,
  hoursForFromRows,
  seasonFor,
  type OpeningExceptionDbRow,
  type OpeningHourDbRow,
} from "./opening-hours";

export type OpeningStatus = {
  isOpenNow: boolean;
  statusLabel: string;
  todayHours: string | null;
  specialNotice: string | null;
};

export type StatusLang = "nl" | "fr" | "en";

/** Uitzondering met drietalige reden (zoals in `opening_exceptions`). */
export type OpeningExceptionWithReason = OpeningExceptionDbRow & {
  reasonNl?: string;
  reasonFr?: string;
  reasonEn?: string;
};

const COPY: Record<StatusLang, Record<string, string>> = {
  nl: { openNow: "Nu open", closesAt: "Sluit om", closedToday: "Vandaag gesloten", opensAt: "Vandaag open vanaf" },
  fr: { openNow: "Ouvert maintenant", closesAt: "Ferme à", closedToday: "Fermé aujourd'hui", opensAt: "Ouvre aujourd'hui à" },
  en: { openNow: "Open now", closesAt: "Closes at", closedToday: "Closed today", opensAt: "Opens today at" },
};

/** Datum-/tijdonderdelen in de tijdzone Europe/Brussels. */
export function brusselsNow(now: Date = new Date()) {
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
  const p = Object.fromEntries(fmt.formatToParts(now).map((x) => [x.type, x.value]));
  const weekdays: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const year = p["year"] ?? "1970";
  const month = p["month"] ?? "01";
  const day = p["day"] ?? "01";
  return {
    dateIso: `${year}-${month}-${day}`,
    month: Number(month),
    weekday: weekdays[p["weekday"] ?? "Mon"] ?? 1,
    time: `${p["hour"] ?? "00"}:${p["minute"] ?? "00"}`,
  };
}

function reasonFor(ex: OpeningExceptionWithReason | null, lang: StatusLang): string | null {
  if (!ex) return null;
  const value = lang === "fr" ? ex.reasonFr : lang === "en" ? ex.reasonEn : ex.reasonNl;
  const text = (value || ex.reasonNl || ex.reasonFr || ex.reasonEn || "").trim();
  return text || null;
}

/** Volledige status voor "nu", inclusief label en eventuele bijzondere melding. */
export function computeOpeningStatus(
  hours: OpeningHourDbRow[],
  exceptions: OpeningExceptionWithReason[],
  lang: StatusLang = "nl",
  now: Date = new Date(),
): OpeningStatus {
  const c = COPY[lang];
  const { dateIso, month, weekday, time } = brusselsNow(now);
  const exception = exceptionForDate(dateIso, exceptions);
  const notice = reasonFor(exception, lang);

  let range: string | null;
  if (exception) {
    range =
      exception.closed || !exception.openTime || !exception.closeTime
        ? null
        : `${exception.openTime} – ${exception.closeTime}`;
  } else {
    range = hoursForFromRows(weekday, seasonFor(month), hours);
  }

  if (!range) {
    return {
      isOpenNow: false,
      statusLabel: notice ? `${c["closedToday"]} (${notice})` : (c["closedToday"] ?? ""),
      todayHours: null,
      specialNotice: notice,
    };
  }

  const [open = "", close = ""] = range.split("–").map((s) => s.trim());
  const isOpenNow = time >= open && time < close;
  const statusLabel = isOpenNow
    ? `${c["openNow"]} · ${c["closesAt"]} ${close}`
    : time < open
      ? `${c["opensAt"]} ${open}`
      : (c["closedToday"] ?? "");

  return {
    isOpenNow,
    statusLabel,
    todayHours: `${open} - ${close}`,
    specialNotice: notice,
  };
}
