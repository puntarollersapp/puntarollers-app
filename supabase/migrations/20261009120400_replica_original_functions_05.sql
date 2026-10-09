-- Original definitions restored exclusively to PR NEXT beta.
SET check_function_bodies = off;
CREATE SCHEMA IF NOT EXISTS rollermap_private;
CREATE SCHEMA IF NOT EXISTS pr_training_internal;
REVOKE ALL ON SCHEMA rollermap_private, pr_training_internal FROM PUBLIC;
CREATE OR REPLACE FUNCTION public.pr_personal_cambiar_estado(p_reserva_id bigint, p_estado text, p_motivo text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare
  v_reserva public.pr_personal_reservas%rowtype;
  v_cuponera public.cuponeras_particulares%rowtype;
  v_saldo_anterior integer;
  v_saldo_despues integer;
begin
  if not public.soy_admin() then
    raise exception 'Solo administración puede actualizar reservas.' using errcode = '42501';
  end if;
  if p_estado not in ('reservada', 'realizada', 'suspendida', 'cancelada', 'reprogramada', 'ausente') then
    raise exception 'Estado de reserva inválido.' using errcode = '22023';
  end if;

  select * into v_reserva
  from public.pr_personal_reservas
  where id = p_reserva_id
  for update;

  if not found then
    raise exception 'No se encontró la reserva.' using errcode = 'P0002';
  end if;

  if v_reserva.cuponera_id is not null then
    select * into v_cuponera
    from public.cuponeras_particulares
    where id = v_reserva.cuponera_id
    for update;
  end if;

  v_saldo_anterior := coalesce(v_cuponera.clases_disponibles, 0);
  v_saldo_despues := v_saldo_anterior;

  if p_estado = 'realizada' and not v_reserva.credito_consumido then
    if v_cuponera.id is null or v_cuponera.clases_disponibles <= 0 then
      raise exception 'La PR Pass no tiene clases disponibles.' using errcode = '23514';
    end if;

    v_saldo_despues := v_saldo_anterior - 1;

    update public.cuponeras_particulares
    set clases_utilizadas = clases_utilizadas + 1,
        clases_disponibles = v_saldo_despues,
        ultima_clase = now(),
        updated_at = now()
    where id = v_cuponera.id;

    insert into public.clases_particulares_historial (
      alumno_id, cuponera_id, tipo, cantidad, saldo_anterior, saldo_despues,
      fecha_clase, observacion
    ) values (
      v_reserva.alumno_id, v_cuponera.id, 'clase_dada', 1,
      v_saldo_anterior, v_saldo_despues, now(),
      'Clase realizada desde PR Personal'
    );

    v_reserva.credito_consumido := true;
    v_reserva.credito_devuelto := false;
  elsif p_estado in ('suspendida', 'cancelada', 'reprogramada')
    and v_reserva.credito_consumido
    and not v_reserva.credito_devuelto then
    if v_cuponera.id is null then
      raise exception 'No se encontró la PR Pass de la reserva.' using errcode = 'P0002';
    end if;

    v_saldo_despues := v_saldo_anterior + 1;

    update public.cuponeras_particulares
    set clases_utilizadas = greatest(0, clases_utilizadas - 1),
        clases_disponibles = v_saldo_despues,
        updated_at = now()
    where id = v_cuponera.id;

    insert into public.clases_particulares_historial (
      alumno_id, cuponera_id, tipo, cantidad, saldo_anterior, saldo_despues,
      observacion
    ) values (
      v_reserva.alumno_id, v_cuponera.id, 'devolucion', 1,
      v_saldo_anterior, v_saldo_despues,
      coalesce(nullif(trim(p_motivo), ''), 'Crédito devuelto desde PR Personal')
    );

    v_reserva.credito_consumido := false;
    v_reserva.credito_devuelto := true;
  end if;

  update public.pr_personal_reservas
  set estado = p_estado,
      motivo_estado = p_motivo,
      realizada_en = case when p_estado = 'realizada' then coalesce(realizada_en, now()) else realizada_en end,
      suspendida_en = case when p_estado = 'suspendida' then now() else suspendida_en end,
      cancelada_en = case when p_estado = 'cancelada' then now() else cancelada_en end,
      credito_consumido = v_reserva.credito_consumido,
      credito_devuelto = v_reserva.credito_devuelto,
      updated_at = now()
  where id = v_reserva.id;

  return jsonb_build_object(
    'reserva_id', v_reserva.id,
    'estado_anterior', v_reserva.estado,
    'estado_nuevo', p_estado,
    'saldo_anterior', v_saldo_anterior,
    'saldo_despues', v_saldo_despues,
    'credito_consumido', v_reserva.credito_consumido,
    'credito_devuelto', v_reserva.credito_devuelto
  );
end;
$function$
;
ALTER FUNCTION "public"."pr_personal_cambiar_estado"(p_reserva_id bigint, p_estado text, p_motivo text) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_personal_cambiar_estado"(p_reserva_id bigint, p_estado text, p_motivo text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_personal_cambiar_estado"(p_reserva_id bigint, p_estado text, p_motivo text) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_personal_cambiar_estado"(p_reserva_id bigint, p_estado text, p_motivo text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."pr_personal_cambiar_estado"(p_reserva_id bigint, p_estado text, p_motivo text) TO "service_role";
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
$function$
;
ALTER FUNCTION "public"."pr_process_shifter_activity"(p_activity_id uuid) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_process_shifter_activity"(p_activity_id uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_process_shifter_activity"(p_activity_id uuid) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_process_shifter_activity"(p_activity_id uuid) TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_profile_media_path(p_slot_key text, p_ext text)
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ declare pid text:=public.pr_current_profile_id(); begin if pid is null then raise exception 'Perfil PR no encontrado'; end if; return pid||'/profile-'||regexp_replace(p_slot_key,'[^a-zA-Z0-9_-]','','g')||'-'||gen_random_uuid()::text||'.'||regexp_replace(lower(p_ext),'[^a-z0-9]','','g'); end $function$
;
ALTER FUNCTION "public"."pr_profile_media_path"(p_slot_key text, p_ext text) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_profile_media_path"(p_slot_key text, p_ext text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_profile_media_path"(p_slot_key text, p_ext text) TO PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."pr_profile_media_path"(p_slot_key text, p_ext text) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_profile_media_path"(p_slot_key text, p_ext text) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."pr_profile_media_path"(p_slot_key text, p_ext text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."pr_profile_media_path"(p_slot_key text, p_ext text) TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_publish_training_completion_to_feed()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_task public.pr_training_tasks%rowtype; v_title text; v_desc text;
begin
 if lower(coalesce(new.status,''))<>'completed' or new.completed_at is null then return new; end if;
 if tg_op='UPDATE' and lower(coalesce(old.status,''))='completed' and old.completed_at is not null then return new; end if;
 select * into v_task from public.pr_training_tasks where id=new.task_id;
 if v_task.id is null or v_task.event_slug<>'shifter-marathon-2026' then return new; end if;
 v_title:=case (v_task.sort_order%6) when 1 then 'Deber '||lpad(v_task.sort_order::text,2,'0')||' superado · '||v_task.title when 2 then 'Road to Shifter avanza · '||v_task.title when 3 then 'Trabajo hecho · Deber '||lpad(v_task.sort_order::text,2,'0') when 4 then 'Un deber más en la cuenta · '||v_task.title when 5 then 'Deber registrado · '||v_task.title else 'Seguimos sumando · Deber '||lpad(v_task.sort_order::text,2,'0') end;
 v_desc:=case (v_task.sort_order%5) when 0 then 'Completó este trabajo de Road to Shifter. El proceso sigue sumando.' when 1 then 'Deber registrado desde Strava. Un paso más en la preparación para Shifter.' when 2 then 'Trabajo registrado. La preparación sigue en movimiento.' when 3 then 'Registró este entrenamiento y ya quedó marcado en su Road to Shifter.' else 'Sesión registrada. Seguimos construyendo el camino a Shifter.' end;
 if not exists(select 1 from public.actividad_pr a where a.alumno_id=new.profile_id and a.creado_por_id='training:'||new.id::text) then insert into public.actividad_pr(alumno_id,tipo,titulo,descripcion,fecha,created_at,creado_por_id,creado_por_nombre,creado_por_role,eliminado) values(new.profile_id,'Deberes',v_title,v_desc,new.completed_at,now(),'training:'||new.id::text,'Road to Shifter','system',false); end if;
 return new;
end;$function$
;
ALTER FUNCTION "public"."pr_publish_training_completion_to_feed"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_publish_training_completion_to_feed"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_publish_training_completion_to_feed"() TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_publish_training_completion_to_feed"() TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_reconcile_shifter_training(p_since interval DEFAULT '30 days'::interval)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v record;
  v_count integer := 0;
begin
  for v in
    select a.id
    from public.pr_activities a
    join public.pr_training_enrollments e
      on e.profile_id=a.alumno_id
     and e.event_slug='shifter-marathon-2026'
     and e.active=true
     and coalesce(e.category,'NO')<>'NO'
    where lower(coalesce(a.fuente,''))='strava'
      and a.deporte_strava='InlineSkate'
      and coalesce(a.eliminada,false)=false
      and a.fecha_inicio >= now()-p_since
      and (
        upper(coalesce(a.nombre,'')) like 'PR-SHIFTER-%'
        or upper(coalesce(a.nombre,'')) ~ '(^|[^0-9])DEBER[[:space:]]*0?[0-9]+([^0-9]|$)'
        or upper(coalesce(a.nombre,'')) ~ '(^|[^A-Z0-9])D0?[0-9]+([^0-9]|$)'
      )
    order by a.fecha_inicio, a.id
  loop
    perform public.pr_process_shifter_activity(v.id);
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$function$
;
ALTER FUNCTION "public"."pr_reconcile_shifter_training"(p_since interval) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_reconcile_shifter_training"(p_since interval) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_reconcile_shifter_training"(p_since interval) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_reconcile_shifter_training"(p_since interval) TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_referral_code_base(p_name text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$ select upper(regexp_replace(translate(coalesce(p_name,'PR'), 'ÁÉÍÓÚÜÑáéíóúüñ', 'AEIOUUNaeiouun'), '[^A-Za-z0-9]', '', 'g')) || 'PR' $function$
;
ALTER FUNCTION "public"."pr_referral_code_base"(p_name text) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_referral_code_base"(p_name text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_referral_code_base"(p_name text) TO PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."pr_referral_code_base"(p_name text) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_referral_code_base"(p_name text) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."pr_referral_code_base"(p_name text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."pr_referral_code_base"(p_name text) TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_referral_confirm_timestamp_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$ begin if new.status='confirmado' and new.confirmed_at is null then new.confirmed_at:=now(); end if; return new; end $function$
;
ALTER FUNCTION "public"."pr_referral_confirm_timestamp_trigger"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_referral_confirm_timestamp_trigger"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_referral_confirm_timestamp_trigger"() TO PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."pr_referral_confirm_timestamp_trigger"() TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_referral_confirm_timestamp_trigger"() TO "anon";
GRANT EXECUTE ON FUNCTION "public"."pr_referral_confirm_timestamp_trigger"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."pr_referral_confirm_timestamp_trigger"() TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_referral_progress(p_profile_id text)
 RETURNS TABLE(confirmed_total bigint, confirmed_last_12m bigint, next_threshold integer, next_reward text, remaining integer, reward_50_status text, reward_free_status text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
with counts as (
  select
    count(*) filter (where status='confirmado')::bigint as total,
    count(*) filter (where status='confirmado' and coalesce(confirmed_at,created_at) >= now() - interval '12 months')::bigint as last12
  from pr_referrals where referrer_profile_id=p_profile_id
), rewards as (
  select
    max(status) filter (where reward_type='50_percent_month') as r50,
    max(status) filter (where reward_type='free_month') as r100
  from pr_referral_rewards where referrer_profile_id=p_profile_id
)
select
  counts.total,
  counts.last12,
  case when counts.total < 5 then 5 when counts.last12 < 10 then 10 else 10 end,
  case when counts.total < 5 then '50% OFF por 1 mes' when counts.last12 < 10 then '1 mes gratis' else 'Meta máxima alcanzada' end,
  case when counts.total < 5 then greatest(0,5-counts.total)::int when counts.last12 < 10 then greatest(0,10-counts.last12)::int else 0 end,
  rewards.r50,
  rewards.r100
from counts cross join rewards;
$function$
;
ALTER FUNCTION "public"."pr_referral_progress"(p_profile_id text) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_referral_progress"(p_profile_id text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_referral_progress"(p_profile_id text) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_referral_progress"(p_profile_id text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."pr_referral_progress"(p_profile_id text) TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_referral_reward_after_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ begin if new.status='confirmado' and (tg_op='INSERT' or old.status is distinct from new.status) then perform pr_refresh_referral_rewards(new.referrer_profile_id); end if; return null; end $function$
;
ALTER FUNCTION "public"."pr_referral_reward_after_trigger"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_referral_reward_after_trigger"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_referral_reward_after_trigger"() TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_referral_reward_after_trigger"() TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_referral_reward_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ begin
  if new.status='confirmado' and (tg_op='INSERT' or old.status is distinct from new.status) then
    if new.confirmed_at is null then new.confirmed_at:=now(); end if;
    perform pr_refresh_referral_rewards(new.referrer_profile_id);
  end if;
  return new;
end $function$
;
ALTER FUNCTION "public"."pr_referral_reward_trigger"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_referral_reward_trigger"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_referral_reward_trigger"() TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_referral_reward_trigger"() TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_refresh_referral_rewards(p_profile_id text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_total bigint; v_12m bigint; begin
  select count(*) filter (where status='confirmado'), count(*) filter (where status='confirmado' and coalesce(confirmed_at,created_at) >= now() - interval '12 months') into v_total,v_12m from pr_referrals where referrer_profile_id=p_profile_id;
  if v_total >= 5 then
    insert into pr_referral_rewards(referrer_profile_id,reward_type,threshold,discount_percent,expires_at)
    values(p_profile_id,'50_percent_month',5,50,now()+interval '12 months') on conflict(referrer_profile_id,reward_type) do nothing;
  end if;
  if v_12m >= 10 then
    insert into pr_referral_rewards(referrer_profile_id,reward_type,threshold,discount_percent,expires_at)
    values(p_profile_id,'free_month',10,100,now()+interval '12 months') on conflict(referrer_profile_id,reward_type) do nothing;
  end if;
end $function$
;
ALTER FUNCTION "public"."pr_refresh_referral_rewards"(p_profile_id text) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_refresh_referral_rewards"(p_profile_id text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_refresh_referral_rewards"(p_profile_id text) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_refresh_referral_rewards"(p_profile_id text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."pr_refresh_referral_rewards"(p_profile_id text) TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_registrar_mensualidad(p_alumno_id text, p_periodo date, p_monto numeric, p_fecha_pago date, p_metodo text, p_observacion text DEFAULT NULL::text, p_registrado_por_id text DEFAULT NULL::text, p_registrado_por_nombre text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
 v_periodo date := date_trunc('month', p_periodo)::date;
 v_due_day int;
 v_next_due date;
 v_mid uuid;
begin
 if not public.puedo_gestionar_pagos() then raise exception 'No tenés autorización para registrar pagos'; end if;
 if p_alumno_id is null or p_periodo is null or p_fecha_pago is null or p_monto is null or p_monto <= 0 then
   raise exception 'Datos de pago inválidos';
 end if;
 select vencimiento_dia into v_due_day from public.pr_tesoreria_config where id=1;
 if v_due_day is null then raise exception 'Configuración de vencimiento no disponible'; end if;
 v_next_due := ((v_periodo + interval '1 month')::date + (v_due_day - 1));
 insert into public.pr_mensualidades(alumno_id,periodo,monto,vencimiento,estado,fecha_pago,metodo,observacion,registrado_por_id,registrado_por_nombre,updated_at)
 values(p_alumno_id,v_periodo,p_monto,v_periodo+(v_due_day-1),'pagado',p_fecha_pago,p_metodo,p_observacion,p_registrado_por_id,p_registrado_por_nombre,now())
 on conflict(alumno_id,periodo) do update set
 monto=excluded.monto, estado='pagado', fecha_pago=excluded.fecha_pago, metodo=excluded.metodo,
 observacion=excluded.observacion, registrado_por_id=excluded.registrado_por_id,
 registrado_por_nombre=excluded.registrado_por_nombre, updated_at=now()
 WHERE public.pr_mensualidades.estado IS DISTINCT FROM 'pagado'
 returning id into v_mid;
 if v_mid is null then
   raise exception 'Esta mensualidad ya figura como pagada. No se registró otro cobro.';
 end if;
 insert into public.pr_tesoreria_movimientos(fecha,tipo,categoria,concepto,monto,metodo,alumno_id,mensualidad_id,observacion,registrado_por_id,registrado_por_nombre)
 values(p_fecha_pago,'ingreso','mensualidad','Mensualidad '||to_char(v_periodo,'MM/YYYY'),p_monto,p_metodo,p_alumno_id,v_mid,p_observacion,p_registrado_por_id,p_registrado_por_nombre);
 update public.profiles
 set ultimo_pago=p_fecha_pago, mensualidad_hasta=v_next_due, acceso_habilitado=true, estado='Activo',
 prcard_activa=true, estado_modificado_por=p_registrado_por_nombre, estado_modificado_en=now(), updated_at=now()
 where id=p_alumno_id;
end $function$
;
ALTER FUNCTION "public"."pr_registrar_mensualidad"(p_alumno_id text, p_periodo date, p_monto numeric, p_fecha_pago date, p_metodo text, p_observacion text, p_registrado_por_id text, p_registrado_por_nombre text) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_registrar_mensualidad"(p_alumno_id text, p_periodo date, p_monto numeric, p_fecha_pago date, p_metodo text, p_observacion text, p_registrado_por_id text, p_registrado_por_nombre text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_registrar_mensualidad"(p_alumno_id text, p_periodo date, p_monto numeric, p_fecha_pago date, p_metodo text, p_observacion text, p_registrado_por_id text, p_registrado_por_nombre text) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_registrar_mensualidad"(p_alumno_id text, p_periodo date, p_monto numeric, p_fecha_pago date, p_metodo text, p_observacion text, p_registrado_por_id text, p_registrado_por_nombre text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."pr_registrar_mensualidad"(p_alumno_id text, p_periodo date, p_monto numeric, p_fecha_pago date, p_metodo text, p_observacion text, p_registrado_por_id text, p_registrado_por_nombre text) TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_rollermap_approve_location(location_id uuid, slug text)
 RETURNS uuid
 LANGUAGE sql
 SET search_path TO ''
AS $function$select rollermap_private.approve_location(location_id,slug)$function$
;
ALTER FUNCTION "public"."pr_rollermap_approve_location"(location_id uuid, slug text) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_rollermap_approve_location"(location_id uuid, slug text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_rollermap_approve_location"(location_id uuid, slug text) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_rollermap_approve_location"(location_id uuid, slug text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."pr_rollermap_approve_location"(location_id uuid, slug text) TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_rollermap_submit_location(payload jsonb)
 RETURNS uuid
 LANGUAGE sql
 SET search_path TO ''
AS $function$select rollermap_private.submit_location(payload)$function$
;
ALTER FUNCTION "public"."pr_rollermap_submit_location"(payload jsonb) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_rollermap_submit_location"(payload jsonb) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_rollermap_submit_location"(payload jsonb) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_rollermap_submit_location"(payload jsonb) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."pr_rollermap_submit_location"(payload jsonb) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."pr_rollermap_submit_location"(payload jsonb) TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_save_profile_showcase(p_slot_key text, p_title text, p_image_url text, p_sort_order integer DEFAULT 0)
 RETURNS pr_profile_showcase
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ declare pid text; saved public.pr_profile_showcase; begin pid:=public.pr_current_profile_id(); if pid is null then raise exception 'No encontramos tu perfil PR autenticado'; end if; if p_slot_key not in ('galeria','patines','ruedas','calle') then raise exception 'Slot de perfil inválido'; end if; if p_slot_key <> 'galeria' then delete from public.pr_profile_showcase where profile_id=pid and slot_key=p_slot_key; end if; insert into public.pr_profile_showcase(profile_id,slot_key,title,image_url,sort_order) values(pid,p_slot_key,coalesce(nullif(trim(p_title),''),'Momento'),p_image_url,p_sort_order) returning * into saved; return saved; end $function$
;
ALTER FUNCTION "public"."pr_save_profile_showcase"(p_slot_key text, p_title text, p_image_url text, p_sort_order integer) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_save_profile_showcase"(p_slot_key text, p_title text, p_image_url text, p_sort_order integer) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_save_profile_showcase"(p_slot_key text, p_title text, p_image_url text, p_sort_order integer) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_save_profile_showcase"(p_slot_key text, p_title text, p_image_url text, p_sort_order integer) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."pr_save_profile_showcase"(p_slot_key text, p_title text, p_image_url text, p_sort_order integer) TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_tesoreria_resumen_historico(p_desde date DEFAULT NULL::date, p_hasta date DEFAULT NULL::date)
 RETURNS TABLE(periodo date, ingresos numeric, gastos numeric, claudio numeric, lucia numeric, total_pagado numeric)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ select m.periodo, coalesce(sum(case when m.estado='pagado' then m.monto else 0 end),0)::numeric as ingresos, coalesce((select sum(x.monto) from pr_tesoreria_movimientos x where x.tipo='gasto' and x.fecha >= m.periodo and x.fecha < (m.periodo + interval '1 month')),0)::numeric as gastos, coalesce(sum(case when m.estado='pagado' and m.metodo='Transferencia Claudio' then m.monto else 0 end),0)::numeric as claudio, coalesce(sum(case when m.estado='pagado' and m.metodo='Transferencia Lucía' then m.monto else 0 end),0)::numeric as lucia, coalesce(sum(case when m.estado='pagado' then m.monto else 0 end),0)::numeric as total_pagado from pr_mensualidades m where (p_desde is null or m.periodo>=p_desde) and (p_hasta is null or m.periodo<=p_hasta) group by m.periodo order by m.periodo desc $function$
;
ALTER FUNCTION "public"."pr_tesoreria_resumen_historico"(p_desde date, p_hasta date) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_tesoreria_resumen_historico"(p_desde date, p_hasta date) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_tesoreria_resumen_historico"(p_desde date, p_hasta date) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_tesoreria_resumen_historico"(p_desde date, p_hasta date) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."pr_tesoreria_resumen_historico"(p_desde date, p_hasta date) TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_track_admin_add_tag(p_item_id uuid, p_label text DEFAULT NULL::text)
 RETURNS pr_track_tags
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ declare r public.pr_track_tags; n integer; begin if not public.pr_track_is_staff() then raise exception 'No autorizado'; end if; if not exists(select 1 from public.pr_track_items where id=p_item_id and estado<>'retired') then raise exception 'Track ID no disponible'; end if; select count(*)+1 into n from public.pr_track_tags where item_id=p_item_id; insert into public.pr_track_tags(item_id,etiqueta,estado,asignado_por) values(p_item_id,left(coalesce(nullif(trim(p_label),''),'NFC '||n),80),'assigned',public.pr_track_current_profile_id()) returning * into r; return r; end $function$
;
ALTER FUNCTION "public"."pr_track_admin_add_tag"(p_item_id uuid, p_label text) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_track_admin_add_tag"(p_item_id uuid, p_label text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_track_admin_add_tag"(p_item_id uuid, p_label text) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_track_admin_add_tag"(p_item_id uuid, p_label text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."pr_track_admin_add_tag"(p_item_id uuid, p_label text) TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_track_admin_create_item(p_alumno_id text, p_nombre text DEFAULT 'Nuevo equipo'::text, p_tipo text DEFAULT 'patines'::text)
 RETURNS pr_track_items
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  r public.pr_track_items;
begin
  if not public.pr_track_is_staff() then
    raise exception 'No autorizado';
  end if;

  if not exists(select 1 from public.profiles p where p.id=p_alumno_id) then
    raise exception 'Alumno no disponible';
  end if;

  insert into public.pr_track_items(alumno_id,nombre,tipo,estado,activado_por)
  values(
    p_alumno_id,
    left(coalesce(nullif(trim(p_nombre),''),'Nuevo equipo'),120),
    left(coalesce(nullif(trim(p_tipo),''),'patines'),40),
    'draft',
    public.pr_track_current_profile_id()
  )
  returning * into r;

  insert into public.pr_track_tags(item_id,etiqueta,estado,asignado_por)
  values(r.id,'NFC principal','assigned',public.pr_track_current_profile_id());

  return r;
end
$function$
;
ALTER FUNCTION "public"."pr_track_admin_create_item"(p_alumno_id text, p_nombre text, p_tipo text) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_track_admin_create_item"(p_alumno_id text, p_nombre text, p_tipo text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_track_admin_create_item"(p_alumno_id text, p_nombre text, p_tipo text) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_track_admin_create_item"(p_alumno_id text, p_nombre text, p_tipo text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."pr_track_admin_create_item"(p_alumno_id text, p_nombre text, p_tipo text) TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_track_admin_retire_tag(p_tag_id uuid)
 RETURNS pr_track_tags
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ declare r public.pr_track_tags; begin if not public.pr_track_is_staff() then raise exception 'No autorizado'; end if; update public.pr_track_tags set estado='retired',updated_at=now() where id=p_tag_id and estado<>'retired' returning * into r; if r.id is null then raise exception 'NFC no disponible'; end if; return r; end $function$
;
ALTER FUNCTION "public"."pr_track_admin_retire_tag"(p_tag_id uuid) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_track_admin_retire_tag"(p_tag_id uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_track_admin_retire_tag"(p_tag_id uuid) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_track_admin_retire_tag"(p_tag_id uuid) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."pr_track_admin_retire_tag"(p_tag_id uuid) TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_track_current_profile_id()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ select p.id from public.profiles p where p.auth_user_id=auth.uid() limit 1 $function$
;
ALTER FUNCTION "public"."pr_track_current_profile_id"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_track_current_profile_id"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_track_current_profile_id"() TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_track_current_profile_id"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."pr_track_current_profile_id"() TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_track_is_staff()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ select exists(select 1 from public.profiles p where p.auth_user_id=auth.uid() and (p.role in ('admin','profesor') or p.es_profesor=true)) $function$
;
ALTER FUNCTION "public"."pr_track_is_staff"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_track_is_staff"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_track_is_staff"() TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_track_is_staff"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."pr_track_is_staff"() TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_track_public(p_public_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare i public.pr_track_items;p public.profiles;enforcement boolean:=false;due public.pr_mensualidades;allowed boolean:=false;
begin
  select * into i from public.pr_track_items where public_id=p_public_id limit 1;
  if i.id is null then return jsonb_build_object('status','not_found'); end if;
  select * into p from public.profiles where id=i.alumno_id limit 1;
  select coalesce(enforcement_enabled,false) into enforcement from public.pr_tesoreria_config where id=1;
  select * into due from public.pr_mensualidades where alumno_id=i.alumno_id and periodo=date_trunc('month',timezone('America/Montevideo',now()))::date limit 1;
  allowed:=i.estado in ('active','lost') and coalesce(p.acceso_habilitado,true)
    and (coalesce(p.exento_mensualidad,false) or p.role in ('admin','profesor') or not enforcement
      or extract(day from timezone('America/Montevideo',now()))::int<11
      or lower(coalesce(due.estado,'')) in ('pagado','bonificado','acuerdo')
      or coalesce(due.gracia_hasta,due.vencimiento)>=timezone('America/Montevideo',now())::date);
  if not allowed then return jsonb_build_object('status','paused','public_id',i.public_id); end if;
  return jsonb_build_object(
    'status',i.estado,'public_id',i.public_id,
    'item',jsonb_build_object(
      'tipo',i.tipo,'marca',i.marca,'modelo',i.modelo,'color',i.color,
      'descripcion',i.descripcion,'foto_url',i.foto_url,'detalles',coalesce(i.detalles,'{}'::jsonb)
    ),
    'owner',jsonb_strip_nulls(jsonb_build_object(
      'nombre',p.nombre,'apellido',p.apellido,'foto',p.foto,'telefono',p.telefono,'ciudad',p.ciudad,'email',p.email
    ))
  );
end $function$
;
ALTER FUNCTION "public"."pr_track_public"(p_public_id text) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_track_public"(p_public_id text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_track_public"(p_public_id text) TO PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."pr_track_public"(p_public_id text) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_track_public"(p_public_id text) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."pr_track_public"(p_public_id text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."pr_track_public"(p_public_id text) TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_track_public_report(p_public_id text, p_kind text DEFAULT 'found'::text, p_note text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare i public.pr_track_items;
begin
  if p_kind not in ('found','info') then raise exception 'Tipo inválido'; end if;
  select * into i from public.pr_track_items where public_id=p_public_id and estado in ('active','lost') limit 1;
  if i.id is null then return jsonb_build_object('ok',false); end if;
  insert into public.pr_track_reports(item_id,kind,note) values(i.id,p_kind,left(coalesce(p_note,''),500));
  return jsonb_build_object('ok',true);
end $function$
;
ALTER FUNCTION "public"."pr_track_public_report"(p_public_id text, p_kind text, p_note text) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_track_public_report"(p_public_id text, p_kind text, p_note text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_track_public_report"(p_public_id text, p_kind text, p_note text) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_track_public_report"(p_public_id text, p_kind text, p_note text) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."pr_track_public_report"(p_public_id text, p_kind text, p_note text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."pr_track_public_report"(p_public_id text, p_kind text, p_note text) TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_track_scan(p_public_id text, p_scan_key text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare i public.pr_track_items; inserted_count integer:=0;begin
 select * into i from public.pr_track_items where public_id=p_public_id limit 1;
 if i.id is null then return jsonb_build_object('ok',false); end if;
 if p_scan_key is null or length(trim(p_scan_key))<8 then
   insert into public.pr_track_scans(item_id) values(i.id); inserted_count:=1;
 else
   insert into public.pr_track_scans(item_id,scan_key) values(i.id,left(p_scan_key,120)) on conflict do nothing;
   get diagnostics inserted_count = row_count;
 end if;
 if inserted_count>0 then update public.pr_track_items set scans=scans+1,ultimo_scan=now() where id=i.id; end if;
 return jsonb_build_object('ok',true,'counted',inserted_count>0);
end $function$
;
ALTER FUNCTION "public"."pr_track_scan"(p_public_id text, p_scan_key text) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_track_scan"(p_public_id text, p_scan_key text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_track_scan"(p_public_id text, p_scan_key text) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_track_scan"(p_public_id text, p_scan_key text) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."pr_track_scan"(p_public_id text, p_scan_key text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."pr_track_scan"(p_public_id text, p_scan_key text) TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_track_set_state(p_item_id uuid, p_state text)
 RETURNS pr_track_items
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare r public.pr_track_items;
begin
  if p_state not in ('active','paused','lost','retired') then
    raise exception 'Estado inválido';
  end if;

  select * into r from public.pr_track_items where id=p_item_id limit 1;
  if r.id is null then raise exception 'Track ID no disponible'; end if;

  if public.pr_track_is_staff() then
    null;
  elsif r.alumno_id=public.pr_track_current_profile_id() then
    if not (
      (r.estado='active' and p_state='lost')
      or (r.estado='lost' and p_state='active')
    ) then
      raise exception 'Transición de estado no permitida';
    end if;
  else
    raise exception 'Track ID no disponible';
  end if;

  update public.pr_track_items
  set estado=p_state,updated_at=now()
  where id=p_item_id
  returning * into r;
  return r;
end $function$
;
ALTER FUNCTION "public"."pr_track_set_state"(p_item_id uuid, p_state text) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_track_set_state"(p_item_id uuid, p_state text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_track_set_state"(p_item_id uuid, p_state text) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_track_set_state"(p_item_id uuid, p_state text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."pr_track_set_state"(p_item_id uuid, p_state text) TO "service_role";
SET check_function_bodies = on;

