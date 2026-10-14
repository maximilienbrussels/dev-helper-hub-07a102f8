/**
 * Echte planningscontext voor Maxim: de komende 14 dagen met de openingsuren
 * uit de databank (inclusief uitzonderingen) en de reeds geboekte activiteiten
 * of reservaties. Zo hoeft de AI niets meer te gokken bij het maken van een
 * bezoekplanning.
 */
import {
  hoursForDate,
  seasonFor,
  type OpeningExceptionDbRow,
  type OpeningHourDbRow,
} from "@/lib/opening-hours";

const DAY_NL = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];

function brusselsToday(): Date {
  const now = new Date();
  const iso = now.toLocaleDateString("en-CA", { timeZone: "Europe/Brussels" });
  return new Date(`${iso}T12:00:00Z`);
}

/** Bouwt een compacte, feitelijke agenda-blok voor de systeemprompt. */
export async function buildPlanningContext(days = 14): Promise<string> {
  let hours: OpeningHourDbRow[] = [];
  let exceptions: OpeningExceptionDbRow[] = [];
  let events: { title: string; date: string; time: string | null }[] = [];

  try {
    const { db } = await import("@/lib/neon.server");
    const sql = db();

    const hourRows = (await sql`
      select weekday, season, is_open, open_time::text, close_time::text
      from opening_hours
    `.catch(() => [])) as Record<string, unknown>[];
    hours = hourRows.map((r) => ({
      weekday: Number(r["weekday"]),
      season: (r["season"] === "winter" ? "winter" : "zomer") as OpeningHourDbRow["season"],
      isOpen: Boolean(r["is_open"]),
      openTime: (r["open_time"] as string | null) ?? null,
      closeTime: (r["close_time"] as string | null) ?? null,
    }));

    const exceptionRows = (await sql`
      select date_from::text, date_to::text, closed, open_time::text, close_time::text
      from opening_exceptions
      where date_to >= current_date - interval '1 day'
    `.catch(() => [])) as Record<string, unknown>[];
    exceptions = exceptionRows.map((r) => ({
      dateFrom: String(r["date_from"]),
      dateTo: String(r["date_to"]),
      closed: Boolean(r["closed"]),
      openTime: (r["open_time"] as string | null) ?? null,
      closeTime: (r["close_time"] as string | null) ?? null,
    }));

    const eventRows = (await sql`
      select title_nl as title,
             event_date::text as date,
             to_char(start_time, 'HH24:MI') || '-' || to_char(end_time, 'HH24:MI') as time
      from events
      where is_public = true
        and event_date >= current_date
        and event_date < current_date + interval '21 days'
      order by event_date, start_time
      limit 25
    `.catch(() => [])) as Record<string, unknown>[];
    events = eventRows.map((r) => ({
      title: String(r["title"]),
      date: String(r["date"]),
      time: (r["time"] as string | null) ?? null,
    }));
  } catch (error) {
    console.error("[chat] planningcontext niet beschikbaar", error);
  }

  const start = brusselsToday();
  const lines: string[] = [];
  for (let i = 0; i < days; i += 1) {
    const day = new Date(start.getTime() + i * 86_400_000);
    const iso = day.toISOString().slice(0, 10);
    const weekday = day.getUTCDay();
    const open = hoursForDate(iso, weekday, seasonFor(day.getUTCMonth() + 1), hours, exceptions);
    const dayEvents = events.filter((e) => e.date === iso);
    const extra = dayEvents.length
      ? ` | activiteiten: ${dayEvents.map((e) => `${e.time ?? ""} ${e.title}`.trim()).join(", ")}`
      : "";
    lines.push(`  ${DAY_NL[weekday]} ${iso}: ${open ? `open ${open}` : "GESLOTEN"}${extra}`);
  }

  return [
    "- ECHTE AGENDA (bron: databank, dit is de waarheid — verzin nooit andere dagen, uren of activiteiten):",
    ...lines,
    "- PLANNINGREGELS: plan enkel op dagen die hierboven 'open' staan, blijf binnen de vermelde uren, vermeld altijd datum + dag + startuur + eindtijd, en geef nooit een planning met gaten of met activiteiten die hierboven niet vermeld staan. Weet je iets niet zeker, zeg dat eerlijk in plaats van te gokken.",
  ].join("\n");
}
