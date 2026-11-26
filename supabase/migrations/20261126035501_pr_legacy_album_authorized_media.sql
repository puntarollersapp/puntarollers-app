
create or replace function public.community_can_view_album(p_album_id uuid,p_profile_id text default public.pr_current_profile_id()) returns boolean language sql stable security definer set search_path='' as $$
select exists(select 1 from public.community_albums a join public.profiles owner on owner.id=a.owner_id join public.profiles viewer on viewer.id=p_profile_id where a.id=p_album_id and viewer.estado='Activo' and viewer.acceso_habilitado and owner.estado='Activo' and owner.acceso_habilitado and (a.owner_id=p_profile_id or a.is_public or public.community_are_friends(p_profile_id,a.owner_id) or exists(select 1 from public.community_album_members m where m.album_id=a.id and m.profile_id=p_profile_id and m.status='accepted')) and not exists(select 1 from public.community_blocks b where (b.blocker_profile_id=p_profile_id and b.blocked_profile_id=a.owner_id) or (b.blocker_profile_id=a.owner_id and b.blocked_profile_id=p_profile_id)))
$$;
CREATE OR REPLACE FUNCTION public.community_my_albums()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare pid text:=public.pr_current_profile_id(); result jsonb;
begin
select coalesce(jsonb_agg(x.item order by x.created_at desc),'[]'::jsonb) into result from (
select a.created_at,jsonb_build_object('id',a.id,'created_at',a.created_at,'owner_id',a.owner_id,'title',a.title,'description',a.description,'status',case when a.owner_id=pid then 'owner' else coalesce((select m.status from community_album_members m where m.album_id=a.id and m.profile_id=pid),'friend') end,'is_collaborative',exists(select 1 from community_album_members mx where mx.album_id=a.id),'owner_name',p.nombre,'owner_photo',p.foto,
'members',(select coalesce(jsonb_agg(jsonb_build_object('profile_id',m.profile_id,'status',m.status,'name',mp.nombre,'photo',mp.foto)),'[]'::jsonb) from community_album_members m join profiles mp on mp.id=m.profile_id where m.album_id=a.id),
'photos',(select coalesce(jsonb_agg(jsonb_build_object('id',am.id,'url',am.media_path,'caption',am.caption,'uploader_id',am.uploader_id,'uploader_name',up.nombre,'uploader_photo',up.foto,'reactions',(select coalesce(jsonb_agg(jsonb_build_object('profile_id',rr.profile_id,'reaction',rr.reaction,'name',rp.nombre,'photo',rp.foto)),'[]'::jsonb) from community_album_photo_reactions rr join profiles rp on rp.id=rr.profile_id where rr.photo_id=am.id),'comments',(select coalesce(jsonb_agg(jsonb_build_object('id',cc.id,'profile_id',cc.profile_id,'body',cc.body,'name',cp.nombre,'photo',cp.foto,'created_at',cc.created_at) order by cc.created_at),'[]'::jsonb) from community_album_photo_comments cc join profiles cp on cp.id=cc.profile_id where cc.photo_id=am.id)) order by am.created_at),'[]'::jsonb) from community_album_media am join profiles up on up.id=am.uploader_id where am.album_id=a.id),
'reactions',(select coalesce(jsonb_agg(jsonb_build_object('profile_id',r.profile_id,'reaction',r.reaction,'name',rp.nombre,'photo',rp.foto)),'[]'::jsonb) from community_album_reactions r join profiles rp on rp.id=r.profile_id where r.album_id=a.id),
'comments',(select coalesce(jsonb_agg(jsonb_build_object('id',c.id,'profile_id',c.profile_id,'body',c.body,'name',cp.nombre,'photo',cp.foto,'created_at',c.created_at,'parent_comment_id',c.parent_comment_id) order by c.created_at),'[]'::jsonb) from community_album_comments c join profiles cp on cp.id=c.profile_id where c.album_id=a.id)) item
from community_albums a join profiles p on p.id=a.owner_id
where public.community_can_view_album(a.id,pid)
) x;
return result;
end $function$
;
create or replace function public.pr_album_storage_read(p_name text) returns boolean language sql stable security definer set search_path='' as $$
 select public.community_is_active_member(public.pr_current_profile_id()) and exists(select 1 from public.community_album_media m where m.media_path='https://ycgxnzeaihuwlwfwalom.supabase.co/storage/v1/object/public/community-albums/'||p_name and public.community_can_view_album(m.album_id,public.pr_current_profile_id()))
$$;
revoke all on function public.pr_album_storage_read(text) from public,anon;
grant execute on function public.pr_album_storage_read(text) to authenticated;
create policy community_album_storage_authorized_read on storage.objects for select to authenticated using(bucket_id='community-albums' and public.pr_album_storage_read(name));
create or replace function public.community_add_album_photo(p_album_id uuid,p_media_path text,p_caption text default null) returns uuid language plpgsql security definer set search_path='' as $$
declare pid text:=public.pr_current_profile_id(); photoid uuid; path text;
begin
 if not public.community_is_active_member(pid) or not public.community_can_view_album(p_album_id,pid) or not exists(select 1 from public.community_albums a where a.id=p_album_id and (a.owner_id=pid or exists(select 1 from public.community_album_members m where m.album_id=a.id and m.profile_id=pid and m.status='accepted'))) then raise exception 'No tenés acceso colaborativo a este álbum' using errcode='42501';end if;
 path:=split_part(p_media_path,'/storage/v1/object/public/community-albums/',2);
 if path='' or not exists(select 1 from storage.objects o where o.bucket_id='community-albums' and o.name=path and o.owner_id=auth.uid()::text and o.metadata->>'mimetype' in ('image/jpeg','image/png','image/webp')) then raise exception 'Foto no autorizada o formato inválido' using errcode='42501';end if;
 insert into public.community_album_media(album_id,uploader_id,media_path,caption) values(p_album_id,pid,'https://ycgxnzeaihuwlwfwalom.supabase.co/storage/v1/object/public/community-albums/'||path,nullif(trim(p_caption),'')) returning id into photoid;return photoid;
end $$;
revoke all on function public.community_my_albums(),public.community_add_album_photo(uuid,text,text) from public,anon;
grant execute on function public.community_my_albums(),public.community_add_album_photo(uuid,text,text) to authenticated;
