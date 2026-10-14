-- Academy-analyse: pogingen, uitvalmomenten en vraagstatistieken.
-- Bevat geen persoonsgegevens: enkel geaggregeerde voortgang per poging.
-- Idempotent: mag meermaals draaien.

create table if not exists public.academy_pogingen (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies(id) on delete cascade,
  doelgroep text not null check (doelgroep in ('kids', '16plus')),
  taal text not null check (taal in ('nl', 'fr', 'en')),
  gestart_op timestamptz not null default now(),
  laatste_activiteit timestamptz not null default now(),
  afgerond_op timestamptz,
  vragen_totaal smallint not null default 0,
  beantwoord smallint not null default 0,
  juist smallint not null default 0,
  laatste_module smallint not null default 1,
  status text not null default 'bezig' check (status in ('bezig', 'geslaagd', 'gezakt'))
);

comment on table public.academy_pogingen is
  'Anonieme examenpogingen voor statistieken (slaagkans, uitval, gemiddelde score).';

create index if not exists academy_pogingen_academy_idx
  on public.academy_pogingen (academy_id, gestart_op desc);
create index if not exists academy_pogingen_filter_idx
  on public.academy_pogingen (doelgroep, taal, gestart_op desc);

create table if not exists public.academy_vraag_stats (
  vraag_id uuid not null references public.academy_vragen(id) on delete cascade,
  taal text not null check (taal in ('nl', 'fr', 'en')),
  doelgroep text not null check (doelgroep in ('kids', '16plus')),
  gesteld integer not null default 0,
  juist integer not null default 0,
  primary key (vraag_id, taal, doelgroep)
);

comment on table public.academy_vraag_stats is
  'Geaggregeerde antwoordkwaliteit per vraag, taal en leeftijdsspoor.';
