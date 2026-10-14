-- Publieke bestelreferentie `MP-2026-8F3A2` naast de interne primaire sleutel.
alter table if exists public.orders
  add column if not exists order_reference text;

-- Bestaande bestellingen krijgen een stabiele referentie op basis van hun id.
update public.orders
   set order_reference = 'MP-' || to_char(coalesce(created_at, now()), 'YYYY') || '-'
                       || upper(lpad(to_hex(id), 5, '0'))
 where order_reference is null;

create unique index if not exists orders_order_reference_key
  on public.orders (order_reference)
  where order_reference is not null;

create index if not exists orders_order_reference_search_idx
  on public.orders (lower(coalesce(order_reference, '')));
