import { z } from "zod";
import { ACADEMY_CATEGORIES } from "./academy-filter";

export const ACADEMY_STATUSES = ["concept", "wacht_op_goedkeuring", "gepubliceerd"] as const;
export type AcademyStatus = (typeof ACADEMY_STATUSES)[number];

/**
 * Vertaalsleutels per status (drietalig via t() in de UI, zie
 * portal-i18n/academy.ts — sleutels "academy.status.<status>").
 */
export const STATUS_LABEL_KEYS: Record<AcademyStatus, string> = {
  concept: "academy.status.concept",
  wacht_op_goedkeuring: "academy.status.wachtOpGoedkeuring",
  gepubliceerd: "academy.status.live",
};

const text = (max: number) => z.string().trim().min(1).max(max);
const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v && v.length > 0 ? v : null));

export const academyInputSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  slug: text(60).regex(/^[a-z0-9-]+$/, "Enkel kleine letters, cijfers en streepjes"),
  diersoort_naam: text(80),
  diersoort_naam_fr: optional(80),
  diersoort_naam_en: optional(80),
  beschrijving: optional(600),
  beschrijving_fr: optional(600),
  beschrijving_en: optional(600),
  categorie: z.enum(ACADEMY_CATEGORIES),
  badge_icon: text(8),
  cover_image_url: optional(500),
  cover_image_alt: optional(200),
  vragen_per_test: z.number().int().min(1).max(60),
  slaag_grens: z.number().int().min(1).max(60),
  prioriteit: z.number().int().min(0).max(999),
  is_active: z.boolean(),
});

export type AcademyInput = z.infer<typeof academyInputSchema>;

export const vraagInputSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  academy_id: z.string().uuid(),
  module: z.number().int().min(1).max(3),
  doelgroep: z.enum(["kids", "16plus", "beide"]).default("beide"),
  vraag_type: z.enum(["tekst", "beeld", "audio", "getal"]),
  vraag_tekst: text(400),
  vraag_tekst_fr: optional(400),
  vraag_tekst_en: optional(400),
  opties: z.array(text(200)).max(6),
  opties_fr: z.array(z.string().trim().max(200)).max(6).optional().nullable(),
  opties_en: z.array(z.string().trim().max(200)).max(6).optional().nullable(),
  correcte_optie_index: z.number().int().min(0).max(5),
  media_url: optional(400),
  media_alt: optional(200),
  wist_je_dat: optional(600),
  wist_je_dat_fr: optional(600),
  wist_je_dat_en: optional(600),
  variant_groep: optional(100),
  verplicht: z.boolean(),
  moeilijkheid: z.number().int().min(1).max(3),
  correct_getal: z.number().finite().optional().nullable(),
  getal_marge: z.number().finite().min(0).default(0),
  getal_eenheid: optional(80),
  getal_eenheid_fr: optional(80),
  getal_eenheid_en: optional(80),
}).superRefine((v, ctx) => {
  if (v.doelgroep === "kids" && v.module !== 1) {
    ctx.addIssue({ code: "custom", path: ["module"], message: "Kindervragen horen in ronde 1." });
  }
  if (v.vraag_type === "getal") {
    if (v.correct_getal === null || v.correct_getal === undefined) {
      ctx.addIssue({ code: "custom", path: ["correct_getal"], message: "Vul het juiste getal in." });
    }
    for (const [field, value] of [
      ["getal_eenheid", v.getal_eenheid],
      ["getal_eenheid_fr", v.getal_eenheid_fr],
      ["getal_eenheid_en", v.getal_eenheid_en],
    ] as const) {
      if (!value) ctx.addIssue({ code: "custom", path: [field], message: "Eenheid is verplicht in alle talen." });
    }
  } else {
    if (v.opties.length < 2) ctx.addIssue({ code: "custom", path: ["opties"], message: "Minstens twee antwoorden nodig." });
    if (!v.opties_fr || v.opties_fr.length !== v.opties.length) ctx.addIssue({ code: "custom", path: ["opties_fr"], message: "FR moet evenveel antwoorden hebben als NL." });
    if (!v.opties_en || v.opties_en.length !== v.opties.length) ctx.addIssue({ code: "custom", path: ["opties_en"], message: "EN moet evenveel antwoorden hebben als NL." });
  }
});

export type VraagInput = z.infer<typeof vraagInputSchema>;

export const publishRequestSchema = z.object({
  academy_id: z.string().uuid(),
  note: optional(500),
});

export const publishDecisionSchema = z.object({
  request_id: z.string().uuid(),
  approve: z.boolean(),
  decision_note: optional(500),
});
