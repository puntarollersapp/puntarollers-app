
create or replace function public.pr_post_media_can_read(p_name text) returns boolean language sql stable security definer set search_path='' as $$
 select public.community_is_active_member(public.pr_current_profile_id()) and exists(
 select 1 from public.community_post_media m join public.community_posts p on p.id=m.post_id join public.profiles a on a.id=p.author_id
 where m.media_path='https://ycgxnzeaihuwlwfwalom.supabase.co/storage/v1/object/public/community-media/'||p_name and p.deleted_at is null and a.estado='Activo' and a.acceso_habilitado is true and (p.author_id=public.pr_current_profile_id() or p.visibility='members' or public.community_are_friends(public.pr_current_profile_id(),p.author_id)) and not exists(select 1 from public.community_blocks b where (b.blocker_profile_id=public.pr_current_profile_id() and b.blocked_profile_id=p.author_id) or (b.blocker_profile_id=p.author_id and b.blocked_profile_id=public.pr_current_profile_id())))
$$;
revoke all on function public.pr_post_media_can_read(text) from public,anon;
grant execute on function public.pr_post_media_can_read(text) to authenticated;
create policy community_media_authorized_read on storage.objects for select to authenticated using(bucket_id='community-media' and public.pr_post_media_can_read(name));
create index if not exists community_post_media_path_idx on public.community_post_media(media_path);
