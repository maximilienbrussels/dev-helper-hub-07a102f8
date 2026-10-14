/**
 * Gedeelde, publieke opzoeklogica voor certificaatverificatie.
 * Wordt gebruikt door zowel de server functions (`verify.functions.ts`) als
 * het publieke REST-endpoint `/api/public/verify-certificate`, zodat beide
 * exact dezelfde gegevens en regels hanteren.
 */
import { certCode, parseCertCode, titleCaseName } from "@/lib/cert-code";

export type VerifyFailReason = "invalid_format" | "not_found" | "rate_limited";

export type VerifyResult =
  | { valid: false; reason: VerifyFailReason }
  | {
      valid: true;
      code: string;
      naam: string;
      score: string | null;
      behaald_op: string;
      academy: string | null;
      /** Publieke gegevens om het certificaatbeeld te kunnen tonen. */
      slug: string | null;
      volgnummer: number;
      badge_icon: string | null;
    };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SELECT =
  "volgnummer, volledige_naam, behaald_op, score, academies(slug, diersoort_naam, badge_icon)";

function shape(row: Record<string, unknown>): VerifyResult {
  const academy = row["academies"] as {
    slug?: string;
    diersoort_naam?: string;
    badge_icon?: string | null;
  } | null;
  return {
    valid: true,
    code: certCode(academy?.slug, row["behaald_op"] as string, row["volgnummer"] as number),
    naam: titleCaseName(row["volledige_naam"] as string | null, ""),
    score: (row["score"] as string | null) ?? null,
    behaald_op: row["behaald_op"] as string,
    academy: academy?.diersoort_naam ?? null,
    slug: academy?.slug ?? null,
    volgnummer: row["volgnummer"] as number,
    badge_icon: academy?.badge_icon ?? null,
  };
}

/** Opzoeken via het onraadbare publieke token (UUID). */
export async function lookupByToken(token: string): Promise<VerifyResult> {
  if (!UUID.test(token)) return { valid: false, reason: "invalid_format" };
  const { dbAdmin } = await import("@/lib/db-admin.server");
  const { data, error } = await dbAdmin
    .from("certificaten")
    .select(SELECT)
    .eq("public_token", token)
    .maybeSingle();
  if (error || !data) return { valid: false, reason: "not_found" };
  return shape(data as Record<string, unknown>);
}

/** Opzoeken via de leesbare certificaatcode, bv. KNJ-2026-0001. */
export async function lookupByCode(code: string): Promise<VerifyResult> {
  const parsed = parseCertCode(String(code).replace(/^#/, ""));
  if (!parsed) return { valid: false, reason: "invalid_format" };
  const { dbAdmin } = await import("@/lib/db-admin.server");
  const { data, error } = await dbAdmin
    .from("certificaten")
    .select(SELECT)
    .eq("volgnummer", parsed.volgnummer);
  if (error) return { valid: false, reason: "not_found" };

  const wanted = `${parsed.prefix}-${parsed.year}-${String(parsed.volgnummer).padStart(4, "0")}`;
  const match = (data ?? []).find((row: Record<string, unknown>) => {
    const academy = row["academies"] as { slug?: string } | null;
    return (
      certCode(academy?.slug, row["behaald_op"] as string, row["volgnummer"] as number) === wanted
    );
  });
  if (!match) return { valid: false, reason: "not_found" };
  return shape(match as Record<string, unknown>);
}

/** Opzoeken op om het even welke publieke identificatie (token of code). */
export async function lookupCertificate(value: string): Promise<VerifyResult> {
  const clean = String(value ?? "")
    .trim()
    .replace(/^#/, "");
  if (clean.length < 6) return { valid: false, reason: "invalid_format" };
  return UUID.test(clean) ? lookupByToken(clean) : lookupByCode(clean);
}
