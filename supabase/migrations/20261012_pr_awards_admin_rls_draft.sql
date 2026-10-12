-- PR Awards administrator-only read/write access.
-- Review the existing application's role model before applying this draft.
-- Never grant this role via client-side fields or unauthenticated user metadata.
create or replace function public.pr_awards_is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
 select exists(
   select 1 from public.profiles p
   where p.auth_user_id = (select auth.uid())
   and p.role = 'admin'
 )
$$;
revoke all on function public.pr_awards_is_admin() from public;
grant execute on function public.pr_awards_is_admin() to authenticated;
-- RLS permits authenticated administrators to manage the award system.
-- Anonymous users retain only the separately defined public reads and RPCs.
create policy "awards admins categories" on public.pr_awards_categories
 for all to authenticated using (public.pr_awards_is_admin()) with check (public.pr_awards_is_admin());
create policy "awards admins candidates" on public.pr_awards_candidates
 for all to authenticated using (public.pr_awards_is_admin()) with check (public.pr_awards_is_admin());
create policy "awards admins suggestions" on public.pr_awards_suggestions
 for all to authenticated using (public.pr_awards_is_admin()) with check (public.pr_awards_is_admin());
create policy "awards admins nominations" on public.pr_awards_nominations
 for all to authenticated using (public.pr_awards_is_admin()) with check (public.pr_awards_is_admin());
create policy "awards admins finalists" on public.pr_awards_finalists
 for all to authenticated using (public.pr_awards_is_admin()) with check (public.pr_awards_is_admin());
create policy "awards admins votes" on public.pr_awards_votes
 for select to authenticated using (public.pr_awards_is_admin());
create policy "awards admins settings" on public.pr_awards_settings
 for all to authenticated using (public.pr_awards_is_admin()) with check (public.pr_awards_is_admin());
create policy "awards admins winners" on public.pr_awards_winners
 for all to authenticated using (public.pr_awards_is_admin()) with check (public.pr_awards_is_admin());
grant select,insert,update,delete on public.pr_awards_categories,public.pr_awards_candidates,
 public.pr_awards_suggestions,public.pr_awards_nominations,public.pr_awards_finalists,
 public.pr_awards_settings,public.pr_awards_winners to authenticated;
grant select on public.pr_awards_votes to authenticated;
-- Source-of-truth role values MUST be checked against existing production schema.
