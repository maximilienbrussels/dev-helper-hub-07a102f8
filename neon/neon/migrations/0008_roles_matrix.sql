-- Rollen & rechtenmatrix definitief inrichten (idempotent).
-- 1) Alle rollen bestaan in de enum `app_role`
-- 2) Volledige matrix voor elke rol/recht-combinatie (defaults, bestaande
--    keuzes worden NIET overschreven behalve voor super_admin)
-- 3) desk@delplanche.cloud = super_admin met alle rechten

do $$
declare
  r text;
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('super_admin', 'admin', 'staff', 'team');
  end if;
  foreach r in array array['super_admin', 'admin', 'staff', 'team'] loop
    if not exists (
      select 1 from pg_enum e
      join pg_type t on t.oid = e.enumtypid
      where t.typname = 'app_role' and e.enumlabel = r
    ) then
      execute format('alter type public.app_role add value %L', r);
    end if;
  end loop;
end
$$;

-- Volledige matrix aanmaken met verstandige defaults (alleen ontbrekende rijen).
insert into public.role_permissions (role, permission, allowed, updated_at)
select
  r::app_role,
  perm,
  case
    when r in ('super_admin', 'admin') then true
    when r = 'staff' then perm in (
      'view_today','view_requests','manage_requests','view_calendar','manage_calendar',
      'view_services','view_shop','manage_orders','view_academy','view_team','view_media'
    )
    else perm in (
      'view_today','view_requests','view_calendar','view_services','view_shop',
      'view_academy','view_team','view_media'
    )
  end,
  now()
from unnest(array['super_admin','admin','staff','team']) r,
     unnest(array[
       'view_today','view_requests','manage_requests','view_calendar','manage_calendar',
       'view_services','manage_services','view_shop','manage_products','manage_orders',
       'view_academy','manage_academy','publish_academy','view_team','manage_team',
       'manage_rights','view_media','manage_media'
     ]) perm
on conflict (role, permission) do nothing;

-- Super admin heeft altijd álle rechten (wel afdwingen).
update public.role_permissions
set allowed = true, updated_at = now()
where role = 'super_admin'::app_role and allowed is distinct from true;

-- Vaste super-admin: portaaltoegang + rollen.
insert into public.portal_admins (email, role, active)
values ('desk@delplanche.cloud', 'admin', true)
on conflict (email) do update set role = 'admin', active = true;

insert into public.user_roles (user_id, role)
select p.id, r::app_role
from public.profiles p, unnest(array['super_admin','admin']) r
where lower(p.email) = 'desk@delplanche.cloud'
on conflict do nothing;
