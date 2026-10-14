/**
 * Boekingen + Stripe-betalingen, server-only.
 * De browser bepaalt nooit het bedrag: de prijs komt uit de vaste formules
 * hieronder en wordt server-side berekend.
 */
import Stripe from "stripe";
import { db, one } from "@/lib/neon.server";
import type { MailLang } from "@/lib/email-copy";

export type BookingKind =
  | "teambuilding"
  | "privatisering"
  | "zaalverhuur"
  | "peterschap"
  | "stage";

/** Vaste formules met een serverprijs in cent. */
export const BOOKING_PRODUCTS: Record<
  string,
  {
    kind: BookingKind;
    labelNl: string;
    labelFr: string;
    labelEn: string;
    amountCent: number;
  }
> = {
  zaalverhuur_halve_dag: {
    kind: "zaalverhuur",
    labelNl: "Zaalverhuur — halve dag",
    labelFr: "Location de salle — demi-journée",
    labelEn: "Room rental — half day",
    amountCent: 15000,
  },
  zaalverhuur_dag: {
    kind: "zaalverhuur",
    labelNl: "Zaalverhuur — volledige dag",
    labelFr: "Location de salle — journée complète",
    labelEn: "Room rental — full day",
    amountCent: 25000,
  },
  feestje: {
    kind: "privatisering",
    labelNl: "Kinderfeestje (max. 15 kinderen)",
    labelFr: "Fête d'enfants (max. 15 enfants)",
    labelEn: "Children's party (max. 15 children)",
    amountCent: 18000,
  },
  teambuilding: {
    kind: "teambuilding",
    labelNl: "Teambuilding — halve dag",
    labelFr: "Team-building — demi-journée",
    labelEn: "Team building — half day",
    amountCent: 45000,
  },
  peterschap_maand: {
    kind: "peterschap",
    labelNl: "Peterschap — steun per jaar",
    labelFr: "Parrainage — soutien par an",
    labelEn: "Sponsorship — support per year",
    amountCent: 6000,
  },
  stage_week: {
    kind: "stage",
    labelNl: "Vakantiestage — één week",
    labelFr: "Stage de vacances — une semaine",
    labelEn: "Holiday camp — one week",
    amountCent: 14000,
  },
};

/**
 * Elke formule speelt zich af op een bestaande locatie uit `public.locations`.
 * Zonder deze koppeling weigert de databank de boeking (verwijssleutel).
 */
export const BOOKING_LOCATION: Record<string, string> = {
  zaalverhuur_halve_dag: "zaal",
  zaalverhuur_dag: "zaal",
  feestje: "chalet",
  teambuilding: "boerderij",
  peterschap_maand: "boerderij",
  stage_week: "boerderij",
};

/** Locatie voor een formule; valt terug op de hele boerderij. */
export function bookingLocationId(productId: string): string {
  return BOOKING_LOCATION[productId] ?? "boerderij";
}

/**
 * Koppeling naar de gedeelde tarieventabel: exact dezelfde rijen die de
 * publieke pagina's tonen. Past het team een prijs aan in het portaal, dan
 * verandert meteen ook het bedrag dat Stripe aanrekent.
 */
export const BOOKING_PRICING_KEY: Record<string, string> = {
  zaalverhuur_halve_dag: "rental.zaal.half",
  zaalverhuur_dag: "rental.zaal.full",
  feestje: "birthday.woensdag",
  teambuilding: "booking.teambuilding",
  peterschap_maand: "booking.peterschap_maand",
  stage_week: "camp.week",
};

/** Bedrag in cent voor een formule — databank eerst, code als vangnet. */
export async function bookingAmountCent(productId: string): Promise<number> {
  const product = BOOKING_PRODUCTS[productId];
  if (!product) throw new Error("Onbekende formule");
  const key = BOOKING_PRICING_KEY[productId];
  if (!key) return product.amountCent;
  const { priceForKey } = await import("./pricing.server");
  const euros = await priceForKey(key, product.amountCent / 100);
  return Math.round(euros * 100);
}

/** Formulenaam in de taal van de bezoeker (terugval NL). */
export function bookingLabel(id: string, lang: "nl" | "fr" | "en"): string {
  const p = BOOKING_PRODUCTS[id];
  if (!p) return id;
  return lang === "fr" ? p.labelFr : lang === "en" ? p.labelEn : p.labelNl;
}

export type BookingRow = {
  id: string;
  reference: string;
  client_name: string;
  client_email: string;
  event_date: string;
  guests_count: number;
  amount_cent: number;
  lang: MailLang;
  payment_status: string;
  location_id: string;
  confirmation_sent_at: string | null;
};

