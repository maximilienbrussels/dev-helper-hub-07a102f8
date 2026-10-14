-- Losse arrangementen ("Diensten & tarieven" in het portaal). De tabel werd
-- nooit door een migratie aangemaakt, waardoor de portaalpagina leeg bleef.
-- Idempotent: mag meerdere keren lopen.

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  title_nl text not null default '',
  title_fr text not null default '',
  title_en text not null default '',
  desc_nl text not null default '',
  desc_fr text not null default '',
  desc_en text not null default '',
  price numeric not null default 0,
  location_id text not null default 'zaal',
  active boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'services_location_check') then
    alter table public.services
      add constraint services_location_check
      check (location_id in ('chalet', 'zaal', 'prairie', 'boerderij'));
  end if;
end $$;

create index if not exists services_sort_idx on public.services (sort_order);

-- Rollen bestaan enkel op Supabase-achtige databanken; op Neon overslaan.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select, insert, update, delete on public.services to authenticated;
  end if;
  if exists (select 1 from pg_roles where rolname = 'anon') then
    grant select on public.services to anon;
  end if;
end $$;
