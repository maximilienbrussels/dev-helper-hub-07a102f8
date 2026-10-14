-- Factuur-URL en factuurnummer bij de bestelling bewaren, zodat klanten hun
-- PDF later opnieuw kunnen downloaden vanuit hun account.
alter table orders add column if not exists invoice_url text;
alter table orders add column if not exists invoice_number text;
create index if not exists orders_invoice_number_idx on orders (invoice_number);
