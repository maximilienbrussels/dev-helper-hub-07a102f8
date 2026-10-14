-- Eén bron voor alle tarieven (publieke pagina's én betalingen) plus de
-- centrale contactgegevens van de boerderij.

create table if not exists public.pricing_items (
  key text primary key,
  amount numeric not null default 0,
  label_nl text not null default '',
  label_fr text not null default '',
  label_en text not null default '',
  updated_at timestamptz not null default now(),
  updated_by text
);

-- Rechten enkel toekennen wanneer die rollen bestaan (Neon heeft ze niet).
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    grant select on public.pricing_items to anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select, insert, update, delete on public.pricing_items to authenticated;
  end if;
end $$;

-- Contactgegevens leven als één rij in site_settings.
insert into public.site_settings (key, value)
values (
  'contact',
  '{"address":"Schipperijkaai 2","postal_code":"1000","city":"Brussel","phone":"+32 2 201 56 09","email":"contact@maximilien.brussels","facebook_url":"","instagram_url":"","linkedin_url":""}'::jsonb
)
on conflict (key) do nothing;
