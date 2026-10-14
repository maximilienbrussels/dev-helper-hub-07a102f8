-- Menselijk leesbare afhaalcode van 6 tekens (bv. B7K9X2) naast de QR-code.
-- Alfabet zonder verwarrende tekens (0/O, 1/I).
alter table public.orders add column if not exists pickup_code text;

create or replace function public.gen_pickup_code() returns text
language plpgsql
as $$
declare
  alphabet text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  code text;
  i int;
  free boolean;
begin
  loop
    code := '';
    for i in 1..6 loop
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    select not exists (select 1 from public.orders where pickup_code = code) into free;
    exit when free;
  end loop;
  return code;
end;
$$;

update public.orders set pickup_code = public.gen_pickup_code() where pickup_code is null;

alter table public.orders alter column pickup_code set default public.gen_pickup_code();

create unique index if not exists orders_pickup_code_idx on public.orders (pickup_code);
