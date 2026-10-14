-- API-sleutels voor externe integraties (scoped REST-toegang) en
-- Maxim-aankondigingen die via die API beheerd kunnen worden.

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  key_hash text not null unique,
  prefix text not null,
  scopes jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  last_used_at timestamptz,
  created_by text,
  created_at timestamptz not null default now()
);

create index if not exists api_keys_key_hash_idx on public.api_keys (key_hash);

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select, insert, update, delete on public.api_keys to authenticated;
  end if;
end $$;

-- Aankondigingen die via de scoped API voor Maxim (kennisbank) worden gezet.
create table if not exists public.maxim_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select, insert, update, delete on public.maxim_announcements to authenticated;
  end if;
end $$;

-- Check-in marker voor boekingen (gebruikt door de scoped API).
alter table public.bookings add column if not exists checked_in_at timestamptz;
