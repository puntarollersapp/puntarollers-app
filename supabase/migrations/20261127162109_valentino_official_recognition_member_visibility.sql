CREATE OR REPLACE FUNCTION pr_social_internal.official_post_details(p_post uuid, p_viewer text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
 select jsonb_build_object('event_key',o.event_key,'badge_title',o.badge_title,'badge_image',o.badge_image,
 'count',(select count(distinct i.profile_id) from public.pr_check_attendance a join public.pr_check_ids i on i.id=a.identity_id where a.class_id=o.class_id and exists(select 1 from public.actividad_pr b where b.alumno_id=i.profile_id and b.tipo='Insignia' and b.titulo=o.badge_title and not b.eliminado)),
 'participants',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'nombre',p.nombre,'apellido',p.apellido,'foto',p.foto) order by p.nombre,p.apellido) from public.profiles p join public.community_privacy cp on cp.profile_id=p.id where p.estado='Activo' and p.acceso_habilitado is true and (
 p.id=p_viewer or pr_social_internal.is_owner() or
 (cp.discoverable and cp.show_badges_to_friends and (
 public.community_are_friends(p_viewer,p.id) or
 (o.event_key='valentino-2026-11-25' and public.community_is_active_member(p_viewer) and not exists(select 1 from public.community_blocks b where (b.blocker_profile_id=p_viewer and b.blocked_profile_id=p.id) or (b.blocker_profile_id=p.id and b.blocked_profile_id=p_viewer)))
 ))
 ) and (o.event_key is distinct from 'valentino-2026-11-25' or p.id=p_viewer or pr_social_internal.is_owner() or not exists(select 1 from public.community_blocks b where (b.blocker_profile_id=p_viewer and b.blocked_profile_id=p.id) or (b.blocker_profile_id=p.id and b.blocked_profile_id=p_viewer))) and exists(select 1 from public.pr_check_attendance a join public.pr_check_ids i on i.id=a.identity_id where a.class_id=o.class_id and i.profile_id=p.id) and exists(select 1 from public.actividad_pr b where b.alumno_id=p.id and b.tipo='Insignia' and b.titulo=o.badge_title and not b.eliminado)),'[]'::jsonb))
 from pr_social_internal.official_posts o where o.post_id=p_post
$function$;
revoke all on function pr_social_internal.official_post_details(uuid,text) from public,anon,authenticated;
