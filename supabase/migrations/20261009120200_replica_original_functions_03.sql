-- Original definitions restored exclusively to PR NEXT beta.
SET check_function_bodies = off;
CREATE SCHEMA IF NOT EXISTS rollermap_private;
CREATE SCHEMA IF NOT EXISTS pr_training_internal;
REVOKE ALL ON SCHEMA rollermap_private, pr_training_internal FROM PUBLIC;
CREATE OR REPLACE FUNCTION public.community_toggle_repost(p_post_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ declare pid text:=public.pr_current_profile_id(); begin if exists(select 1 from community_reposts where post_id=p_post_id and profile_id=pid) then delete from community_reposts where post_id=p_post_id and profile_id=pid; return false; end if; if not exists(select 1 from community_posts p where p.id=p_post_id and community_are_friends(pid,p.author_id)) then raise exception 'No podés repostear esta publicación'; end if; insert into community_reposts(post_id,profile_id) values(p_post_id,pid); return true; end $function$;
ALTER FUNCTION "public"."community_toggle_repost"(p_post_id uuid) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."community_toggle_repost"(p_post_id uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."community_toggle_repost"(p_post_id uuid) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."community_toggle_repost"(p_post_id uuid) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."community_toggle_repost"(p_post_id uuid) TO "service_role";
CREATE OR REPLACE FUNCTION public.community_unread_count()
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ select count(*)::integer from community_notifications where recipient_id=public.pr_current_profile_id() and read_at is null $function$
;
ALTER FUNCTION "public"."community_unread_count"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."community_unread_count"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."community_unread_count"() TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."community_unread_count"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."community_unread_count"() TO "service_role";
CREATE OR REPLACE FUNCTION public.create_default_community_privacy()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.community_privacy (profile_id)
    values (new.id)
      on conflict (profile_id) do nothing;

        return new;
        end;
        $function$
;
ALTER FUNCTION "public"."create_default_community_privacy"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."create_default_community_privacy"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."create_default_community_privacy"() TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."create_default_community_privacy"() TO "service_role";
CREATE OR REPLACE FUNCTION public.editar_clase_particular(p_historial_id text, p_fecha_clase timestamp with time zone, p_observacion text, p_modificado_por_id text, p_modificado_por_nombre text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
                    declare
                      v_cuponera_id text;
                        v_ultima_clase timestamptz;
                          v_ultima_observacion text;
                          begin
                            if not public.soy_staff() then
                                raise exception 'No autorizado';
                                  end if;

                                    select h.cuponera_id::text
                                        into v_cuponera_id
                                          from public.clases_particulares_historial h
                                            where h.id::text = p_historial_id
                                                and h.fecha_clase is not null
                                                    and coalesce(h.anulado, false) = false
                                                      for update;

                                                        if v_cuponera_id is null then
                                                            raise exception 'La clase no existe o ya fue anulada';
                                                              end if;

                                                                update public.clases_particulares_historial
                                                                  set
                                                                      fecha_clase = p_fecha_clase,
                                                                          observacion = trim(coalesce(p_observacion, '')),
                                                                              motivo_correccion = 'Edición de fecha o devolución',
                                                                                  corregido_por_id = p_modificado_por_id,
                                                                                      corregido_por_nombre = p_modificado_por_nombre,
                                                                                          corregido_en = now()
                                                                                            where id::text = p_historial_id;

                                                                                              select
                                                                                                  h.fecha_clase,
                                                                                                      h.observacion
                                                                                                        into
                                                                                                            v_ultima_clase,
                                                                                                                v_ultima_observacion
                                                                                                                  from public.clases_particulares_historial h
                                                                                                                    where h.cuponera_id::text = v_cuponera_id
                                                                                                                        and h.fecha_clase is not null
                                                                                                                            and coalesce(h.anulado, false) = false
                                                                                                                              order by h.fecha_clase desc, h.created_at desc
                                                                                                                                limit 1;

                                                                                                                                  update public.cuponeras_particulares
                                                                                                                                    set
                                                                                                                                        ultima_clase = v_ultima_clase,
                                                                                                                                            ultima_observacion = v_ultima_observacion
                                                                                                                                              where id::text = v_cuponera_id;

                                                                                                                                                return jsonb_build_object(
                                                                                                                                                    'ok', true,
                                                                                                                                                        'mensaje', 'Clase actualizada correctamente'
                                                                                                                                                          );
                                                                                                                                                          end;
                                                                                                                                                          $function$
;
ALTER FUNCTION "public"."editar_clase_particular"(p_historial_id text, p_fecha_clase timestamp with time zone, p_observacion text, p_modificado_por_id text, p_modificado_por_nombre text) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."editar_clase_particular"(p_historial_id text, p_fecha_clase timestamp with time zone, p_observacion text, p_modificado_por_id text, p_modificado_por_nombre text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."editar_clase_particular"(p_historial_id text, p_fecha_clase timestamp with time zone, p_observacion text, p_modificado_por_id text, p_modificado_por_nombre text) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."editar_clase_particular"(p_historial_id text, p_fecha_clase timestamp with time zone, p_observacion text, p_modificado_por_id text, p_modificado_por_nombre text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."editar_clase_particular"(p_historial_id text, p_fecha_clase timestamp with time zone, p_observacion text, p_modificado_por_id text, p_modificado_por_nombre text) TO "service_role";
CREATE OR REPLACE FUNCTION public.editar_observacion_pr(p_actividad_id text, p_titulo text, p_descripcion text, p_modificado_por_id text, p_modificado_por_nombre text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
                                                                                                                                                                                                                                                                                                                                                                                            begin
                                                                                                                                                                                                                                                                                                                                                                                              if not public.soy_staff() then
                                                                                                                                                                                                                                                                                                                                                                                                  raise exception 'No autorizado';
                                                                                                                                                                                                                                                                                                                                                                                                    end if;

                                                                                                                                                                                                                                                                                                                                                                                                      if trim(coalesce(p_titulo, '')) = '' then
                                                                                                                                                                                                                                                                                                                                                                                                          raise exception 'El título no puede quedar vacío';
                                                                                                                                                                                                                                                                                                                                                                                                            end if;

                                                                                                                                                                                                                                                                                                                                                                                                              update public.actividad_pr
                                                                                                                                                                                                                                                                                                                                                                                                                set
                                                                                                                                                                                                                                                                                                                                                                                                                    titulo = trim(p_titulo),
                                                                                                                                                                                                                                                                                                                                                                                                                        descripcion = trim(coalesce(p_descripcion, '')),
                                                                                                                                                                                                                                                                                                                                                                                                                            editado_en = now(),
                                                                                                                                                                                                                                                                                                                                                                                                                                editado_por_id = p_modificado_por_id,
                                                                                                                                                                                                                                                                                                                                                                                                                                    editado_por_nombre = p_modificado_por_nombre
                                                                                                                                                                                                                                                                                                                                                                                                                                      where id::text = p_actividad_id
                                                                                                                                                                                                                                                                                                                                                                                                                                          and lower(tipo) = 'nota'
                                                                                                                                                                                                                                                                                                                                                                                                                                              and coalesce(eliminado, false) = false;

                                                                                                                                                                                                                                                                                                                                                                                                                                                if not found then
                                                                                                                                                                                                                                                                                                                                                                                                                                                    raise exception 'La observación no existe o fue eliminada';
                                                                                                                                                                                                                                                                                                                                                                                                                                                      end if;

                                                                                                                                                                                                                                                                                                                                                                                                                                                        return jsonb_build_object(
                                                                                                                                                                                                                                                                                                                                                                                                                                                            'ok', true,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                'mensaje', 'Observación actualizada correctamente'
                                                                                                                                                                                                                                                                                                                                                                                                                                                                  );
                                                                                                                                                                                                                                                                                                                                                                                                                                                                  end;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                  $function$
;
ALTER FUNCTION "public"."editar_observacion_pr"(p_actividad_id text, p_titulo text, p_descripcion text, p_modificado_por_id text, p_modificado_por_nombre text) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."editar_observacion_pr"(p_actividad_id text, p_titulo text, p_descripcion text, p_modificado_por_id text, p_modificado_por_nombre text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."editar_observacion_pr"(p_actividad_id text, p_titulo text, p_descripcion text, p_modificado_por_id text, p_modificado_por_nombre text) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."editar_observacion_pr"(p_actividad_id text, p_titulo text, p_descripcion text, p_modificado_por_id text, p_modificado_por_nombre text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."editar_observacion_pr"(p_actividad_id text, p_titulo text, p_descripcion text, p_modificado_por_id text, p_modificado_por_nombre text) TO "service_role";
CREATE OR REPLACE FUNCTION public.eliminar_observacion_pr(p_actividad_id text, p_modificado_por_id text, p_modificado_por_nombre text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                        begin
                                                                                                                                                                                                                                                                                                                                                                                                                                                                          if not public.soy_staff() then
                                                                                                                                                                                                                                                                                                                                                                                                                                                                              raise exception 'No autorizado';
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                end if;

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  update public.actividad_pr
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    set
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        eliminado = true,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            eliminado_en = now(),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                eliminado_por_id = p_modificado_por_id,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    eliminado_por_nombre = p_modificado_por_nombre
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      where id::text = p_actividad_id
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          and lower(tipo) = 'nota'
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              and coalesce(eliminado, false) = false;

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                if not found then
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    raise exception 'La observación no existe o ya fue eliminada';
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      end if;

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        return jsonb_build_object(
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            'ok', true,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                'mensaje', 'Observación eliminada correctamente'
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  );
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  end;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  $function$
;
ALTER FUNCTION "public"."eliminar_observacion_pr"(p_actividad_id text, p_modificado_por_id text, p_modificado_por_nombre text) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."eliminar_observacion_pr"(p_actividad_id text, p_modificado_por_id text, p_modificado_por_nombre text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."eliminar_observacion_pr"(p_actividad_id text, p_modificado_por_id text, p_modificado_por_nombre text) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."eliminar_observacion_pr"(p_actividad_id text, p_modificado_por_id text, p_modificado_por_nombre text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."eliminar_observacion_pr"(p_actividad_id text, p_modificado_por_id text, p_modificado_por_nombre text) TO "service_role";
CREATE OR REPLACE FUNCTION public.ensure_pr_referral_code(p_profile_id text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ declare v_name text; v_base text; v_code text; v_n int:=1; begin select code into v_code from pr_referral_codes where profile_id=p_profile_id and active=true; if v_code is not null then return v_code; end if; select coalesce(nullif(trim(nombre),''),'PR') into v_name from profiles where id=p_profile_id; if v_name is null then raise exception 'Perfil no encontrado'; end if; v_base:=pr_referral_code_base(v_name); v_code:=v_base; while exists(select 1 from pr_referral_codes where code=v_code) loop v_n:=v_n+1; v_code:=v_base||v_n::text; end loop; insert into pr_referral_codes(profile_id,code) values(p_profile_id,v_code) on conflict(profile_id) do update set active=true,updated_at=now() returning code into v_code; return v_code; end $function$
;
ALTER FUNCTION "public"."ensure_pr_referral_code"(p_profile_id text) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."ensure_pr_referral_code"(p_profile_id text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."ensure_pr_referral_code"(p_profile_id text) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."ensure_pr_referral_code"(p_profile_id text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."ensure_pr_referral_code"(p_profile_id text) TO "service_role";
CREATE OR REPLACE FUNCTION public.estado_inscripciones_2026()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_abiertas boolean;
begin
  select personalizadas_abiertas into v_abiertas
  from public.pr_inscripciones_config
  where id = 'global';

  return jsonb_build_object(
    'personalizadas_abiertas', coalesce(v_abiertas, true)
  );
end;
$function$
;
ALTER FUNCTION "public"."estado_inscripciones_2026"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."estado_inscripciones_2026"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."estado_inscripciones_2026"() TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."estado_inscripciones_2026"() TO "anon";
GRANT EXECUTE ON FUNCTION "public"."estado_inscripciones_2026"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."estado_inscripciones_2026"() TO "service_role";
CREATE OR REPLACE FUNCTION public.finalize_pr_unlock_campaign(p_campaign_id uuid)
 RETURNS pr_unlock_results
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  c public.pr_unlock_campaigns%rowtype;
  winner record;
  total_km numeric := 0;
  lvl integer := 0;
  prize text := null;
  result_row public.pr_unlock_results%rowtype;
begin
  select * into c from public.pr_unlock_campaigns where id=p_campaign_id;
  if not found then raise exception 'campaign_not_found'; end if;
  if (timezone('America/Montevideo', now()))::date <= c.ends_on then raise exception 'campaign_not_finished'; end if;
  select coalesce(sum(a.distancia_metros),0)/1000.0 into total_km
  from public.pr_inline_skate_activities a
  where coalesce(a.eliminada,false)=false and coalesce(a.es_privada,false)=false and coalesce(a.visible_feed,true)=true
    and lower(coalesce(a.fuente,'strava'))='strava'
    and a.fecha_inicio >= (c.starts_on::timestamp at time zone 'America/Montevideo')
    and a.fecha_inicio < ((c.ends_on + 1)::timestamp at time zone 'America/Montevideo');
  if total_km >= c.prize_3_target_km then lvl:=3; prize:=c.prize_3_title;
  elsif total_km >= c.prize_2_target_km then lvl:=2; prize:=c.prize_2_title;
  elsif total_km >= c.prize_1_target_km then lvl:=1; prize:=c.prize_1_title; end if;
  select a.alumno_id, coalesce(p.nombre,'') || case when coalesce(p.apellido,'')<>'' then ' '||p.apellido else '' end as nombre, p.foto,
         sum(a.distancia_metros)/1000.0 as km
    into winner
  from public.pr_inline_skate_activities a
  left join public.profiles_public p on p.id=a.alumno_id
  where coalesce(a.eliminada,false)=false and coalesce(a.es_privada,false)=false and coalesce(a.visible_feed,true)=true
    and lower(coalesce(a.fuente,'strava'))='strava'
    and a.fecha_inicio >= (c.starts_on::timestamp at time zone 'America/Montevideo')
    and a.fecha_inicio < ((c.ends_on + 1)::timestamp at time zone 'America/Montevideo')
  group by a.alumno_id,p.nombre,p.apellido,p.foto
  order by km desc, a.alumno_id asc limit 1;
  insert into public.pr_unlock_results(campaign_id,winner_profile_id,winner_name,winner_photo,winner_km,unlocked_level,prize_title,group_km,finalized_at)
  values(c.id, case when winner.alumno_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then winner.alumno_id::uuid else null end,
         nullif(trim(winner.nombre),''),winner.foto,coalesce(winner.km,0),lvl,prize,total_km,now())
  on conflict(campaign_id) do nothing;
  select * into result_row from public.pr_unlock_results where campaign_id=c.id;
  return result_row;
end; $function$
;
ALTER FUNCTION "public"."finalize_pr_unlock_campaign"(p_campaign_id uuid) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."finalize_pr_unlock_campaign"(p_campaign_id uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."finalize_pr_unlock_campaign"(p_campaign_id uuid) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."finalize_pr_unlock_campaign"(p_campaign_id uuid) TO "service_role";
CREATE OR REPLACE FUNCTION public.get_rollerfeed_live_podium(p_slug text DEFAULT 'toma-3-2026-09-02'::text)
 RETURNS TABLE(post_slug text, title text, kicker text, subtitle text, event_date date, pinned_until timestamp with time zone, cta text, footer text, rank integer, display_name text, photo text, distance_km numeric, time_seconds integer, speed_kmh numeric, toma_number integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with live as (
    select p.* from public.rollerfeed_live_posts p
    where p.slug = p_slug and p.visible = true and now() <= p.pinned_until limit 1
  ), ranked as (
    select t.alumno_id,t.distancia_km,t.tiempo_segundos,
      round((t.distancia_km / nullif(t.tiempo_segundos::numeric / 3600, 0))::numeric, 2) as speed_kmh,
      t.numero_toma,
      row_number() over (order by (t.distancia_km / nullif(t.tiempo_segundos::numeric / 3600, 0)) desc, t.tiempo_segundos asc, t.created_at asc)::integer as rank
    from public.pr_performance_tomas t
    join live l on l.event_date = t.fecha
    where t.eliminado = false
      and (
        (t.origen = 'strava' and t.observacion_original_id is not null)
        or (t.origen = 'otro' and t.observacion_original_id like 'manual-strava-capture:%')
      )
  )
  select l.slug,l.title,l.kicker,l.subtitle,l.event_date,l.pinned_until,
    coalesce(l.payload->>'cta',''),coalesce(l.payload->>'footer',''),
    r.rank,coalesce(nullif(trim(concat_ws(' ',pf.nombre,pf.apellido)),''),'Roller PR') as display_name,
    coalesce(pf.foto,'') as photo,r.distancia_km,r.tiempo_segundos,r.speed_kmh,r.numero_toma
  from live l
  left join ranked r on r.rank <= 3
  left join public.profiles_feed pf on pf.id = r.alumno_id
  order by r.rank nulls last;
$function$
;
ALTER FUNCTION "public"."get_rollerfeed_live_podium"(p_slug text) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."get_rollerfeed_live_podium"(p_slug text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."get_rollerfeed_live_podium"(p_slug text) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."get_rollerfeed_live_podium"(p_slug text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."get_rollerfeed_live_podium"(p_slug text) TO "service_role";
CREATE OR REPLACE FUNCTION public.is_pr_staff()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
      select 1
          from public.profiles p
              where (
                    p.auth_user_id::text = auth.uid()::text
                          or p.id = auth.uid()::text
                              )
                                  and (
                                        lower(coalesce(to_jsonb(p)->>'rol', '')) in (
                                                'admin',
                                                        'administrador',
                                                                'entrenador',
                                                                        'profesor',
                                                                                'tesoreria'
                                                                                      )
                                                                                            or lower(coalesce(to_jsonb(p)->>'role', '')) in (
                                                                                                    'admin',
                                                                                                            'administrador',
                                                                                                                    'entrenador',
                                                                                                                            'profesor',
                                                                                                                                    'tesoreria'
                                                                                                                                          )
                                                                                                                                                or coalesce((to_jsonb(p)->>'es_admin')::boolean, false)
                                                                                                                                                      or coalesce((to_jsonb(p)->>'es_entrenador')::boolean, false)
                                                                                                                                                          )
                                                                                                                                                            );
                                                                                                                                                            $function$
;
ALTER FUNCTION "public"."is_pr_staff"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."is_pr_staff"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."is_pr_staff"() TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."is_pr_staff"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."is_pr_staff"() TO "service_role";
CREATE OR REPLACE FUNCTION public.marcar_mis_devoluciones_leidas(p_actividad_ids text[])
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
      declare
        v_alumno_id text;
          v_actualizadas integer := 0;
          begin
            select p.id
                into v_alumno_id
                  from public.profiles p
                    where (
                        p.auth_user_id::text = auth.uid()::text
                            or p.id = auth.uid()::text
                              )
                                limit 1;

                                  if v_alumno_id is null then
                                      raise exception 'No se encontró el perfil asociado a esta sesión';
                                        end if;

                                          update public.actividad_pr a
                                            set
                                                leida = true,
                                                    leida_en = coalesce(a.leida_en, now())
                                                      where a.alumno_id = v_alumno_id
                                                          and a.tipo = 'Nota'
                                                              and coalesce(a.eliminado, false) = false
                                                                  and a.leida = false
                                                                      and a.id::text = any(p_actividad_ids);

                                                                        get diagnostics v_actualizadas = row_count;
                                                                          return v_actualizadas;
                                                                          end;
                                                                          $function$
;
ALTER FUNCTION "public"."marcar_mis_devoluciones_leidas"(p_actividad_ids text[]) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."marcar_mis_devoluciones_leidas"(p_actividad_ids text[]) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."marcar_mis_devoluciones_leidas"(p_actividad_ids text[]) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."marcar_mis_devoluciones_leidas"(p_actividad_ids text[]) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."marcar_mis_devoluciones_leidas"(p_actividad_ids text[]) TO "service_role";
CREATE OR REPLACE FUNCTION public.mi_profile_id()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select id
    from public.profiles
      where auth_user_id = auth.uid()
        limit 1;
        $function$
;
ALTER FUNCTION "public"."mi_profile_id"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."mi_profile_id"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."mi_profile_id"() TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."mi_profile_id"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."mi_profile_id"() TO "service_role";
CREATE OR REPLACE FUNCTION public.mi_role()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
          select role
            from public.profiles
              where auth_user_id = auth.uid()
                limit 1;
                $function$
;
ALTER FUNCTION "public"."mi_role"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."mi_role"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."mi_role"() TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."mi_role"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."mi_role"() TO "service_role";
CREATE OR REPLACE FUNCTION public.next_pr_toma_number(p_alumno_id text)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
                declare
                  v_next integer;
                  begin
                    if not public.is_pr_staff() then
                        raise exception 'No autorizado para consultar la próxima toma';
                          end if;

                            select coalesce(max(t.numero_toma), 0) + 1
                                into v_next
                                  from public.pr_performance_tomas t
                                    where t.alumno_id = p_alumno_id
                                        and t.eliminado = false;

                                          return v_next;
                                          end;
                                          $function$
;
ALTER FUNCTION "public"."next_pr_toma_number"(p_alumno_id text) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."next_pr_toma_number"(p_alumno_id text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."next_pr_toma_number"(p_alumno_id text) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."next_pr_toma_number"(p_alumno_id text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."next_pr_toma_number"(p_alumno_id text) TO "service_role";
CREATE OR REPLACE FUNCTION public.obtener_cuponera_particular(p_alumno_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
    declare
      v_habilitada boolean;
        v_cuponera jsonb;
          v_historial jsonb;
          begin
            select coalesce(particulares_habilitadas, false)
              into v_habilitada
                from public.profiles
                  where id = p_alumno_id;

                    if not found then
                        raise exception 'Alumno no encontrado.';
                          end if;

                            if v_habilitada is false then
                                return jsonb_build_object(
                                      'habilitada', false,
                                            'cuponera', null,
                                                  'historial', '[]'::jsonb
                                                      );
                                                        end if;

                                                          select to_jsonb(c)
                                                            into v_cuponera
                                                              from public.cuponeras_particulares c
                                                                where c.alumno_id = p_alumno_id;

                                                                  select coalesce(
                                                                      jsonb_agg(
                                                                            to_jsonb(h)
                                                                                  order by coalesce(
                                                                                          h.fecha_clase,
                                                                                                  h.created_at
                                                                                                        ) desc
                                                                                                            ),
                                                                                                                '[]'::jsonb
                                                                                                                  )
                                                                                                                    into v_historial
                                                                                                                      from public.clases_particulares_historial h
                                                                                                                        where h.alumno_id = p_alumno_id;

                                                                                                                          return jsonb_build_object(
                                                                                                                              'habilitada', true,
                                                                                                                                  'cuponera', v_cuponera,
                                                                                                                                      'historial', v_historial
                                                                                                                                        );
                                                                                                                                        end;
                                                                                                                                        $function$
;
ALTER FUNCTION "public"."obtener_cuponera_particular"(p_alumno_id text) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."obtener_cuponera_particular"(p_alumno_id text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."obtener_cuponera_particular"(p_alumno_id text) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."obtener_cuponera_particular"(p_alumno_id text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."obtener_cuponera_particular"(p_alumno_id text) TO "service_role";
CREATE OR REPLACE FUNCTION public.obtener_historial_pagos(p_alumno_id text)
 RETURNS TABLE(id bigint, fecha_pago date, vigente_hasta date, monto numeric, metodo text, observacion text, registrado_por_id text, registrado_por_nombre text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
                                                                                                                                                                                                                                begin
                                                                                                                                                                                                                                  if not public.puedo_gestionar_pagos() then
                                                                                                                                                                                                                                      raise exception
                                                                                                                                                                                                                                            'No tenés autorización para consultar pagos';
                                                                                                                                                                                                                                              end if;

                                                                                                                                                                                                                                                return query
                                                                                                                                                                                                                                                  select
                                                                                                                                                                                                                                                      pg.id,
                                                                                                                                                                                                                                                          pg.fecha_pago,
                                                                                                                                                                                                                                                              pg.vigente_hasta,
                                                                                                                                                                                                                                                                  pg.monto,
                                                                                                                                                                                                                                                                      pg.metodo,
                                                                                                                                                                                                                                                                          pg.observacion,
                                                                                                                                                                                                                                                                              pg.registrado_por_id,
                                                                                                                                                                                                                                                                                  pg.registrado_por_nombre,
                                                                                                                                                                                                                                                                                      pg.created_at
                                                                                                                                                                                                                                                                                        from public.pagos_pr pg
                                                                                                                                                                                                                                                                                          where pg.alumno_id = p_alumno_id
                                                                                                                                                                                                                                                                                            order by
                                                                                                                                                                                                                                                                                                pg.fecha_pago desc,
                                                                                                                                                                                                                                                                                                    pg.created_at desc;
                                                                                                                                                                                                                                                                                                    end;
                                                                                                                                                                                                                                                                                                    $function$
;
ALTER FUNCTION "public"."obtener_historial_pagos"(p_alumno_id text) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."obtener_historial_pagos"(p_alumno_id text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."obtener_historial_pagos"(p_alumno_id text) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."obtener_historial_pagos"(p_alumno_id text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."obtener_historial_pagos"(p_alumno_id text) TO "service_role";
CREATE OR REPLACE FUNCTION public.obtener_mis_particulares()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_alumno_id text;
    v_panel jsonb;
      v_cuponera jsonb;
        v_historial jsonb;
        begin
          -- Vincular la sesión de Supabase Auth con el perfil de texto.
            select p.id
                into v_alumno_id
                  from public.profiles p
                    where (
                        p.auth_user_id::text = auth.uid()::text
                            or p.id = auth.uid()::text
                              )
                                limit 1;

                                  if v_alumno_id is null then
                                      raise exception 'No se encontró el perfil asociado a esta sesión';
                                        end if;

                                          -- Reutilizar la fuente que ya alimenta el panel administrativo.
                                            v_panel := public.obtener_panel_particulares_admin()::jsonb;

                                              select item
                                                  into v_cuponera
                                                    from jsonb_array_elements(
                                                        coalesce(v_panel->'cuponeras', '[]'::jsonb)
                                                          ) as item
                                                            where item->>'alumno_id' = v_alumno_id
                                                              limit 1;

                                                                select coalesce(
                                                                    jsonb_agg(
                                                                          item
                                                                                order by coalesce(
                                                                                        item->>'fecha_clase',
                                                                                                item->>'created_at'
                                                                                                      ) desc
                                                                                                          ),
                                                                                                              '[]'::jsonb
                                                                                                                )
                                                                                                                    into v_historial
                                                                                                                      from jsonb_array_elements(
                                                                                                                          coalesce(v_panel->'historial', '[]'::jsonb)
                                                                                                                            ) as item
                                                                                                                              where item->>'alumno_id' = v_alumno_id;

                                                                                                                                return jsonb_build_object(
                                                                                                                                    'alumno_id', v_alumno_id,
                                                                                                                                        'cuponera', v_cuponera,
                                                                                                                                            'historial', coalesce(v_historial, '[]'::jsonb)
                                                                                                                                              );
                                                                                                                                              end;
                                                                                                                                              $function$
;
ALTER FUNCTION "public"."obtener_mis_particulares"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."obtener_mis_particulares"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."obtener_mis_particulares"() TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."obtener_mis_particulares"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."obtener_mis_particulares"() TO "service_role";
CREATE OR REPLACE FUNCTION public.obtener_panel_pagos()
 RETURNS TABLE(alumno_id text, nombre text, apellido text, documento text, estado text, ultimo_pago date, mensualidad_hasta date, acceso_habilitado boolean, prcard_activa boolean, dias_restantes integer, estado_pago text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
                      begin
                        if not public.puedo_gestionar_pagos() then
                            raise exception
                                  'No tenés autorización para consultar pagos';
                                    end if;

                                      return query
                                        select
                                            p.id as alumno_id,
                                                p.nombre,
                                                    p.apellido,
                                                        p.documento,
                                                            p.estado,
                                                                p.ultimo_pago,
                                                                    p.mensualidad_hasta,
                                                                        p.acceso_habilitado,
                                                                            p.prcard_activa,

                                                                                case
                                                                                      when p.mensualidad_hasta is null then null
                                                                                            else (
                                                                                                    p.mensualidad_hasta
                                                                                                            - current_date
                                                                                                                  )::integer
                                                                                                                      end as dias_restantes,

                                                                                                                          case
                                                                                                                                when p.mensualidad_hasta is null then
                                                                                                                                        'sin_fecha'

                                                                                                                                              when p.mensualidad_hasta < current_date then
                                                                                                                                                      'vencido'

                                                                                                                                                            when p.mensualidad_hasta
                                                                                                                                                                    <= current_date + 7 then
                                                                                                                                                                            'por_vencer'

                                                                                                                                                                                  else
                                                                                                                                                                                          'vigente'
                                                                                                                                                                                              end as estado_pago

                                                                                                                                                                                                from public.profiles p
                                                                                                                                                                                                  where lower(coalesce(p.role, 'alumno')) = 'alumno'
                                                                                                                                                                                                    order by
                                                                                                                                                                                                        p.nombre,
                                                                                                                                                                                                            p.apellido;
                                                                                                                                                                                                            end;
                                                                                                                                                                                                            $function$
;
ALTER FUNCTION "public"."obtener_panel_pagos"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."obtener_panel_pagos"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."obtener_panel_pagos"() TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."obtener_panel_pagos"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."obtener_panel_pagos"() TO "service_role";
CREATE OR REPLACE FUNCTION public.obtener_panel_particulares_admin()
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare
  v_cuponeras jsonb;
    v_historial jsonb;
    begin
      select coalesce(
          jsonb_agg(
                to_jsonb(c)
                      order by c.updated_at desc
                          ),
                              '[]'::jsonb
                                )
                                  into v_cuponeras
                                    from public.cuponeras_particulares c;

                                      select coalesce(
                                          jsonb_agg(
                                                to_jsonb(h)
                                                      order by h.created_at desc
                                                          ),
                                                              '[]'::jsonb
                                                                )
                                                                  into v_historial
                                                                    from public.clases_particulares_historial h;

                                                                      return jsonb_build_object(
                                                                          'cuponeras', v_cuponeras,
                                                                              'historial', v_historial
                                                                                );
                                                                                end;
                                                                                $function$
;
ALTER FUNCTION "public"."obtener_panel_particulares_admin"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."obtener_panel_particulares_admin"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."obtener_panel_particulares_admin"() TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."obtener_panel_particulares_admin"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."obtener_panel_particulares_admin"() TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_actualizar_estado_mensualidades()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_count integer; v_today date := (now() AT TIME ZONE 'America/Montevideo')::date;
BEGIN
 IF NOT public.puedo_gestionar_pagos() THEN RAISE EXCEPTION 'No tenés autorización para gestionar tesorería'; END IF;
 UPDATE public.pr_mensualidades m SET estado='vencido',updated_at=now()
 FROM public.profiles p
 WHERE p.id=m.alumno_id AND m.estado='pendiente'
 AND lower(coalesce(p.estado,'Activo'))='activo'
 AND coalesce(p.exento_mensualidad,false)=false
 AND coalesce(m.gracia_hasta,m.vencimiento) + 1 < v_today;
 GET DIAGNOSTICS v_count=ROW_COUNT;
 RETURN v_count;
END $function$
;
ALTER FUNCTION "public"."pr_actualizar_estado_mensualidades"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_actualizar_estado_mensualidades"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_actualizar_estado_mensualidades"() TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_actualizar_estado_mensualidades"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."pr_actualizar_estado_mensualidades"() TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_aplicar_bloqueos_mensuales()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_hoy date := (now() AT TIME ZONE 'America/Montevideo')::date;
  v_periodo date := date_trunc('month', (now() AT TIME ZONE 'America/Montevideo'))::date;
  v_count integer := 0;
BEGIN
  IF extract(day FROM v_hoy) < 12 THEN RETURN 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.pr_tesoreria_config WHERE id=1 AND enforcement_enabled IS TRUE) THEN RETURN 0; END IF;
  UPDATE public.profiles p SET acceso_habilitado=false, updated_at=now()
  FROM public.pr_mensualidades m
  WHERE m.alumno_id=p.id AND m.periodo=v_periodo
    AND m.estado IN ('pendiente','vencido')
    AND (m.gracia_hasta IS NULL OR m.gracia_hasta < v_hoy)
    AND p.role='alumno' AND p.estado='Activo'
    AND coalesce(p.exento_mensualidad,false)=false
    AND p.auth_user_id IS NOT NULL
    AND p.acceso_habilitado IS TRUE;
  GET DIAGNOSTICS v_count=ROW_COUNT;
  RETURN v_count;
END $function$
;
ALTER FUNCTION "public"."pr_aplicar_bloqueos_mensuales"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_aplicar_bloqueos_mensuales"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_aplicar_bloqueos_mensuales"() TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_aplicar_bloqueos_mensuales"() TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_asegurar_mensualidades(p_periodo date DEFAULT (date_trunc('month'::text, timezone('America/Montevideo'::text, now())))::date)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_periodo date := date_trunc('month',p_periodo)::date;
v_vencimiento_dia int; v_monto numeric(12,2); v_count integer;
BEGIN
 IF NOT public.puedo_gestionar_pagos() THEN RAISE EXCEPTION 'No tenés autorización para gestionar tesorería'; END IF;
 SELECT vencimiento_dia,monto_default INTO v_vencimiento_dia,v_monto FROM public.pr_tesoreria_config WHERE id=1;
 INSERT INTO public.pr_mensualidades(alumno_id,periodo,monto,vencimiento)
 SELECT p.id,v_periodo,v_monto,(v_periodo+(v_vencimiento_dia-1))::date
 FROM public.profiles p
 WHERE p.role='alumno'
 AND lower(coalesce(p.estado,'Activo'))='activo'
 AND coalesce(p.exento_mensualidad,false)=false
 AND coalesce(p.es_tesoreria,false)=false
 AND p.id NOT LIKE 'personal_%'
 AND coalesce(p.es_solo_personalizadas,false)=false
 ON CONFLICT(alumno_id,periodo) DO NOTHING;
 GET DIAGNOSTICS v_count=ROW_COUNT;
 RETURN v_count;
END $function$
;
ALTER FUNCTION "public"."pr_asegurar_mensualidades"(p_periodo date) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_asegurar_mensualidades"(p_periodo date) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_asegurar_mensualidades"(p_periodo date) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_asegurar_mensualidades"(p_periodo date) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."pr_asegurar_mensualidades"(p_periodo date) TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_current_profile_id()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select p.id
  from public.profiles p
  where p.auth_user_id = auth.uid() or p.id = auth.uid()::text
  limit 1
$function$
;
ALTER FUNCTION "public"."pr_current_profile_id"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_current_profile_id"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_current_profile_id"() TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_current_profile_id"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."pr_current_profile_id"() TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_delete_profile_showcase(p_item_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ declare pid text:=public.pr_current_profile_id(); old_url text; begin delete from pr_profile_showcase where id=p_item_id and profile_id=pid returning image_url into old_url; if old_url is null then raise exception 'Foto no encontrada o sin permiso'; end if; return old_url; end $function$
;
ALTER FUNCTION "public"."pr_delete_profile_showcase"(p_item_id uuid) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_delete_profile_showcase"(p_item_id uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_delete_profile_showcase"(p_item_id uuid) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_delete_profile_showcase"(p_item_id uuid) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."pr_delete_profile_showcase"(p_item_id uuid) TO "service_role";
SET check_function_bodies = on;

