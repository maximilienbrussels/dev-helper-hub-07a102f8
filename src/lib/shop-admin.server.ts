/**
 * Server-only laag voor het webshopbeheer: zorgt dat `products` en
 * `product_images` het volledige verwachte schema hebben, ongeacht welke
 * migraties de productie-databank al kreeg. Zonder deze "ensure"-stap gaf een
 * ontbrekende kolom (bv. `desc_fr` of `required_level`) een stille query-fout
 * en toonde het portaal gewoon een lege productenlijst.
 */

let ensured = false;

export async function ensureShopTables(): Promise<boolean> {
  const { db, hasDatabase } = await import("./neon.server");
  if (!hasDatabase()) return false;
  if (ensured) return true;
  const sql = db();

  // Basistabel: bestaat ze nog niet (verse omgeving), maak ze volledig aan.
  await sql`
    create table if not exists products (
      id bigint generated always as identity primary key,
      organisation_id bigint not null default 1,
      title text not null,
      created_at timestamptz not null default now()
    )
  `;

  // Kolommen één voor één afdwingen: idempotent en werkt ook op een
  // bestaande tabel die nog niet alle migraties kreeg.
  // Eén ALTER-statement per kolom: de HTTP-driver ondersteunt geen
  // dynamische SQL-fragmenten, dus elke kolom staat hier expliciet.
  await sql`alter table products add column if not exists organisation_id bigint not null default 1`;
  await sql`alter table products add column if not exists title text not null default ''`;
  await sql`alter table products add column if not exists title_nl text`;
  await sql`alter table products add column if not exists title_fr text`;
  await sql`alter table products add column if not exists title_en text`;
  await sql`alter table products add column if not exists description text`;
  await sql`alter table products add column if not exists desc_nl text`;
  await sql`alter table products add column if not exists desc_fr text`;
  await sql`alter table products add column if not exists desc_en text`;
  await sql`alter table products add column if not exists price_cents integer not null default 0`;
  await sql`alter table products add column if not exists stock_quantity integer not null default 0`;
  await sql`alter table products add column if not exists is_catalog boolean not null default true`;
  await sql`alter table products add column if not exists image_url text`;
  await sql`alter table products add column if not exists is_packaging_free boolean not null default false`;
  await sql`alter table products add column if not exists c2c_eligible boolean not null default false`;
  await sql`alter table products add column if not exists c2c_refund_value_cents integer not null default 0`;
  await sql`alter table products add column if not exists availability text`;
  await sql`alter table products add column if not exists required_level integer`;
  await sql`alter table products add column if not exists deleted_at timestamptz`;
  await sql`alter table products add column if not exists created_at timestamptz not null default now()`;
  await sql`create index if not exists products_deleted_idx on products (deleted_at)`;
  await sql`create index if not exists products_organisation_idx on products (organisation_id)`;

  await sql`
    create table if not exists product_images (
      id bigint generated always as identity primary key,
      product_id bigint not null references products(id) on delete cascade,
      media_id text,
      url text,
      alt text,
      position integer not null default 0,
      created_at timestamptz not null default now()
    )
  `;
  // Rollen: hoofdfoto (kaartbeeld) en hoverfoto (tweede beeld in het raster).
  await sql`alter table product_images add column if not exists is_primary boolean not null default false`;
  await sql`alter table product_images add column if not exists is_hover boolean not null default false`;
  await sql`alter table product_images add column if not exists file_key text`;
  await sql`create index if not exists product_images_product_id_idx on product_images(product_id)`;
  await sql`create index if not exists product_images_position_idx on product_images(product_id, position)`;

  ensured = true;
  return true;
}

/** Volledige productenlijst voor het portaal (achter `view_shop`). */
export type PortalProductRow = {
  id: number;
  title: string;
  description: string | null;
  title_nl: string | null;
  title_fr: string | null;
  title_en: string | null;
  desc_nl: string | null;
  desc_fr: string | null;
  desc_en: string | null;
  price_cents: number;
  stock_quantity: number;
  is_catalog: boolean;
  organisation_id: number;
  availability: string | null;
  required_level: number | null;
};

export async function listPortalProducts(): Promise<PortalProductRow[]> {
  await ensureShopTables();
  const { db } = await import("./neon.server");
  const rows = (await db()`
    select id, title, description, title_nl, title_fr, title_en, desc_nl, desc_fr, desc_en,
           price_cents, stock_quantity, is_catalog, organisation_id, availability, required_level
    from products
    where deleted_at is null
    order by title
  `) as PortalProductRow[];
  return rows;
}

export type PortalProductImageRow = {
  id: number;
  product_id: number;
  media_id: string | null;
  url: string | null;
  alt: string | null;
  position: number;
  is_primary: boolean;
  is_hover: boolean;
  file_key: string | null;
};

export async function listPortalProductImages(productId: number): Promise<PortalProductImageRow[]> {
  await ensureShopTables();
  const { db } = await import("./neon.server");
  const rows = (await db()`
    select id, product_id, media_id, url, alt, position, is_primary, is_hover, file_key
    from product_images
    where product_id = ${productId}
    order by position
  `) as PortalProductImageRow[];
  return rows;
}

/** Recente bestellingen voor het portaal (achter `manage_orders`). */
export type PortalOrderRow = {
  id: number;
  order_reference: string | null;
  structured_communication: string | null;
  total_price_cents: number;
  pickup_slot: string;
  payment_status: string;
  customer_email: string | null;
};

export async function listPortalOrders(): Promise<PortalOrderRow[]> {
  const { db, hasDatabase } = await import("./neon.server");
  if (!hasDatabase()) return [];
  const rows = (await db()`
    select id, order_reference, structured_communication, total_price_cents, pickup_slot, payment_status, customer_email
    from orders
    order by created_at desc
    limit 50
  `) as PortalOrderRow[];
  return rows;
}

/* --------------------------------------------------- webshop-hero afbeelding */

const SHOP_HERO_KEY = "shop_hero";

export type ShopHero = { url: string | null; mediaId: string | null; alt: string | null };

export async function loadShopHero(): Promise<ShopHero> {
  try {
    const { db, hasDatabase } = await import("./neon.server");
    if (!hasDatabase()) return { url: null, mediaId: null, alt: null };
    const { ensureSiteTables } = await import("./site-config.server");
    await ensureSiteTables();
    const rows = (await db()`
      select value from site_settings where key = ${SHOP_HERO_KEY}
    `) as Array<{ value: { url?: string | null; mediaId?: string | null; alt?: string | null } }>;
    const value = rows[0]?.value ?? {};
    return { url: value.url ?? null, mediaId: value.mediaId ?? null, alt: value.alt ?? null };
  } catch (error) {
    console.error("[shop-admin] kon webshop-hero niet laden:", error);
    return { url: null, mediaId: null, alt: null };
  }
}

export async function saveShopHero(hero: ShopHero, updatedBy: string | null): Promise<void> {
  const { db } = await import("./neon.server");
  const { ensureSiteTables } = await import("./site-config.server");
  await ensureSiteTables();
  await db()`
    insert into site_settings (key, value, updated_at, updated_by)
    values (${SHOP_HERO_KEY}, ${JSON.stringify(hero)}::jsonb, now(), ${updatedBy})
    on conflict (key) do update set value = excluded.value, updated_at = now(), updated_by = excluded.updated_by
  `;
}
