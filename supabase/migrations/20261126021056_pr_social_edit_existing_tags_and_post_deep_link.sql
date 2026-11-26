
create or replace function public.pr_social_tag_editor(p_post uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare pid text:=public.pr_current_profile_id(); audience text;
begin
 if auth.uid() is null or not pr_social_internal.allowed() then raise exception 'PR Social no habilitado' using errcode='42501'; end if;
 select visibility into audience from public.community_posts where id=p_post and author_id=pid and deleted_at is null;
 if not found then raise exception 'Publicación no disponible' using errcode='42501';end if;
 return jsonb_build_object('tags',coalesce((select jsonb_agg(jsonb_build_object('id',t.profile_id,'status',t.status,'nombre',p.nombre,'apellido',p.apellido,'foto',p.foto) order by p.nombre,p.apellido) from public.community_post_tags t join public.profiles p on p.id=t.profile_id where t.post_id=p_post),'[]'::jsonb),'people',coalesce((select jsonb_agg(to_jsonb(d)) from public.community_tag_directory(audience) d),'[]'::jsonb));
end $$;
create or replace function public.pr_social_edit_tags(p_post uuid,p_add text[],p_remove text[])
returns boolean language plpgsql security definer set search_path='' as $$
declare pid text:=public.pr_current_profile_id(); audience text; x text; total int;
begin
 if auth.uid() is null or not pr_social_internal.allowed() then raise exception 'PR Social no habilitado' using errcode='42501';end if;
 select visibility into audience from public.community_posts where id=p_post and author_id=pid and deleted_at is null for update;
 if not found then raise exception 'Publicación no disponible' using errcode='42501';end if;
 if coalesce(cardinality(p_add),0)>20 or coalesce(cardinality(p_remove),0)>20 or coalesce(p_add,'{}') && coalesce(p_remove,'{}') or array_position(p_add,null) is not null or array_position(p_remove,null) is not null then raise exception 'Selección inválida';end if;
 foreach x in array coalesce(p_add,'{}'::text[]) loop
  if not exists(select 1 from public.community_post_tags where post_id=p_post and profile_id=x) and not exists(select 1 from public.community_tag_directory(audience) d where d.id=x) then raise exception 'Una persona ya no está disponible para etiquetar';end if;
 end loop;
 delete from public.community_post_tags where post_id=p_post and profile_id=any(coalesce(p_remove,'{}'::text[])) and status in ('pending','accepted');
 select count(*) into total from public.community_post_tags where post_id=p_post and status in ('pending','accepted');
 if total+(select count(distinct a.x) from unnest(coalesce(p_add,'{}'::text[])) a(x) where not exists(select 1 from public.community_post_tags t where t.post_id=p_post and t.profile_id=a.x))>20 then raise exception 'Máximo 20 etiquetas';end if;
 foreach x in array coalesce(p_add,'{}'::text[]) loop
  insert into public.community_post_tags(post_id,profile_id,status) values(p_post,x,'pending') on conflict do nothing;
  if found then
   update public.community_notifications n set text=(select trim(concat_ws(' ',p.nombre,p.apellido)) from public.profiles p where p.id=pid)||' te etiquetó en una publicación de RollerFeed.'
   where n.recipient_id=x and n.actor_id=pid and n.kind='tag' and n.entity_id=p_post and n.created_at=now();
  end if;
 end loop;
 return true;
end $$;
CREATE OR REPLACE FUNCTION public.community_social_post(p_post_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare pid text := public.pr_current_profile_id(); result jsonb;
begin
 if not public.community_is_active_member(pid) then return '[]'::jsonb; end if;
 select coalesce(jsonb_agg(x.item order by x.created_at desc),'[]'::jsonb) into result
 from (
 select p.created_at,jsonb_build_object(
  'id',p.id,'author_id',p.author_id,'body',p.body,'created_at',p.created_at,
  'visibility',p.visibility,'social_kind',case when pr_social_internal.allowed() then coalesce((select pp.kind from pr_social_internal.prompt_posts pp where pp.post_id=p.id),case when exists(select 1 from pr_social_internal.polls q where q.post_id=p.id) then 'poll' when exists(select 1 from pr_social_internal.videos v where v.post_id=p.id) then 'video' else 'post' end) else null end,'social_key',case when pr_social_internal.allowed() then (select pp.prompt_key from pr_social_internal.prompt_posts pp where pp.post_id=p.id) else null end,'video_path',case when pr_social_internal.allowed() and now()>='2026-12-01 03:00:00+00'::timestamptz then (select v.object_path from pr_social_internal.videos v where v.post_id=p.id) else null end,'is_mine',p.author_id=pid,'my_pending_tag',exists(select 1 from public.community_post_tags t where t.post_id=p.id and t.profile_id=pid and t.status='pending'),'my_reaction',(select r.reaction from public.community_post_reactions r where r.post_id=p.id and r.profile_id=pid),
  'author',jsonb_build_object('id',a.id,'nombre',a.nombre,'apellido',a.apellido,'foto',a.foto),
  'media',(select coalesce(jsonb_agg(jsonb_build_object('id',m.id,'url',m.media_path,'sort',m.sort_order) order by m.sort_order),'[]'::jsonb) from public.community_post_media m where m.post_id=p.id),
  'reactions',(select coalesce(jsonb_agg(jsonb_build_object('profile_id',r.profile_id,'reaction',r.reaction)),'[]'::jsonb) from public.community_post_reactions r where r.post_id=p.id),
  'comments',(select coalesce(jsonb_agg(jsonb_build_object('id',c.id,'profile_id',c.profile_id,'parent_comment_id',c.parent_comment_id,'body',c.body,'created_at',c.created_at,'nombre',cp.nombre) order by c.created_at),'[]'::jsonb) from public.community_post_comments c join public.profiles cp on cp.id=c.profile_id where c.post_id=p.id),
  'tags',(select coalesce(jsonb_agg(jsonb_build_object('profile_id',t.profile_id,'status',t.status,'nombre',tp.nombre,'apellido',tp.apellido,'foto',tp.foto)),'[]'::jsonb) from public.community_post_tags t join public.profiles tp on tp.id=t.profile_id where t.post_id=p.id and (t.status='accepted' or (t.status='pending' and (t.profile_id=pid or p.author_id=pid)))),
  'reposted',exists(select 1 from public.community_reposts rr where rr.post_id=p.id and rr.profile_id=pid),
  'repost_count',(select count(*) from public.community_reposts rr where rr.post_id=p.id)
 ) item
 from public.community_posts p join public.profiles a on a.id=p.author_id
 where p.id=p_post_id and p.deleted_at is null and (p.visibility='members' or p.author_id=pid or public.community_are_friends(pid,p.author_id))
 order by p.created_at desc limit 60
 ) x;
 return result;
end $function$
;
revoke all on function public.pr_social_tag_editor(uuid),public.pr_social_edit_tags(uuid,text[],text[]),public.community_social_post(uuid) from public,anon;
grant execute on function public.pr_social_tag_editor(uuid),public.pr_social_edit_tags(uuid,text[],text[]),public.community_social_post(uuid) to authenticated;
