/**
 * Server-only laag voor API-sleutels: aanmaken, hashen en valideren van
 * scoped tokens voor de publieke REST-API (/api/v1/**).
 */

export type ApiKeyRow = {
  id: string;
  name: string;
  key_hash: string;
  prefix: string;
  scopes: string[];
  is_active: boolean;
  last_used_at: string | null;
  created_by: string | null;
  created_at: string;
};

export type ApiKeyPublic = Omit<ApiKeyRow, "key_hash">;

const KEY_PREFIX = "max_live_";

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Genereert een nieuwe ruwe sleutel: max_live_<32 hex tekens>. */
export function generateKey(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const random = toHex(bytes.buffer);
  return `${KEY_PREFIX}${random}`;
}

/** SHA-256 hash (hex) van een sleutel — enkel de hash wordt opgeslagen. */
export async function hashKey(rawKey: string): Promise<string> {
  const data = new TextEncoder().encode(rawKey);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(digest);
}

function toPublic(row: ApiKeyRow): ApiKeyPublic {
  const { key_hash, ...rest } = row;
  void key_hash;
  return { ...rest, scopes: Array.isArray(rest.scopes) ? rest.scopes : [] };
}

async function sql() {
  const { db } = await import("./neon.server");
  return db();
}

/** Nieuwe API-sleutel aanmaken; geeft de ruwe sleutel eenmalig terug. */
export async function createApiKey(
  name: string,
  scopes: string[],
  createdBy: string | null,
): Promise<{ key: ApiKeyPublic; rawKey: string }> {
  const rawKey = generateKey();
  const keyHash = await hashKey(rawKey);
  const prefix = rawKey.slice(0, KEY_PREFIX.length + 8);
  const db = await sql();
  const rows = (await db`
    insert into public.api_keys (name, key_hash, prefix, scopes, created_by)
    values (${name}, ${keyHash}, ${prefix}, ${JSON.stringify(scopes)}::jsonb, ${createdBy})
    returning id::text, name, key_hash, prefix, scopes, is_active, last_used_at, created_by, created_at
  `) as ApiKeyRow[];
  const row = rows[0];
  if (!row) throw new Error("Kon API-sleutel niet aanmaken.");
  return { key: toPublic(row), rawKey };
}

/** Alle API-sleutels, nieuwste eerst. */
export async function listApiKeys(): Promise<ApiKeyPublic[]> {
  const db = await sql();
  const rows = (await db`
    select id::text, name, key_hash, prefix, scopes, is_active, last_used_at, created_by, created_at
    from public.api_keys
    order by created_at desc
  `) as ApiKeyRow[];
  return rows.map(toPublic);
}

/** Sleutel actief/inactief zetten (intrekken). */
export async function setApiKeyActive(id: string, active: boolean): Promise<void> {
  const db = await sql();
  await db`update public.api_keys set is_active = ${active} where id = ${id}::uuid`;
}

/** Vertaalt een scope-notatie naar de effectieve set (bv. "products" -> read/write). */
function expandScopes(scopes: string[]): Set<string> {
  const out = new Set<string>();
  for (const scope of scopes) {
    out.add(scope);
    if (scope === "products") {
      out.add("read:products");
      out.add("write:products");
    }
  }
  return out;
}

function unauthorized(message: string): Response {
  return Response.json({ error: message }, { status: 401 });
}

function forbidden(message: string): Response {
  return Response.json({ error: message }, { status: 403 });
}

export type ApiKeyAuthResult = { ok: true; key: ApiKeyPublic } | Response;

/**
 * Authenticeert een inkomend verzoek via `Authorization: Bearer max_live_...`
 * en controleert of de sleutel het gevraagde scope heeft.
 */
export async function authenticateApiKey(
  request: Request,
  requiredScope: string,
): Promise<ApiKeyAuthResult> {
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(max_live_[a-f0-9]+)$/i.exec(header.trim());
  if (!match) return unauthorized("Ontbrekende of ongeldige API-sleutel.");
  const rawKey = match[1] as string;
  const keyHash = await hashKey(rawKey);

  const db = await sql();
  const rows = (await db`
    select id::text, name, key_hash, prefix, scopes, is_active, last_used_at, created_by, created_at
    from public.api_keys
    where key_hash = ${keyHash}
    limit 1
  `) as ApiKeyRow[];
  const row = rows[0];
  if (!row || !row.is_active) return unauthorized("Ongeldige of ingetrokken API-sleutel.");

  const scopes = expandScopes(Array.isArray(row.scopes) ? row.scopes : []);
  if (!scopes.has(requiredScope)) {
    return forbidden(`Deze API-sleutel heeft geen scope '${requiredScope}'.`);
  }

  // Fire-and-forget: last_used_at bijwerken zonder het antwoord te vertragen.
  void db`update public.api_keys set last_used_at = now() where id = ${row.id}::uuid`.catch(() => {});

  return { ok: true, key: toPublic(row) };
}
