-- Persoonlijke iCal-feedtokens per medewerker, zodat de boerderijagenda in
-- Google Calendar, Infomaniak, Outlook of Apple Calendar kan worden ingelezen.
-- Idempotent: mag meerdere keren lopen.

create table if not exists public.calendar_feed_tokens (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  token text not null unique,
  include_assigned boolean not null default true,
  include_schools boolean not null default true,
  include_all boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists calendar_feed_tokens_token_idx
  on public.calendar_feed_tokens (token);

grant select, insert, update, delete on public.calendar_feed_tokens to authenticated;
