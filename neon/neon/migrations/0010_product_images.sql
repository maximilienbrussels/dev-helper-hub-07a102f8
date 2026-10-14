-- Extra fotos per product (naast het bestaande enkelvoudige products.image_url).
-- Idempotent: opnieuw uitvoeren mag geen fouten geven.
create table if not exists product_images (
  id bigint generated always as identity primary key,
  product_id bigint not null references products(id) on delete cascade,
  media_id text,
  url text,
  alt text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  constraint product_images_source_check check (media_id is not null or url is not null)
);

create index if not exists product_images_product_id_idx on product_images(product_id);
create index if not exists product_images_position_idx on product_images(product_id, position);
