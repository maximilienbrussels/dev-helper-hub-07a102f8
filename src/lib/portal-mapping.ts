import { z } from "zod";
import type { Booking, LocationId, Service, StaffMember } from "./portal-types";

export interface PortalSnapshot {
  bookings: Booking[];
  services: Service[];
  staff: StaffMember[];
  currentUserId: string;
  currentRole: "admin" | "team";
}

const locationId = z.enum(["chalet", "zaal", "prairie", "boerderij"]);
const time = z.string().regex(/^\d{2}:\d{2}$/);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const idInput = z.object({ id: z.string().uuid() });

export const statusInput = z.object({
  id: z.string().uuid(),
  status: z.enum([
    "nieuw",
    "in_behandeling",
    "offerte_verzonden",
    "gereserveerd",
    "afgerond",
    "geannuleerd",
  ]),
});

export const noteInput = z.object({
  id: z.string().uuid(),
  body: z.string().trim().min(1).max(1000),
});

export const bookingInput = z.object({
  type: z.enum(["teambuilding", "privatisering", "zaalverhuur", "geblokkeerd"]),
  status: z.enum([
    "nieuw",
    "in_behandeling",
    "offerte_verzonden",
    "gereserveerd",
    "afgerond",
    "geannuleerd",
  ]),
  client_name: z.string().trim().min(1).max(120),
  client_org: z.string().trim().max(120).optional().default(""),
  client_email: z.string().trim().email().max(255).or(z.literal("")),
  client_phone: z.string().trim().max(40),
  date,
  start_time: time,
  end_time: time,
  location_id: locationId,
  guests_count: z.number().int().min(0).max(1000),
  options: z.array(z.string().trim().max(120)).max(20).optional(),
  price: z.number().min(0).max(1000000),
});

export const blockInput = z.object({
  date,
  start_time: time,
  end_time: time,
  location_id: locationId,
  reason: z.string().trim().max(120),
});

export const serviceInput = z.object({
  id: z.string().uuid(),
  title_fr: z.string().trim().min(1).max(160),
  title_nl: z.string().trim().min(1).max(160),
  title_en: z.string().trim().min(1).max(160),
  desc_fr: z.string().trim().max(1000),
  desc_nl: z.string().trim().max(1000),
  desc_en: z.string().trim().max(1000),
  price: z.number().min(0).max(1000000),
  location_id: locationId,
  active: z.boolean(),
});

/** Nieuwe dienst: zelfde velden, nog zonder id. */
export const serviceCreateInput = serviceInput.omit({ id: true });

/** Nieuwe volgorde: lijst van id's in de gewenste sortering. */
export const reorderInput = z.object({
  ids: z.array(z.string().uuid()).min(1).max(200),
});


export const staffInput = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  role: z.enum(["admin", "team"]),
  active: z.boolean(),
});

export const publicRequestInput = z.object({
  client_name: z.string().trim().min(2).max(120),
  client_org: z.string().trim().max(120).optional().default(""),
  client_email: z.string().trim().email().max(255),
  client_phone: z.string().trim().min(6).max(40),
  type: z.enum(["teambuilding", "privatisering", "zaalverhuur"]),
  date,
  start_time: time,
  end_time: time,
  location_id: locationId,
  guests_count: z.number().int().min(1).max(1000),
  message: z.string().trim().max(1000).optional().default(""),
});

type BookingRow = {
  id: string;
  type: string;
  status: string;
  client_name: string;
  client_org: string | null;
  client_email: string;
  client_phone: string;
  event_date: string;
  start_time: string;
  end_time: string;
  location_id: string;
  guests_count: number;
  options: string[] | null;
  price: number | string;
  day_status: string;
  created_at: string;
};

type NoteRow = { booking_id: string; body: string };

export function mapBooking(row: BookingRow, notes: NoteRow[]): Booking {
  return {
    id: row.id,
    type: row.type as Booking["type"],
    status: row.status as Booking["status"],
    client_name: row.client_name,
    client_org: row.client_org ?? undefined,
    client_email: row.client_email,
    client_phone: row.client_phone,
    date: row.event_date,
    start_time: row.start_time.slice(0, 5),
    end_time: row.end_time.slice(0, 5),
    location_id: row.location_id as LocationId,
    guests_count: row.guests_count,
    options: row.options ?? [],
    internal_notes: notes.filter((n) => n.booking_id === row.id).map((n) => n.body),
    price: Number(row.price),
    day_status: row.day_status as Booking["day_status"],
    created_at: row.created_at.slice(0, 10),
  };
}

export type { Service, StaffMember };
