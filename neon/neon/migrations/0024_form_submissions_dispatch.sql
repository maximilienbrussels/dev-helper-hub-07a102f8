-- Dubbele verzendlijn (Brevo → Infomaniak SMTP): extra kolom + indexen.
-- Kolomtoewijzing t.o.v. de functionele namen:
--   form        → form_type   (contact, verhuur, webshop, academie)
--   name/email  → sender_name / sender_email
--   payload     → payload_json
--   error       → error_log
--   status      → pending | sent_brevo | sent_smtp_fallback | failed

alter table if exists public.form_submissions
  add column if not exists transport text;

alter table if exists public.form_submissions
  add column if not exists error_log text;

alter table if exists public.form_submissions
  alter column status set default 'pending';

create index if not exists form_submissions_status_idx on public.form_submissions (status);
create index if not exists form_submissions_form_idx on public.form_submissions (form);
create index if not exists form_submissions_email_idx on public.form_submissions (lower(coalesce(email, '')));
