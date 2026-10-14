-- Vaste beheerdersaccounts in de eigen auth-tabel (idempotent).
-- Zonder wachtwoord-hash: het wachtwoord wordt gezet via de inloglink of
-- "wachtwoord vergeten" (bcrypt-hash, nooit een hash in versiebeheer).

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

insert into public.app_users (email, name, email_verified_at)
values
  ('desk@delplanche.cloud', 'Desk Delplanche', now()),
  ('hallo@maximilien.site', 'Maximilien', now()),
  ('contact@maximilien.brussels', 'Maximilien', now())
on conflict (lower(email)) do nothing;

-- Portaaltoegang blijft gegarandeerd (self-healing bij login via ensureSuperAdmin).
insert into public.portal_admins (email, role, active)
values
  ('desk@delplanche.cloud', 'admin', true),
  ('hallo@maximilien.site', 'admin', true),
  ('contact@maximilien.brussels', 'admin', true)
on conflict (email) do update set role = 'admin', active = true;
