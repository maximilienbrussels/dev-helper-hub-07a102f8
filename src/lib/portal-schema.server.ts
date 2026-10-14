/**
 * Zelfherstellend schema voor portaaltoegang (server-only).
 *
 * Een lege databank had nooit `profiles`, `portal_admins`, `user_roles` of
 * `role_permissions`: alle rechtencontroles faalden stil en elke beheerder
 * werd teruggestuurd naar /auth. Deze functie maakt ze idempotent aan.
 */
import { db, hasDatabase } from "./neon.server";

let ready: Promise<boolean> | null = null;

export function ensurePortalSchema(): Promise<boolean> {
  if (!hasDatabase()) return Promise.resolve(false);
  if (!ready) {
    ready = (async () => {
      const sql = db();
      try {
        await sql`
          do $$
          begin
            if not exists (select 1 from pg_type where typname = 'app_role') then
              create type public.app_role as enum ('super_admin', 'admin', 'staff', 'team', 'owner');
            end if;
          end $$`;
        await sql`
          create table if not exists public.profiles (
            id uuid primary key,
            email text unique,
            full_name text,
            active boolean not null default true,
            created_at timestamptz not null default now(),
            updated_at timestamptz not null default now()
          )`;
        await sql`
          create table if not exists public.portal_admins (
            email text primary key,
            role text not null default 'team',
            active boolean not null default true,
            created_at timestamptz not null default now()
          )`;
        await sql`
          create table if not exists public.user_roles (
            id uuid primary key default gen_random_uuid(),
            user_id uuid not null references public.profiles (id) on delete cascade,
            role public.app_role not null,
            unique (user_id, role)
          )`;
        await sql`
          create table if not exists public.role_permissions (
            role public.app_role not null,
            permission text not null,
            allowed boolean not null default true,
            updated_at timestamptz not null default now(),
            primary key (role, permission)
          )`;
        return true;
      } catch (error) {
        console.error("[portal-schema] aanmaken mislukt:", error);
        ready = null;
        return false;
      }
    })();
  }
  return ready;
}
