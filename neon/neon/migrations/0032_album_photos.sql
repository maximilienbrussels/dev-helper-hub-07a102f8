-- Fotoalbums die het team zelf beheert via het beheerportaal.
-- Elke foto hoort bij een album (thema of een specifiek dier) en staat in de
-- Europese Scaleway-bucket; hier bewaren we enkel de verwijzing + bijschrift.
create table if not exists public.album_photos (
  id uuid primary key default gen_random_uuid(),
  album_key text not null,
  url text not null,
  storage_key text,
  alt_nl text not null default '',
  alt_fr text not null default '',
  alt_en text not null default '',
  position int not null default 0,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists album_photos_album_idx on public.album_photos (album_key, position);

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    grant select on public.album_photos to anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select, insert, update, delete on public.album_photos to authenticated;
  end if;
end $$;
