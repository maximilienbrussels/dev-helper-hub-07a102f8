-- Tweestapsverificatie: instellingen per gebruiker, eenmalige codes en
-- buitenlandse verificatieaanvragen. Enkel server-side benaderd.

create table if not exists public.app_mfa (
  user_id uuid primary key references public.app_users (id) on delete cascade,
  totp_secret_enc text,
  totp_pending_enc text,
  totp_enabled_at timestamptz,
  phone text,
  phone_country text,
  phone_verified_at timestamptz,
  phone_method text,
  recovery_hashes text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists public.app_mfa_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users (id) on delete cascade,
  kind text not null check (kind in ('sms', 'intl')),
  purpose text not null check (purpose in ('setup', 'login')),
  code_hash text not null,
  code_plain text,
  phone text,
  country text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'used')),
  attempts int not null default 0,
  decided_by text,
  decided_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists app_mfa_codes_user_idx on public.app_mfa_codes (user_id, created_at desc);
create index if not exists app_mfa_codes_pending_idx on public.app_mfa_codes (kind, status, created_at desc);
