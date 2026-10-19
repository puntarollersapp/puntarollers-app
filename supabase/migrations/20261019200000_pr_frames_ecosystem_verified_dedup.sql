-- Verified historical Ecosistema activities, excluding deleted/unvalidated/future activities and duplicate Strava IDs.
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
    select exists(select 1 from public.pr_performance_tomas_calculadas t
     where t.alumno_id=$1
       and coalesce((to_jsonb(t)->>'eliminado')::boolean,false)=false
       and (to_jsonb(t)->>'distancia_km')::numeric in (6,12)
       and (to_jsonb(t)->>'tiempo_segundos')::numeric>0)
   $query$ into v_takes using v_profile;
 end if;
 if v_takes then
  insert into public.pr_frame_unlocks(profile_id,frame_id,source)
  values(v_profile,'shifter-2026','shifter_valid_6k_12k_time_trial') on conflict do nothing;
 end if;
 -- Match Ecosistema's verified-activity contract, deduplicating by Strava source ID.
 if to_regclass('public.pr_activities') is not null then
   execute $query$
    select coalesce(sum(x.meters),0)/1000
    from (
      select max(a.distancia_metros) as meters
      from public.pr_activities a
      where a.alumno_id=$1
        and a.eliminada=false and a.tipo='Patinaje'
        and a.fecha_inicio is not null and a.fecha_inicio<=now()
        and a.distancia_metros>=0
        and ((a.fuente='strava' and a.estado_validacion='sincronizada')
          or (a.fuente='manual' and a.estado_validacion='validada'))
      group by case when a.fuente='strava' and a.strava_activity_id is not null
        then 'strava:'||a.strava_activity_id::text else 'id:'||a.id::text end
    ) x
   $query$ into v_km using v_profile;
 end if;
 if v_km>=100 then
  insert into public.pr_frame_unlocks(profile_id,frame_id,source)
  values(v_profile,'100km','verified_deduplicated_ecosystem_distance') on conflict do nothing;
 end if;
 return query select u.frame_id,u.source from public.pr_frame_unlocks u
 where u.profile_id=v_profile and u.frame_id in ('shifter-2026','100km');
end $function$
;
revoke all on function public.pr_frames_sync_sports() from public,anon;
grant execute on function public.pr_frames_sync_sports() to authenticated;
