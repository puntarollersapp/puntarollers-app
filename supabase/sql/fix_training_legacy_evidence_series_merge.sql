-- Applied via Supabase migration fix_training_legacy_evidence_series_merge.
-- Preserve legacy evidence while ensuring the series object exists before jsonb_set.
CREATE OR REPLACE FUNCTION public.pr_process_shifter_activity(p_activity_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  a public.pr_activities%rowtype;
  t public.pr_training_tasks%rowtype;
  v_name text;
  v_series int;
  v_existing_series int;
  v_ok boolean;
  v_ev jsonb;
  v_count int;
  v_duration int;
  v_exact boolean := false;
begin
  select * into a from public.pr_activities where id=p_activity_id;
  if a.id is null then return; end if;
  if lower(coalesce(a.fuente,'')) <> 'strava'
     or a.deporte_strava <> 'InlineSkate'
     or coalesce(a.eliminada,false) then
    return;
  end if;

  if not exists (
    select 1 from public.pr_training_enrollments e
    where e.profile_id=a.alumno_id
      and e.event_slug='shifter-marathon-2026'
      and e.active=true
      and coalesce(e.category,'NO')<>'NO'
  ) then return; end if;

  v_name := upper(coalesce(a.nombre,''));

  select tt.* into t
  from public.pr_training_tasks tt
  where tt.event_slug='shifter-marathon-2026'
    and tt.active=true
    and (
      v_name like upper(tt.strava_code)||'%'
      or v_name ~ ('(^|[^0-9])DEBER[[:space:]]*0?'||tt.sort_order::text||'([^0-9]|$)')
      or v_name ~ ('(^|[^A-Z0-9])D0?'||tt.sort_order::text||'([^0-9]|$)')
    )
  order by case when v_name like upper(tt.strava_code)||'%' then 0 else 1 end,
           length(tt.strava_code) desc
  limit 1;

  if t.id is null then return; end if;
  v_exact := v_name like upper(t.strava_code)||'%';

  if coalesce(t.series_count,1) > 1 then
    select (e.key)::int into v_existing_series
    from public.pr_training_task_results r,
         lateral jsonb_each(coalesce(r.evidence->'series','{}'::jsonb)) e
    where r.profile_id=a.alumno_id and r.task_id=t.id
      and e.value->>'activity_id'=a.id::text
    limit 1;

    if v_existing_series is not null then
      v_series := v_existing_series;
    else
      if v_exact then
        v_series := nullif(substring(v_name from upper(t.strava_code)||'-S([0-9]+)'),'')::int;
      end if;

      if v_series is null then
        v_series := nullif(substring(v_name from '(?:SERIE|PASADA)[[:space:]#-]*([0-9]+)'),'')::int;
      end if;

      if v_series is null then
        v_series := case
          when v_name ~ '(^|[^A-Z])(PRIMER|PRIMERA)([^A-Z]|$)' then 1
          when v_name ~ '(^|[^A-Z])SEGUND[AO]([^A-Z]|$)' then 2
          when v_name ~ '(^|[^A-Z])(TERCER|TERCERA)([^A-Z]|$)' then 3
          when v_name ~ '(^|[^A-Z])CUARTA([^A-Z]|$)' then 4
          when v_name ~ '(^|[^A-Z])QUINTA([^A-Z]|$)' then 5
          when v_name ~ '(^|[^A-Z])SEXTA([^A-Z]|$)' then 6
          when v_name ~ '(^|[^A-Z])SEPTIMA([^A-Z]|$)' then 7
          when v_name ~ '(^|[^A-Z])OCTAVA([^A-Z]|$)' then 8
          else null end;
      end if;

      if v_series is null then
        select s into v_series
        from generate_series(1,t.series_count) s
        where not exists (
          select 1
          from public.pr_training_task_results r
          where r.profile_id=a.alumno_id and r.task_id=t.id
            and coalesce((r.evidence->'series'->s::text->>'valid')::boolean,false)
        )
        order by s
        limit 1;
      end if;
    end if;

    if v_series is null or v_series<1 or v_series>t.series_count then return; end if;
  else
    v_series := 1;
  end if;

  v_duration := greatest(coalesce(a.tiempo_movimiento_segundos,0),coalesce(a.tiempo_total_segundos,0));
  v_ok := case
    when t.rule_type in ('duration_min','series_duration') then v_duration >= coalesce(t.target_value,0)*60
    when t.rule_type in ('distance_min','series_distance') then coalesce(a.distancia_metros,0) >= coalesce(t.target_value,0)
    else true end;

  v_ev := jsonb_build_object(
    'series',v_series,
    'activity_id',a.id,
    'strava_activity_id',a.strava_activity_id,
    'name',a.nombre,
    'distance_m',a.distancia_metros,
    'moving_seconds',a.tiempo_movimiento_segundos,
    'elapsed_seconds',a.tiempo_total_segundos,
    'duration_seconds_used',v_duration,
    'valid',v_ok,
    'detected_at',now()
  );

  insert into public.pr_training_task_results(profile_id,task_id,activity_id,status,progress_value,completed_at,evidence,updated_at)
  values(
    a.alumno_id,t.id,a.id::text,
    case when v_ok and t.series_count=1 then 'completed'
         when v_ok then 'detected' else 'incomplete' end,
    case when v_ok then 1 else 0 end,
    case when v_ok and t.series_count=1 then now() else null end,
    jsonb_build_object('series',jsonb_build_object(v_series::text,v_ev)),
    now()
  )
  on conflict(profile_id,task_id) do update
  set evidence=jsonb_set(
        coalesce(pr_training_task_results.evidence,'{}'::jsonb)
          || jsonb_build_object('series',coalesce(pr_training_task_results.evidence->'series','{}'::jsonb)),
        array['series',v_series::text],v_ev,true
      ),
      activity_id=excluded.activity_id,
      updated_at=now();

  select count(*) into v_count
  from jsonb_each(
    coalesce(
      (select evidence->'series' from public.pr_training_task_results
       where profile_id=a.alumno_id and task_id=t.id),
      '{}'::jsonb
    )
  ) e
  where coalesce((e.value->>'valid')::boolean,false);

  update public.pr_training_task_results
  set progress_value=v_count,
      status=case
        when v_count>=t.series_count then 'completed'
        when v_count>0 then 'detected'
        else 'incomplete' end,
      completed_at=case
        when v_count>=t.series_count then coalesce(completed_at,now())
        else null end,
      updated_at=now()
  where profile_id=a.alumno_id and task_id=t.id;
end;
$function$

-- Recover valid historical results using the canonical duration/distance rules.
SELECT public.pr_reconcile_shifter_training(interval '120 days');
