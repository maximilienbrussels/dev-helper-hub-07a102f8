-- 0038: terreinzones en taken. Eén bron van waarheid voor de veld-app en het
-- beheerportaal: taken horen bij een zone, hebben een toegewezen medewerker,
-- een vervaldatum, een prioriteit en een status. Idempotent.

create table if not exists public.farm_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  color text not null default '',
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid references public.farm_zones(id) on delete set null,
  title text not null,
  description text not null default '',
  status text not null default 'open',
  priority text not null default 'normaal',
  assigned_to uuid,
  due_date date,
  completed_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'tasks_status_check') then
    alter table public.tasks
      add constraint tasks_status_check
      check (status in ('open', 'bezig', 'afgerond', 'geannuleerd'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'tasks_priority_check') then
    alter table public.tasks
      add constraint tasks_priority_check
      check (priority in ('laag', 'normaal', 'hoog'));
  end if;
end $$;

create index if not exists tasks_zone_idx on public.tasks (zone_id);
create index if not exists tasks_status_idx on public.tasks (status);
create index if not exists tasks_assignee_idx on public.tasks (assigned_to);
create index if not exists farm_zones_sort_idx on public.farm_zones (sort_order);

-- Rollen bestaan enkel op Supabase-achtige databanken; op Neon overslaan.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select, insert, update, delete on public.farm_zones to authenticated;
    grant select, insert, update, delete on public.tasks to authenticated;
  end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant all on public.farm_zones to service_role;
    grant all on public.tasks to service_role;
  end if;
end $$;

-- Startzones zodat de filters meteen werken.
insert into public.farm_zones (name, description, sort_order)
select z.name, z.description, z.sort_order
from (values
  ('Moestuin', 'Bakken, serre en zaaigoed', 10),
  ('Boomgaard', 'Fruitbomen en hagen', 20),
  ('Dierenweide', 'Schapen, geiten, ezels en pony''s', 30),
  ('Kippenren', 'Kippen, eieren en voeder', 40),
  ('Erf & onthaal', 'Paden, onthaal en chalet', 50),
  ('Compost', 'Compostzone en groenafval', 60)
) as z(name, description, sort_order)
where not exists (select 1 from public.farm_zones f where f.name = z.name);

-- Nieuwe rechten in de matrix voor de volledige-toegangsrollen.
insert into public.role_permissions (role, permission, allowed)
select r.role, p.permission, true
from (values ('owner'::app_role), ('super_admin'::app_role), ('admin'::app_role)) as r(role)
cross join (values ('view_tasks'), ('manage_tasks'), ('manage_zones')) as p(permission)
on conflict (role, permission) do update set allowed = true, updated_at = now();

-- Medewerkers mogen taken zien en afvinken, maar geen zones beheren.
insert into public.role_permissions (role, permission, allowed)
select r.role, p.permission, true
from (values ('staff'::app_role), ('team'::app_role)) as r(role)
cross join (values ('view_tasks'), ('manage_tasks')) as p(permission)
on conflict (role, permission) do nothing;
