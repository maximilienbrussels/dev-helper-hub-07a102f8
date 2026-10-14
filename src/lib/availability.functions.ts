/**
 * Serverfuncties voor de dynamische boekingskalender.
 *
 *  - publiek : beschikbare dagen + tijdsloten per formule (leesbaar zonder login)
 *  - beheer  : sluitingsdagen, slotregels, slots genereren en handmatig overriden
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-middleware";
import { requirePermission } from "@/lib/portal-permissions";
import { FORMULA_TYPES, hhmm, type AvailabilityResponse } from "@/lib/availability";

const formula = z.enum(FORMULA_TYPES);
const time = z.string().regex(/^\d{2}:\d{2}$/);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

async function sql() {
  const { db } = await import("./neon.server");
  return db();
}

/* ------------------------------------------------------------------ publiek */

/** Beschikbare tijdsloten + sluitingsdagen voor één formule in een periode. */
export const fetchAvailability = createServerFn({ method: "GET" })
  .validator((d: unknown) =>
    z.object({ formula, from: date, to: date }).parse(d),
  )
  .handler(async ({ data }): Promise<AvailabilityResponse> => {
    const db = await sql();

    const slotRows = (await db`
      select s.id::text as id, s.date::text as date, s.start_time::text as start_time,
             s.end_time::text as end_time, s.max_capacity, s.booked_count
        from booking_slots s
        left join blocked_dates b on b.date = s.date
       where s.formula_type = ${data.formula}
         and s.date between ${data.from} and ${data.to}
         and s.is_blocked = false
         and b.id is null
         and s.booked_count < s.max_capacity
       order by s.date, s.start_time
    `) as Array<{
      id: string;
      date: string;
      start_time: string;
      end_time: string;
      max_capacity: number;
      booked_count: number;
    }>;

    const blockedRows = (await db`
      select date::text as date from blocked_dates
       where date between ${data.from} and ${data.to} order by date
    `) as Array<{ date: string }>;

    return {
      slots: slotRows.map((r) => ({
        id: r.id,
        date: r.date,
        startTime: hhmm(r.start_time),
        endTime: hhmm(r.end_time),
        remaining: Math.max(0, r.max_capacity - r.booked_count),
      })),
      blockedDates: blockedRows.map((r) => r.date),
    };
  });

/* ------------------------------------------------------------------- beheer */

export type AdminSlot = {
  id: string;
  formulaType: string;
  date: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  bookedCount: number;
  isBlocked: boolean;
  note: string | null;
};

export type SlotRule = {
  id: string;
  formulaType: string;
  weekday: number;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  isActive: boolean;
};

export type BlockedDate = { id: string; date: string; reason: string };

export type AvailabilityAdminSnapshot = {
  slots: AdminSlot[];
  rules: SlotRule[];
  blockedDates: BlockedDate[];
};

/** Alle beschikbaarheidsgegevens voor het beheer in één keer. */
export const fetchAvailabilityAdmin = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .validator((d: unknown) => z.object({ from: date, to: date }).parse(d))
  .handler(async ({ data, context }): Promise<AvailabilityAdminSnapshot> => {
    await requirePermission(context, "view_calendar");
    const db = await sql();

    const slotRows = (await db`
      select id::text as id, formula_type, date::text as date, start_time::text as start_time,
             end_time::text as end_time, max_capacity, booked_count, is_blocked, note
        from booking_slots where date between ${data.from} and ${data.to}
       order by date, start_time, formula_type
    `) as Array<Record<string, never>>;

    const ruleRows = (await db`
      select id::text as id, formula_type, weekday, start_time::text as start_time,
             end_time::text as end_time, max_capacity, is_active
        from booking_slot_rules order by formula_type, weekday, start_time
    `) as Array<Record<string, never>>;

    const blockedRows = (await db`
      select id::text as id, date::text as date, reason from blocked_dates order by date
    `) as Array<{ id: string; date: string; reason: string }>;

    return {
      slots: (slotRows as unknown as Array<{
        id: string;
        formula_type: string;
        date: string;
        start_time: string;
        end_time: string;
        max_capacity: number;
        booked_count: number;
        is_blocked: boolean;
        note: string | null;
      }>).map((r) => ({
        id: r.id,
        formulaType: r.formula_type,
        date: r.date,
        startTime: hhmm(r.start_time),
        endTime: hhmm(r.end_time),
        maxCapacity: r.max_capacity,
        bookedCount: r.booked_count,
        isBlocked: r.is_blocked,
        note: r.note,
      })),
      rules: (ruleRows as unknown as Array<{
        id: string;
        formula_type: string;
        weekday: number;
        start_time: string;
        end_time: string;
        max_capacity: number;
        is_active: boolean;
      }>).map((r) => ({
        id: r.id,
        formulaType: r.formula_type,
        weekday: r.weekday,
        startTime: hhmm(r.start_time),
        endTime: hhmm(r.end_time),
        maxCapacity: r.max_capacity,
        isActive: r.is_active,
      })),
      blockedDates: blockedRows,
    };
  });

