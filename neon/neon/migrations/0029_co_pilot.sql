-- Admin AI Co-Pilot: uitgevoerde acties (met undo) en beeldoverrides voor
-- e-mailsjablonen. Idempotent: mag meerdere keren lopen.

create table if not exists public.co_pilot_actions (
  id uuid primary key default gen_random_uuid(),
  admin_email text,
  tool text not null,
  target_table text not null,
  target_id text,
  previous_value jsonb,
  new_value jsonb,
  undone_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists co_pilot_actions_created_idx on public.co_pilot_actions (created_at desc);

create table if not exists public.email_template_media (
  template_id text primary key,
  header_image_url text,
  banner_url text,
  updated_at timestamptz not null default now(),
  updated_by text
);

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select, insert, update, delete on public.co_pilot_actions to authenticated;
    grant select, insert, update, delete on public.email_template_media to authenticated;
  end if;
end $$;
