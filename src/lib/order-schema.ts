import { z } from "zod";
import { PAYMENT_CHOICES } from "./payment-methods";

export const orderInputSchema = z.object({
  email: z.string().trim().email().max(160),
  naam: z.string().trim().max(120).optional(),
  afhaalmoment: z.string().trim().min(1).max(160),
  pickup_iso: z.string().datetime().optional(),
  lang: z.enum(["nl", "fr", "en"]).optional(),
  method: z.enum(["manual_iban", ...PAYMENT_CHOICES]),

  /** Verpakkingskeuze voor de hele bestelling. */
  packaging_choice: z.enum(["own_container", "paper_bag", "cotton_bag"]).default("own_container"),
  /** Indicatie vanuit de browser; de server herberekent de toeslag zelf. */
  packaging_fee: z.number().min(0).max(10).optional(),

  items: z
    .array(
      z.object({
        product_id: z.number().int().positive(),
        quantity: z.number().int().min(1).max(99),
        // Enkel de id van de verpakkingsoptie; de prijs bepaalt de server zelf.
        packaging_id: z.string().trim().max(40).optional(),
      }),
    )
    .min(1)
    .max(30),
});

export type OrderInput = z.infer<typeof orderInputSchema>;
