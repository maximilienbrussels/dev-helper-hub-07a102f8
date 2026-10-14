import { describe, expect, it } from "vitest";
import {
  auditAcademy,
  auditAll,
  auditVraag,
  type AuditAcademy,
  type AuditVraag,
} from "@/lib/academy-audit";

const vraag = (over: Partial<AuditVraag> = {}): AuditVraag => ({
  id: "11111111-1111-4111-8111-111111111111",
  module: 1,
  vraag_tekst: "Wat eet een konijn?",
  vraag_tekst_fr: "Que mange un lapin ?",
  vraag_tekst_en: "What does a rabbit eat?",
  opties: ["Hooi", "Chocolade", "Brood"],
  opties_fr: ["Foin", "Chocolat", "Pain"],
  opties_en: ["Hay", "Chocolate", "Bread"],
  wist_je_dat: "Hooi is 80% van het dieet.",
  wist_je_dat_fr: "Le foin représente 80%.",
  wist_je_dat_en: "Hay is 80% of the diet.",
  ...over,
});

const academy = (over: Partial<AuditAcademy> = {}): AuditAcademy => ({
  id: "22222222-2222-4222-8222-222222222222",
  slug: "konijn",
  diersoort_naam: "Konijn",
  diersoort_naam_fr: "Lapin",
  diersoort_naam_en: "Rabbit",
  beschrijving: "Alles over konijnen.",
  beschrijving_fr: "Tout sur les lapins.",
  beschrijving_en: "All about rabbits.",
  categorie: "huisdieren",
  status: "gepubliceerd",
  is_active: true,
  vragen: [vraag(), vraag({ id: "33333333-3333-4333-8333-333333333333", module: 2 })],
  ...over,
});

describe("automatische NL/FR/EN controle", () => {
  it("meldt niets bij een volledige kaart", () => {
    const report = auditAcademy(academy());
    expect(report.complete).toBe(true);
    expect(report.modules.map((m) => m.module)).toEqual([1, 2]);
  });

  it("ziet een ontbrekende Franse vraagtekst", () => {
    const issues = auditVraag(vraag({ vraag_tekst_fr: null }));
    expect(issues).toEqual([
      expect.objectContaining({ field: "vraag_tekst", lang: "fr", reason: "ontbreekt" }),
    ]);
  });

  it("ziet een verschillend aantal antwoordopties", () => {
    const issues = auditVraag(vraag({ opties_en: ["Hay", "Chocolate"] }));
    expect(issues).toEqual([
      expect.objectContaining({ field: "opties", lang: "en", reason: "aantal_opties_verschilt" }),
    ]);
  });

  it("ziet een lege antwoordoptie", () => {
    const issues = auditVraag(vraag({ opties_fr: ["Foin", "", "Pain"] }));
    expect(issues).toEqual([
      expect.objectContaining({ field: "opties", lang: "fr", reason: "lege_optie" }),
    ]);
  });

  it("vraagt 'Wist je dat?' enkel wanneer het Nederlands bestaat", () => {
    expect(
      auditVraag(vraag({ wist_je_dat: null, wist_je_dat_fr: null, wist_je_dat_en: null })),
    ).toEqual([]);
    expect(auditVraag(vraag({ wist_je_dat_en: null }))).toEqual([
      expect.objectContaining({ field: "wist_je_dat", lang: "en" }),
    ]);
  });

  it("markeert de juiste module als incompleet", () => {
    const report = auditAcademy(
      academy({
        vragen: [
          vraag(),
          vraag({ id: "44444444-4444-4444-8444-444444444444", module: 3, vraag_tekst_en: null }),
        ],
      }),
    );
    expect(report.complete).toBe(false);
    expect(report.modules.find((m) => m.module === 1)?.complete).toBe(true);
    expect(report.modules.find((m) => m.module === 3)?.complete).toBe(false);
  });

  it("meldt ontbrekende kaartvelden per taal", () => {
    const report = auditAcademy(academy({ diersoort_naam_fr: null, beschrijving_en: "  " }));
    expect(report.issues).toEqual([
      expect.objectContaining({ scope: "kaart", field: "diersoort_naam", lang: "fr" }),
      expect.objectContaining({ scope: "kaart", field: "beschrijving", lang: "en" }),
    ]);
  });

  it("vat alle kaarten samen", () => {
    const report = auditAll([
      academy(),
      academy({ id: "x", slug: "kip", diersoort_naam_en: null }),
    ]);
    expect(report.totalAcademies).toBe(2);
    expect(report.completeAcademies).toBe(1);
    expect(report.totalVragen).toBe(4);
    expect(report.complete).toBe(false);
  });
});
