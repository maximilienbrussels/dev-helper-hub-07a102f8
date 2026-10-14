import { describe, expect, it } from "vitest";
import {
  ACADEMY_CATEGORIES,
  WARNING_CATEGORY,
  countByCategory,
  filterAcademies,
  usedCategories,
  type FilterableAcademy,
} from "@/lib/academy-filter";
import type { Lang } from "@/lib/i18n";

const a = (
  slug: string,
  categorie: string,
  nl: string,
  fr: string,
  en: string,
): FilterableAcademy => ({
  slug,
  categorie,
  diersoort_naam: nl,
  diersoort_naam_fr: fr,
  diersoort_naam_en: en,
  beschrijving: `${nl} beschrijving`,
  beschrijving_fr: `${fr} description`,
  beschrijving_en: `${en} description`,
});

const academies: FilterableAcademy[] = [
  a("konijn", "huisdieren", "Konijn", "Lapin", "Rabbit"),
  a("cavia", "knaagdieren", "Cavia", "Cochon d'Inde", "Guinea pig"),
  a("kip", "pluimvee", "Kip", "Poule", "Chicken"),
  a("korenslang", "valkuilen", "Korenslang", "Serpent des blés", "Corn snake"),
  a("vogelspin", "valkuilen", "Vogelspin", "Mygale", "Tarantula"),
  a("baardagaam", "valkuilen", "Baardagaam", "Agame barbu", "Bearded dragon"),
];

const LANGS: Lang[] = ["nl", "fr", "en"];

describe("filterknop ⚠️ Impulsaankopen & valkuilen", () => {
  it("staat in de categorielijst en heeft de juiste sleutel", () => {
    expect(WARNING_CATEGORY).toBe("valkuilen");
    expect(ACADEMY_CATEGORIES).toContain("valkuilen");
  });

  it("toont exact de valkuil-academies, in elke taal identiek", () => {
    for (const lang of LANGS) {
      const result = filterAcademies(academies, { category: WARNING_CATEGORY, lang });
      expect(result.map((r) => r.slug).sort()).toEqual(["baardagaam", "korenslang", "vogelspin"]);
      expect(result.every((r) => r.categorie === WARNING_CATEGORY)).toBe(true);
    }
  });

  it("telt hetzelfde aantal als de knop toont, ongeacht de taal", () => {
    const counts = countByCategory(academies);
    expect(counts[WARNING_CATEGORY]).toBe(3);
    for (const lang of LANGS) {
      expect(filterAcademies(academies, { category: WARNING_CATEGORY, lang })).toHaveLength(
        counts[WARNING_CATEGORY],
      );
    }
    expect(counts.all).toBe(academies.length);
  });

  it("verbergt de knop wanneer er geen valkuil-academies zijn", () => {
    const zonder = academies.filter((x) => x.categorie !== WARNING_CATEGORY);
    expect(usedCategories(zonder)).not.toContain(WARNING_CATEGORY);
    expect(usedCategories(academies)).toContain(WARNING_CATEGORY);
  });

  it("combineert het valkuilenfilter met zoeken in alle talen", () => {
    const cases: Array<[Lang, string, string]> = [
      ["nl", "vogelspin", "vogelspin"],
      ["fr", "mygale", "vogelspin"],
      ["en", "tarantula", "vogelspin"],
      ["fr", "serpent", "korenslang"],
      ["en", "bearded", "baardagaam"],
    ];
    for (const [lang, query, slug] of cases) {
      const result = filterAcademies(academies, { category: WARNING_CATEGORY, query, lang });
      expect(result.map((r) => r.slug)).toEqual([slug]);
    }
  });

  it("laat academies uit andere categorieën nooit binnen via zoeken", () => {
    for (const lang of LANGS) {
      const result = filterAcademies(academies, { category: WARNING_CATEGORY, query: "kip", lang });
      expect(result).toHaveLength(0);
    }
  });

  it("negeert accenten en hoofdletters", () => {
    const result = filterAcademies(academies, {
      category: WARNING_CATEGORY,
      query: "SERPENT DES BLES",
      lang: "fr",
    });
    expect(result.map((r) => r.slug)).toEqual(["korenslang"]);
  });

  it("som van alle categorieën is gelijk aan het totaal", () => {
    const counts = countByCategory(academies);
    const sum = ACADEMY_CATEGORIES.reduce((n, c) => n + (counts[c] ?? 0), 0);
    expect(sum).toBe(counts.all);
  });
});
