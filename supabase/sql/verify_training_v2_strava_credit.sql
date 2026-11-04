-- Read-only deployment verification. No student data is changed.
select
  exists(select 1 from pg_trigger where tgname='pr_training_v2_strava_credit_trigger' and not tgisinternal) as trigger_installed,
  exists(select 1 from pg_proc where proname='pr_training_v2_strava_credit' and pronamespace='public'::regnamespace) as function_installed,
  (select count(*) from public.pr_training_v2_submissions where status='approved' and evidence->>'source'='strava') as auto_approved_count,
  (select count(*) from (
    select assignment_duty_id,profile_id from public.pr_training_v2_submissions
    group by assignment_duty_id,profile_id having count(*)>1
  ) duplicates) as duplicated_submission_pairs;
