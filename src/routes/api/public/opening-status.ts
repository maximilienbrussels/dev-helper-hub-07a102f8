import { createFileRoute } from "@tanstack/react-router";
import { computeOpeningStatus, type StatusLang } from "@/lib/opening-status";
import type { OpeningExceptionDbRow, OpeningHourDbRow } from "@/lib/opening-hours";

/**
 * Publieke openingsstatus voor de bezoekerssite. Leest de wekelijkse uren en
 * de uitzonderingen uit Neon; zonder databank gelden de statische uren als
 * vangnet (dat zit in `hoursForFromRows`).
 */
export const Route = createFileRoute("/api/public/opening-status")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const raw = url.searchParams.get("lang");
        const lang: StatusLang = raw === "fr" || raw === "en" ? raw : "nl";

        let hours: OpeningHourDbRow[] = [];
        let exceptions: (OpeningExceptionDbRow & {
          reasonNl: string;
          reasonFr: string;
          reasonEn: string;
        })[] = [];

        try {
          const { db, hasDatabase } = await import("@/lib/neon.server");
          if (hasDatabase()) {
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
            hours = hourRows.map((r) => ({
              weekday: r.weekday,
              season: r.season as OpeningHourDbRow["season"],
              isOpen: r.is_open,
              openTime: r.open_time?.slice(0, 5) ?? null,
              closeTime: r.close_time?.slice(0, 5) ?? null,
            }));

            const exRows = (await sql`
              select date_from::text as date_from, date_to::text as date_to, closed,
                     open_time::text as open_time, close_time::text as close_time,
                     reason_nl, reason_fr, reason_en
              from opening_exceptions
              where date_to >= current_date - interval '1 day'
            `) as Array<{
              date_from: string;
              date_to: string;
              closed: boolean;
              open_time: string | null;
              close_time: string | null;
              reason_nl: string;
              reason_fr: string;
              reason_en: string;
            }>;
            exceptions = exRows.map((r) => ({
              dateFrom: r.date_from,
              dateTo: r.date_to,
              closed: r.closed,
              openTime: r.open_time?.slice(0, 5) ?? null,
              closeTime: r.close_time?.slice(0, 5) ?? null,
              reasonNl: r.reason_nl,
              reasonFr: r.reason_fr,
              reasonEn: r.reason_en,
            }));
          }
        } catch {
          // Zonder databank vallen we terug op de statische openingsuren.
        }

        const status = computeOpeningStatus(hours, exceptions, lang);
        return new Response(JSON.stringify(status), {
          status: 200,
          headers: {
            "content-type": "application/json; charset=utf-8",
            "access-control-allow-origin": "*",
            "cache-control": "public, max-age=60",
          },
        });
      },
    },
  },
});
