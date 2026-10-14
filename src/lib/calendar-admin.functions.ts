/**
 * Eigen serverfuncties voor het volledige kalenderbeheer: reservaties en
 * blokkades bewerken/verwijderen, teamtoewijzingen, openingsuren/sluitingen
 * en eigen evenementen. Losstaand van portal.functions.ts zodat andere
 * agents dat bestand ongemoeid kunnen laten.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-middleware";
import { requirePermission } from "@/lib/portal-permissions";
import type { LocationId } from "@/lib/portal-types";

const locationId = z.enum(["chalet", "zaal", "prairie", "boerderij"]);
const time = z.string().regex(/^\d{2}:\d{2}$/);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

async function sql() {
  const { db } = await import("./neon.server");
  return db();
}

export type Assignment = {
  id: string;
  bookingId: string;
  profileId: string;
  profileName: string;
  task: string;
};

export type OpeningHourRow = {
  weekday: number;
  season: "zomer" | "winter";
  isOpen: boolean;
  openTime: string | null;
  closeTime: string | null;
};

export type OpeningExceptionRow = {
  id: string;
  dateFrom: string;
  dateTo: string;
  closed: boolean;
  openTime: string | null;
  closeTime: string | null;
  reasonNl: string;
  reasonFr: string;
  reasonEn: string;
};

export type CalendarEvent = {
  id: string;
  titleNl: string;
  titleFr: string;
  titleEn: string;
  date: string;
  startTime: string;
  endTime: string;
  locationId: LocationId;
  isPublic: boolean;
};

export type CalendarAdminSnapshot = {
  assignments: Assignment[];
  openingHours: OpeningHourRow[];
  openingExceptions: OpeningExceptionRow[];
  events: CalendarEvent[];
};

/** Alle beheergegevens voor de kalender in één keer ophalen. */
export const fetchCalendarAdmin = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<CalendarAdminSnapshot> => {
    await requirePermission(context, "view_calendar");
    const db = await sql();

    const assignmentRows = (await db`
      select ba.id::text as id, ba.booking_id::text as booking_id, ba.profile_id::text as profile_id,
             coalesce(nullif(trim(coalesce(p.full_name, concat_ws(' ', p.first_name, p.last_name))), ''), p.email, '') as profile_name,
             ba.task
      from booking_assignments ba
      join profiles p on p.id = ba.profile_id
      order by ba.created_at
    `) as Array<{
      id: string;
      booking_id: string;
      profile_id: string;
      profile_name: string;
      task: string;
    }>;

    const hourRows = (await db`
      select weekday, season, is_open, open_time::text as open_time, close_time::text as close_time
      from opening_hours order by season, weekday
    `) as Array<{
      weekday: number;
      season: string;
      is_open: boolean;
      open_time: string | null;
      close_time: string | null;
    }>;

    const exceptionRows = (await db`
      select id::text as id, date_from::text as date_from, date_to::text as date_to, closed,
             open_time::text as open_time, close_time::text as close_time,
             reason_nl, reason_fr, reason_en
      from opening_exceptions order by date_from desc
    `) as Array<{
      id: string;
      date_from: string;
      date_to: string;
      closed: boolean;
      open_time: string | null;
      close_time: string | null;
      reason_nl: string;
      reason_fr: string;
      reason_en: string;
    }>;

    const eventRows = (await db`
      select id::text as id, title_nl, title_fr, title_en, event_date::text as event_date,
             start_time::text as start_time, end_time::text as end_time, location_id, is_public
      from events order by event_date
    `) as Array<{
      id: string;
      title_nl: string;
      title_fr: string;
      title_en: string;
      event_date: string;
      start_time: string;
      end_time: string;
      location_id: string;
      is_public: boolean;
    }>;

    return {
      assignments: assignmentRows.map((r) => ({
        id: r.id,
        bookingId: r.booking_id,
        profileId: r.profile_id,
        profileName: r.profile_name,
        task: r.task,
      })),
      openingHours: hourRows.map((r) => ({
        weekday: r.weekday,
        season: r.season as "zomer" | "winter",
        isOpen: r.is_open,
        openTime: r.open_time?.slice(0, 5) ?? null,
        closeTime: r.close_time?.slice(0, 5) ?? null,
      })),
      openingExceptions: exceptionRows.map((r) => ({
        id: r.id,
        dateFrom: r.date_from,
        dateTo: r.date_to,
        closed: r.closed,
        openTime: r.open_time?.slice(0, 5) ?? null,
        closeTime: r.close_time?.slice(0, 5) ?? null,
        reasonNl: r.reason_nl,
        reasonFr: r.reason_fr,
        reasonEn: r.reason_en,
      })),
      events: eventRows.map((r) => ({
        id: r.id,
        titleNl: r.title_nl,
        titleFr: r.title_fr,
        titleEn: r.title_en,
        date: r.event_date,
        startTime: r.start_time.slice(0, 5),
        endTime: r.end_time.slice(0, 5),
        locationId: r.location_id as LocationId,
        isPublic: r.is_public,
      })),
    };
  });

