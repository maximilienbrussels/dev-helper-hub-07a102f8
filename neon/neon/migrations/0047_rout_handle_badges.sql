-- ROUT: handle als gebruikersnaam, Rich Identity-activiteit, webhooks en badges. Idempotent.
alter table public.app_users add column if not exists username text;
alter table public.app_users add column if not exists rout_public_activity jsonb;
-- Uniek (hoofdletterongevoelig) zodra ingevuld; accounts zonder ROUT hebben (nog) geen handle.
create unique index if not exists app_users_username_key on public.app_users (lower(username)) where username is not null;

create table if not exists public.rout_webhook_events (
  id text primary key,
  type text not null,
  received_at timestamptz not null default now()
);

create table if not exists public.issued_badges (
  id uuid primary key default gen_random_uuid(),
  recipient_handle text not null,
  badge_slug text not null,
  issue_date date not null default current_date,
  metadata jsonb,
  rout_badge_id text,
  status text not null default 'pending',
  last_error text,
  idempotency_key uuid not null unique,
  issued_by uuid,
  created_at timestamptz not null default now()
);
create index if not exists issued_badges_created_idx on public.issued_badges (created_at desc);
