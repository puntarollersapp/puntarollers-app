
create or replace function public.pr_moment_can_read(p_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select public.community_is_active_member(public.pr_current_profile_id()) and (
 exists(select 1 from public.pr_moments m where m.id=p_id and m.profile_id=public.pr_current_profile_id() and m.deleted_at is null)
 or pr_social_internal.moment_visible(p_id,public.pr_current_profile_id()))
$$;
create or replace function public.pr_moment_media_can_read(p_name text) returns boolean language sql stable security definer set search_path='' as $$
 select public.community_is_active_member(public.pr_current_profile_id()) and exists(select 1 from public.pr_moments m where m.media_url=p_name and pr_social_internal.moment_visible(m.id,public.pr_current_profile_id()))
$$;
revoke all on function public.pr_moment_can_read(uuid),public.pr_moment_media_can_read(text) from public,anon;
grant execute on function public.pr_moment_can_read(uuid),public.pr_moment_media_can_read(text) to authenticated;
drop policy "Ver moments permitidos" on public.pr_moments;
create policy "Ver moments permitidos" on public.pr_moments for select to authenticated using(public.pr_moment_can_read(id));
drop policy pr_moments_media_select on storage.objects;
create policy pr_moments_media_select on storage.objects for select to authenticated using(bucket_id='pr-moments' and public.community_is_active_member(public.pr_current_profile_id()) and ((owner_id=auth.uid()::text and split_part(name,'/',1)=public.pr_current_profile_id()) or public.pr_moment_media_can_read(name)));
alter policy "Crear moment propio" on public.pr_moments with check(profile_id=public.pr_current_profile_id() and public.community_is_active_member(public.pr_current_profile_id()));
alter policy "Modificar reaccion moment propia" on public.pr_moment_reactions using(profile_id=public.pr_current_profile_id() and public.pr_moment_can_read(moment_id)) with check(profile_id=public.pr_current_profile_id() and public.pr_moment_can_read(moment_id));
create index if not exists pr_moments_media_lookup_idx on public.pr_moments(media_url) where media_url is not null;
