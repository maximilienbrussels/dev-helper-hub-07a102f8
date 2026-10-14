-- Certificaten: korte code van 6 tekens (zelfde alfabet als de afhaalcodes)
-- plus afdrukstatus, zodat een teamlid aan de balie kan scannen, intikken en
-- meteen afdrukken.

alter table public.certificaten add column if not exists short_code text;
alter table public.certificaten add column if not exists printed_at timestamptz;
alter table public.certificaten add column if not exists printed_by uuid;
alter table public.certificaten add column if not exists print_count integer not null default 0;

create or replace function public.gen_cert_short_code() returns text
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
    select not exists (select 1 from public.certificaten where short_code = code) into free;
    exit when free;
  end loop;
  return code;
end;
$$;

update public.certificaten set short_code = public.gen_cert_short_code() where short_code is null;

alter table public.certificaten alter column short_code set default public.gen_cert_short_code();

create unique index if not exists certificaten_short_code_idx on public.certificaten (short_code);

-- Afhaling: wie printte de bon/het bewijs en wanneer.
alter table public.orders add column if not exists printed_at timestamptz;
alter table public.orders add column if not exists printed_by uuid;