/** Dag blokkeren of vrijgeven voor publieke boekingen. */
export const toggleBlockedDate = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) =>
    z.object({ date, reason: z.string().trim().max(160).optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await requirePermission(context, "manage_calendar");
    const db = await sql();
    const existing = (await db`
      select id::text as id from blocked_dates where date = ${data.date} limit 1
    `) as Array<{ id: string }>;
    if (existing.length) {
      await db`delete from blocked_dates where date = ${data.date}`;
      return { blocked: false };
    }
    await db`
      insert into blocked_dates (date, reason)
      values (${data.date}, ${data.reason?.trim() || "Sluitingsdag"})
    `;
    return { blocked: true };
  });

/** Standaardregel per weekdag toevoegen of bijwerken. */
export const saveSlotRule = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        formulaType: formula,
        weekday: z.number().int().min(0).max(6),
        startTime: time,
        endTime: time,
        maxCapacity: z.number().int().min(1).max(500),
        isActive: z.boolean().default(true),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requirePermission(context, "manage_calendar");
    const db = await sql();
    if (data.id) {
      await db`
        update booking_slot_rules set
          formula_type = ${data.formulaType}, weekday = ${data.weekday},
          start_time = ${data.startTime}, end_time = ${data.endTime},
          max_capacity = ${data.maxCapacity}, is_active = ${data.isActive}
        where id = ${data.id}::uuid
      `;
    } else {
      await db`
        insert into booking_slot_rules
          (formula_type, weekday, start_time, end_time, max_capacity, is_active)
        values (${data.formulaType}, ${data.weekday}, ${data.startTime}, ${data.endTime},
                ${data.maxCapacity}, ${data.isActive})
        on conflict (formula_type, weekday, start_time, end_time) do update
          set max_capacity = excluded.max_capacity, is_active = excluded.is_active
      `;
    }
    return { ok: true };
  });

/** Standaardregel verwijderen. */
export const deleteSlotRule = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requirePermission(context, "manage_calendar");
    const db = await sql();
    await db`delete from booking_slot_rules where id = ${data.id}::uuid`;
    return { ok: true };
  });

/**
 * Slots aanmaken op basis van de actieve regels voor een periode.
 * Bestaande slots blijven ongemoeid (booked_count blijft dus correct).
 * Stages krijgen enkel maandagen — de regel staat al op weekday 1.
 */
export const generateSlots = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) =>
    z.object({ from: date, to: date, formulaType: formula.optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await requirePermission(context, "manage_calendar");
    const db = await sql();
    const rows = (await db`
      insert into booking_slots (formula_type, date, start_time, end_time, max_capacity)
      select r.formula_type, d::date, r.start_time, r.end_time, r.max_capacity
        from booking_slot_rules r
        join generate_series(${data.from}::date, ${data.to}::date, interval '1 day') d
          on extract(dow from d)::int = r.weekday
       where r.is_active
         and (${data.formulaType ?? null}::text is null or r.formula_type = ${data.formulaType ?? null})
      on conflict (formula_type, date, start_time, end_time) do nothing
      returning id
    `) as Array<{ id: string }>;
    return { created: rows.length };
  });

/** Handmatig slot toevoegen of overriden (capaciteit, blokkeren, notitie). */
export const saveSlot = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        formulaType: formula,
        date,
        startTime: time,
        endTime: time,
        maxCapacity: z.number().int().min(1).max(500).default(1),
        bookedCount: z.number().int().min(0).max(500).optional(),
        isBlocked: z.boolean().default(false),
        note: z.string().trim().max(200).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requirePermission(context, "manage_calendar");
    const db = await sql();
    if (data.id) {
      await db`
        update booking_slots set
          formula_type = ${data.formulaType}, date = ${data.date},
          start_time = ${data.startTime}, end_time = ${data.endTime},
          max_capacity = ${data.maxCapacity},
          booked_count = coalesce(${data.bookedCount ?? null}::int, booked_count),
          is_blocked = ${data.isBlocked}, note = ${data.note ?? null}
        where id = ${data.id}::uuid
      `;
    } else {
      await db`
        insert into booking_slots
          (formula_type, date, start_time, end_time, max_capacity, booked_count, is_blocked, note)
        values (${data.formulaType}, ${data.date}, ${data.startTime}, ${data.endTime},
                ${data.maxCapacity}, ${data.bookedCount ?? 0}, ${data.isBlocked}, ${data.note ?? null})
        on conflict (formula_type, date, start_time, end_time) do update set
          max_capacity = excluded.max_capacity, is_blocked = excluded.is_blocked,
          note = excluded.note
      `;
    }
    return { ok: true };
  });

/** Slot verwijderen. */
export const deleteSlot = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requirePermission(context, "manage_calendar");
    const db = await sql();
    await db`delete from booking_slots where id = ${data.id}::uuid`;
    return { ok: true };
  });
