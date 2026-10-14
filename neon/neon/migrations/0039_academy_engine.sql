-- Academy-motor: leeftijdssporen, rondes, variantgroepen, getalvragen.
-- Idempotent: mag meermaals draaien.

alter table public.academy_vragen
  add column if not exists variant_groep text,
  add column if not exists verplicht boolean not null default false,
  add column if not exists moeilijkheid smallint not null default 2,
  add column if not exists correct_getal numeric,
  add column if not exists getal_marge numeric not null default 0,
  add column if not exists getal_eenheid text,
  add column if not exists getal_eenheid_fr text,
  add column if not exists getal_eenheid_en text;

comment on column public.academy_vragen.variant_groep is
  'Vragen met dezelfde groep toetsen hetzelfde: hoogstens één per ronde.';
comment on column public.academy_vragen.verplicht is
  'Essentiële welzijnsvraag: wordt altijd gesteld.';
comment on column public.academy_vragen.moeilijkheid is '1 = makkelijk, 2 = gemiddeld, 3 = moeilijk.';
comment on column public.academy_vragen.correct_getal is 'Juist getal bij vraag_type = getal.';
comment on column public.academy_vragen.getal_marge is 'Toegestane afwijking op correct_getal.';

-- vraag_type mag nu ook "getal" zijn.
do $$
begin
  if exists (
    select 1 from pg_constraint
     where conname = 'academy_vragen_vraag_type_check'
       and conrelid = 'public.academy_vragen'::regclass
  ) then
    alter table public.academy_vragen drop constraint academy_vragen_vraag_type_check;
  end if;
end $$;

alter table public.academy_vragen
  add constraint academy_vragen_vraag_type_check
  check (vraag_type is null or vraag_type in ('tekst', 'beeld', 'audio', 'getal'));

-- Aparte testlengte per spoor.
alter table public.academies
  add column if not exists vragen_per_test_kids smallint,
  add column if not exists vragen_per_test_16plus smallint,
  add column if not exists slaag_grens_kids smallint,
  add column if not exists slaag_grens_16plus smallint;

update public.academies
   set vragen_per_test_kids = coalesce(vragen_per_test_kids, least(vragen_per_test, 8)),
       vragen_per_test_16plus = coalesce(vragen_per_test_16plus, vragen_per_test),
       slaag_grens_kids = coalesce(slaag_grens_kids, greatest(1, ceil(least(vragen_per_test, 8) * 0.7)::int)),
       slaag_grens_16plus = coalesce(slaag_grens_16plus, slaag_grens);

create index if not exists academy_vragen_spoor_idx
  on public.academy_vragen (academy_id, doelgroep, module);
