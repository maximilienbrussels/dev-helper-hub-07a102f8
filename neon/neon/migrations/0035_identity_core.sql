-- Intern UUID als enige sleutel + koppeltabel voor inlogmethodes.
--
-- 1. `app_users.id` (uuid) blijft de onveranderlijke kern: alle reservaties,
--    Hoefjes, badges en transacties hangen daaraan vast.
-- 2. `app_user_identities` koppelt dat interne ID aan externe aanbieders via
--    hun eigen subject-id (Google sub, GitHub id, Mastodon acct, Bluesky DID).
--    Verandert het e-mailadres, dan blijft de koppeling gewoon staan.
-- 3. Het e-mailadres is een gewoon profielveld: wijzigen kan via een
--    bevestigingslink (tabel hieronder), zonder gegevensverlies.

create table if not exists public.app_user_identities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  provider text not null,
  instance text,
  created_at timestamptz not null default now(),
  unique (user_id, provider)
);

alter table public.app_user_identities add column if not exists subject text;
alter table public.app_user_identities add column if not exists email text;
alter table public.app_user_identities add column if not exists last_used_at timestamptz;

-- Eén extern account hoort bij hoogstens één intern profiel.
create unique index if not exists app_user_identities_provider_subject_key
  on public.app_user_identities (provider, subject)
  where subject is not null;

create index if not exists app_user_identities_user_idx
  on public.app_user_identities (user_id);

-- Veilige e-mailwijziging: pas na het volgen van de bevestigingslink wordt
-- het profielveld aangepast. Het interne ID verandert nooit.
create table if not exists public.app_user_email_changes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  new_email text not null,
  token text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_at timestamptz
);

create index if not exists app_user_email_changes_user_idx
  on public.app_user_email_changes (user_id);
