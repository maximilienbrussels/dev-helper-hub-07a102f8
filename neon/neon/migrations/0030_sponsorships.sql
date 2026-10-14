-- Peter/Meterschap: dierensponsoring via Stripe (eenmalig of terugkerend).
create table if not exists public.sponsorships (
  id uuid primary key default gen_random_uuid(),
  animal_id int,
  animal_name text not null,
  tier text not null,
  amount_cents int not null,
  interval text not null default 'month',
  sponsor_name text not null,
  sponsor_email text not null,
  lang text not null default 'nl',
  stripe_session_id text unique,
  stripe_subscription_id text,
  status text not null default 'pending',
  certificate_id text unique,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists sponsorships_email_idx on public.sponsorships (sponsor_email);
create index if not exists sponsorships_status_idx on public.sponsorships (status);

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    grant select on public.sponsorships to anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select, insert, update on public.sponsorships to authenticated;
  end if;
end $$;
