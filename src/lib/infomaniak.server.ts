/**
 * Infomaniak API — uitsluitend server-side.
 *
 * De browser praat NOOIT rechtstreeks met api.infomaniak.com (CORS + geheimen).
 * Alles loopt via de proxy-routes onder `/api/infomaniak/*`.
 */

const BASE = "https://api.infomaniak.com";

export type InfomaniakConfig = { apiKey: string; productId: string };

export class InfomaniakError extends Error {
  status: number;
  code: string;
  constructor(message: string, status: number, code: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/** Leest de credentials. Gooit een duidelijke fout wanneer er iets ontbreekt. */
export function infomaniakConfig(): InfomaniakConfig {
  const apiKey = (process.env["INFOMANIAK_API_KEY"] ?? process.env["INFOMANIAK_AI_API_KEY"] ?? "").trim();
  const productId = (process.env["INFOMANIAK_PRODUCT_ID"] ?? process.env["INFOMANIAK_AI_PRODUCT_ID"] ?? "").trim();
  if (!apiKey) {
    throw new InfomaniakError(
      "Infomaniak API-sleutel ontbreekt in de serverinstellingen.",
      503,
      "missing_api_key",
    );
  }
  if (!productId) {
    throw new InfomaniakError(
      "Infomaniak product-ID ontbreekt in de serverinstellingen.",
      503,
      "missing_product_id",
    );
  }
  return { apiKey, productId };
}

export function infomaniakConfigured(): boolean {
  return Boolean(
    (process.env["INFOMANIAK_API_KEY"] || process.env["INFOMANIAK_AI_API_KEY"]) &&
      (process.env["INFOMANIAK_PRODUCT_ID"] || process.env["INFOMANIAK_AI_PRODUCT_ID"]),
  );
}

type Json = Record<string, unknown>;

/** Eén doorgang naar de Infomaniak API met nette foutafhandeling. */
export async function infomaniakRequest<T = unknown>(
  path: string,
  init: { method?: string; body?: unknown; query?: Record<string, string | number | undefined> } = {},
): Promise<T> {
  const cfg = infomaniakConfig();
  const url = new URL(path.startsWith("/") ? path : `/${path}`, BASE);
  for (const [key, value] of Object.entries(init.query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: init.method ?? "GET",
      headers: {
        Authorization: `Bearer ${cfg.apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
    });
  } catch (error) {
    throw new InfomaniakError(
      `Infomaniak is onbereikbaar: ${error instanceof Error ? error.message : "netwerkfout"}`,
      502,
      "network_error",
    );
  }

  const raw = await response.text();
  let parsed: Json | null = null;
  try {
    parsed = raw ? (JSON.parse(raw) as Json) : null;
  } catch {
    parsed = null;
  }

  if (!response.ok || (parsed && parsed["result"] === "error")) {
    const detail =
      (parsed?.["error"] as { description?: string; code?: string } | undefined)?.description ??
      raw.slice(0, 300);
    const code =
      (parsed?.["error"] as { code?: string } | undefined)?.code ??
      (response.status === 401 || response.status === 403 ? "invalid_api_key" : "api_error");
    const message =
      code === "invalid_api_key"
        ? "Infomaniak API-sleutel ongeldig of zonder toegang tot dit product."
        : `Infomaniak-fout [${response.status}]: ${detail || "onbekende fout"}`;
    throw new InfomaniakError(message, response.status || 502, code);
  }

  return (parsed?.["data"] ?? parsed ?? null) as T;
}

/* ------------------------------------------------------------------ status */

export type InfomaniakStatus = {
  configured: boolean;
  ok: boolean;
  productId: string | null;
  account: { id?: number; email?: string; display_name?: string } | null;
  domains: Array<{ domain: string; ok: boolean }>;
  error: string | null;
  errorCode: string | null;
  checkedAt: string;
};

const DOMAINS = ["maximilien.brussels", "maximilien.site"];

/** Statuscheck voor het beheerdersdashboard: token geldig + domeinen gekend. */
export async function infomaniakStatus(): Promise<InfomaniakStatus> {
  const base: InfomaniakStatus = {
    configured: infomaniakConfigured(),
    ok: false,
    productId: process.env["INFOMANIAK_PRODUCT_ID"] ?? process.env["INFOMANIAK_AI_PRODUCT_ID"] ?? null,
    account: null,
    domains: [],
    error: null,
    errorCode: null,
    checkedAt: new Date().toISOString(),
  };
  if (!base.configured) {
    return { ...base, error: "Infomaniak is nog niet geconfigureerd.", errorCode: "not_configured" };
  }
  try {
    const account = await infomaniakRequest<InfomaniakStatus["account"]>("/1/profile");
    let domains: Array<{ domain: string; ok: boolean }> = DOMAINS.map((d) => ({ domain: d, ok: false }));
    try {
      const list = await infomaniakRequest<Array<{ customer_name?: string; domain?: string }>>(
        "/1/domains",
      );
      const known = new Set(
        (Array.isArray(list) ? list : []).map((d) => (d.domain ?? d.customer_name ?? "").toLowerCase()),
      );
      domains = DOMAINS.map((d) => ({ domain: d, ok: known.has(d) }));
    } catch {
      // Domeinlijst is optioneel: het token kan enkel workspace-scopes hebben.
    }
    return { ...base, ok: true, account: account ?? null, domains };
  } catch (error) {
    const err = error instanceof InfomaniakError ? error : null;
    return {
      ...base,
      error: err?.message ?? "Infomaniak-status kon niet gelezen worden.",
      errorCode: err?.code ?? "unknown",
    };
  }
}

/* -------------------------------------------------------------------- sync */

export type SyncScope = "calendar" | "contacts" | "newsletter";

export type SyncScopeResult = {
  scope: SyncScope;
  ok: boolean;
  count: number;
  message: string;
};

async function ensureSyncTables() {
  const { db, hasDatabase } = await import("./neon.server");
  if (!hasDatabase()) return null;
  const sql = db();
  await sql`
    create table if not exists infomaniak_sync_state (
      scope text primary key,
      last_sync_at timestamptz,
      last_status text,
      last_message text,
      item_count integer not null default 0
    )
  `;
  await sql`
    create table if not exists infomaniak_events (
      id text primary key,
      title text,
      starts_at timestamptz,
      ends_at timestamptz,
      location text,
      payload jsonb,
      synced_at timestamptz not null default now()
    )
  `;
  return sql;
}

export async function recordSyncState(result: SyncScopeResult): Promise<void> {
  const sql = await ensureSyncTables();
  if (!sql) return;
  await sql`
    insert into infomaniak_sync_state (scope, last_sync_at, last_status, last_message, item_count)
    values (${result.scope}, now(), ${result.ok ? "ok" : "error"}, ${result.message}, ${result.count})
    on conflict (scope) do update
      set last_sync_at = now(), last_status = excluded.last_status,
          last_message = excluded.last_message, item_count = excluded.item_count
  `;
}

export async function readSyncState(): Promise<
  Array<{ scope: string; last_sync_at: string | null; last_status: string | null; last_message: string | null; item_count: number }>
> {
  const sql = await ensureSyncTables();
  if (!sql) return [];
  return (await sql`select scope, last_sync_at, last_status, last_message, item_count from infomaniak_sync_state`) as never;
}

type CalendarEvent = {
  id?: string | number;
  uid?: string;
  title?: string;
  name?: string;
  start?: string | number;
  end?: string | number;
  location?: string;
};

/** Haalt agenda-items op uit Infomaniak Workspace en bewaart ze lokaal. */
async function syncCalendar(): Promise<SyncScopeResult> {
  const cfg = infomaniakConfig();
  const events = await infomaniakRequest<CalendarEvent[]>(
    `/1/calendar/${encodeURIComponent(cfg.productId)}/events`,
  );
  const list = Array.isArray(events) ? events : [];
  const sql = await ensureSyncTables();
  if (sql) {
    for (const event of list) {
      const id = String(event.id ?? event.uid ?? "");
      if (!id) continue;
      const toDate = (v: string | number | undefined) =>
        v === undefined ? null : typeof v === "number" ? new Date(v * 1000).toISOString() : v;
      await sql`
        insert into infomaniak_events (id, title, starts_at, ends_at, location, payload, synced_at)
        values (${id}, ${event.title ?? event.name ?? null}, ${toDate(event.start)}, ${toDate(event.end)},
                ${event.location ?? null}, ${JSON.stringify(event)}::jsonb, now())
        on conflict (id) do update
          set title = excluded.title, starts_at = excluded.starts_at, ends_at = excluded.ends_at,
              location = excluded.location, payload = excluded.payload, synced_at = now()
      `;
    }
  }
  return {
    scope: "calendar",
    ok: true,
    count: list.length,
    message: `${list.length} agenda-items gesynchroniseerd.`,
  };
}

/** Zet contactaanvragen van de website in het Infomaniak-adresboek. */
async function syncContacts(): Promise<SyncScopeResult> {
  const cfg = infomaniakConfig();
  const { db, hasDatabase } = await import("./neon.server");
  if (!hasDatabase()) {
    return { scope: "contacts", ok: true, count: 0, message: "Geen databank verbonden." };
  }
  const rows = (await db()`
    select name, email from contact_messages
    where email is not null and created_at > now() - interval '30 days'
    limit 100
  `.catch(() => [])) as Array<{ name: string | null; email: string }>;

  let pushed = 0;
  for (const row of rows) {
    try {
      await infomaniakRequest(`/1/contacts/${encodeURIComponent(cfg.productId)}/contact`, {
        method: "POST",
        body: { emails: [{ value: row.email, type: "work" }], firstname: row.name ?? row.email },
      });
      pushed += 1;
    } catch (error) {
      if (error instanceof InfomaniakError && error.code === "invalid_api_key") throw error;
    }
  }
  return { scope: "contacts", ok: true, count: pushed, message: `${pushed} contacten doorgestuurd.` };
}

/** Zet nieuwsbriefinschrijvingen door naar de Infomaniak Newsletter-lijst. */
async function syncNewsletter(): Promise<SyncScopeResult> {
  const cfg = infomaniakConfig();
  const { db, hasDatabase } = await import("./neon.server");
  if (!hasDatabase()) {
    return { scope: "newsletter", ok: true, count: 0, message: "Geen databank verbonden." };
  }
  const rows = (await db()`
    select email from newsletter_subscribers where unsubscribed_at is null limit 500
  `.catch(() => [])) as Array<{ email: string }>;

  let pushed = 0;
  for (const row of rows) {
    try {
      await infomaniakRequest(`/1/newsletters/${encodeURIComponent(cfg.productId)}/subscribers`, {
        method: "POST",
        body: { email: row.email, status: "active" },
      });
      pushed += 1;
    } catch (error) {
      if (error instanceof InfomaniakError && error.code === "invalid_api_key") throw error;
    }
  }
  return {
    scope: "newsletter",
    ok: true,
    count: pushed,
    message: `${pushed} inschrijvingen doorgestuurd.`,
  };
}

export async function runInfomaniakSync(scopes: SyncScope[]): Promise<SyncScopeResult[]> {
  const results: SyncScopeResult[] = [];
  for (const scope of scopes) {
    try {
      const result =
        scope === "calendar"
          ? await syncCalendar()
          : scope === "contacts"
            ? await syncContacts()
            : await syncNewsletter();
      results.push(result);
      await recordSyncState(result);
    } catch (error) {
      const message =
        error instanceof InfomaniakError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Onbekende fout";
      const failed: SyncScopeResult = { scope, ok: false, count: 0, message };
      results.push(failed);
      await recordSyncState(failed);
    }
  }
  return results;
}