/* --------------------------------------------------------- reservaties */

const updateBookingInput = z.object({
  id: z.string().uuid(),
  date,
  start_time: time,
  end_time: time,
  location_id: locationId,
  guests_count: z.number().int().min(0).max(1000),
  price: z.number().min(0).max(1000000),
  status: z.enum([
    "nieuw",
    "in_behandeling",
    "offerte_verzonden",
    "gereserveerd",
    "afgerond",
    "geannuleerd",
  ]),
});

/** Bestaande reservatie volledig bewerken (datum, uren, ruimte, aantal, prijs, status). */
export const updateBooking = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => updateBookingInput.parse(d))
  .handler(async ({ data, context }) => {
    await requirePermission(context, "manage_calendar");
    const db = await sql();
    await db`
      update bookings set
        event_date = ${data.date}, start_time = ${data.start_time}, end_time = ${data.end_time},
        location_id = ${data.location_id}, guests_count = ${data.guests_count},
        price = ${data.price}, status = ${data.status}
      where id = ${data.id}::uuid
    `;
    return { ok: true };
  });

const updateBlockInput = z.object({
  id: z.string().uuid(),
  date,
  start_time: time,
  end_time: time,
  location_id: locationId,
  reason: z.string().trim().max(120),
});

/** Bestaande blokkade bewerken. */
export const updateBlock = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => updateBlockInput.parse(d))
  .handler(async ({ data, context }) => {
    await requirePermission(context, "manage_calendar");
    const db = await sql();
    await db`
      update bookings set
        event_date = ${data.date}, start_time = ${data.start_time}, end_time = ${data.end_time},
        location_id = ${data.location_id}, client_name = ${data.reason || "Niet beschikbaar"}
      where id = ${data.id}::uuid and type = 'geblokkeerd'
    `;
    return { ok: true };
  });

/** Blokkade verwijderen. */
export const deleteBlock = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requirePermission(context, "manage_calendar");
    const db = await sql();
    await db`delete from bookings where id = ${data.id}::uuid and type = 'geblokkeerd'`;
    return { ok: true };
  });

/* --------------------------------------------------------- toewijzingen */

const assignInput = z.object({
  bookingId: z.string().uuid(),
  profileId: z.string().uuid(),
  task: z.string().trim().max(160).optional().default(""),
});

/** Eén teamlid met taak toewijzen aan een reservatie. */
export const assignStaffToBooking = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => assignInput.parse(d))
  .handler(async ({ data, context }) => {
    await requirePermission(context, "manage_calendar");
    const db = await sql();
    await db`
      insert into booking_assignments (booking_id, profile_id, task)
      values (${data.bookingId}::uuid, ${data.profileId}::uuid, ${data.task})
      on conflict (booking_id, profile_id, task) do nothing
    `;
    return { ok: true };
  });

/** Toewijzing verwijderen. */
export const removeAssignment = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requirePermission(context, "manage_calendar");
    const db = await sql();
    await db`delete from booking_assignments where id = ${data.id}::uuid`;
    return { ok: true };
  });

/* --------------------------------------------------------- openingsuren */

const openingHourInput = z.object({
  weekday: z.number().int().min(0).max(6),
  season: z.enum(["zomer", "winter"]),
  isOpen: z.boolean(),
  openTime: time.nullable(),
  closeTime: time.nullable(),
});

