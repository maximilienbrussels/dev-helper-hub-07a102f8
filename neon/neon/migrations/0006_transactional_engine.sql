-- Transactionele Email & Document Engine
-- Uniforme betalingen (payments), referenties op orders en een maillogboek
-- (email_logs) waaruit mislukte mails opnieuw verstuurd kunnen worden.

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('donation', 'ticket', 'invoice', 'shop')),
  reference text not null unique,
  stripe_payment_intent_id text unique,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded')),
  amount_cent integer not null default 0,
  vat_rate numeric(5, 2) not null default 21,
  currency text not null default 'eur',
  customer_name text,
  customer_email text not null,
  lang text not null default 'nl' check (lang in ('nl', 'fr', 'en')),
  description text,
  metadata jsonb not null default '{}'::jsonb,
  paid_at timestamptz,
  confirmation_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payments_email_idx on public.payments (lower(customer_email));
create index if not exists payments_status_idx on public.payments (status);

-- Hoevewinkel: dezelfde referentie op de bestelling zelf.
alter table public.orders add column if not exists reference text;
alter table public.orders add column if not exists stripe_payment_intent_id text;
alter table public.orders add column if not exists lang text not null default 'nl';
alter table public.orders add column if not exists customer_name text;
alter table public.orders add column if not exists paid_at timestamptz;
create unique index if not exists orders_reference_key on public.orders (reference)
  where reference is not null;

-- Boekingen krijgen dezelfde koppeling met de betalingsrij.
alter table public.bookings add column if not exists payment_id uuid;

create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  reference text,
  payment_id uuid,
  template text not null,
  lang text not null default 'nl',
  recipient text not null,
  subject text,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  attempts integer not null default 0,
  error_message text,
  provider_status integer,
  provider_message_id text,
  payload jsonb not null default '{}'::jsonb,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists email_logs_status_idx on public.email_logs (status, created_at desc);
create index if not exists email_logs_reference_idx on public.email_logs (reference);
