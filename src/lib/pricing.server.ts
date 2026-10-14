/**
 * Server-only laag voor de tarieventabel. Fail-safe: zonder databank
 * gelden de standaardwaarden uit de code.
 */
import { PRICING_DEFAULTS, PRICING_DEFAULT_ITEMS, type PricingMap } from "./pricing";

let ensured = false;

export async function ensurePricingTable(): Promise<boolean> {
  const { db, hasDatabase } = await import("./neon.server");
  if (!hasDatabase()) return false;
  if (ensured) return true;
  await db()`
    create table if not exists pricing_items (
      key text primary key,
      amount numeric not null default 0,
      label_nl text not null default '',
      label_fr text not null default '',
      label_en text not null default '',
      updated_at timestamptz not null default now(),
      updated_by text
    )
  `;
  ensured = true;
  return true;
}

/** Alle tarieven uit de databank, aangevuld met de standaarden. */
export async function loadPricing(): Promise<PricingMap> {
  if (!(await ensurePricingTable())) return { ...PRICING_DEFAULTS };
  const { db } = await import("./neon.server");
  const rows = (await db()`select key, amount from pricing_items`) as Array<{
    key: string;
    amount: string | number;
  }>;
  const map: PricingMap = { ...PRICING_DEFAULTS };
  for (const r of rows) {
    const n = Number(r.amount);
    if (Number.isFinite(n)) map[r.key] = n;
  }
  return map;
}

/** Eén tarief in euro (server-side, voor betalingen). */
export async function priceForKey(key: string, fallback: number): Promise<number> {
  try {
    const map = await loadPricing();
    const value = map[key];
    return typeof value === "number" && Number.isFinite(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

/** Lijst voor het portaal: elk bekend tarief met huidige waarde. */
export async function listPricing(): Promise<
  Array<{ key: string; amount: number; label: { nl: string; fr: string; en: string } }>
> {
  const map = await loadPricing();
  return PRICING_DEFAULT_ITEMS.map((i) => ({
    key: i.key,
    amount: map[i.key] ?? i.amount,
    label: i.label,
  }));
}

export async function savePricingValue(
  key: string,
  amount: number,
  updatedBy: string | null,
): Promise<void> {
  if (!(await ensurePricingTable())) {
    throw new Error("De databank is niet verbonden — het tarief kan niet bewaard worden.");
  }
  const known = PRICING_DEFAULT_ITEMS.find((i) => i.key === key);
  const { db } = await import("./neon.server");
  await db()`
    insert into pricing_items (key, amount, label_nl, label_fr, label_en, updated_at, updated_by)
    values (${key}, ${amount}, ${known?.label.nl ?? ""}, ${known?.label.fr ?? ""}, ${known?.label.en ?? ""}, now(), ${updatedBy})
    on conflict (key) do update set
      amount = excluded.amount, updated_at = now(), updated_by = excluded.updated_by
  `;
}
