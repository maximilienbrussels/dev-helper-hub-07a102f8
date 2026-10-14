-- Openbaar profiel per gebruiker + volgen. Idempotent.
create table if not exists public.app_public_profiles (
  user_id uuid primary key references public.app_users (id) on delete cascade,
  public_id text not null unique check (public_id ~ '^[a-z2-9]{10}$'),
  username text unique,
  username_source text,
  is_public boolean not null default false,
  show_name boolean not null default true,
  show_timeline boolean not null default true,
  show_badges boolean not null default true,
  show_certificates boolean not null default true,
  show_hooi boolean not null default true,
  show_follows boolean not null default true,
  bio text check (char_length(bio) <= 280),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_follows (
  follower_id uuid not null references public.app_users (id) on delete cascade,
  followee_id uuid not null references public.app_users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);
create index if not exists app_follows_followee_idx on public.app_follows (followee_id);
