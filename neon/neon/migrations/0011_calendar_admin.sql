-- Volwaardig beheer van de kalender: teamtoewijzingen, openingsuren/sluitingen
-- en eigen evenementen. Idempotent: mag meerdere keren lopen.

-- 1) Teamtoewijzingen per reservatie.
create table if not exists public.booking_assignments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  task text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists booking_assignments_booking_idx
  on public.booking_assignments (booking_id);
create index if not exists booking_assignments_profile_idx
  on public.booking_assignments (profile_id);
create unique index if not exists booking_assignments_unique_idx
  on public.booking_assignments (booking_id, profile_id, task);

grant select, insert, update, delete on public.booking_assignments to authenticated;

-- 2) Wekelijkse openingsuren per seizoen (zomer/winter). De statische waarden
-- uit src/lib/opening-hours.ts dienen als seed; de databank wordt de bron van
-- waarheid, met die statische waarden als fallback wanneer de tabel leeg is.
create table if not exists public.opening_hours (
  id serial primary key,
  weekday integer not null check (weekday between 0 and 6), -- 0 = zondag ... 6 = zaterdag
  season text not null check (season in ('zomer', 'winter')),
  is_open boolean not null default false,
  open_time time,
  close_time time,
  updated_at timestamptz not null default now(),
  unique (weekday, season)
);

grant select, insert, update, delete on public.opening_hours to authenticated;

insert into public.opening_hours (weekday, season, is_open, open_time, close_time)
select w, 'zomer', (w between 2 and 6), '09:30', '17:00'
from generate_series(0, 6) as w
on conflict (weekday, season) do nothing;

insert into public.opening_hours (weekday, season, is_open, open_time, close_time)
select w, 'winter', (w between 2 and 5), '10:00', '16:30'
from generate_series(0, 6) as w
on conflict (weekday, season) do nothing;

-- 3) Uitzonderingen: gesloten dagen/periodes of afwijkende uren, met een
-- drietalige reden.
create table if not exists public.opening_exceptions (
  id uuid primary key default gen_random_uuid(),
  date_from date not null,
  date_to date not null,
  closed boolean not null default true,
  open_time time,
  close_time time,
  reason_nl text not null default '',
  reason_fr text not null default '',
  reason_en text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists opening_exceptions_range_idx
  on public.opening_exceptions (date_from, date_to);

grant select, insert, update, delete on public.opening_exceptions to authenticated;

-- 4) Eigen evenementen in de kalender.
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title_nl text not null,
  title_fr text not null,
  title_en text not null,
  event_date date not null,
  start_time time not null,
  end_time time not null,
  location_id text not null,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'events_location_check') then
    alter table public.events
      add constraint events_location_check
      check (location_id in ('chalet', 'zaal', 'prairie', 'boerderij'));
  end if;
end $$;

create index if not exists events_date_idx on public.events (event_date);

grant select, insert, update, delete on public.events to authenticated;
