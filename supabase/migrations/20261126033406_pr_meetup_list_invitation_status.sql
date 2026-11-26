CREATE OR REPLACE FUNCTION public.pr_meetup_list()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare pid text:=public.pr_current_profile_id();
begin
 if not pr_social_internal.allowed() then return jsonb_build_object('eligible',false,'items','[]'::jsonb);end if;
 if not pr_social_internal.meetup_adult(pid) then return jsonb_build_object('eligible',false,'items','[]'::jsonb);end if;
 return jsonb_build_object('eligible',true,'items',coalesce((select jsonb_agg(x.item order by x.starts_at) from (
 select m.starts_at,jsonb_build_object('id',m.id,'title',m.title,'meeting_point',m.meeting_point,'starts_at',m.starts_at,'distance_km',m.distance_km,'pace',m.pace,'skill_level',m.skill_level,'audience',m.audience,'notes',m.notes,'capacity',m.capacity,'cancelled',m.cancelled_at is not null,'invited',exists(select 1 from pr_social_internal.meetup_invites i where i.meetup_id=m.id and i.recipient_id=pid and i.declined_at is null),'mine',m.organizer_id=pid,'joined',exists(select 1 from pr_social_internal.meetup_members mm where mm.meetup_id=m.id and mm.profile_id=pid),'count',1+(select count(*) from pr_social_internal.meetup_members mm where mm.meetup_id=m.id and pr_social_internal.meetup_adult(mm.profile_id)),'organizer',jsonb_build_object('name',concat_ws(' ',p.nombre,p.apellido),'photo',p.foto),'participants',coalesce((select jsonb_agg(jsonb_build_object('name',concat_ws(' ',q.nombre,q.apellido),'photo',q.foto)) from pr_social_internal.meetup_members mm join public.profiles q on q.id=mm.profile_id left join public.community_privacy cp on cp.profile_id=q.id where mm.meetup_id=m.id and pr_social_internal.meetup_adult(q.id) and (q.id=pid or (coalesce(cp.discoverable,true) and public.community_are_friends(pid,q.id))) and not exists(select 1 from public.community_blocks b where (b.blocker_profile_id=pid and b.blocked_profile_id=q.id) or (b.blocker_profile_id=q.id and b.blocked_profile_id=pid))),'[]'::jsonb)) item
 from pr_social_internal.meetups m join public.profiles p on p.id=m.organizer_id where m.starts_at>now()-interval '2 hours' and m.starts_at<now()+interval '60 days' and pr_social_internal.meetup_visible(m.id,pid) and (m.cancelled_at is null or m.organizer_id=pid or exists(select 1 from pr_social_internal.meetup_members mm where mm.meetup_id=m.id and mm.profile_id=pid) or exists(select 1 from pr_social_internal.meetup_invites i where i.meetup_id=m.id and i.recipient_id=pid and i.declined_at is null)) order by m.starts_at limit 60)x),'[]'::jsonb));
end $function$
;