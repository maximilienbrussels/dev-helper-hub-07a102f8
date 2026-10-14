/**
 * Server-only helpers om een certificaat aan de balie op te zoeken en als
 * afgedrukt te markeren. Wordt enkel aangeroepen vanuit
 * `academy-print.functions.ts` (met rechtencontrole).
 */
import { db } from "@/lib/neon.server";
import { parseCertCode } from "@/lib/cert-code";
import { academyCodePrefix } from "@/lib/academy-cert";

import type { DeskCertificate } from "@/lib/academy-print-types";

export type { DeskCertificate };

type Row = {
  id: string;
  volgnummer: number;
  score: string;
  volledige_naam: string;
  behaald_op: string;
  public_token: string | null;
  short_code: string | null;
  printed_at: string | null;
  print_count: number | null;
  academy_id: string | null;
};

type Aca = NonNullable<DeskCertificate["academy"]>;

async function hydrate(row: Row | undefined): Promise<DeskCertificate | null> {
  if (!row) return null;
  const sql = db();
  const academy = row.academy_id
    ? ((
        (await sql`
        select id, slug, diersoort_naam, diersoort_naam_fr, diersoort_naam_en, badge_icon
          from academies where id = ${row.academy_id}::uuid limit 1
      `) as Aca[]
      )[0] ?? null)
    : null;
  return {
    id: row.id,
    volgnummer: row.volgnummer,
    score: row.score,
    volledigeNaam: row.volledige_naam,
    behaaldOp: row.behaald_op,
    publicToken: row.public_token,
    shortCode: row.short_code,
    printedAt: row.printed_at,
    printCount: row.print_count ?? 0,
    academy,
  };
}

/**
 * Zoekt een certificaat op via de QR-inhoud (URL of token), de korte code van
 * 6 tekens, of de leesbare code KNJ-2026-0001.
 */
export async function findCertificate(raw: string): Promise<DeskCertificate | null> {
  const sql = db();
  const value = raw.trim();
  if (!value) return null;

  // 1. Volledige URL of losse waarde: haal het relevante segment eruit.
  let candidate = value;
  try {
    if (/^https?:\/\//i.test(value)) {
      const url = new URL(value);
      candidate =
        url.searchParams.get("code") ??
        url.searchParams.get("token") ??
        url.pathname.split("/").filter(Boolean).pop() ??
        value;
    }
  } catch {
    /* geen geldige URL — gebruik de ruwe waarde */
  }
  candidate = decodeURIComponent(candidate).trim();

  // 2. Publiek token.
  const byToken = (await sql`
    select id, volgnummer, score, volledige_naam, behaald_op, public_token,
           short_code, printed_at, print_count, academy_id
      from certificaten
     where public_token = ${candidate}
     limit 1
  `) as Row[];
  if (byToken[0]) return hydrate(byToken[0]);

  // 3. Rechtstreeks het interne id (uuid) uit de URL.
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(candidate)) {
    const byId = (await sql`
      select id, volgnummer, score, volledige_naam, behaald_op, public_token,
             short_code, printed_at, print_count, academy_id
        from certificaten
       where id = ${candidate}::uuid
       limit 1
    `) as Row[];
    if (byId[0]) return hydrate(byId[0]);
  }

  const upper = candidate.toUpperCase();

  // 4. Korte code van 6 tekens.
  if (/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/.test(upper)) {
    const byShort = (await sql`
      select id, volgnummer, score, volledige_naam, behaald_op, public_token,
             short_code, printed_at, print_count, academy_id
        from certificaten
       where short_code = ${upper}
       limit 1
    `) as Row[];
    if (byShort[0]) return hydrate(byShort[0]);
  }

  // 5. Leesbare code, bv. KNJ-2026-0001 (prefix per diersoort, jaar, volgnummer).
  const parsed = parseCertCode(upper);
  if (parsed) {
    const rows = (await sql`
      select c.id, c.volgnummer, c.score, c.volledige_naam, c.behaald_op, c.public_token,
             c.short_code, c.printed_at, c.print_count, c.academy_id, a.slug
        from certificaten c
        left join academies a on a.id = c.academy_id
       where c.volgnummer = ${parsed.volgnummer}
         and extract(year from c.behaald_op) = ${parsed.year}
       limit 20
    `) as Array<Row & { slug: string | null }>;
    const match = rows.find((r) => academyCodePrefix(r.slug) === parsed.prefix);
    if (match) return hydrate(match);
  }


  return null;
}

/** Zet de afdrukstatus op het certificaat. */
export async function setCertificatePrinted(id: string, actorId: string | null) {
  const sql = db();
  const rows = (await sql`
    update certificaten
       set printed_at = now(),
           printed_by = ${actorId}::uuid,
           print_count = coalesce(print_count, 0) + 1
     where id = ${id}::uuid
     returning printed_at, print_count
  `) as Array<{ printed_at: string; print_count: number }>;
  return rows[0] ?? null;
}
