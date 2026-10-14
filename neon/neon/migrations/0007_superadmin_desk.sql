-- Vaste super-admin desk@delplanche.cloud (idempotent).
-- Het Neon Auth-account (met wachtwoord) wordt via de auth-API aangemaakt;
-- deze migratie legt de rechten in het publieke schema vast.

-- Uniek e-mailadres in profiles zodat self-healing upserts werken.
create unique index if not exists profiles_email_unique on public.profiles (email);

-- Portaaltoegang
insert into public.portal_admins (email, role, active)
values
  ('desk@delplanche.cloud', 'admin', true),
  ('hallo@maximilien.site', 'admin', true),
  ('contact@maximilien.brussels', 'admin', true)
on conflict (email) do update set role = 'admin', active = true;

-- Rollen voor bestaande profielen van de whitelist
insert into public.user_roles (user_id, role)
select p.id, 'super_admin'::app_role
from public.profiles p
where lower(p.email) in (
  'desk@delplanche.cloud', 'hallo@maximilien.site', 'contact@maximilien.brussels'
)
on conflict do nothing;

insert into public.user_roles (user_id, role)
select p.id, 'admin'::app_role
from public.profiles p
where lower(p.email) in (
  'desk@delplanche.cloud', 'hallo@maximilien.site', 'contact@maximilien.brussels'
)
on conflict do nothing;

-- Alle rechten voor admin + super_admin
insert into public.role_permissions (role, permission, allowed, updated_at)
select r::app_role, perm, true, now()
from unnest(array['super_admin','admin']) r,
     unnest(array[
       'view_today','view_requests','manage_requests','view_calendar','manage_calendar',
       'view_services','manage_services','view_shop','manage_products','manage_orders',
       'view_academy','manage_academy','publish_academy','view_team','manage_team','manage_rights'
     ]) perm
on conflict (role, permission) do update set allowed = true, updated_at = now();
