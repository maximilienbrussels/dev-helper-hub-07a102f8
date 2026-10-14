import { createFileRoute } from "@tanstack/react-router";

/**
 * Persoonlijke iCal-feed van een medewerker. Alleen bereikbaar met het
 * onraadbare token uit `calendar_feed_tokens`; het token bepaalt ook welke
 * onderdelen (eigen diensten, schoolbezoeken, volledige agenda) meekomen.
 */
export const Route = createFileRoute("/api/public/calendar/feed")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = new URL(request.url).searchParams.get("token") ?? "";
        if (!/^[a-f0-9]{16,64}$/i.test(token)) {
          return new Response("Ongeldig token", { status: 401 });
        }

        const { db } = await import("@/lib/neon.server");
        const sql = db();

        const settings = (await sql`
          select profile_id::text as profile_id, include_assigned, include_schools, include_all
          from calendar_feed_tokens where token = ${token}
        `) as Array<{
          profile_id: string;
          include_assigned: boolean;
          include_schools: boolean;
          include_all: boolean;
        }>;
        const cfg = settings[0];
        if (!cfg) return new Response("Onbekend token", { status: 404 });

        const rows = (await sql`
          select b.id::text as id, b.client_name, b.type, b.location_id,
                 b.event_date::text as event_date,
                 b.start_time::text as start_time, b.end_time::text as end_time,
                 b.status,
                 exists (
                   select 1 from booking_assignments ba
                   where ba.booking_id = b.id and ba.profile_id = ${cfg.profile_id}::uuid
                 ) as mine
          from bookings b
          where b.status <> 'geannuleerd'
            and b.event_date >= current_date - interval '60 days'
          order by b.event_date
        `) as Array<{
          id: string;
          client_name: string;
          type: string;
          location_id: string;
          event_date: string;
          start_time: string;
          end_time: string;
          mine: boolean;
        }>;

        const wanted = rows.filter((r) => {
          if (cfg.include_all) return true;
          if (cfg.include_assigned && r.mine) return true;
          if (cfg.include_schools && (r.type === "teambuilding" || r.type === "zaalverhuur"))
            return true;
          return false;
        });

        const stamp = (date: string, time: string) =>
          `${date.replace(/-/g, "")}T${time.slice(0, 5).replace(":", "")}00`;
        const esc = (s: string) => s.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");

        const ADDRESS = "Schipperijkaai 2, 1000 Brussel";
        const lines = [
          "BEGIN:VCALENDAR",
          "VERSION:2.0",
          "PRODID:-//Maximilien//Agenda//NL",
          "CALSCALE:GREGORIAN",
          "METHOD:PUBLISH",
          "X-WR-CALNAME:Ferme Maximilien Agenda",
          "X-WR-TIMEZONE:Europe/Brussels",
        ];
        for (const r of wanted) {
          const title = r.type === "geblokkeerd" ? "Geblokkeerd" : r.client_name || "Reservatie";
          lines.push(
            "BEGIN:VEVENT",
            `UID:${r.id}@maximilien.site`,
            `DTSTAMP:${stamp(r.event_date, r.start_time)}`,
            `DTSTART;TZID=Europe/Brussels:${stamp(r.event_date, r.start_time)}`,
            `DTEND;TZID=Europe/Brussels:${stamp(r.event_date, r.end_time)}`,
            `SUMMARY:${esc(title)}`,
            `DESCRIPTION:${esc(`${title} — ${r.type} · Maximilien`)}`,
            `LOCATION:${esc(ADDRESS)}`,
            `CATEGORIES:${esc(r.type)}`,
            "END:VEVENT",
          );
        }
        lines.push("END:VCALENDAR");

        return new Response(lines.join("\r\n"), {
          status: 200,
          headers: {
            "content-type": "text/calendar; charset=utf-8",
            "content-disposition": 'inline; filename="maximilien-agenda.ics"',
            "cache-control": "no-store",
          },
        });
      },
    },
  },
});
