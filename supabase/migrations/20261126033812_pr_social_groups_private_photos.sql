
alter table pr_social_internal.social_group_posts add column photo_path text unique;
alter table pr_social_internal.social_group_posts drop constraint social_group_posts_body_check;
alter table pr_social_internal.social_group_posts add constraint social_group_posts_body_check check(char_length(body)<=1200 and (char_length(btrim(body))>=1 or photo_path is not null));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('pr-group-photos','pr-group-photos',false,10485760,array['image/jpeg','image/png','image/webp','image/gif']);
create or replace function public.pr_group_photo_access(p_name text,p_mode text) returns boolean language plpgsql stable security definer set search_path='' as $$
declare pid text:=public.pr_current_profile_id(); gid uuid;
begin
 if not pr_social_internal.allowed() or not pr_social_internal.meetup_adult(pid) or p_name is null or p_name !~ '^[0-9a-f-]{36}/[0-9a-f-]{36}[.](jpg|png|webp|gif)$' then return false;end if;
 begin gid:=split_part(p_name,'/',1)::uuid;exception when invalid_text_representation then return false;end;
 if not pr_social_internal.group_member(gid,pid) then return false;end if;
 if p_mode='write' then return true;
 elsif p_mode='read' then return exists(select 1 from pr_social_internal.social_group_posts p where p.group_id=gid and p.photo_path=p_name and p.deleted_at is null and pr_social_internal.meetup_adult(p.author_id) and not exists(select 1 from public.community_blocks b where (b.blocker_profile_id=pid and b.blocked_profile_id=p.author_id) or (b.blocker_profile_id=p.author_id and b.blocked_profile_id=pid)));
 elsif p_mode='cleanup' then return not exists(select 1 from pr_social_internal.social_group_posts p where p.photo_path=p_name);
 end if;return false;
end $$;
revoke all on function public.pr_group_photo_access(text,text) from public,anon;
grant execute on function public.pr_group_photo_access(text,text) to authenticated;
create policy pr_group_photos_insert on storage.objects for insert to authenticated with check(bucket_id='pr-group-photos' and owner_id=auth.uid()::text and public.pr_group_photo_access(name,'write'));
create policy pr_group_photos_select on storage.objects for select to authenticated using(bucket_id='pr-group-photos' and public.pr_group_photo_access(name,'read'));
create policy pr_group_photos_cleanup on storage.objects for delete to authenticated using(bucket_id='pr-group-photos' and owner_id=auth.uid()::text and public.pr_group_photo_access(name,'cleanup'));
create or replace function public.pr_groups_social_publish_photo(p_group uuid,p_body text,p_photo text) returns uuid language plpgsql security definer set search_path='' as $$
declare pid text:=public.pr_current_profile_id(); post_id uuid;
begin
 if not pr_social_internal.allowed() or not pr_social_internal.meetup_adult(pid) or split_part(p_photo,'/',1)<>p_group::text or not public.pr_group_photo_access(p_photo,'write') then raise exception 'Sin permiso para publicar' using errcode='42501';end if;
 if not exists(select 1 from storage.objects o where o.bucket_id='pr-group-photos' and o.name=p_photo and o.owner_id=auth.uid()::text and o.metadata->>'mimetype' in ('image/jpeg','image/png','image/webp','image/gif')) then raise exception 'Foto no disponible' using errcode='42501';end if;
 insert into pr_social_internal.social_group_posts(group_id,author_id,body,photo_path) values(p_group,pid,btrim(coalesce(p_body,'')),p_photo) returning id into post_id;return post_id;
end $$;
revoke all on function public.pr_groups_social_publish_photo(uuid,text,text) from public,anon;
grant execute on function public.pr_groups_social_publish_photo(uuid,text,text) to authenticated;
CREATE OR REPLACE FUNCTION public.pr_groups_social_posts(p_group uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare pid text:=public.pr_current_profile_id();
begin
 if not pr_social_internal.allowed() or not pr_social_internal.meetup_adult(pid) or not pr_social_internal.group_member(p_group,pid) then raise exception 'Grupo privado para sus integrantes' using errcode='42501';end if;
 return coalesce((select jsonb_agg(x.item order by x.created_at desc) from (select p.created_at,jsonb_build_object('id',p.id,'body',p.body,'photo_path',p.photo_path,'created_at',p.created_at,'mine',p.author_id=pid,'can_delete',p.author_id=pid or g.owner_id=pid or pr_social_internal.is_owner(),'author',jsonb_build_object('name',concat_ws(' ',a.nombre,a.apellido),'photo',a.foto)) item from pr_social_internal.social_group_posts p join pr_social_internal.social_groups g on g.id=p.group_id join public.profiles a on a.id=p.author_id where p.group_id=p_group and p.deleted_at is null and pr_social_internal.meetup_adult(p.author_id) and not exists(select 1 from public.community_blocks b where (b.blocker_profile_id=pid and b.blocked_profile_id=p.author_id) or (b.blocker_profile_id=p.author_id and b.blocked_profile_id=pid)) order by p.created_at desc limit 80)x),'[]'::jsonb);
end $function$
;