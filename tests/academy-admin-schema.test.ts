import { describe, expect, it } from "vitest";
import { vraagInputSchema } from "../src/lib/academy-admin-schema";

const base = {
  academy_id: "00000000-0000-4000-8000-000000000000",
  module: 1,
  doelgroep: "16plus" as const,
  vraag_tekst: "Hoeveel?", vraag_tekst_fr: "Combien ?", vraag_tekst_en: "How many?",
  opties: [], opties_fr: [], opties_en: [], correcte_optie_index: 0,
  variant_groep: "feeding", verplicht: true, moeilijkheid: 2,
  wist_je_dat: "", wist_je_dat_fr: "", wist_je_dat_en: "",
  media_url: "", media_alt: "",
};

describe("Academy beheerschema", () => {
  it("aanvaardt een volledig drietalige getalvraag", () => {
    expect(vraagInputSchema.safeParse({ ...base, vraag_type: "getal", correct_getal: 2, getal_marge: 0, getal_eenheid: "keer", getal_eenheid_fr: "fois", getal_eenheid_en: "times" }).success).toBe(true);
  });
  it("weigert ontbrekende vertaalde eenheden", () => {
    expect(vraagInputSchema.safeParse({ ...base, vraag_type: "getal", correct_getal: 2, getal_marge: 0, getal_eenheid: "keer" }).success).toBe(false);
  });
});