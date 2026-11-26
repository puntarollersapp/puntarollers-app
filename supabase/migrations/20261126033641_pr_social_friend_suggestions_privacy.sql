create or replace function public.pr_social_friend_suggestions()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare pid text:=public.pr_current_profile_id(); result jsonb;
begin
 if not pr_social_internal.allowed() or not pr_social_internal.meetup_adult(pid) then return '[]'::jsonb;end if;
 with my_friends as (
 select case when f.profile_a_id=pid then f.profile_b_id else f.profile_a_id end id from public.community_friendships f where pid in(f.profile_a_id,f.profile_b_id)
 ), candidates as (
 select p.id,p.nombre,p.apellido,p.foto,p.role,p.verificado,p.participa_como_alumno,
 case when cp.show_city then p.ciudad else '' end ciudad,case when cp.show_bio then p.sobre_mi else '' end sobre_mi,
 (select count(*) from my_friends mf join public.profiles q on q.id=mf.id join public.community_privacy mcp on mcp.profile_id=q.id where mcp.discoverable and coalesce(q.profile_privacy->>'show_friends','true')='true' and pr_social_internal.meetup_adult(q.id) and public.pr_dm_are_friends(pid,q.id) and public.pr_dm_are_friends(p.id,q.id)) mutual
 from public.profiles p join public.community_privacy cp on cp.profile_id=p.id
 cross join lateral public.community_relationship_status(pid,p.id) rel
 where p.id<>pid and pr_social_internal.meetup_adult(p.id) and cp.discoverable and cp.allow_friend_requests and rel.relationship_status='none'
 and not exists(select 1 from public.community_blocks b where (b.blocker_profile_id=pid and b.blocked_profile_id=p.id) or (b.blocker_profile_id=p.id and b.blocked_profile_id=pid))
 and not exists(select 1 from public.community_friend_requests r where r.status in('pending','rejected') and ((r.sender_profile_id=pid and r.receiver_profile_id=p.id) or (r.sender_profile_id=p.id and r.receiver_profile_id=pid)))
 ), ranked as (
 select * from candidates order by mutual desc,(foto is not null and foto<>'') desc,nombre,apellido,id limit 32
 )
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'nombre',nombre,'apellido',apellido,'foto',foto,'role',role,'verificado',verificado,'participa_como_alumno',participa_como_alumno,'ciudad',ciudad,'sobre_mi',sobre_mi,'relationship_status','none','mutual_count',mutual) order by mutual desc,(foto is not null and foto<>'') desc,nombre,apellido,id),'[]'::jsonb) into result from ranked;
 return result;
end $$;
revoke all on function public.pr_social_friend_suggestions() from public,anon;
grant execute on function public.pr_social_friend_suggestions() to authenticated;