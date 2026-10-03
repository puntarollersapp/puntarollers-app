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

  -- A named PR activity records participation even before selecting a race category.

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
    'valid',true,
    'meets_target',v_ok,
    'completion_basis','named_activity',
    'detected_at',now()
  );

  insert into public.pr_training_task_results(profile_id,task_id,activity_id,status,progress_value,completed_at,evidence,updated_at)
  values(
    a.alumno_id,t.id,a.id::text,
    'completed',
    1,
    coalesce(a.fecha_inicio,now()),
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
        when v_count>0 then 'completed'
        else 'incomplete' end,
      completed_at=case
        when v_count>0 then coalesce(completed_at,a.fecha_inicio,now())
        else null end,
      updated_at=now()
  where profile_id=a.alumno_id and task_id=t.id;
end;
$function$;

CREATE TABLE public.pr_training_public_checks (
 profile_id text NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 task_id uuid NOT NULL REFERENCES public.pr_training_tasks(id) ON DELETE CASCADE,
 completed_at timestamptz NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(profile_id,task_id)
);
ALTER TABLE public.pr_training_public_checks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.pr_training_public_checks FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.pr_training_public_checks TO authenticated;
GRANT ALL ON public.pr_training_public_checks TO service_role;
CREATE POLICY community_completed_checks ON public.pr_training_public_checks
 FOR SELECT TO authenticated USING (true);
CREATE SCHEMA IF NOT EXISTS pr_training_internal;
REVOKE ALL ON SCHEMA pr_training_internal FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION pr_training_internal.sync_completed_checks()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
 BEGIN
  IF TG_OP='DELETE' THEN
   DELETE FROM public.pr_training_public_checks WHERE profile_id=old.profile_id AND task_id=old.task_id;
   RETURN old;
  END IF;
  IF lower(coalesce(new.status,''))='completed' AND new.completed_at IS NOT NULL THEN
   INSERT INTO public.pr_training_public_checks(profile_id,task_id,completed_at,updated_at)
   VALUES(new.profile_id,new.task_id,new.completed_at,now())
   ON CONFLICT(profile_id,task_id) DO UPDATE SET completed_at=excluded.completed_at,updated_at=excluded.updated_at;
  ELSE
   DELETE FROM public.pr_training_public_checks WHERE profile_id=new.profile_id AND task_id=new.task_id;
  END IF;
  RETURN new;
 END $$;
REVOKE ALL ON FUNCTION pr_training_internal.sync_completed_checks() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER sync_training_public_checks
 AFTER INSERT OR UPDATE OR DELETE ON public.pr_training_task_results
 FOR EACH ROW EXECUTE FUNCTION pr_training_internal.sync_completed_checks();
INSERT INTO public.pr_training_public_checks(profile_id,task_id,completed_at)
 SELECT profile_id,task_id,completed_at FROM public.pr_training_task_results
 WHERE lower(status)='completed' AND completed_at IS NOT NULL
 ON CONFLICT(profile_id,task_id) DO UPDATE SET completed_at=excluded.completed_at;
SELECT public.pr_reconcile_shifter_training(interval '120 days');
