-- Apply in isolated PR Awards staging only, after the base schema.
-- Public sees only open/closed flags, never private admin configuration.
create or replace function public.pr_awards_public_status()
returns table(nomination_open boolean, voting_open boolean)
language sql stable security definer set search_path=''
as $$
 select
  (s.nomination_open   and now() < timestamptz '2026-12-01 00:00:00-03'
    and (s.nominations_close_at is null or now() < s.nominations_close_at)),
  (s.voting_open and now() >= timestamptz '2026-12-01 00:00:00-03'
    and now() < timestamptz '2026-12-21 00:00:00-03'
    and (s.voting_close_at is null or now() < s.voting_close_at))
 from public.pr_awards_settings s where s.singleton=true
$$;
revoke all on function public.pr_awards_public_status() from public;
grant execute on function public.pr_awards_public_status() to anon,authenticated;
