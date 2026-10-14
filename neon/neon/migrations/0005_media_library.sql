-- Centrale mediabibliotheek: één tabel voor alle beelden van portaal + publieke site.
-- Bestanden worden als base64 bewaard zodat er geen externe bucket nodig is; de
-- bytes worden uitgeserveerd via /api/public/media/<id> met lange cache-headers.

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  mime_type text not null,
  byte_size integer not null default 0,
  width integer,
  height integer,
  category text not null default 'general',
  title text not null default '',
  description text not null default '',
  alt_text text not null default '',
  data_base64 text not null,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists media_assets_category_idx on public.media_assets (category);
create index if not exists media_assets_created_at_idx on public.media_assets (created_at desc);

-- Rechten voor de mediabibliotheek in de rechtenmatrix.
insert into role_permissions (role, permission, allowed, updated_at)
select r.role::app_role, p.permission, true, now()
from (values ('super_admin'), ('admin'), ('staff'), ('team')) as r(role)
cross join (values ('view_media'), ('manage_media')) as p(permission)
where r.role in ('super_admin', 'admin') or p.permission = 'view_media'
on conflict (role, permission) do nothing;
