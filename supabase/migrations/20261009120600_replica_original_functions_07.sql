-- Original definitions restored exclusively to PR NEXT beta.
SET check_function_bodies = off;
CREATE SCHEMA IF NOT EXISTS rollermap_private;
CREATE SCHEMA IF NOT EXISTS pr_training_internal;
REVOKE ALL ON SCHEMA rollermap_private, pr_training_internal FROM PUBLIC;
CREATE OR REPLACE FUNCTION public.sync_referral_from_enrollment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if new.id is null then return new; end if;
  if new.estado='confirmado' then
    update public.pr_referrals set status='confirmado', confirmed_at=coalesce(confirmed_at,now()), updated_at=now()
    where enrollment_id=new.id and status<>'confirmado';
  elsif old.estado='confirmado' and new.estado<>'confirmado' then
    update public.pr_referrals set status='cancelado', updated_at=now() where enrollment_id=new.id;
  end if;
  return new;
end $function$;
ALTER FUNCTION "public"."sync_referral_from_enrollment"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."sync_referral_from_enrollment"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."sync_referral_from_enrollment"() TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."sync_referral_from_enrollment"() TO "service_role";
CREATE OR REPLACE FUNCTION public.sync_toma3_rollerfeed_post()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_description text;
  v_existing uuid;
begin
  select string_agg(
    case rank
      when 1 then '🥇 '
      when 2 then '🥈 '
      when 3 then '🥉 '
      else ''
    end || display_name || ' · ' || to_char(speed_kmh, 'FM999990.00') || ' km/h · ' ||
    trim(to_char(distance_km, 'FM999990.00')) || ' km · ' ||
    (case when time_seconds >= 3600
      then floor(time_seconds/3600)::text || ':' || lpad(floor((time_seconds%3600)/60)::text,2,'0') || ':' || lpad((time_seconds%60)::text,2,'0')
      else floor(time_seconds/60)::text || ':' || lpad((time_seconds%60)::text,2,'0')
    end),
    E'\n' order by rank
  ) into v_description
  from public.get_rollerfeed_live_podium('toma-3-2026-09-02')
  where rank between 1 and 3;

  v_description := coalesce(v_description, 'La clasificación se está actualizando con las nuevas tomas registradas.') ||
    E'\n\n⚡ Podio provisional de la Toma de Tiempo 3. Se actualiza con cada nueva marca válida.\nNo es solo patinar. Es pertenecer.';

  select id into v_existing
  from public.rollerfeed_events
  where titulo = '🏆 PODIO · TOMA DE TIEMPO 3'
  order by created_at desc
  limit 1;

  if v_existing is null then
    insert into public.rollerfeed_events (
      titulo, descripcion, inicio, fin, mes_referencia, lugar, link, color, estado, visible_feed, creado_por_nombre
    ) values (
      '🏆 PODIO · TOMA DE TIEMPO 3',
      v_description,
      now(),
      now() + interval '72 hours',
      'Miércoles 2 de septiembre de 2026 · visible durante 72 horas',
      'Punta Rollers · Ranking oficial',
      '',
      'gold',
      'Publicado',
      true,
      'Punta Rollers'
    );
  else
    update public.rollerfeed_events
    set descripcion = v_description,
        fin = greatest(fin, now() + interval '72 hours'),
        visible_feed = true,
        estado = 'Publicado',
        updated_at = now()
    where id = v_existing;
  end if;
end;
$function$
;
ALTER FUNCTION "public"."sync_toma3_rollerfeed_post"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."sync_toma3_rollerfeed_post"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."sync_toma3_rollerfeed_post"() TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."sync_toma3_rollerfeed_post"() TO "service_role";
CREATE OR REPLACE FUNCTION public.sync_training_task_result_to_rollerfeed()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  return case when tg_op='DELETE' then old else new end;
end;$function$
;
ALTER FUNCTION "public"."sync_training_task_result_to_rollerfeed"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."sync_training_task_result_to_rollerfeed"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."sync_training_task_result_to_rollerfeed"() TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."sync_training_task_result_to_rollerfeed"() TO "service_role";
CREATE OR REPLACE FUNCTION public.trigger_sync_toma3_rollerfeed_post()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if (tg_op = 'DELETE' and old.fecha = date '2026-09-02')
     or (tg_op <> 'DELETE' and new.fecha = date '2026-09-02') then
    perform public.sync_toma3_rollerfeed_post();
  end if;
  return coalesce(new, old);
end;
$function$
;
ALTER FUNCTION "public"."trigger_sync_toma3_rollerfeed_post"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."trigger_sync_toma3_rollerfeed_post"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."trigger_sync_toma3_rollerfeed_post"() TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."trigger_sync_toma3_rollerfeed_post"() TO "service_role";
CREATE OR REPLACE FUNCTION public.validate_pr_referral_code(p_code text)
 RETURNS TABLE(profile_id text, display_name text, code text, discount_percent numeric)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with norm as (select regexp_replace(upper(trim(coalesce(p_code,''))), '\s+', '', 'g') as code)
  select 'campaign:rollerween'::text, 'RollerWeen 2026'::text, 'ROLLERWEENPR'::text, 10::numeric
  from norm where code='ROLLERWEENPR'
  union all
  select p.id, trim(coalesce(p.nombre,'')||' '||coalesce(p.apellido,'')), c.code, 10::numeric
  from pr_referral_codes c join profiles p on p.id=c.profile_id cross join norm
  where c.active=true and regexp_replace(upper(trim(c.code)), '\s+', '', 'g')=norm.code
    and coalesce(p.estado,'Activo')='Activo' and norm.code<>'ROLLERWEENPR'
  limit 1
$function$
;
ALTER FUNCTION "public"."validate_pr_referral_code"(p_code text) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."validate_pr_referral_code"(p_code text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."validate_pr_referral_code"(p_code text) TO PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."validate_pr_referral_code"(p_code text) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."validate_pr_referral_code"(p_code text) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."validate_pr_referral_code"(p_code text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."validate_pr_referral_code"(p_code text) TO "service_role";
SET check_function_bodies = on;

