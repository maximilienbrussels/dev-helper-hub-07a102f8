-- Stripe-betaalvelden op de bestaande boekingstabel.
alter table public.bookings
  add column if not exists lang text not null default 'nl',
  add column if not exists amount_cent integer not null default 0,
  add column if not exists payment_status text not null default 'PENDING',
  add column if not exists stripe_payment_intent_id text,
  add column if not exists paid_at timestamptz,
  add column if not exists confirmation_sent_at timestamptz,
  add column if not exists notes text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'bookings_lang_check') then
    alter table public.bookings
      add constraint bookings_lang_check check (lang in ('nl', 'fr', 'en'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'bookings_payment_status_check') then
    alter table public.bookings
      add constraint bookings_payment_status_check
      check (payment_status in ('PENDING', 'PAID', 'FAILED', 'CANCELLED'));
  end if;
end $$;

create unique index if not exists bookings_pi_idx
  on public.bookings (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

create index if not exists bookings_client_email_idx on public.bookings (client_email);
