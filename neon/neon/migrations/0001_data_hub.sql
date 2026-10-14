-- Data Hub: hubs, datasets en connecties
create table if not exists public.hubs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  owner_id text not null,
  status text not null default 'active' check (status in ('active','paused','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.datasets (
  id uuid primary key default gen_random_uuid(),
  hub_id uuid not null references public.hubs(id) on delete cascade,
  name text not null,
  description text,
  format text not null default 'csv' check (format in ('csv','json','parquet','postgres','api')),
  record_count integer not null default 0,
  refreshed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  hub_id uuid not null references public.hubs(id) on delete cascade,
  dataset_id uuid references public.datasets(id) on delete set null,
  name text not null,
  kind text not null default 'api' check (kind in ('api','database','webhook','sftp','file')),
  endpoint text,
  status text not null default 'disconnected' check (status in ('connected','disconnected','error')),
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists datasets_hub_id_idx on public.datasets(hub_id);
create index if not exists connections_hub_id_idx on public.connections(hub_id);
create index if not exists hubs_owner_idx on public.hubs(owner_id);