export function stripeClient(): Stripe {
  const key = process.env["STRIPE_SECRET_KEY"];
  if (!key) {
    // In ontwikkeling een duidelijke melding, in productie hard stoppen.
    const msg =
      "STRIPE_SECRET_KEY ontbreekt: betalingen zijn uitgeschakeld. Zet de sleutel bij de projectgeheimen.";
    if (process.env["NODE_ENV"] !== "production") console.warn(`[betalingen] ${msg}`);
    throw new Error(msg);
  }
  return new Stripe(key, { apiVersion: "2025-08-27.basil" as Stripe.LatestApiVersion });
}

export async function createPendingBooking(input: {
  product: string;
  naam: string;
  email: string;
  telefoon?: string;
  datum: string;
  startTime?: string;
  endTime?: string;
  personen: number;
  opmerking?: string;
  lang: MailLang;
}): Promise<BookingRow> {
  const product = BOOKING_PRODUCTS[input.product];
  if (!product) throw new Error("Onbekende formule");
  const amountCent = await bookingAmountCent(input.product);

  const row = await one<BookingRow>(db()`
    insert into public.bookings
      (type, status, client_name, client_email, client_phone, event_date,
       start_time, end_time,
       location_id, guests_count, price, amount_cent, lang, payment_status, notes)
    values
      (${product.kind}::booking_type, 'nieuw', ${input.naam}, ${input.email},
       ${input.telefoon ?? ""}, ${input.datum},
       ${input.startTime ?? "09:00"}, ${input.endTime ?? "17:00"},
       ${bookingLocationId(input.product)}, ${input.personen},
       ${amountCent / 100}, ${amountCent}, ${input.lang}, 'PENDING',
       ${input.opmerking ?? null})
    returning id, reference, client_name, client_email, event_date::text as event_date,
              guests_count, amount_cent, lang, payment_status, location_id, confirmation_sent_at
  `);
  if (!row) throw new Error("Boeking kon niet worden opgeslagen");
  return row;
}

/**
 * Reserveert één plaats in een tijdslot. Geeft false wanneer het slot
 * intussen volzet of geblokkeerd is (atomair via de where-voorwaarde).
 */
export async function reserveSlot(slotId: string): Promise<boolean> {
  const rows = (await db()`
    update public.booking_slots
       set booked_count = booked_count + 1
     where id = ${slotId}::uuid
       and is_blocked = false
       and booked_count < max_capacity
    returning id
  `) as Array<{ id: string }>;
  return rows.length > 0;
}

export async function attachPaymentIntent(bookingId: string, paymentIntentId: string) {
  await db()`
    update public.bookings set stripe_payment_intent_id = ${paymentIntentId}, updated_at = now()
    where id = ${bookingId}
  `;
}

export async function bookingByPaymentIntent(pi: string): Promise<BookingRow | null> {
  return one<BookingRow>(db()`
    select id, reference, client_name, client_email, event_date::text as event_date,
           guests_count, amount_cent, lang, payment_status, location_id, confirmation_sent_at
    from public.bookings where stripe_payment_intent_id = ${pi} limit 1
  `);
}

export async function bookingByReference(reference: string): Promise<BookingRow | null> {
  return one<BookingRow>(db()`
    select id, reference, client_name, client_email, event_date::text as event_date,
           guests_count, amount_cent, lang, payment_status, location_id, confirmation_sent_at
    from public.bookings where reference = ${reference} limit 1
  `);
}

/** Zet de boeking op betaald (idempotent) en meldt of dit de eerste keer was. */
export async function markBookingPaid(pi: string): Promise<BookingRow | null> {
  const rows = (await db()`
    update public.bookings
       set payment_status = 'PAID', status = 'gereserveerd', paid_at = coalesce(paid_at, now()),
           updated_at = now()
     where stripe_payment_intent_id = ${pi} and payment_status <> 'PAID'
    returning id, reference, client_name, client_email, event_date::text as event_date,
              guests_count, amount_cent, lang, payment_status, location_id, confirmation_sent_at
  `) as BookingRow[];
  return rows.length ? (rows[0] as BookingRow) : null;
}

export async function markBookingFailed(pi: string) {
  await db()`
    update public.bookings
       set payment_status = 'FAILED', updated_at = now()
     where stripe_payment_intent_id = ${pi} and payment_status = 'PENDING'
  `;
}

export async function markConfirmationSent(bookingId: string) {
  await db()`update public.bookings set confirmation_sent_at = now() where id = ${bookingId}`;
}

/** Bevestigingsmail in de taal die de bezoeker koos. */
export async function sendBookingConfirmation(booking: BookingRow): Promise<void> {
  const { sendMail, bookingPaidEmail } = await import("@/lib/email.server");
  const { subject, html } = bookingPaidEmail({
    naam: booking.client_name,
    referentie: booking.reference,
    formule: bookingLabel(booking.location_id, booking.lang),
    datum: booking.event_date,
    personen: booking.guests_count,
    bedrag_cent: booking.amount_cent,
    lang: booking.lang,
  });
  await sendMail({ to: booking.client_email, subject, html, kind: "boeking" });
  await markConfirmationSent(booking.id);
}
