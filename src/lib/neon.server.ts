import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

/**
 * Server-only Neon Postgres client (HTTP driver — werkt in de edge runtime).
 *
 * Gebruik uitsluitend binnen `createServerFn().handler()` of een server route:
 * de connection string is een secret en mag nooit in de browserbundel komen.
 *
 * Fail-safe: als géén van de bekende environment variables aanwezig is,
 * crasht de SSR NIET met een 500 maar krijgt de caller een stub-client die
 * lege resultaten teruggeeft, zodat de pagina netjes in "fallback mode" laadt.
 *
 * Voorbeeld:
 *   const rows = await db()`select id, name from organisations where id = ${1}`;
 */
let _db: NeonQueryFunction<false, false> | undefined;

/** Geeft de gevonden connection string terug, of null als er geen is. */
export function connectionString(): string | null {
  const env = process.env;
  return (
    env["NEON_DATABASE_URL"] ||
    env["DATABASE_URL"] ||
    env["DATABASE_URL_POOLED"] ||
    env["NEON_DATABASE_URL_POOLED"] ||
    null
  );
}

export function hasDatabase(): boolean {
  return connectionString() !== null;
}

/**
 * Stub-client voor wanneer er geen connection string is: elke query geeft een
 * lege array terug. Zo blijven callers (`one()`, `.length`, `map`, ...) werken
 * zonder dat de pagina tijdens SSR crasht.
 */
function stubClient(): NeonQueryFunction<false, false> {
  const stub = (..._args: unknown[]) => Promise.resolve([]);
  // Ook de `query(text, params)`-vorm moet werken: de PostgREST-achtige laag
  // in db-admin.server.ts gebruikt die.
  (stub as unknown as Record<string, unknown>)["query"] = (..._args: unknown[]) =>
    Promise.resolve([]);
  (stub as unknown as Record<string, unknown>)["unsafe"] = (text: string) => text;
  return stub as unknown as NeonQueryFunction<false, false>;
}

/** Cache leegmaken (bv. na een tijdelijke DATABASE_URL-override in dev). */
export function resetDb() {
  _db = undefined;
}

export function db(): NeonQueryFunction<false, false> {
  if (_db) return _db;
  const url = connectionString();
  if (!url) {
    console.error(
      "[neon] Geen databaseconnectie gevonden (NEON_DATABASE_URL / DATABASE_URL / *_POOLED ontbreken) — fallback mode actief, queries geven [] terug.",
    );
    return stubClient();
  }
  _db = neon(url);
  return _db;
}

/** Eén rij of null — handig voor `maybeSingle()`-achtige reads. */
export async function one<T>(rows: Promise<unknown[]> | unknown[]): Promise<T | null> {
  const r = (await rows) as T[];
  return r.length ? (r[0] as T) : null;
}
