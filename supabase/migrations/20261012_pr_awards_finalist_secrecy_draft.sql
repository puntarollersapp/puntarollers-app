-- PR Awards: finalists stay secret until public voting opens.
-- Apply after base schema and admin RLS draft; verify in isolated staging.
drop policy if exists "awards public finalists" on public.pr_awards_finalists;
create policy "awards finalists visible during public voting"
on public.pr_awards_finalists for select to anon,authenticated
using (
 exists (
  select 1 from public.pr_awards_categories c
  where c.id=category_id and c.is_active and not c.is_automatic
 )
 and exists (
  select 1 from public.pr_awards_settings s
  where s.singleton=true and s.voting_open=true
 )
);
-- This policy checks a table without public SELECT permission. To avoid exposing
-- the settings row, use a restricted SECURITY DEFINER boolean helper.
create or replace function public.pr_awards_public_finalists_open()
returns boolean language sql stable security definer set search_path=''
as $$
 select exists(select 1 from public.pr_awards_settings
               where singleton=true and voting_open=true)
$$;
revoke all on function public.pr_awards_public_finalists_open() from public;
grant execute on function public.pr_awards_public_finalists_open() to anon,authenticated;
drop policy if exists "awards finalists visible during public voting" on public.pr_awards_finalists;
create policy "awards finalists visible during public voting"
on public.pr_awards_finalists for select to anon,authenticated
using (
 public.pr_awards_public_finalists_open()
 and exists (
  select 1 from public.pr_awards_categories c
  where c.id=category_id and c.is_active and not c.is_automatic
 )
);
-- Existing admin policy remains: administrators can see finalists before voting.
-- No public SELECT is granted for votes or winner rows.
