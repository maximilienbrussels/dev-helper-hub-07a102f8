-- Login met ROUT (OpenID Connect). Idempotent.
alter table public.app_users add column if not exists rout_id text;
alter table public.app_users add column if not exists email_verified boolean not null default false;
alter table public.app_users add column if not exists is_verified_person boolean not null default false;
alter table public.app_users add column if not exists is_verified_business boolean not null default false;
alter table public.app_users add column if not exists is_influencer boolean not null default false;
create unique index if not exists app_users_rout_id_key on public.app_users (rout_id) where rout_id is not null;
-- Koppelingen staan in public.app_user_identities (provider = 'rout').
