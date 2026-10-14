/**
 * Bouwt een compacte momentopname van de actuele databasewaarden (tarieven,
 * diensten, site-instellingen, producten) die als context in de systeemprompt
 * van Maxim AI wordt gezet. Zo kent de assistent het huidige tarief vóór hij
 * een wijziging voorstelt.
 */

type Row = Record<string, unknown>;

function euro(value: unknown): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "?";
  return `€${n.toFixed(2).replace(/\.00$/, "")}`;
}

export async function buildLiveDataContext(): Promise<string> {
  const { db } = await import("../neon.server");
  const sql = db();

  const safe = async <T>(run: () => Promise<T>, fallback: T): Promise<T> => {
    try {
      return await run();
    } catch {
      return fallback;
    }
  };

  const [pricing, services, settings, products] = await Promise.all([
    safe(
      async () => (await sql`select key, amount from pricing_items order by key limit 60`) as Row[],
      [] as Row[],
    ),
    safe(
      async () =>
        (await sql`select id, title_nl, price from services order by title_nl limit 40`) as Row[],
      [] as Row[],
    ),
    safe(
      async () =>
        (await sql`select key, value from site_settings where key in ('contact','maintenance','opening_hours') limit 10`) as Row[],
      [] as Row[],
    ),
    safe(
      async () =>
        (await sql`select id, name_nl, price from products where active = true order by name_nl limit 40`) as Row[],
      [] as Row[],
    ),
  ]);

  const lines: string[] = [];

  if (pricing.length) {
    lines.push("Actuele tarieven (tabel pricing_items, sleutel = bedrag):");
    for (const r of pricing) lines.push(`- ${String(r["key"])}: ${euro(r["amount"])}`);
  }
  if (services.length) {
    lines.push("Actuele dienstprijzen (tabel services):");
    for (const r of services) lines.push(`- ${String(r["title_nl"])} (id ${String(r["id"])}): ${euro(r["price"])}`);
  }
  if (products.length) {
    lines.push("Actuele webshopprijzen (tabel products):");
    for (const r of products) lines.push(`- ${String(r["name_nl"])} (id ${String(r["id"])}): ${euro(r["price"])}`);
  }
  if (settings.length) {
    lines.push("Actuele site-instellingen (tabel site_settings):");
    for (const r of settings) {
      lines.push(`- ${String(r["key"])}: ${JSON.stringify(r["value"]).slice(0, 400)}`);
    }
  }

  if (lines.length === 0) return "Geen live databasewaarden beschikbaar (database niet bereikbaar).";
  return lines.join("\n").slice(0, 6_000);
}
