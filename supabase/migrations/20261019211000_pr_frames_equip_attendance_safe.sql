-- Reuse the guarded attendance verifier before equipping Constancia.
CREATE OR REPLACE FUNCTION public.pr_frames_equip(p_frame_id text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_profile text; v_today date; v_kind text; v_start date; v_end date;
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='28000'; end if;
 select p.id into v_profile from public.profiles p where p.auth_user_id=auth.uid() limit 1;
 if v_profile is null then raise exception 'Profile not found' using errcode='P0002'; end if;
 select c.unlock_kind,c.starts_on,c.ends_on into v_kind,v_start,v_end
 from public.pr_frame_catalog c where c.id=p_frame_id and c.visible and c.active;
 if v_kind is null then raise exception 'Unknown or inactive frame' using errcode='22023'; end if;
 v_today := (now() at time zone 'America/Montevideo')::date;
 if p_frame_id='constancia' then
   perform public.pr_frames_my_unlocks();
 end if;
 if v_kind <> 'default'
 and not exists(select 1 from public.pr_frame_unlocks u where u.profile_id=v_profile and u.frame_id=p_frame_id)
 and not (v_kind='seasonal' and v_today between v_start and v_end)
 then raise exception 'Frame locked' using errcode='42501'; end if;
 update public.profiles p set pr_avatar=jsonb_set(
 jsonb_set(coalesce(p.pr_avatar,'{}'::jsonb),'{frames}',coalesce(p.pr_avatar->'frames','{}'::jsonb),true),
 '{frames,equipped}',to_jsonb(p_frame_id),true),updated_at=now() where p.id=v_profile;
 return p_frame_id;
end $function$
;
revoke all on function public.pr_frames_equip(text) from public,anon;
grant execute on function public.pr_frames_equip(text) to authenticated;
