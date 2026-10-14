-- Bootstrap van de super-admin desk@delplanche.cloud
-- Idempotent: mag zo vaak uitgevoerd worden als nodig.

-- 1. Portaaltoegang (bron van waarheid voor /portaal-routes)
insert into portal_admins (email, role, active)
values ('desk@delplanche.cloud', 'admin', true)
on conflict (email) do update set role = 'admin', active = true;

-- 2. Rol `super_admin` toekennen zodra het profiel bestaat
insert into user_roles (user_id, role)
select p.id, 'super_admin'
from profiles p
where lower(p.email) = 'desk@delplanche.cloud'
on conflict do nothing;

-- 3. Alle rechten aan voor `super_admin`
insert into role_permissions (role, permission, allowed, updated_at)
select 'super_admin', perm, true, now()
from unnest(array[
  'view_today','view_requests','manage_requests','view_calendar','manage_calendar',
  'view_services','manage_services','view_shop','manage_products','manage_orders',
  'view_academy','manage_academy','publish_academy','view_team','manage_team','manage_rights'
]) as perm
on conflict (role, permission) do update set allowed = true, updated_at = now();

-- 4. Nieuwe aanmelding van dit adres krijgt automatisch de super-admin-rol
create or replace function public.grant_superadmin_on_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if lower(coalesce(new.email, '')) = 'desk@delplanche.cloud' then
    insert into user_roles (user_id, role) values (new.id, 'super_admin')
    on conflict do nothing;
    insert into portal_admins (email, role, active)
    values (lower(new.email), 'admin', true)
    on conflict (email) do update set role = 'admin', active = true;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_grant_superadmin on public.profiles;
create trigger profiles_grant_superadmin
after insert on public.profiles
for each row execute function public.grant_superadmin_on_signup();
