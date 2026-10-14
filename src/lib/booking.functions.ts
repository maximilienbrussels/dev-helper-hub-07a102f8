import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Publieke status van één boeking, op basis van de referentie uit de mail/URL. */
export const getBookingStatus = createServerFn({ method: "GET" })
  .validator((d: unknown) =>
    z.object({ reference: z.string().min(4).max(40) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { bookingByReference, bookingLabel } = await import("@/lib/booking-payment.server");
    const booking = await bookingByReference(data.reference.toUpperCase());
    if (!booking) return null;
    return {
      reference: booking.reference,
      naam: booking.client_name,
      email: booking.client_email,
      datum: booking.event_date,
      personen: booking.guests_count,
      bedrag_cent: booking.amount_cent,
      status: booking.payment_status,
      formule: bookingLabel(booking.location_id, booking.lang),
    };
  });
