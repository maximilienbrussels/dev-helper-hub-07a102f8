-- Bestaande links met "volledige agenda" uitschakelen; beheerders zetten het opnieuw aan.
update public.calendar_feed_tokens set include_all = false where include_all;
