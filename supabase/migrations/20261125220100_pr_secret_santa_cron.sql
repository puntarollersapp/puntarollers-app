-- Schedule the one-time draw on December 8 at 00:00 Uruguay (03:00 UTC).
-- Environments without pg_cron use the authenticated request fallback.
do $$
begin
 if exists(select 1 from pg_extension where extname='pg_cron') then
  if current_setting('cron.timezone',true) not in ('GMT','UTC','Etc/UTC') then
   raise exception 'Review cron timezone before scheduling PR Secret Santa';
  end if;
  perform cron.schedule('pr-secret-santa-2026-draw','0 3 8 12 *',
    $job$select pr_santa_private.draw_due(); select cron.unschedule('pr-secret-santa-2026-draw');$job$);
 end if;
end $$;
