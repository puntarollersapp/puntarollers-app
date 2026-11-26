
create table if not exists pr_social_internal.official_posts (
 post_id uuid primary key references public.community_posts(id) on delete cascade,
 event_key text unique, class_id uuid references public.pr_check_classes(id),
 badge_title text, badge_image text
);
alter table pr_social_internal.official_posts enable row level security;
revoke all on pr_social_internal.official_posts from public,anon,authenticated;
create or replace function pr_social_internal.official_post_details(p_post uuid,p_viewer text)
returns jsonb language sql stable set search_path='' as $$
 select jsonb_build_object('event_key',o.event_key,'badge_title',o.badge_title,'badge_image',o.badge_image,
 'count',(select count(distinct i.profile_id) from public.pr_check_attendance a join public.pr_check_ids i on i.id=a.identity_id where a.class_id=o.class_id and exists(select 1 from public.actividad_pr b where b.alumno_id=i.profile_id and b.tipo='Insignia' and b.titulo=o.badge_title and not b.eliminado)),
 'participants',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'nombre',p.nombre,'apellido',p.apellido,'foto',p.foto) order by p.nombre,p.apellido) from public.profiles p join public.community_privacy cp on cp.profile_id=p.id where p.estado='Activo' and p.acceso_habilitado is true and (p.id=p_viewer or pr_social_internal.is_owner() or (cp.discoverable and cp.show_badges_to_friends and public.community_are_friends(p_viewer,p.id))) and exists(select 1 from public.pr_check_attendance a join public.pr_check_ids i on i.id=a.identity_id where a.class_id=o.class_id and i.profile_id=p.id) and exists(select 1 from public.actividad_pr b where b.alumno_id=p.id and b.tipo='Insignia' and b.titulo=o.badge_title and not b.eliminado)),'[]'::jsonb))
 from pr_social_internal.official_posts o where o.post_id=p_post
$$;
revoke all on function pr_social_internal.official_post_details(uuid,text) from public,anon,authenticated;
CREATE OR REPLACE FUNCTION public.community_social_feed()
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
  'official',pr_social_internal.official_post_details(p.id,pid),'visibility',p.visibility,'social_kind',case when pr_social_internal.allowed() then coalesce((select pp.kind from pr_social_internal.prompt_posts pp where pp.post_id=p.id),case when exists(select 1 from pr_social_internal.polls q where q.post_id=p.id) then 'poll' when exists(select 1 from pr_social_internal.videos v where v.post_id=p.id) then 'video' else 'post' end) else null end,'social_key',case when pr_social_internal.allowed() then (select pp.prompt_key from pr_social_internal.prompt_posts pp where pp.post_id=p.id) else null end,'video_path',case when pr_social_internal.allowed() and now()>='2026-12-01 03:00:00+00'::timestamptz then (select v.object_path from pr_social_internal.videos v where v.post_id=p.id) else null end,'is_mine',p.author_id=pid,'my_pending_tag',exists(select 1 from public.community_post_tags t where t.post_id=p.id and t.profile_id=pid and t.status='pending'),'my_reaction',(select r.reaction from public.community_post_reactions r where r.post_id=p.id and r.profile_id=pid),
  'author',jsonb_build_object('id',a.id,'nombre',a.nombre,'apellido',a.apellido,'foto',a.foto),
  'media',(select coalesce(jsonb_agg(jsonb_build_object('id',m.id,'url',m.media_path,'sort',m.sort_order) order by m.sort_order),'[]'::jsonb) from public.community_post_media m where m.post_id=p.id),
  'reactions',(select coalesce(jsonb_agg(jsonb_build_object('profile_id',r.profile_id,'reaction',r.reaction)),'[]'::jsonb) from public.community_post_reactions r where r.post_id=p.id),
  'comments',(select coalesce(jsonb_agg(jsonb_build_object('id',c.id,'profile_id',c.profile_id,'parent_comment_id',c.parent_comment_id,'body',c.body,'created_at',c.created_at,'nombre',cp.nombre) order by c.created_at),'[]'::jsonb) from public.community_post_comments c join public.profiles cp on cp.id=c.profile_id where c.post_id=p.id),
  'tags',(select coalesce(jsonb_agg(jsonb_build_object('profile_id',t.profile_id,'status',t.status,'nombre',tp.nombre,'apellido',tp.apellido,'foto',tp.foto)),'[]'::jsonb) from public.community_post_tags t join public.profiles tp on tp.id=t.profile_id where t.post_id=p.id and (t.status='accepted' or (t.status='pending' and (t.profile_id=pid or p.author_id=pid)))),
  'reposted',exists(select 1 from public.community_reposts rr where rr.post_id=p.id and rr.profile_id=pid),
  'repost_count',(select count(*) from public.community_reposts rr where rr.post_id=p.id)
 ) item
 from public.community_posts p join public.profiles a on a.id=p.author_id
 where p.deleted_at is null and (p.visibility='members' or p.author_id=pid or public.community_are_friends(pid,p.author_id))
 order by p.created_at desc limit 60
 ) x;
 return result;
end $function$
;
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
  'official',pr_social_internal.official_post_details(p.id,pid),'visibility',p.visibility,'social_kind',case when pr_social_internal.allowed() then coalesce((select pp.kind from pr_social_internal.prompt_posts pp where pp.post_id=p.id),case when exists(select 1 from pr_social_internal.polls q where q.post_id=p.id) then 'poll' when exists(select 1 from pr_social_internal.videos v where v.post_id=p.id) then 'video' else 'post' end) else null end,'social_key',case when pr_social_internal.allowed() then (select pp.prompt_key from pr_social_internal.prompt_posts pp where pp.post_id=p.id) else null end,'video_path',case when pr_social_internal.allowed() and now()>='2026-12-01 03:00:00+00'::timestamptz then (select v.object_path from pr_social_internal.videos v where v.post_id=p.id) else null end,'is_mine',p.author_id=pid,'my_pending_tag',exists(select 1 from public.community_post_tags t where t.post_id=p.id and t.profile_id=pid and t.status='pending'),'my_reaction',(select r.reaction from public.community_post_reactions r where r.post_id=p.id and r.profile_id=pid),
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
do $$
declare pid uuid; cid uuid;
begin
 select id into strict cid from public.pr_check_classes where title='Rodada solidaria · Juntos por Valentino · 6 km' and (starts_at at time zone 'America/Montevideo')::date=date '2026-11-25' and not is_test and status<>'cancelled';
 if not exists(select 1 from pr_social_internal.official_posts where event_key='valentino-2026-11-25') then
 insert into public.community_posts(author_id,body,visibility) values('admin-claudio','¡Hoy nuestras ruedas hicieron la diferencia! 🛼❤️

Felicitaciones a todos los que participaron en la rodada solidaria de 6 KM · Juntos por Valentino. Gracias por acompañarnos, colaborar y sumar su granito de arena.

En reconocimiento a su participación, quienes registraron su asistencia y recibieron la insignia especial ya la tienen en su perfil. ¡Qué orgullo compartir esta comunidad con ustedes!

Gracias también a quienes colaboraron de otras formas. Juntos somos mucho más que patinaje.','members') returning id into pid;
 insert into pr_social_internal.official_posts(post_id,event_key,class_id,badge_title,badge_image) values(pid,'valentino-2026-11-25',cid,'6 KM solidarios · Juntos por Valentino','/insignias-pr/6km-solidarios-valentino(1).webp');
 end if;
end $$;
