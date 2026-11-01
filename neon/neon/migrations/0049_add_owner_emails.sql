-- Extra vaste eigenaars voor het beheerportaal.
insert into public.portal_admins (email, role, active)
values
  ('desk@delplanche.com', 'admin', true),
  ('jona@delplanche.com', 'admin', true)
on conflict (email) do update set role = 'admin', active = true;
