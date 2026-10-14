/**
 * Automatische controle: bewijst per academykaart en per vraagmodule dat alle
 * NL/FR/EN velden bestaan en overeenkomen (zelfde aantal antwoordopties).
 * Zuivere logica zonder database, zodat tests dit rechtstreeks kunnen dekken.
 */

export type AuditLang = "fr" | "en";

export type AuditVraag = {
  id: string;
  module: number | null;
  vraag_tekst: string;
  vraag_tekst_fr: string | null;
  vraag_tekst_en: string | null;
  opties: unknown;
  opties_fr: unknown;
  opties_en: unknown;
  wist_je_dat: string | null;
  wist_je_dat_fr: string | null;
  wist_je_dat_en: string | null;
  doelgroep?: string | null;
  vraag_type?: string | null;
  variant_groep?: string | null;
  verplicht?: boolean | null;
  moeilijkheid?: number | null;
  getal_eenheid?: string | null;
  getal_eenheid_fr?: string | null;
  getal_eenheid_en?: string | null;
};

export type AuditAcademy = {
  id: string;
  slug: string;
  diersoort_naam: string;
  diersoort_naam_fr: string | null;
  diersoort_naam_en: string | null;
  beschrijving: string | null;
  beschrijving_fr: string | null;
  beschrijving_en: string | null;
  categorie: string;
  status: string;
  is_active: boolean;
  vragen: AuditVraag[];
};

export type AuditIssue = {
  scope: "kaart" | "vraag";
  /** Vraag-id of kaart-slug, voor terugkoppeling in de UI. */
  ref: string;
  module?: number;
  field: string;
  lang: AuditLang;
  reason: "ontbreekt" | "aantal_opties_verschilt" | "lege_optie";
};

export type ModuleReport = {
  module: number;
  vragen: number;
  issues: number;
  complete: boolean;
};

export type AcademyReport = {
  id: string;
  slug: string;
  naam: string;
  categorie: string;
  status: string;
  is_active: boolean;
  vragen: number;
  modules: ModuleReport[];
  issues: AuditIssue[];
  complete: boolean;
};

export type AuditReport = {
  academies: AcademyReport[];
  totalAcademies: number;
  completeAcademies: number;
  totalVragen: number;
  totalIssues: number;
  complete: boolean;
};

const filled = (value: string | null | undefined): boolean =>
  typeof value === "string" && value.trim().length > 0;

const asArray = (value: unknown): string[] | null =>
  Array.isArray(value) ? value.map((v) => String(v)) : null;

/** Controleert één vraag voor FR en EN. */
export function auditVraag(v: AuditVraag): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const module = v.module ?? 1;
  const base = asArray(v.opties) ?? [];

  for (const lang of ["fr", "en"] as AuditLang[]) {
    const tekst = lang === "fr" ? v.vraag_tekst_fr : v.vraag_tekst_en;
    if (!filled(tekst)) {
      issues.push({
        scope: "vraag",
        ref: v.id,
        module,
        field: "vraag_tekst",
        lang,
        reason: "ontbreekt",
      });
    }

    const opties = asArray(lang === "fr" ? v.opties_fr : v.opties_en);
    if (v.vraag_type === "getal") {
      const eenheid = lang === "fr" ? v.getal_eenheid_fr : v.getal_eenheid_en;
      if (!filled(eenheid)) issues.push({ scope: "vraag", ref: v.id, module, field: "getal_eenheid", lang, reason: "ontbreekt" });
    } else if (!opties || opties.length === 0) {
      issues.push({
        scope: "vraag",
        ref: v.id,
        module,
        field: "opties",
        lang,
        reason: "ontbreekt",
      });
    } else if (opties.length !== base.length) {
      issues.push({
        scope: "vraag",
        ref: v.id,
        module,
        field: "opties",
        lang,
        reason: "aantal_opties_verschilt",
      });
    } else if (opties.some((o) => !filled(o))) {
      issues.push({
        scope: "vraag",
        ref: v.id,
        module,
        field: "opties",
        lang,
        reason: "lege_optie",
      });
    }

    // 'Wist je dat?' is optioneel, maar moet in alle talen bestaan zodra het in het Nederlands staat.
    if (filled(v.wist_je_dat)) {
      const feedback = lang === "fr" ? v.wist_je_dat_fr : v.wist_je_dat_en;
      if (!filled(feedback)) {
        issues.push({
          scope: "vraag",
          ref: v.id,
          module,
          field: "wist_je_dat",
          lang,
          reason: "ontbreekt",
        });
      }
    }
  }
  return issues;
}

/** Controleert één academykaart plus al haar vragen. */
export function auditAcademy(a: AuditAcademy): AcademyReport {
  const issues: AuditIssue[] = [];

  for (const lang of ["fr", "en"] as AuditLang[]) {
    const naam = lang === "fr" ? a.diersoort_naam_fr : a.diersoort_naam_en;
    if (!filled(naam)) {
      issues.push({
        scope: "kaart",
        ref: a.slug,
        field: "diersoort_naam",
        lang,
        reason: "ontbreekt",
      });
    }
    if (filled(a.beschrijving)) {
      const beschrijving = lang === "fr" ? a.beschrijving_fr : a.beschrijving_en;
      if (!filled(beschrijving)) {
        issues.push({
          scope: "kaart",
          ref: a.slug,
          field: "beschrijving",
          lang,
          reason: "ontbreekt",
        });
      }
    }
  }

  const perModule = new Map<number, { vragen: number; issues: number }>();
  for (const v of a.vragen) {
    const module = v.module ?? 1;
    const vraagIssues = auditVraag(v);
    issues.push(...vraagIssues);
    const cur = perModule.get(module) ?? { vragen: 0, issues: 0 };
    cur.vragen += 1;
    cur.issues += vraagIssues.length;
    perModule.set(module, cur);
  }

  const modules: ModuleReport[] = [...perModule.entries()]
    .sort((x, y) => x[0] - y[0])
    .map(([module, s]) => ({
      module,
      vragen: s.vragen,
      issues: s.issues,
      complete: s.issues === 0,
    }));

  return {
    id: a.id,
    slug: a.slug,
    naam: a.diersoort_naam,
    categorie: a.categorie,
    status: a.status,
    is_active: a.is_active,
    vragen: a.vragen.length,
    modules,
    issues,
    complete: issues.length === 0,
  };
}

/** Volledig rapport over alle academies. */
export function auditAll(academies: AuditAcademy[]): AuditReport {
  const reports = academies.map(auditAcademy);
  const totalIssues = reports.reduce((n, r) => n + r.issues.length, 0);
  return {
    academies: reports,
    totalAcademies: reports.length,
    completeAcademies: reports.filter((r) => r.complete).length,
    totalVragen: reports.reduce((n, r) => n + r.vragen, 0),
    totalIssues,
    complete: totalIssues === 0,
  };
}

export const ISSUE_LABELS: Record<AuditIssue["reason"], string> = {
  ontbreekt: "veld ontbreekt",
  aantal_opties_verschilt: "aantal antwoordopties verschilt van NL",
  lege_optie: "lege antwoordoptie",
};
