-- Telefoonverificatie buitenland via Telegram.
alter table public.app_mfa_codes drop constraint if exists app_mfa_codes_kind_check;
alter table public.app_mfa_codes add constraint app_mfa_codes_kind_check check (kind in ('sms', 'intl', 'telegram'));
alter table public.app_mfa_codes add column if not exists tg_chat_id bigint;
create index if not exists app_mfa_codes_tg_idx on public.app_mfa_codes (tg_chat_id) where kind = 'telegram';
