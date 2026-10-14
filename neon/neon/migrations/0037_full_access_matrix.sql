-- 0037: eigenaars, super-admins en admins krijgen álle rechten in de matrix.
-- De servercontrole laat deze rollen sowieso door; de matrix wordt hiermee
-- weer gelijk aan die werkelijkheid (o.a. ontbrekende manage_settings,
-- manage_content en view_audit voor owner/admin).
insert into public.role_permissions (role, permission, allowed)
select r.role, p.permission, true
from (values ('owner'::app_role), ('super_admin'::app_role), ('admin'::app_role)) as r(role)
cross join (values
  ('view_today'), ('view_requests'), ('manage_requests'), ('view_calendar'), ('manage_calendar'),
  ('view_services'), ('manage_services'), ('view_shop'), ('manage_products'), ('manage_orders'),
  ('view_academy'), ('manage_academy'), ('publish_academy'), ('view_team'), ('manage_team'),
  ('manage_rights'), ('view_media'), ('manage_media'), ('view_audit'), ('manage_settings'),
  ('manage_content')
) as p(permission)
on conflict (role, permission) do update set allowed = true, updated_at = now();
