-- Owner-rol + beheerbare (eigen) rollen met meertalige labels.
-- Idempotent: mag meerdere keren lopen.

-- 1) 'owner' toevoegen aan het rol-type.
do $$
begin
  if not exists (
    select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid
    where t.typname = 'app_role' and e.enumlabel = 'owner'
  ) then
    execute 'alter type public.app_role add value ''owner''';
  end if;
end
$$;

-- 2) Metadata per rol (labels in NL/FR/EN + of de rol ingebouwd is).
create table if not exists public.role_meta (
  role text primary key,
  label_nl text not null,
  label_fr text not null,
  label_en text not null,
  builtin boolean not null default false,
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);

grant select on public.role_meta to authenticated;

insert into public.role_meta (role, label_nl, label_fr, label_en, builtin, sort_order) values
  ('owner', 'Eigenaar', 'Propriétaire', 'Owner', true, 0),
  ('super_admin', 'Super Admin', 'Super Admin', 'Super Admin', true, 10),
  ('admin', 'Beheerder', 'Administrateur', 'Administrator', true, 20),
  ('staff', 'Medewerker', 'Collaborateur', 'Staff', true, 30),
  ('team', 'Team', 'Équipe', 'Team', true, 40)
on conflict (role) do update
  set label_nl = excluded.label_nl,
      label_fr = excluded.label_fr,
      label_en = excluded.label_en,
      builtin = true,
      sort_order = excluded.sort_order;

-- 3) Owner heeft altijd élk recht.
insert into public.role_permissions (role, permission, allowed, updated_at)
select 'owner'::app_role, perm, true, now()
from unnest(array[
  'view_today','view_requests','manage_requests','view_calendar','manage_calendar',
  'view_services','manage_services','view_shop','manage_products','manage_orders',
  'view_academy','manage_academy','publish_academy','view_team','manage_team',
  'manage_rights','view_media','manage_media'
]) perm
on conflict (role, permission) do update set allowed = true, updated_at = now();

-- 4) Vaste eigenaars.
insert into public.portal_admins (email, role, active)
values ('desk@delplanche.cloud', 'admin', true)
on conflict (email) do update set role = 'admin', active = true;

insert into public.user_roles (user_id, role)
select p.id, r::app_role
from public.profiles p, unnest(array['owner','super_admin','admin']) r
where lower(p.email) in ('desk@delplanche.cloud', 'hallo@maximilien.site', 'contact@maximilien.brussels')
on conflict do nothing;

-- 5) Owner en super_admin gelden ook als actieve beheerder.
create or replace function public.is_active_admin(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles ur
    join public.profiles p on p.id = ur.user_id
    where ur.user_id = _user_id and p.active
      and ur.role in ('admin'::public.app_role, 'super_admin'::public.app_role, 'owner'::public.app_role)
  )
$$;
