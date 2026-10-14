-- Webshopbeheer afronden: hero-afbeelding (via site_settings) en volledige
-- hardening van products/product_images. Idempotent: opnieuw uitvoeren mag
-- geen fouten geven.

create table if not exists products (
  id bigint generated always as identity primary key,
  organisation_id bigint not null default 1,
  title text not null,
  created_at timestamptz not null default now()
);

alter table products add column if not exists organisation_id bigint not null default 1;
alter table products add column if not exists title text not null default '';
alter table products add column if not exists title_nl text;
alter table products add column if not exists title_fr text;
alter table products add column if not exists title_en text;
alter table products add column if not exists description text;
alter table products add column if not exists desc_nl text;
alter table products add column if not exists desc_fr text;
alter table products add column if not exists desc_en text;
alter table products add column if not exists price_cents integer not null default 0;
alter table products add column if not exists stock_quantity integer not null default 0;
alter table products add column if not exists is_catalog boolean not null default true;
alter table products add column if not exists image_url text;
alter table products add column if not exists is_packaging_free boolean not null default false;
alter table products add column if not exists c2c_eligible boolean not null default false;
alter table products add column if not exists c2c_refund_value_cents integer not null default 0;
alter table products add column if not exists availability text;
alter table products add column if not exists required_level integer;
alter table products add column if not exists deleted_at timestamptz;
alter table products add column if not exists created_at timestamptz not null default now();
create index if not exists products_deleted_idx on products (deleted_at);
create index if not exists products_organisation_idx on products (organisation_id);

create table if not exists product_images (
  id bigint generated always as identity primary key,
  product_id bigint not null references products(id) on delete cascade,
  media_id text,
  url text,
  alt text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists product_images_product_id_idx on product_images(product_id);
create index if not exists product_images_position_idx on product_images(product_id, position);

-- Webshop-hero (banner op de publieke webshoppagina) wordt bewaard in
-- site_settings onder de sleutel 'shop_hero'; die tabel bestaat al dankzij
-- 0015_site_settings.sql, hier alleen ter documentatie/idempotente garantie.
create table if not exists site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by text
);
