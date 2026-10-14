-- Eigen authenticatie op Neon Postgres (geen externe Neon Auth meer).
-- Gebruikers, wachtwoord-hashes (bcrypt) en eenmalige tokens voor
-- inloglinks, e-mailbevestiging en wachtwoordherstel.

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  password_hash text,
  name text,
  avatar_url text,
  email_verified_at timestamptz,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists app_users_email_key on public.app_users (lower(email));

create table if not exists public.app_auth_tokens (
  token text primary key,
  kind text not null,
  email text not null,
  user_id uuid references public.app_users (id) on delete cascade,
  redirect_to text,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists app_auth_tokens_email_idx on public.app_auth_tokens (lower(email), kind);
create index if not exists app_auth_tokens_expires_idx on public.app_auth_tokens (expires_at);

-- Deze tabellen worden uitsluitend server-side benaderd (directe Postgres
-- verbinding), nooit via de Data API: daarom geen anon/authenticated grants.

