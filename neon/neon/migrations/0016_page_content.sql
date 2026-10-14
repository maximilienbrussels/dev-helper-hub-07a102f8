-- Beheerbare inhoud voor de "Boeken & huren"-pagina's (schoolanimaties,
-- vakantiestages, zalen huren, teambuilding, seminaries): hero-afbeelding +
-- tekst per pagina, en een lijst van bewerkbare blokken (afbeelding, titel,
-- tekst en prijs per taal). De statische bestanden in src/lib blijven het
-- vangnet zolang er geen rijen in de databank staan.

create table if not exists public.page_content_pages (
  page_key text primary key,
  hero_image_url text,
  hero_title_nl text not null default '',
  hero_title_fr text not null default '',
  hero_title_en text not null default '',
  hero_text_nl text not null default '',
  hero_text_fr text not null default '',
  hero_text_en text not null default '',
  updated_at timestamptz not null default now(),
  updated_by text
);

create table if not exists public.page_content_blocks (
  id uuid primary key default gen_random_uuid(),
  page_key text not null,
  sort_order integer not null default 0,
  active boolean not null default true,
  image_url text,
  title_nl text not null default '',
  title_fr text not null default '',
  title_en text not null default '',
  text_nl text not null default '',
  text_fr text not null default '',
  text_en text not null default '',
  price numeric,
  price_label_nl text not null default '',
  price_label_fr text not null default '',
  price_label_en text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by text
);

create index if not exists page_content_blocks_page_idx
  on public.page_content_blocks (page_key, sort_order);
