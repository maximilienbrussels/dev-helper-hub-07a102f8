import { z } from "zod";

/** Gedeelde validators. Bewust buiten de *.functions.ts-bestanden. */
export const emailInput = (d: unknown) =>
  z
    .object({
      email: z.string().trim().toLowerCase().email().max(254),
      naam: z.string().trim().max(120).optional(),
    })
    .parse(d);

export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null));
