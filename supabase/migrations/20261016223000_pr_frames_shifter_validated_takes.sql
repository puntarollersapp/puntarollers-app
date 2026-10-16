-- Shifter 2026 requires a valid 6K/12K recorded time trial.
CREATE OR REPLACE FUNCTION public.pr_frames_sync_sports()
 RETURNS TABLE(frame_id text, source text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_profile text; v_takes boolean:=false; v_km numeric:=0;
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='28000'; end if;
 select p.id into v_profile from public.profiles p where p.auth_user_id=auth.uid() limit 1;
 if v_profile is null then raise exception 'Profile not found' using errcode='P0002'; end if;
 if to_regclass('public.pr_performance_tomas_calculadas') is not null then
   execute $query$
     select exists(
       select 1 from public.pr_performance_tomas_calculadas t
       where t.alumno_id=$1
         and coalesce((to_jsonb(t)->>'eliminado')::boolean,false)=false
         and (to_jsonb(t)->>'distancia_km')::numeric in (6,12)
         and (to_jsonb(t)->>'tiempo_segundos')::numeric>0
     )
   $query$ into v_takes using v_profile;
 end if;
 if v_takes then
   insert into public.pr_frame_unlocks(profile_id,frame_id,source)
   values(v_profile,'shifter-2026','shifter_valid_6k_12k_time_trial') on conflict do nothing;
 end if;
 if to_regclass('public.pr_inline_skate_activities') is not null then
   execute 'select coalesce(sum(greatest(0,distancia_metros)),0)/1000 from public.pr_inline_skate_activities where alumno_id=$1 and fuente=$2 and eliminada=false'
   into v_km using v_profile,'strava';
 end if;
 if v_km>=100 then
   insert into public.pr_frame_unlocks(profile_id,frame_id,source)
   values(v_profile,'100km','verified_strava_distance') on conflict do nothing;
 end if;
 return query select u.frame_id,u.source from public.pr_frame_unlocks u
 where u.profile_id=v_profile and u.frame_id in ('shifter-2026','100km');
end $function$
;
revoke all on function public.pr_frames_sync_sports() from public,anon;
grant execute on function public.pr_frames_sync_sports() to authenticated;
