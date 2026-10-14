-- 0020_booking_availability.sql
-- Dynamische beschikbaarheid voor de publieke boekingsmodule (/boeking) en
-- het beheer ervan in het portaal (kalender → tab "Beschikbaarheid").
--
--  * booking_slot_rules : standaard openingsuren per weekdag per formule
--  * booking_slots      : concrete, boekbare tijdsloten per datum
--  * blocked_dates      : sluitingsdagen (hele dag geblokkeerd)

create table if not exists public.booking_slot_rules (
  id            uuid primary key default gen_random_uuid(),
  formula_type  text not null,
  weekday       integer not null check (weekday between 0 and 6),
  start_time    time not null,
  end_time      time not null,
  max_capacity  integer not null default 1 check (max_capacity > 0),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  unique (formula_type, weekday, start_time, end_time)
);

create table if not exists public.booking_slots (
  id            uuid primary key default gen_random_uuid(),
  formula_type  text not null,
  date          date not null,
  start_time    time not null,
  end_time      time not null,
  max_capacity  integer not null default 1 check (max_capacity > 0),
  booked_count  integer not null default 0 check (booked_count >= 0),
  is_blocked    boolean not null default false,
  note          text,
  created_at    timestamptz not null default now(),
  unique (formula_type, date, start_time, end_time)
);

create index if not exists booking_slots_formula_date_idx
  on public.booking_slots (formula_type, date);

create table if not exists public.blocked_dates (
  id         uuid primary key default gen_random_uuid(),
  date       date not null unique,
  reason     text not null default 'Sluitingsdag',
  created_at timestamptz not null default now()
);

-- Standaardregels: woensdag- en zaterdagnamiddag voor kinderfeestjes,
-- zaalverhuur/teambuilding op werkdagen, stages starten op maandag.
insert into public.booking_slot_rules (formula_type, weekday, start_time, end_time, max_capacity)
values
  ('zaal_halve_dag', 1, '09:30', '13:30', 1),
  ('zaal_halve_dag', 2, '09:30', '13:30', 1),
  ('zaal_halve_dag', 3, '09:30', '13:30', 1),
  ('zaal_halve_dag', 4, '09:30', '13:30', 1),
  ('zaal_halve_dag', 5, '09:30', '13:30', 1),
  ('zaal_halve_dag', 6, '09:30', '13:30', 1),
  ('zaal_halve_dag', 1, '13:30', '17:30', 1),
  ('zaal_halve_dag', 2, '13:30', '17:30', 1),
  ('zaal_halve_dag', 3, '13:30', '17:30', 1),
  ('zaal_halve_dag', 4, '13:30', '17:30', 1),
  ('zaal_halve_dag', 5, '13:30', '17:30', 1),
  ('zaal_halve_dag', 6, '13:30', '17:30', 1),
  ('zaal_volledige_dag', 1, '09:00', '17:00', 1),
  ('zaal_volledige_dag', 2, '09:00', '17:00', 1),
  ('zaal_volledige_dag', 3, '09:00', '17:00', 1),
  ('zaal_volledige_dag', 4, '09:00', '17:00', 1),
  ('zaal_volledige_dag', 5, '09:00', '17:00', 1),
  ('zaal_volledige_dag', 6, '09:00', '17:00', 1),
  ('kinderfeestje', 3, '13:30', '17:30', 1),
  ('kinderfeestje', 6, '13:30', '17:30', 1),
  ('teambuilding', 2, '09:30', '13:30', 1),
  ('teambuilding', 3, '09:30', '13:30', 1),
  ('teambuilding', 4, '09:30', '13:30', 1),
  ('teambuilding', 2, '13:30', '17:30', 1),
  ('teambuilding', 3, '13:30', '17:30', 1),
  ('teambuilding', 4, '13:30', '17:30', 1),
  ('stage', 1, '09:00', '16:00', 15)
on conflict (formula_type, weekday, start_time, end_time) do nothing;