/** Eén openingsuren-rij (weekdag + seizoen) opslaan. */
export const saveOpeningHour = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => openingHourInput.parse(d))
  .handler(async ({ data, context }) => {
    await requirePermission(context, "manage_calendar");
    const db = await sql();
    await db`
      insert into opening_hours (weekday, season, is_open, open_time, close_time, updated_at)
      values (${data.weekday}, ${data.season}, ${data.isOpen}, ${data.openTime}, ${data.closeTime}, now())
      on conflict (weekday, season) do update set
        is_open = excluded.is_open, open_time = excluded.open_time,
        close_time = excluded.close_time, updated_at = now()
    `;
    return { ok: true };
  });

const exceptionInput = z.object({
  id: z.string().uuid().optional(),
  dateFrom: date,
  dateTo: date,
  closed: z.boolean(),
  openTime: time.nullable(),
  closeTime: time.nullable(),
  reasonNl: z.string().trim().max(200),
  reasonFr: z.string().trim().max(200),
  reasonEn: z.string().trim().max(200),
});

/** Sluitingsdag of afwijkende uren toevoegen of bewerken. */
export const saveOpeningException = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => exceptionInput.parse(d))
  .handler(async ({ data, context }) => {
    await requirePermission(context, "manage_calendar");
    const db = await sql();
    if (data.id) {
      await db`
        update opening_exceptions set
          date_from = ${data.dateFrom}, date_to = ${data.dateTo}, closed = ${data.closed},
          open_time = ${data.openTime}, close_time = ${data.closeTime},
          reason_nl = ${data.reasonNl}, reason_fr = ${data.reasonFr}, reason_en = ${data.reasonEn}
        where id = ${data.id}::uuid
      `;
    } else {
      await db`
        insert into opening_exceptions
          (date_from, date_to, closed, open_time, close_time, reason_nl, reason_fr, reason_en)
        values (${data.dateFrom}, ${data.dateTo}, ${data.closed}, ${data.openTime}, ${data.closeTime},
                ${data.reasonNl}, ${data.reasonFr}, ${data.reasonEn})
      `;
    }
    return { ok: true };
  });

/** Sluitingsdag/-periode verwijderen. */
export const deleteOpeningException = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requirePermission(context, "manage_calendar");
    const db = await sql();
    await db`delete from opening_exceptions where id = ${data.id}::uuid`;
    return { ok: true };
  });

/* --------------------------------------------------------- evenementen */

const eventInput = z.object({
  id: z.string().uuid().optional(),
  titleNl: z.string().trim().min(1).max(160),
  titleFr: z.string().trim().min(1).max(160),
  titleEn: z.string().trim().min(1).max(160),
  date,
  startTime: time,
  endTime: time,
  locationId,
  isPublic: z.boolean(),
});

/** Evenement aanmaken of bewerken. */
export const saveEvent = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => eventInput.parse(d))
  .handler(async ({ data, context }) => {
    await requirePermission(context, "manage_calendar");
    const db = await sql();
    if (data.id) {
      await db`
        update events set
          title_nl = ${data.titleNl}, title_fr = ${data.titleFr}, title_en = ${data.titleEn},
          event_date = ${data.date}, start_time = ${data.startTime}, end_time = ${data.endTime},
          location_id = ${data.locationId}, is_public = ${data.isPublic}, updated_at = now()
        where id = ${data.id}::uuid
      `;
    } else {
      await db`
        insert into events
          (title_nl, title_fr, title_en, event_date, start_time, end_time, location_id, is_public)
        values (${data.titleNl}, ${data.titleFr}, ${data.titleEn}, ${data.date}, ${data.startTime},
                ${data.endTime}, ${data.locationId}, ${data.isPublic})
      `;
    }
    return { ok: true };
  });

/** Evenement verwijderen. */
export const deleteEvent = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requirePermission(context, "manage_calendar");
    const db = await sql();
    let imageUrl: string | null = null;
    try {
      const rows = (await db`
        select image_url from events where id = ${data.id}::uuid
      `) as Array<{ image_url: string | null }>;
      imageUrl = rows[0]?.image_url ?? null;
    } catch {
      imageUrl = null; // kolom bestaat (nog) niet
    }
    await db`delete from events where id = ${data.id}::uuid`;
    const { deleteByPublicUrl } = await import("./s3.server");
    await deleteByPublicUrl(imageUrl);
    return { ok: true };
  });
