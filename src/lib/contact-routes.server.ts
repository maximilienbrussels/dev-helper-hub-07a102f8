/**
 * Bestemmingsadressen per contactformulier / categorie.
 *
 * Bron van waarheid is de Neon-tabel `contact_routes` (kolommen: key, label,
 * recipients text[], active). Zolang Neon niet bereikbaar is of een categorie
 * ontbreekt, geldt de vaste lijst uit `contact-emails.ts` als vangnet — een
 * formulier verdwijnt dus nooit in het niets.
 */
import { CONTACT_ROUTE_LABELS, CONTACT_INBOXES, defaultRecipients } from "./contact-emails";

export type ContactRoute = {
  key: string;
  label: string;
  recipients: string[];
  active: boolean;
};

/** Zorgt dat de tabel bestaat en de standaardrijen erin staan. */
export async function ensureContactRoutes(): Promise<void> {
  const { db, hasDatabase } = await import("./neon.server");
  if (!hasDatabase()) return;
  const sql = db();
  await sql`
    create table if not exists contact_routes (
      key text primary key,
      label text not null,
      recipients text[] not null default '{}',
      active boolean not null default true,
      updated_at timestamptz not null default now(),
      updated_by text
    )
  `;
  for (const key of Object.keys(CONTACT_INBOXES)) {
    await sql`
      insert into contact_routes (key, label, recipients)
      values (${key}, ${CONTACT_ROUTE_LABELS[key] ?? key}, ${defaultRecipients(key)})
      on conflict (key) do nothing
    `;
  }
}

/** Alle routes, aangevuld met categorieën die nog niet in de databank staan. */
export async function listContactRoutes(): Promise<ContactRoute[]> {
  const fallback: ContactRoute[] = Object.keys(CONTACT_INBOXES).map((key) => ({
    key,
    label: CONTACT_ROUTE_LABELS[key] ?? key,
    recipients: defaultRecipients(key),
    active: true,
  }));

  try {
    const { db, hasDatabase } = await import("./neon.server");
    if (!hasDatabase()) return fallback;
    await ensureContactRoutes();
    const rows = (await db()`
      select key, label, recipients, active from contact_routes order by label
    `) as Array<{ key: string; label: string; recipients: string[] | null; active: boolean }>;
    if (!rows.length) return fallback;

    const byKey = new Map(rows.map((r) => [r.key, r]));
    const merged = fallback.map((f) => {
      const row = byKey.get(f.key);
      byKey.delete(f.key);
      return row
        ? {
            key: row.key,
            label: row.label || f.label,
            recipients: row.recipients ?? [],
            active: row.active,
          }
        : f;
    });
    for (const row of byKey.values()) {
      merged.push({
        key: row.key,
        label: row.label || row.key,
        recipients: row.recipients ?? [],
        active: row.active,
      });
    }
    return merged;
  } catch (err) {
    console.warn(`[contact-routes] niet leesbaar: ${(err as Error).message}`);
    return fallback;
  }
}

/** Ontvangers voor één categorie; nooit leeg — anders het globale vangnetadres. */
export async function recipientsFor(key?: string): Promise<string[]> {
  const wanted = key || "algemeen";
  try {
    const { db, hasDatabase } = await import("./neon.server");
    if (hasDatabase()) {
      const rows = (await db()`
        select recipients, active from contact_routes where key = ${wanted} limit 1
      `) as Array<{ recipients: string[] | null; active: boolean }>;
      const row = rows[0];
      if (row && row.active && row.recipients?.length) return row.recipients;
    }
  } catch (err) {
    console.warn(`[contact-routes] fallback gebruikt: ${(err as Error).message}`);
  }
  try {
    const { fallbackEmail } = await import("./email-settings.server");
    return [await fallbackEmail()];
  } catch {
    return defaultRecipients(wanted);
  }
}


/** Slaat de ontvangers van één categorie op. */
export async function saveContactRoute(input: {
  key: string;
  label: string;
  recipients: string[];
  active: boolean;
  updatedBy: string;
}): Promise<void> {
  const { db, hasDatabase } = await import("./neon.server");
  if (!hasDatabase()) {
    throw new Error("De databank is niet verbonden — de mailroutering kan niet bewaard worden.");
  }
  await ensureContactRoutes();
  await db()`
    insert into contact_routes (key, label, recipients, active, updated_at, updated_by)
    values (${input.key}, ${input.label}, ${input.recipients}, ${input.active}, now(), ${input.updatedBy})
    on conflict (key) do update set
      label = excluded.label,
      recipients = excluded.recipients,
      active = excluded.active,
      updated_at = now(),
      updated_by = excluded.updated_by
  `;
}

/** Verwijdert een eigen categorie (standaardcategorieën blijven bestaan). */
export async function deleteContactRoute(key: string): Promise<void> {
  const { db, hasDatabase } = await import("./neon.server");
  if (!hasDatabase()) {
    throw new Error("De databank is niet verbonden — de categorie kan niet verwijderd worden.");
  }
  await ensureContactRoutes();
  await db()`delete from contact_routes where key = ${key}`;
}

/**
 * Publieke keuzelijst voor het algemene contactformulier: enkel sleutel en
 * label — e-mailadressen blijven server-side.
 */
export async function publicContactTopics(): Promise<{ key: string; label: string }[]> {
  const routes = await listContactRoutes();
  return routes
    .filter((r) => r.active && r.recipients.length > 0)
    .map((r) => ({ key: r.key, label: r.label }));
}
