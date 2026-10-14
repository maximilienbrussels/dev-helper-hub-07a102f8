/**
 * Server-side bron van waarheid voor de openingsuren: leest de wekelijkse uren
 * en de uitzonderingen uit Neon. Zonder databank blijven beide lijsten leeg,
 * waarna de officiële uren als vangnet gelden.
 */
import type { OpeningHourDbRow, Season } from "./opening-hours";
import type { OpeningExceptionWithReason } from "./opening-status";

export type OpeningData = {
  hours: OpeningHourDbRow[];
  exceptions: OpeningExceptionWithReason[];
};

export async function readOpeningData(): Promise<OpeningData> {
  try {
    const { db, hasDatabase } = await import("./neon.server");
    if (!hasDatabase()) return { hours: [], exceptions: [] };
    const sql = db();

    const hourRows = (await sql`
      select weekday, season, is_open, open_time::text as open_time,
             close_time::text as close_time
      from opening_hours
    `) as Array<{
      weekday: number;
      season: string;
      is_open: boolean;
      open_time: string | null;
      close_time: string | null;
    }>;

    const exRows = (await sql`
      select date_from::text as date_from, date_to::text as date_to, closed,
             open_time::text as open_time, close_time::text as close_time,
             reason_nl, reason_fr, reason_en
      from opening_exceptions
      where date_to >= current_date - interval '1 day'
      order by date_from
    `) as Array<{
      date_from: string;
      date_to: string;
      closed: boolean;
      open_time: string | null;
      close_time: string | null;
      reason_nl: string | null;
      reason_fr: string | null;
      reason_en: string | null;
    }>;

    return {
      hours: hourRows.map((r) => ({
        weekday: r.weekday,
        season: r.season as Season,
        isOpen: r.is_open,
        openTime: r.open_time?.slice(0, 5) ?? null,
        closeTime: r.close_time?.slice(0, 5) ?? null,
      })),
      exceptions: exRows.map((r) => ({
        dateFrom: r.date_from,
        dateTo: r.date_to,
        closed: r.closed,
        openTime: r.open_time?.slice(0, 5) ?? null,
        closeTime: r.close_time?.slice(0, 5) ?? null,
        reasonNl: r.reason_nl ?? "",
        reasonFr: r.reason_fr ?? "",
        reasonEn: r.reason_en ?? "",
      })),
    };
  } catch (err) {
    console.error("Opening hours read warning:", err);
    return { hours: [], exceptions: [] };
  }
}
