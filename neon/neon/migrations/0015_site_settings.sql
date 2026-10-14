-- Sitebeheer: pagina-zichtbaarheid, onderhoudsmodus, modules en aankondigingen.

create table if not exists public.site_pages (
  key text primary key,
  status text not null default 'visible' check (status in ('visible', 'hidden', 'offline')),
  visible_from timestamptz,
  visible_to timestamptz,
  notice_nl text,
  notice_fr text,
  notice_en text,
  updated_at timestamptz not null default now(),
  updated_by text
);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by text
);

create table if not exists public.feature_flags (
  key text primary key,
  enabled boolean not null default true,
  label text,
  updated_at timestamptz not null default now(),
  updated_by text
);

create table if not exists public.site_announcements (
  id uuid primary key default gen_random_uuid(),
  active boolean not null default false,
  tone text not null default 'info' check (tone in ('info', 'warning', 'success')),
  message_nl text not null default '',
  message_fr text not null default '',
  message_en text not null default '',
  link_url text,
  link_label_nl text,
  link_label_fr text,
  link_label_en text,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by text
);

create index if not exists site_announcements_active_idx on public.site_announcements (active, starts_at, ends_at);

-- Standaardmodules (aan/uit voor de hele site).
insert into public.feature_flags (key, label) values
  ('shop', 'Webshop & winkelmandje'),
  ('booking', 'Online boeken'),
  ('academy_quiz', 'Academie-quiz'),
  ('chatbot', 'Chatbot'),
  ('social_feeds', 'Social feeds'),
  ('registration', 'Registratie van nieuwe accounts')
on conflict (key) do nothing;

-- Onderhoudsmodus staat standaard uit.
insert into public.site_settings (key, value)
values ('maintenance', '{"enabled": false, "message_nl": "", "message_fr": "", "message_en": ""}'::jsonb)
on conflict (key) do nothing;
