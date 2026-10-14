-- Mailinstellingen + logboek van formulierinzendingen (idempotent).

create table if not exists public.email_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now(),
  updated_by text
);

insert into public.email_settings (key, value)
values ('fallback_email', 'contact@maximilien.site')
on conflict (key) do nothing;

create table if not exists public.form_submissions (
  id uuid primary key default gen_random_uuid(),
  form text not null,
  category text,
  name text,
  email text,
  subject text,
  message text,
  payload jsonb not null default '{}'::jsonb,
  recipients text[] not null default '{}',
  status text not null default 'email_pending',
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists form_submissions_created_idx on public.form_submissions (created_at desc);
create index if not exists form_submissions_status_idx on public.form_submissions (status);
