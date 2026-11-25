-- PR Wrapped 2026: isolated, session-bound aggregates. No existing data/policies changed.
-- Apply only after staging schema parity and access tests. Default: closed to students.
begin;
create table if not exists public.pr_wrapped_2026_settings (
  singleton boolean primary key default true check (singleton),
  published boolean not null default false,
  opens_at timestamptz not null default '2026-12-01 00:00:00 America/Montevideo'::timestamptz
);
alter table public.pr_wrapped_2026_settings enable row level security;
revoke all on public.pr_wrapped_2026_settings from public, anon, authenticated;
insert into public.pr_wrapped_2026_settings(singleton) values(true) on conflict do nothing;

create or replace function public.pr_wrapped_2026(p_publish boolean default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles%rowtype;
  cfg public.pr_wrapped_2026_settings%rowtype;
  lo constant timestamptz := '2026-01-01 00:00:00 America/Montevideo';
  hi timestamptz := least(statement_timestamp(), '2027-01-01 00:00:00 America/Montevideo'::timestamptz);
  is_admin boolean;
  result jsonb;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  select * into strict me from public.profiles where auth_user_id=auth.uid();
  is_admin := me.role='admin';
  if me.role='familiar' or (not is_admin and me.acceso_habilitado is distinct from true) then
    raise exception 'Access denied' using errcode='42501';
  end if;
  -- Mirror the existing platform's monthly access enforcement on the server.
  if not is_admin and me.role <> 'profesor' and not coalesce(me.exento_mensualidad,false)
     and not coalesce(me.es_solo_personalizadas,false)
     and extract(day from statement_timestamp() at time zone 'America/Montevideo') >= 11
     and exists(select 1 from public.pr_tesoreria_config where id=1 and enforcement_enabled)
     and exists(select 1 from public.pr_mensualidades m where m.alumno_id=me.id
       and m.periodo=date_trunc('month',statement_timestamp() at time zone 'America/Montevideo')::date
       and lower(coalesce(m.estado,'')) not in ('pagado','bonificado','acuerdo')
       and coalesce(m.gracia_hasta,m.vencimiento)<(statement_timestamp() at time zone 'America/Montevideo')::date)
  then raise exception 'Access denied' using errcode='42501'; end if;
  if p_publish is not null then
    if not is_admin then raise exception 'Admin required' using errcode='42501'; end if;
    update public.pr_wrapped_2026_settings set published=p_publish where singleton;
  end if;
  select * into strict cfg from public.pr_wrapped_2026_settings where singleton;
  result := jsonb_build_object('year',2026,'opensAt',cfg.opens_at,'asOf',hi,'published',cfg.published,'admin',is_admin,'open',is_admin or (cfg.published and statement_timestamp()>=cfg.opens_at));
  if not (is_admin or (cfg.published and statement_timestamp()>=cfg.opens_at)) then return result; end if;
  return result || jsonb_build_object(
    'name',me.nombre,'lastInitial',left(me.apellido,1),'photo',me.foto,
    'attendance',(with days as (
      select distinct c.id, c.starts_at at time zone 'America/Montevideo' as local_at
      from public.pr_check_attendance a join public.pr_check_ids i on i.id=a.identity_id
      join public.pr_check_classes c on c.id=a.class_id
      where i.profile_id=me.id and i.child_id is null and c.is_test=false and c.audience is distinct from 'kids'
      and c.status not in ('cancelled','canceled') and c.starts_at>=lo and c.starts_at<hi and a.scanned_at<hi
    ), months as (select extract(month from local_at)::int as month,count(*) as n from days group by 1 order by 2 desc,1 limit 1),
    weekdays as (select extract(dow from local_at)::int as day,count(*) as n from days group by 1 order by 2 desc,1 limit 1)
    select case when count(*)>0 then jsonb_build_object('classes',count(*),'firstClass',min(local_at)::date,'busiestMonth',(select month from months),'busiestMonthCount',(select n from months),'favoriteWeekday',(select day from weekdays),'favoriteWeekdayCount',(select n from weekdays)) end from days),
    'activity',(with rows as (
      select distinct on (coalesce(strava_activity_id::text,id::text)) fecha_inicio, distancia_metros,tiempo_movimiento_segundos
      from public.pr_activities where alumno_id=me.id and deporte_strava='InlineSkate' and eliminada is not true
      and estado_validacion in ('sincronizada','validada') and fecha_inicio>=lo and fecha_inicio<hi
      -- Manual entries are kept separate until cross-source duplicate matching is verified.
      and lower(fuente)='strava'
      order by coalesce(strava_activity_id::text,id::text), actualizado_en desc nulls last,id
    ), months as (select extract(month from fecha_inicio at time zone 'America/Montevideo')::int as month,sum(distancia_metros) as meters from rows where distancia_metros>0 group by 1 order by 2 desc,1 limit 1)
    select case when count(*)>0 then jsonb_build_object('activities',count(*),'km',sum(distancia_metros) filter(where distancia_metros>0)/1000,'hours',sum(tiempo_movimiento_segundos) filter(where tiempo_movimiento_segundos>0)/3600.0,'longestKm',max(distancia_metros) filter(where distancia_metros>0)/1000,'bestMonth',(select month from months),'bestMonthKm',(select meters/1000 from months)) end from rows),
    'manualActivities',(select nullif(count(*),0) from public.pr_activities where alumno_id=me.id and lower(fuente)='manual' and deporte_strava='InlineSkate' and eliminada is not true and estado_validacion='validada' and fecha_inicio>=lo and fecha_inicio<hi),
    'duties',(with approved as (
      select distinct s.assignment_duty_id,d.title from public.pr_training_v2_submissions s
      join public.pr_training_v2_assignment_duties ad on ad.id=s.assignment_duty_id
      join public.pr_training_v2_assignments a on a.id=ad.assignment_id and a.profile_id=me.id
      join public.pr_training_v2_duties d on d.id=ad.duty_id
      where s.profile_id=me.id and s.status='approved' and coalesce(s.reviewed_at,s.submitted_at)>=lo and coalesce(s.reviewed_at,s.submitted_at)<hi
    ) select case when count(*)>0 then jsonb_build_object('approved',count(*),'techniques',jsonb_agg(distinct title)) end from approved),
    'level',(select level_code from public.pr_training_v2_progression where profile_id=me.id and changed_at>=lo and changed_at<hi order by changed_at desc limit 1),
    'shifter',(with completed as (
      select r.task_id from public.pr_training_task_results r join public.pr_training_tasks t on t.id=r.task_id
      where r.profile_id=me.id and r.status='completed' and t.event_slug='shifter-marathon-2026' and r.completed_at>=lo and r.completed_at<hi
      union select c.task_id from public.pr_training_public_checks c join public.pr_training_tasks t on t.id=c.task_id
      where c.profile_id=me.id and t.event_slug='shifter-marathon-2026' and c.completed_at>=lo and c.completed_at<hi
    ) select jsonb_build_object('category',(select category from public.pr_training_enrollments where profile_id=me.id and event_slug='shifter-marathon-2026' and active and answered_at>=lo and answered_at<hi order by answered_at desc limit 1),'completed',nullif((select count(*) from completed),0),'planCompleted',exists(select 1 from public.pr_training_plan_achievements where profile_id=me.id and event_slug='shifter-marathon-2026' and completed_at>=lo and completed_at<hi))),
    'performance',(with valid as (
      select distinct on (coalesce(observacion_original_id,id::text)) id,fecha,distancia_km,tiempo_segundos,numero_toma
      from public.pr_performance_tomas where alumno_id=me.id and eliminado is not true and distancia_km>0 and tiempo_segundos>0
      and fecha>='2026-01-01'::date and fecha<= (hi at time zone 'America/Montevideo')::date and fecha<'2027-01-01'::date
      order by coalesce(observacion_original_id,id::text),updated_at desc nulls last,id
    ), by_distance as (
      select distancia_km,count(*) as count,(array_agg(tiempo_segundos order by fecha,numero_toma,id))[1] as first_seconds,
      (array_agg(tiempo_segundos order by fecha desc,numero_toma desc,id desc))[1] as last_seconds,min(tiempo_segundos) as best_seconds
      from valid group by distancia_km
    ) select case when count(*)>0 then jsonb_build_object('count',sum(count),'distances',jsonb_agg(jsonb_build_object('km',distancia_km,'count',count,'firstSeconds',first_seconds,'lastSeconds',last_seconds,'bestSeconds',best_seconds,'bestPace',best_seconds/distancia_km,'bestSpeed',3600*distancia_km/best_seconds,'timeReductionPct',case when count>1 then 100.0*(first_seconds-last_seconds)/first_seconds end) order by distancia_km)) end from by_distance),
    'goals',(select nullif(count(*),0) from public.pr_performance_objetivos where alumno_id=me.id and eliminado is not true and completado_en>=lo and completado_en<hi),
    'frames',(select case when count(*)>0 then jsonb_build_object('frames',count(*),'titles',jsonb_agg(c.title order by f.granted_at)) end from public.pr_profile_frames f join public.pr_collectible_frames c on c.code=f.frame_code where f.profile_id=me.id and f.revoked_at is null and f.granted_at>=lo and f.granted_at<hi),
    'awards',case when exists(select 1 from public.pr_awards_settings where singleton and results_revealed) then (
      select jsonb_agg(jsonb_build_object('category',cat.title,'recognition',case when w.finalist_id is not null then 'winner' else 'finalist' end))
      from public.pr_awards_candidates c join public.pr_awards_finalists f on f.candidate_id=c.id
      join public.pr_awards_categories cat on cat.id=f.category_id left join public.pr_awards_winners w on w.finalist_id=f.id and w.category_id=cat.id
      where c.source_profile_key=me.id and c.is_public and c.consent_recorded_at is not null and c.created_at>=lo and c.created_at<hi
    ) end
  );
end;
$$;
revoke all on function public.pr_wrapped_2026(boolean) from public, anon, authenticated;
grant execute on function public.pr_wrapped_2026(boolean) to authenticated;
commit;
