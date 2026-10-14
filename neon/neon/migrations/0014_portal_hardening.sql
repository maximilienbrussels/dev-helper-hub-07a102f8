-- Portaal-versteviging: wijzigingslogboek + zacht verwijderen (prullenbak).

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  actor_id uuid,
  actor_email text,
  action text not null,          -- create | update | delete | restore | login | other
  entity text not null,          -- booking | product | media | role | academy | settings | ...
  entity_id text,
  summary text,                  -- korte, leesbare omschrijving
  details jsonb                  -- { before: {...}, after: {...} }
);

create index if not exists audit_log_created_idx on public.audit_log (created_at desc);
create index if not exists audit_log_entity_idx on public.audit_log (entity, entity_id);

-- Zacht verwijderen: rijen blijven 30 dagen herstelbaar.
alter table public.bookings add column if not exists deleted_at timestamptz;
alter table public.media_assets add column if not exists deleted_at timestamptz;
alter table public.products add column if not exists deleted_at timestamptz;

create index if not exists bookings_deleted_idx on public.bookings (deleted_at);
create index if not exists media_assets_deleted_idx on public.media_assets (deleted_at);
create index if not exists products_deleted_idx on public.products (deleted_at);
