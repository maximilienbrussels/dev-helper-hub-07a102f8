-- Beveiligde afhaal-QR (UUID + HMAC), verpakkingskeuze en "betalen bij afhaling".
alter table public.orders add column if not exists pickup_uuid uuid not null default gen_random_uuid();
create unique index if not exists orders_pickup_uuid_idx on public.orders (pickup_uuid);

-- BYO | PAPER_BAG | COTTON_BAG
alter table public.orders add column if not exists packaging_option text not null default 'BYO';

-- Gezet bij een geldige scan aan de kassa; een tweede scan is dan ongeldig.
alter table public.orders add column if not exists fulfilled_at timestamptz;
alter table public.orders add column if not exists fulfilled_by text;
