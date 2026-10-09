-- Original definitions restored exclusively to PR NEXT beta.
SET check_function_bodies = off;
CREATE SCHEMA IF NOT EXISTS rollermap_private;
CREATE SCHEMA IF NOT EXISTS pr_training_internal;
REVOKE ALL ON SCHEMA rollermap_private, pr_training_internal FROM PUBLIC;
CREATE OR REPLACE FUNCTION public.pr_track_sync_profile(p_alumno_id text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  update public.profiles p set tracking_activo = exists(
    select 1 from public.pr_track_items i where i.alumno_id=p_alumno_id and i.estado in ('active','lost')
  ) where p.id=p_alumno_id;
end $function$;
ALTER FUNCTION "public"."pr_track_sync_profile"(p_alumno_id text) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_track_sync_profile"(p_alumno_id text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_track_sync_profile"(p_alumno_id text) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_track_sync_profile"(p_alumno_id text) TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_track_sync_profile_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  perform public.pr_track_sync_profile(coalesce(new.alumno_id,old.alumno_id));
  if tg_op='UPDATE' and old.alumno_id is distinct from new.alumno_id then perform public.pr_track_sync_profile(old.alumno_id); end if;
  return coalesce(new,old);
end $function$
;
ALTER FUNCTION "public"."pr_track_sync_profile_trigger"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_track_sync_profile_trigger"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_track_sync_profile_trigger"() TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_track_sync_profile_trigger"() TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_track_update_details(p_item_id uuid, p_detalles jsonb)
 RETURNS pr_track_items
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare r public.pr_track_items;
begin
  select * into r from public.pr_track_items
  where id=p_item_id
    and (public.pr_track_is_staff() or (alumno_id=public.pr_track_current_profile_id() and estado in ('active','lost')))
  limit 1;
  if r.id is null then raise exception 'Track ID no disponible'; end if;
  update public.pr_track_items
  set detalles=coalesce(p_detalles,'{}'::jsonb),updated_at=now()
  where id=p_item_id returning * into r;
  return r;
end $function$
;
ALTER FUNCTION "public"."pr_track_update_details"(p_item_id uuid, p_detalles jsonb) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_track_update_details"(p_item_id uuid, p_detalles jsonb) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_track_update_details"(p_item_id uuid, p_detalles jsonb) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_track_update_details"(p_item_id uuid, p_detalles jsonb) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."pr_track_update_details"(p_item_id uuid, p_detalles jsonb) TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_track_update_item(p_item_id uuid, p_nombre text, p_tipo text, p_marca text, p_modelo text, p_color text, p_descripcion text, p_foto_url text, p_mostrar_nombre boolean, p_mostrar_telefono boolean, p_mostrar_email boolean, p_mostrar_ciudad boolean)
 RETURNS pr_track_items
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare r public.pr_track_items;
begin
  select * into r
  from public.pr_track_items
  where id=p_item_id
    and (
      public.pr_track_is_staff()
      or (
        alumno_id=public.pr_track_current_profile_id()
        and estado in ('active','lost')
      )
    )
  limit 1;
  if r.id is null then raise exception 'Track ID no disponible'; end if;

  update public.pr_track_items set
    nombre=left(coalesce(p_nombre,''),120),
    tipo=left(coalesce(p_tipo,'otro'),40),
    marca=left(coalesce(p_marca,''),100),
    modelo=left(coalesce(p_modelo,''),100),
    color=left(coalesce(p_color,''),80),
    descripcion=left(coalesce(p_descripcion,''),500),
    foto_url=left(coalesce(p_foto_url,''),1000),
    mostrar_nombre=coalesce(p_mostrar_nombre,true),
    mostrar_telefono=coalesce(p_mostrar_telefono,true),
    mostrar_email=coalesce(p_mostrar_email,false),
    mostrar_ciudad=coalesce(p_mostrar_ciudad,true),
    updated_at=now()
  where id=p_item_id
  returning * into r;
  return r;
end $function$
;
ALTER FUNCTION "public"."pr_track_update_item"(p_item_id uuid, p_nombre text, p_tipo text, p_marca text, p_modelo text, p_color text, p_descripcion text, p_foto_url text, p_mostrar_nombre boolean, p_mostrar_telefono boolean, p_mostrar_email boolean, p_mostrar_ciudad boolean) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_track_update_item"(p_item_id uuid, p_nombre text, p_tipo text, p_marca text, p_modelo text, p_color text, p_descripcion text, p_foto_url text, p_mostrar_nombre boolean, p_mostrar_telefono boolean, p_mostrar_email boolean, p_mostrar_ciudad boolean) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_track_update_item"(p_item_id uuid, p_nombre text, p_tipo text, p_marca text, p_modelo text, p_color text, p_descripcion text, p_foto_url text, p_mostrar_nombre boolean, p_mostrar_telefono boolean, p_mostrar_email boolean, p_mostrar_ciudad boolean) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_track_update_item"(p_item_id uuid, p_nombre text, p_tipo text, p_marca text, p_modelo text, p_color text, p_descripcion text, p_foto_url text, p_mostrar_nombre boolean, p_mostrar_telefono boolean, p_mostrar_email boolean, p_mostrar_ciudad boolean) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."pr_track_update_item"(p_item_id uuid, p_nombre text, p_tipo text, p_marca text, p_modelo text, p_color text, p_descripcion text, p_foto_url text, p_mostrar_nombre boolean, p_mostrar_telefono boolean, p_mostrar_email boolean, p_mostrar_ciudad boolean) TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_track_update_owner_contact(p_nombre text, p_apellido text, p_telefono text, p_ciudad text, p_email text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare pid text:=public.pr_track_current_profile_id(); r public.profiles;
begin
  if pid is null then raise exception 'Perfil PR no encontrado'; end if;
  if nullif(trim(coalesce(p_nombre,'')),'') is null
     or nullif(trim(coalesce(p_apellido,'')),'') is null
     or nullif(trim(coalesce(p_telefono,'')),'') is null
     or nullif(trim(coalesce(p_ciudad,'')),'') is null
  then raise exception 'Nombre, apellido, teléfono y localidad son obligatorios'; end if;
  update public.profiles
  set nombre=left(trim(p_nombre),80),
      apellido=left(trim(p_apellido),80),
      telefono=left(trim(p_telefono),40),
      ciudad=left(trim(p_ciudad),100),
      email=left(trim(coalesce(p_email,'')),180),
      updated_at=now()
  where id=pid returning * into r;
  return jsonb_build_object('id',r.id,'nombre',r.nombre,'apellido',r.apellido,'telefono',r.telefono,'ciudad',r.ciudad,'email',r.email,'foto',r.foto);
end $function$
;
ALTER FUNCTION "public"."pr_track_update_owner_contact"(p_nombre text, p_apellido text, p_telefono text, p_ciudad text, p_email text) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_track_update_owner_contact"(p_nombre text, p_apellido text, p_telefono text, p_ciudad text, p_email text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_track_update_owner_contact"(p_nombre text, p_apellido text, p_telefono text, p_ciudad text, p_email text) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_track_update_owner_contact"(p_nombre text, p_apellido text, p_telefono text, p_ciudad text, p_email text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."pr_track_update_owner_contact"(p_nombre text, p_apellido text, p_telefono text, p_ciudad text, p_email text) TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_unlock_finalize_due_campaigns()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare r record;
begin
  for r in select id from public.pr_unlock_campaigns c where c.active=true and (timezone('America/Montevideo',now()))::date > c.ends_on and not exists(select 1 from public.pr_unlock_results x where x.campaign_id=c.id)
  loop
    perform public.finalize_pr_unlock_campaign(r.id);
  end loop;
  return new;
end; $function$
;
ALTER FUNCTION "public"."pr_unlock_finalize_due_campaigns"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_unlock_finalize_due_campaigns"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_unlock_finalize_due_campaigns"() TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_unlock_finalize_due_campaigns"() TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_unlock_publish_winner()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if new.winner_name is null then return new; end if;
  if not exists(select 1 from public.actividad_pr where creado_por_id='pr_unlock_winner:'||new.campaign_id::text and coalesce(eliminado,false)=false) then
    insert into public.actividad_pr(alumno_id,tipo,titulo,descripcion,fecha,creado_por_id,creado_por_nombre,creado_por_role,creado_por_foto,eliminado,leida)
    values(coalesce(new.winner_profile_id::text,''),'pr_unlock_winner','🏆 PR UNLOCK · RESULTADO OFICIAL',
      new.winner_name||' cerró la misión en el #1 con '||trim(to_char(new.winner_km,'FM999999990.0'))||' km. La comunidad sumó '||trim(to_char(new.group_km,'FM999999990.0'))||' km.'||case when new.unlocked_level>0 then ' Premio desbloqueado: '||new.prize_title||'.' else ' Esta edición cerró sin premio desbloqueado.' end,
      new.finalized_at,'pr_unlock_winner:'||new.campaign_id::text,new.winner_name,'alumno',new.winner_photo,false,false);
  end if;
  return new;
end; $function$
;
ALTER FUNCTION "public"."pr_unlock_publish_winner"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_unlock_publish_winner"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_unlock_publish_winner"() TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_unlock_publish_winner"() TO "service_role";
CREATE OR REPLACE FUNCTION public.prday_create_post(p_caption text, p_media_path text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_profile_id text;
  v_existing public.prday_posts%rowtype;
  v_saved public.prday_posts%rowtype;
  v_previous_media_path text;
  v_caption text := left(btrim(coalesce(p_caption, '')), 220);
begin
  if (select auth.uid()) is null then
    raise exception using errcode = '42501', message = 'Necesitás iniciar sesión.';
  end if;

  select p.id
    into v_profile_id
  from public.profiles p
  where p.auth_user_id = (select auth.uid())
  limit 1;

  if v_profile_id is null then
    raise exception using errcode = '42501', message = 'No encontramos tu perfil PR.';
  end if;

  if not exists (
    select 1
    from public.prday_testers t
    where t.profile_id = v_profile_id
      and t.enabled
  ) then
    raise exception using errcode = '42501', message = 'PRday todavía no está habilitado para esta cuenta.';
  end if;

  if p_media_path is null
     or left(p_media_path, char_length(v_profile_id) + 1) <> v_profile_id || '/'
     or char_length(p_media_path) > 500 then
    raise exception using errcode = '22023', message = 'La foto seleccionada no es válida.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('prday:' || v_profile_id, 0));

  select *
    into v_existing
  from public.prday_posts p
  where p.profile_id = v_profile_id
  for update;

  if found and v_existing.expires_at > now() then
    raise exception using
      errcode = 'P0001',
      message = 'Tu PRday sigue activo. Podrás publicar otro cuando termine el contador.';
  end if;

  if found then
    v_previous_media_path := v_existing.media_path;
  end if;

  insert into public.prday_posts (
    profile_id,
    caption,
    media_path,
    created_at,
    expires_at,
    deleted_at,
    updated_at
  )
  values (
    v_profile_id,
    v_caption,
    p_media_path,
    now(),
    now() + interval '24 hours',
    null,
    now()
  )
  on conflict (profile_id) do update
    set caption = excluded.caption,
        media_path = excluded.media_path,
        created_at = excluded.created_at,
        expires_at = excluded.expires_at,
        deleted_at = null,
        updated_at = excluded.updated_at
    where public.prday_posts.expires_at <= now()
  returning * into v_saved;

  if v_saved.id is null then
    raise exception using
      errcode = 'P0001',
      message = 'Tu PRday sigue activo. Podrás publicar otro cuando termine el contador.';
  end if;

  return jsonb_build_object(
    'post', to_jsonb(v_saved),
    'previous_media_path', v_previous_media_path
  );
end;
$function$
;
ALTER FUNCTION "public"."prday_create_post"(p_caption text, p_media_path text) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."prday_create_post"(p_caption text, p_media_path text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."prday_create_post"(p_caption text, p_media_path text) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."prday_create_post"(p_caption text, p_media_path text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."prday_create_post"(p_caption text, p_media_path text) TO "service_role";
CREATE OR REPLACE FUNCTION public.proteger_campos_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
 IF current_user IN ('postgres','service_role') THEN RETURN NEW; END IF;
 IF public.soy_admin() THEN RETURN NEW; END IF;
 IF OLD.auth_user_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'No podés modificar este perfil.'; END IF;
 IF NEW.role IS DISTINCT FROM OLD.role
 OR NEW.es_tesoreria IS DISTINCT FROM OLD.es_tesoreria
 OR NEW.es_profesor IS DISTINCT FROM OLD.es_profesor
 OR NEW.documento IS DISTINCT FROM OLD.documento
 OR NEW.pin IS DISTINCT FROM OLD.pin
 OR NEW.auth_user_id IS DISTINCT FROM OLD.auth_user_id
 OR NEW.auth_migrado IS DISTINCT FROM OLD.auth_migrado
 OR NEW.auth_migrado_en IS DISTINCT FROM OLD.auth_migrado_en
 OR NEW.estado IS DISTINCT FROM OLD.estado
 OR NEW.acceso_habilitado IS DISTINCT FROM OLD.acceso_habilitado
 OR NEW.mensualidad_hasta IS DISTINCT FROM OLD.mensualidad_hasta
 OR NEW.ultimo_pago IS DISTINCT FROM OLD.ultimo_pago
 OR NEW.prcard_activa IS DISTINCT FROM OLD.prcard_activa
 OR NEW.tracking_activo IS DISTINCT FROM OLD.tracking_activo
 OR NEW.verificado IS DISTINCT FROM OLD.verificado
 OR NEW.grupos_info IS DISTINCT FROM OLD.grupos_info
 OR NEW.exento_mensualidad IS DISTINCT FROM OLD.exento_mensualidad
 OR NEW.particulares_habilitadas IS DISTINCT FROM OLD.particulares_habilitadas
 THEN RAISE EXCEPTION 'Ese dato solo puede modificarlo el equipo de Punta Rollers.'; END IF;
 RETURN NEW;
END $function$
;
ALTER FUNCTION "public"."proteger_campos_profile"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."proteger_campos_profile"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."proteger_campos_profile"() TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."proteger_campos_profile"() TO "service_role";
CREATE OR REPLACE FUNCTION public.puedo_gestionar_pagos()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
                                          select public.soy_admin()
                                              or public.soy_tesoreria();
                                              $function$
;
ALTER FUNCTION "public"."puedo_gestionar_pagos"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."puedo_gestionar_pagos"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."puedo_gestionar_pagos"() TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."puedo_gestionar_pagos"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."puedo_gestionar_pagos"() TO "service_role";
CREATE OR REPLACE FUNCTION public.registrar_clase_particular(p_alumno_id text, p_fecha_clase timestamp with time zone, p_observacion text, p_registrado_por_id text, p_registrado_por_nombre text)
 RETURNS cuponeras_particulares
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
                                                                                                                                                                                                                                                                                                                                                        declare
                                                                                                                                                                                                                                                                                                                                                          v_cuponera public.cuponeras_particulares;
                                                                                                                                                                                                                                                                                                                                                            v_saldo_anterior integer;
                                                                                                                                                                                                                                                                                                                                                              v_fecha_clase timestamptz;
                                                                                                                                                                                                                                                                                                                                                              begin
                                                                                                                                                                                                                                                                                                                                                                v_fecha_clase :=
                                                                                                                                                                                                                                                                                                                                                                    coalesce(p_fecha_clase, now());

                                                                                                                                                                                                                                                                                                                                                                      select *
                                                                                                                                                                                                                                                                                                                                                                        into v_cuponera
                                                                                                                                                                                                                                                                                                                                                                          from public.cuponeras_particulares
                                                                                                                                                                                                                                                                                                                                                                            where alumno_id = p_alumno_id
                                                                                                                                                                                                                                                                                                                                                                              for update;

                                                                                                                                                                                                                                                                                                                                                                                if not found then
                                                                                                                                                                                                                                                                                                                                                                                    raise exception 'El alumno no tiene una cuponera.';
                                                                                                                                                                                                                                                                                                                                                                                      end if;

                                                                                                                                                                                                                                                                                                                                                                                        if v_cuponera.habilitada is false then
                                                                                                                                                                                                                                                                                                                                                                                            raise exception 'La cuponera está deshabilitada.';
                                                                                                                                                                                                                                                                                                                                                                                              end if;

                                                                                                                                                                                                                                                                                                                                                                                                if v_cuponera.clases_disponibles <= 0 then
                                                                                                                                                                                                                                                                                                                                                                                                    raise exception 'El alumno no tiene clases disponibles.';
                                                                                                                                                                                                                                                                                                                                                                                                      end if;

                                                                                                                                                                                                                                                                                                                                                                                                        v_saldo_anterior :=
                                                                                                                                                                                                                                                                                                                                                                                                            v_cuponera.clases_disponibles;

                                                                                                                                                                                                                                                                                                                                                                                                              update public.cuponeras_particulares
                                                                                                                                                                                                                                                                                                                                                                                                                set
                                                                                                                                                                                                                                                                                                                                                                                                                    clases_utilizadas =
                                                                                                                                                                                                                                                                                                                                                                                                                          clases_utilizadas + 1,
                                                                                                                                                                                                                                                                                                                                                                                                                              clases_disponibles =
                                                                                                                                                                                                                                                                                                                                                                                                                                    clases_disponibles - 1,
                                                                                                                                                                                                                                                                                                                                                                                                                                        ultima_clase =
                                                                                                                                                                                                                                                                                                                                                                                                                                              v_fecha_clase,
                                                                                                                                                                                                                                                                                                                                                                                                                                                  ultima_observacion =
                                                                                                                                                                                                                                                                                                                                                                                                                                                        nullif(trim(coalesce(p_observacion, '')), ''),
                                                                                                                                                                                                                                                                                                                                                                                                                                                            estado =
                                                                                                                                                                                                                                                                                                                                                                                                                                                                  case
                                                                                                                                                                                                                                                                                                                                                                                                                                                                          when clases_disponibles - 1 = 0
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    then 'finalizada'
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            else 'activa'
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  end,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      updated_at = now()
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        where id = v_cuponera.id
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          returning *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            into v_cuponera;

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              insert into public.clases_particulares_historial (
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  alumno_id,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      cuponera_id,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          tipo,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              cantidad,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  saldo_anterior,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      saldo_despues,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          fecha_clase,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              observacion,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  registrado_por_id,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      registrado_por_nombre
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        )
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          values (
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              p_alumno_id,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  v_cuponera.id,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      'clase_dada',
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          1,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              v_saldo_anterior,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  v_cuponera.clases_disponibles,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      v_fecha_clase,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          nullif(trim(coalesce(p_observacion, '')), ''),
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              p_registrado_por_id,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  p_registrado_por_nombre
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    );

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      return v_cuponera;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      end;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      $function$
;
ALTER FUNCTION "public"."registrar_clase_particular"(p_alumno_id text, p_fecha_clase timestamp with time zone, p_observacion text, p_registrado_por_id text, p_registrado_por_nombre text) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."registrar_clase_particular"(p_alumno_id text, p_fecha_clase timestamp with time zone, p_observacion text, p_registrado_por_id text, p_registrado_por_nombre text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."registrar_clase_particular"(p_alumno_id text, p_fecha_clase timestamp with time zone, p_observacion text, p_registrado_por_id text, p_registrado_por_nombre text) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."registrar_clase_particular"(p_alumno_id text, p_fecha_clase timestamp with time zone, p_observacion text, p_registrado_por_id text, p_registrado_por_nombre text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."registrar_clase_particular"(p_alumno_id text, p_fecha_clase timestamp with time zone, p_observacion text, p_registrado_por_id text, p_registrado_por_nombre text) TO "service_role";
CREATE OR REPLACE FUNCTION public.registrar_clinica_oct_2026_v1(p_nombre_completo text, p_edad integer, p_nivel text, p_telefono text, p_email text, p_asistencia_completa boolean, p_opcion_pago text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_id uuid;
  v_estado text;
  v_registrados integer;
  v_es_espera boolean;
begin
  if coalesce(trim(p_nombre_completo), '') = '' then raise exception 'Nombre requerido'; end if;
  if p_edad is null or p_edad < 5 or p_edad > 100 then raise exception 'Edad inválida'; end if;
  if coalesce(trim(p_nivel), '') = '' then raise exception 'Nivel requerido'; end if;
  if coalesce(trim(p_telefono), '') = '' then raise exception 'WhatsApp requerido'; end if;
  if p_asistencia_completa is distinct from true then raise exception 'Debe confirmar asistencia a los tres días'; end if;
  if p_opcion_pago not in ('pagar_ahora','bonificacion_rifa','ya_pague') then raise exception 'Opción de pago inválida'; end if;

  perform pg_advisory_xact_lock(hashtext('clinica_oct_2026_capacity'));
  select count(*)::integer into v_registrados
  from public.pr_clinica_oct_2026_inscripciones
  where estado <> 'cancelado';

  v_es_espera := v_registrados >= 30;
  if v_es_espera then
    v_estado := 'lista_espera';
  else
    v_estado := case p_opcion_pago
      when 'ya_pague' then 'confirmado'
      when 'bonificacion_rifa' then 'pendiente_bonificacion'
      else 'pendiente_aprobacion'
    end;
  end if;

  insert into public.pr_clinica_oct_2026_inscripciones
    (nombre_completo, edad, nivel, telefono, email, asistencia_completa, opcion_pago, estado, monto, comprobante_recibido)
  values
    (trim(p_nombre_completo), p_edad, trim(p_nivel), trim(p_telefono), nullif(trim(coalesce(p_email,'')), ''), true, p_opcion_pago, v_estado, 2000, case when v_es_espera then false else p_opcion_pago = 'ya_pague' end)
  returning id into v_id;

  return jsonb_build_object(
    'id', v_id,
    'estado', v_estado,
    'lista_espera', v_es_espera,
    'numero_registro', v_registrados + 1
  );
end;
$function$
;
ALTER FUNCTION "public"."registrar_clinica_oct_2026_v1"(p_nombre_completo text, p_edad integer, p_nivel text, p_telefono text, p_email text, p_asistencia_completa boolean, p_opcion_pago text) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."registrar_clinica_oct_2026_v1"(p_nombre_completo text, p_edad integer, p_nivel text, p_telefono text, p_email text, p_asistencia_completa boolean, p_opcion_pago text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."registrar_clinica_oct_2026_v1"(p_nombre_completo text, p_edad integer, p_nivel text, p_telefono text, p_email text, p_asistencia_completa boolean, p_opcion_pago text) TO PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."registrar_clinica_oct_2026_v1"(p_nombre_completo text, p_edad integer, p_nivel text, p_telefono text, p_email text, p_asistencia_completa boolean, p_opcion_pago text) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."registrar_clinica_oct_2026_v1"(p_nombre_completo text, p_edad integer, p_nivel text, p_telefono text, p_email text, p_asistencia_completa boolean, p_opcion_pago text) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."registrar_clinica_oct_2026_v1"(p_nombre_completo text, p_edad integer, p_nivel text, p_telefono text, p_email text, p_asistencia_completa boolean, p_opcion_pago text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."registrar_clinica_oct_2026_v1"(p_nombre_completo text, p_edad integer, p_nivel text, p_telefono text, p_email text, p_asistencia_completa boolean, p_opcion_pago text) TO "service_role";
CREATE OR REPLACE FUNCTION public.registrar_clinica_sept_2026(p_nombre_completo text, p_edad integer, p_nivel text, p_telefono text, p_email text, p_asistencia_completa boolean, p_opcion_pago text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_id uuid;
  v_estado text;
  v_ocupados integer;
begin
  if coalesce(trim(p_nombre_completo), '') = '' then raise exception 'Nombre requerido'; end if;
  if p_edad is null or p_edad < 5 or p_edad > 100 then raise exception 'Edad inválida'; end if;
  if p_nivel not in ('Primera vez','Principiante','Intermedio','Avanzado','Competitivo') then raise exception 'Nivel inválido'; end if;
  if coalesce(trim(p_telefono), '') = '' then raise exception 'WhatsApp requerido'; end if;
  if p_asistencia_completa is distinct from true then raise exception 'Debe confirmar asistencia a los tres días'; end if;
  if p_opcion_pago not in ('pagar_ahora','bonificacion_rifa','ya_pague') then raise exception 'Opción de pago inválida'; end if;

  perform pg_advisory_xact_lock(hashtext('clinica_sept_2026_capacity'));
  select count(*)::integer into v_ocupados
  from public.pr_clinica_sept_2026_inscripciones
  where estado <> 'cancelado';

  if v_ocupados >= 30 then raise exception 'Cupos agotados'; end if;

  v_estado := case p_opcion_pago
    when 'ya_pague' then 'confirmado'
    when 'bonificacion_rifa' then 'pendiente_bonificacion'
    else 'pendiente_aprobacion'
  end;

  insert into public.pr_clinica_sept_2026_inscripciones (
    nombre_completo, edad, nivel, telefono, email, asistencia_completa,
    opcion_pago, estado, monto, comprobante_recibido
  ) values (
    trim(p_nombre_completo), p_edad, p_nivel, trim(p_telefono),
    nullif(trim(coalesce(p_email,'')), ''), true,
    p_opcion_pago, v_estado, 2000,
    p_opcion_pago = 'ya_pague'
  ) returning id into v_id;

  return v_id;
end;
$function$
;
ALTER FUNCTION "public"."registrar_clinica_sept_2026"(p_nombre_completo text, p_edad integer, p_nivel text, p_telefono text, p_email text, p_asistencia_completa boolean, p_opcion_pago text) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."registrar_clinica_sept_2026"(p_nombre_completo text, p_edad integer, p_nivel text, p_telefono text, p_email text, p_asistencia_completa boolean, p_opcion_pago text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."registrar_clinica_sept_2026"(p_nombre_completo text, p_edad integer, p_nivel text, p_telefono text, p_email text, p_asistencia_completa boolean, p_opcion_pago text) TO PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."registrar_clinica_sept_2026"(p_nombre_completo text, p_edad integer, p_nivel text, p_telefono text, p_email text, p_asistencia_completa boolean, p_opcion_pago text) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."registrar_clinica_sept_2026"(p_nombre_completo text, p_edad integer, p_nivel text, p_telefono text, p_email text, p_asistencia_completa boolean, p_opcion_pago text) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."registrar_clinica_sept_2026"(p_nombre_completo text, p_edad integer, p_nivel text, p_telefono text, p_email text, p_asistencia_completa boolean, p_opcion_pago text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."registrar_clinica_sept_2026"(p_nombre_completo text, p_edad integer, p_nivel text, p_telefono text, p_email text, p_asistencia_completa boolean, p_opcion_pago text) TO "service_role";
CREATE OR REPLACE FUNCTION public.registrar_clinica_sept_2026_v2(p_nombre_completo text, p_edad integer, p_nivel text, p_telefono text, p_email text, p_asistencia_completa boolean, p_opcion_pago text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ declare v_id uuid; v_estado text; v_registrados integer; v_es_espera boolean; begin if coalesce(trim(p_nombre_completo), '') = '' then raise exception 'Nombre requerido'; end if; if p_edad is null or p_edad < 5 or p_edad > 100 then raise exception 'Edad inválida'; end if; if coalesce(trim(p_nivel), '') = '' then raise exception 'Nivel requerido'; end if; if coalesce(trim(p_telefono), '') = '' then raise exception 'WhatsApp requerido'; end if; if p_asistencia_completa is distinct from true then raise exception 'Debe confirmar asistencia a los tres días'; end if; if p_opcion_pago not in ('pagar_ahora','bonificacion_rifa','ya_pague') then raise exception 'Opción de pago inválida'; end if; perform pg_advisory_xact_lock(hashtext('clinica_sept_2026_capacity')); select count(*)::integer into v_registrados from public.pr_clinica_sept_2026_inscripciones where estado <> 'cancelado'; v_es_espera := v_registrados >= 30; if v_es_espera then v_estado := 'lista_espera'; else v_estado := case p_opcion_pago when 'ya_pague' then 'confirmado' when 'bonificacion_rifa' then 'pendiente_bonificacion' else 'pendiente_aprobacion' end; end if; insert into public.pr_clinica_sept_2026_inscripciones (nombre_completo, edad, nivel, telefono, email, asistencia_completa, opcion_pago, estado, monto, comprobante_recibido) values (trim(p_nombre_completo), p_edad, trim(p_nivel), trim(p_telefono), nullif(trim(coalesce(p_email,'')), ''), true, p_opcion_pago, v_estado, 2000, case when v_es_espera then false else p_opcion_pago = 'ya_pague' end) returning id into v_id; return jsonb_build_object('id', v_id,'estado', v_estado,'lista_espera', v_es_espera,'numero_registro', v_registrados + 1); end; $function$
;
ALTER FUNCTION "public"."registrar_clinica_sept_2026_v2"(p_nombre_completo text, p_edad integer, p_nivel text, p_telefono text, p_email text, p_asistencia_completa boolean, p_opcion_pago text) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."registrar_clinica_sept_2026_v2"(p_nombre_completo text, p_edad integer, p_nivel text, p_telefono text, p_email text, p_asistencia_completa boolean, p_opcion_pago text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."registrar_clinica_sept_2026_v2"(p_nombre_completo text, p_edad integer, p_nivel text, p_telefono text, p_email text, p_asistencia_completa boolean, p_opcion_pago text) TO PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."registrar_clinica_sept_2026_v2"(p_nombre_completo text, p_edad integer, p_nivel text, p_telefono text, p_email text, p_asistencia_completa boolean, p_opcion_pago text) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."registrar_clinica_sept_2026_v2"(p_nombre_completo text, p_edad integer, p_nivel text, p_telefono text, p_email text, p_asistencia_completa boolean, p_opcion_pago text) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."registrar_clinica_sept_2026_v2"(p_nombre_completo text, p_edad integer, p_nivel text, p_telefono text, p_email text, p_asistencia_completa boolean, p_opcion_pago text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."registrar_clinica_sept_2026_v2"(p_nombre_completo text, p_edad integer, p_nivel text, p_telefono text, p_email text, p_asistencia_completa boolean, p_opcion_pago text) TO "service_role";
CREATE OR REPLACE FUNCTION public.registrar_inscripcion_2026_v3(p_modalidad text, p_nombre_completo text, p_edad integer, p_localidad text, p_email text, p_telefono text, p_nivel text, p_turno_sabado text DEFAULT NULL::text, p_objetivo_personalizadas text DEFAULT NULL::text, p_nombre_responsable text DEFAULT NULL::text, p_quiere_remera boolean DEFAULT NULL::boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_id uuid;
  v_monto numeric;
  v_modalidad text := trim(coalesce(p_modalidad,''));
  v_nombre text := trim(coalesce(p_nombre_completo,''));
  v_email text := lower(trim(coalesce(p_email,'')));
  v_tel text := trim(coalesce(p_telefono,''));
  v_nivel text := trim(coalesce(p_nivel,''));
  v_turno text := nullif(trim(coalesce(p_turno_sabado,'')), '');
  v_objetivo text := nullif(trim(coalesce(p_objetivo_personalizadas,'')), '');
  v_responsable text := nullif(trim(coalesce(p_nombre_responsable,'')), '');
  v_personalizadas_abiertas boolean;
begin
  if v_modalidad not in ('grupales','personalizadas','kids') then raise exception 'Modalidad inválida'; end if;
  if v_nombre = '' then raise exception 'Nombre requerido'; end if;
  if v_email = '' or position('@' in v_email) < 2 then raise exception 'Email inválido'; end if;
  if v_tel = '' then raise exception 'WhatsApp requerido'; end if;
  if v_nivel = '' or length(v_nivel) > 50 then raise exception 'Nivel inválido'; end if;

  if v_modalidad = 'kids' then
    if p_edad is null or p_edad < 3 or p_edad > 17 then raise exception 'Edad inválida para PR Kids'; end if;
    if v_responsable is null then raise exception 'Adulto responsable requerido'; end if;
    if v_turno is null then v_turno := 'Sábado 19:00–20:00 · Pista cerrada Maldonado'; end if;
    v_objetivo := null;
    v_monto := 2000 + case when coalesce(p_quiere_remera, false) then 690 else 0 end;
  elsif v_modalidad = 'grupales' then
    if p_edad is null or p_edad < 5 or p_edad > 100 then raise exception 'Edad inválida'; end if;
    if nullif(trim(coalesce(p_localidad,'')), '') is null then raise exception 'Localidad requerida'; end if;
    if v_turno is null then raise exception 'Turno de sábado requerido'; end if;
    v_objetivo := null;
    v_responsable := null;
    v_monto := 1500;
  else
    select personalizadas_abiertas into v_personalizadas_abiertas
    from public.pr_inscripciones_config
    where id = 'global';
    if not coalesce(v_personalizadas_abiertas, true) then
      raise exception 'PERSONALIZADAS_CERRADAS';
    end if;
    if p_edad is null or p_edad < 5 or p_edad > 100 then raise exception 'Edad inválida'; end if;
    if nullif(trim(coalesce(p_localidad,'')), '') is null then raise exception 'Localidad requerida'; end if;
    if v_objetivo is null then raise exception 'Objetivo requerido'; end if;
    v_turno := null;
    v_responsable := null;
    v_monto := 2900;
  end if;

  insert into public.pr_inscripciones_2026 (
    modalidad, nombre_completo, edad, localidad, email, telefono, nivel,
    turno_sabado, objetivo_personalizadas, monto, metodo_pago, estado,
    comprobante_recibido, nombre_responsable, quiere_remera
  ) values (
    v_modalidad, v_nombre, p_edad, nullif(trim(coalesce(p_localidad,'')), ''), v_email, v_tel, v_nivel,
    v_turno, v_objetivo, v_monto, 'Prex', 'pre_reserva', false, v_responsable,
    case when v_modalidad = 'kids' then coalesce(p_quiere_remera,false) else null end
  ) returning id into v_id;

  return jsonb_build_object('id', v_id, 'ok', true, 'modalidad', v_modalidad, 'monto', v_monto);
end;
$function$
;
ALTER FUNCTION "public"."registrar_inscripcion_2026_v3"(p_modalidad text, p_nombre_completo text, p_edad integer, p_localidad text, p_email text, p_telefono text, p_nivel text, p_turno_sabado text, p_objetivo_personalizadas text, p_nombre_responsable text, p_quiere_remera boolean) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."registrar_inscripcion_2026_v3"(p_modalidad text, p_nombre_completo text, p_edad integer, p_localidad text, p_email text, p_telefono text, p_nivel text, p_turno_sabado text, p_objetivo_personalizadas text, p_nombre_responsable text, p_quiere_remera boolean) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."registrar_inscripcion_2026_v3"(p_modalidad text, p_nombre_completo text, p_edad integer, p_localidad text, p_email text, p_telefono text, p_nivel text, p_turno_sabado text, p_objetivo_personalizadas text, p_nombre_responsable text, p_quiere_remera boolean) TO PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."registrar_inscripcion_2026_v3"(p_modalidad text, p_nombre_completo text, p_edad integer, p_localidad text, p_email text, p_telefono text, p_nivel text, p_turno_sabado text, p_objetivo_personalizadas text, p_nombre_responsable text, p_quiere_remera boolean) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."registrar_inscripcion_2026_v3"(p_modalidad text, p_nombre_completo text, p_edad integer, p_localidad text, p_email text, p_telefono text, p_nivel text, p_turno_sabado text, p_objetivo_personalizadas text, p_nombre_responsable text, p_quiere_remera boolean) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."registrar_inscripcion_2026_v3"(p_modalidad text, p_nombre_completo text, p_edad integer, p_localidad text, p_email text, p_telefono text, p_nivel text, p_turno_sabado text, p_objetivo_personalizadas text, p_nombre_responsable text, p_quiere_remera boolean) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."registrar_inscripcion_2026_v3"(p_modalidad text, p_nombre_completo text, p_edad integer, p_localidad text, p_email text, p_telefono text, p_nivel text, p_turno_sabado text, p_objetivo_personalizadas text, p_nombre_responsable text, p_quiere_remera boolean) TO "service_role";
CREATE OR REPLACE FUNCTION public.registrar_inscripcion_2026_v4(p_modalidad text, p_nombre_completo text, p_edad integer, p_localidad text, p_email text, p_telefono text, p_nivel text, p_turno_sabado text DEFAULT NULL::text, p_objetivo_personalizadas text DEFAULT NULL::text, p_nombre_responsable text DEFAULT NULL::text, p_quiere_remera boolean DEFAULT NULL::boolean, p_referral_code text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_id uuid; v_modalidad text:=trim(coalesce(p_modalidad,'')); v_nombre text:=trim(coalesce(p_nombre_completo,'')); v_email text:=lower(trim(coalesce(p_email,''))); v_tel text:=trim(coalesce(p_telefono,'')); v_nivel text:=trim(coalesce(p_nivel,'')); v_turno text:=nullif(trim(coalesce(p_turno_sabado,'')),''); v_objetivo text:=nullif(trim(coalesce(p_objetivo_personalizadas,'')),''); v_responsable text:=nullif(trim(coalesce(p_nombre_responsable,'')),''); v_personalizadas_abiertas boolean; v_base numeric; v_extra numeric:=0; v_original numeric; v_final numeric; v_ref_code text:=regexp_replace(upper(nullif(trim(coalesce(p_referral_code,'')),'')),'\s+','','g'); v_referrer text; v_scope text; v_campaign boolean:=false; v_start_month date:=date_trunc('month',timezone('America/Montevideo',now()))::date;
begin
if v_modalidad not in ('grupales','personalizadas','kids') then raise exception 'Modalidad inválida'; end if; if v_nombre='' then raise exception 'Nombre requerido'; end if; if v_email='' or position('@' in v_email)<2 then raise exception 'Email inválido'; end if; if v_tel='' then raise exception 'WhatsApp requerido'; end if; if v_nivel='' or length(v_nivel)>50 then raise exception 'Nivel inválido'; end if;
if v_modalidad='kids' then if p_edad is null or p_edad<3 or p_edad>17 then raise exception 'Edad inválida para PR Kids'; end if; if v_responsable is null then raise exception 'Adulto responsable requerido'; end if; if v_turno is null then v_turno:='Sábado 19:00–20:00 · Pista cerrada Maldonado'; end if; v_objetivo:=null; v_base:=2000; v_extra:=case when coalesce(p_quiere_remera,false) then 690 else 0 end; v_scope:='10% en las primeras 2 mensualidades de PR Kids';
elsif v_modalidad='grupales' then if p_edad is null or p_edad<5 or p_edad>100 then raise exception 'Edad inválida'; end if; if nullif(trim(coalesce(p_localidad,'')),'') is null then raise exception 'Localidad requerida'; end if; if v_turno is null then raise exception 'Turno de sábado requerido'; end if; v_objetivo:=null; v_responsable:=null; v_base:=1500; v_scope:='10% en las primeras 2 mensualidades de Adultos';
else select personalizadas_abiertas into v_personalizadas_abiertas from public.pr_inscripciones_config where id='global'; if not coalesce(v_personalizadas_abiertas,true) then raise exception 'PERSONALIZADAS_CERRADAS'; end if; if p_edad is null or p_edad<5 or p_edad>100 then raise exception 'Edad inválida'; end if; if nullif(trim(coalesce(p_localidad,'')),'') is null then raise exception 'Localidad requerida'; end if; if v_objetivo is null then raise exception 'Objetivo requerido'; end if; v_turno:=null; v_responsable:=null; v_base:=2900; v_scope:='10% en la primera cuponera de Personalizadas'; end if;
if v_ref_code is not null then if v_ref_code='ROLLERWEENPR' then v_campaign:=true; if v_modalidad='personalizadas' then v_scope:='10% en la primera cuponera de Personalizadas · RollerWeen 2026'; else v_scope:='10% en las primeras 2 mensualidades · RollerWeen 2026'; end if; else select c.profile_id into v_referrer from public.pr_referral_codes c join public.profiles p on p.id=c.profile_id where c.active=true and regexp_replace(upper(trim(c.code)),'\s+','','g')=v_ref_code and coalesce(p.estado,'Activo')='Activo' limit 1; if v_referrer is null then raise exception 'CODIGO_AMIGOS_PR_INVALIDO'; end if; end if; end if;
v_original:=v_base+v_extra; v_final:=round((case when v_referrer is not null or v_campaign then v_base*.90 else v_base end)+v_extra,0);
insert into public.pr_inscripciones_2026(modalidad,nombre_completo,edad,localidad,email,telefono,nivel,turno_sabado,objetivo_personalizadas,monto,metodo_pago,estado,comprobante_recibido,nombre_responsable,quiere_remera,referral_code,referral_profile_id,descuento_porcentaje,monto_original,monto_final) values(v_modalidad,v_nombre,p_edad,nullif(trim(coalesce(p_localidad,'')),''),v_email,v_tel,v_nivel,v_turno,v_objetivo,v_final,'Prex','pre_reserva',false,v_responsable,case when v_modalidad='kids' then coalesce(p_quiere_remera,false) else null end,v_ref_code,v_referrer,case when v_referrer is not null or v_campaign then 10 else 0 end,v_original,v_final) returning id into v_id;
if v_campaign and v_modalidad in ('grupales','kids') then insert into public.pr_campaign_benefits(campaign_code,enrollment_id,email,modalidad,discount_percent,starts_month,months_total,active,base_amount) values('ROLLERWEENPR',v_id,v_email,v_modalidad,10,v_start_month,2,true,v_base) on conflict(enrollment_id) do nothing; end if;
if v_referrer is not null then insert into public.pr_referrals(referrer_profile_id,referral_code,referred_name,referred_email,referred_phone,enrollment_id,program,status,referred_discount_percent,referred_discount_scope,referrer_discount_percent,referrer_discount_months) values(v_referrer,v_ref_code,v_nombre,v_email,v_tel,v_id,case v_modalidad when 'grupales' then 'adultos' else v_modalidad end,'pendiente',10,v_scope,10,2) on conflict(enrollment_id) where enrollment_id is not null do nothing; end if;
return jsonb_build_object('id',v_id,'ok',true,'modalidad',v_modalidad,'monto',v_final,'monto_original',v_original,'descuento_porcentaje',case when v_referrer is not null or v_campaign then 10 else 0 end,'referral_applied',v_referrer is not null,'campaign_applied',v_campaign,'referral_code',case when v_campaign then 'ROLLERWEENPR' else v_ref_code end,'discount_scope',v_scope); end $function$
;
ALTER FUNCTION "public"."registrar_inscripcion_2026_v4"(p_modalidad text, p_nombre_completo text, p_edad integer, p_localidad text, p_email text, p_telefono text, p_nivel text, p_turno_sabado text, p_objetivo_personalizadas text, p_nombre_responsable text, p_quiere_remera boolean, p_referral_code text) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."registrar_inscripcion_2026_v4"(p_modalidad text, p_nombre_completo text, p_edad integer, p_localidad text, p_email text, p_telefono text, p_nivel text, p_turno_sabado text, p_objetivo_personalizadas text, p_nombre_responsable text, p_quiere_remera boolean, p_referral_code text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."registrar_inscripcion_2026_v4"(p_modalidad text, p_nombre_completo text, p_edad integer, p_localidad text, p_email text, p_telefono text, p_nivel text, p_turno_sabado text, p_objetivo_personalizadas text, p_nombre_responsable text, p_quiere_remera boolean, p_referral_code text) TO PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."registrar_inscripcion_2026_v4"(p_modalidad text, p_nombre_completo text, p_edad integer, p_localidad text, p_email text, p_telefono text, p_nivel text, p_turno_sabado text, p_objetivo_personalizadas text, p_nombre_responsable text, p_quiere_remera boolean, p_referral_code text) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."registrar_inscripcion_2026_v4"(p_modalidad text, p_nombre_completo text, p_edad integer, p_localidad text, p_email text, p_telefono text, p_nivel text, p_turno_sabado text, p_objetivo_personalizadas text, p_nombre_responsable text, p_quiere_remera boolean, p_referral_code text) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."registrar_inscripcion_2026_v4"(p_modalidad text, p_nombre_completo text, p_edad integer, p_localidad text, p_email text, p_telefono text, p_nivel text, p_turno_sabado text, p_objetivo_personalizadas text, p_nombre_responsable text, p_quiere_remera boolean, p_referral_code text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."registrar_inscripcion_2026_v4"(p_modalidad text, p_nombre_completo text, p_edad integer, p_localidad text, p_email text, p_telefono text, p_nivel text, p_turno_sabado text, p_objetivo_personalizadas text, p_nombre_responsable text, p_quiere_remera boolean, p_referral_code text) TO "service_role";
CREATE OR REPLACE FUNCTION public.registrar_pago_pr(p_alumno_id text, p_fecha_pago date, p_registrado_por_id text, p_registrado_por_nombre text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
                                                      begin
                                                        if not public.puedo_gestionar_pagos() then
                                                            raise exception
                                                                  'No tenés autorización para registrar pagos';
                                                                    end if;

                                                                      perform public.registrar_pago_pr_interno(
                                                                          p_alumno_id,
                                                                              p_fecha_pago,
                                                                                  p_registrado_por_id,
                                                                                      p_registrado_por_nombre
                                                                                        );
                                                                                        end;
                                                                                        $function$
;
ALTER FUNCTION "public"."registrar_pago_pr"(p_alumno_id text, p_fecha_pago date, p_registrado_por_id text, p_registrado_por_nombre text) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."registrar_pago_pr"(p_alumno_id text, p_fecha_pago date, p_registrado_por_id text, p_registrado_por_nombre text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."registrar_pago_pr"(p_alumno_id text, p_fecha_pago date, p_registrado_por_id text, p_registrado_por_nombre text) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."registrar_pago_pr"(p_alumno_id text, p_fecha_pago date, p_registrado_por_id text, p_registrado_por_nombre text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."registrar_pago_pr"(p_alumno_id text, p_fecha_pago date, p_registrado_por_id text, p_registrado_por_nombre text) TO "service_role";
CREATE OR REPLACE FUNCTION public.registrar_pago_pr_interno(p_alumno_id text, p_fecha_pago date, p_registrado_por_id text, p_registrado_por_nombre text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
        declare
          v_vigente_hasta date;
          begin
            v_vigente_hasta := p_fecha_pago + 31;

              insert into public.pagos_pr (
                  alumno_id,
                      fecha_pago,
                          vigente_hasta,
                              registrado_por_id,
                                  registrado_por_nombre
                                    )
                                      values (
                                          p_alumno_id,
                                              p_fecha_pago,
                                                  v_vigente_hasta,
                                                      p_registrado_por_id,
                                                          p_registrado_por_nombre
                                                            );

                                                              update public.profiles
                                                                set
                                                                    ultimo_pago = p_fecha_pago,
                                                                        mensualidad_hasta = v_vigente_hasta,
                                                                            acceso_habilitado = true,
                                                                                estado = 'Activo',
                                                                                    prcard_activa = true,
                                                                                        estado_modificado_por = p_registrado_por_nombre,
                                                                                            estado_modificado_en = now(),
                                                                                                updated_at = now()
                                                                                                  where id = p_alumno_id;
                                                                                                  end;
                                                                                                  $function$
;
ALTER FUNCTION "public"."registrar_pago_pr_interno"(p_alumno_id text, p_fecha_pago date, p_registrado_por_id text, p_registrado_por_nombre text) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."registrar_pago_pr_interno"(p_alumno_id text, p_fecha_pago date, p_registrado_por_id text, p_registrado_por_nombre text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."registrar_pago_pr_interno"(p_alumno_id text, p_fecha_pago date, p_registrado_por_id text, p_registrado_por_nombre text) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."registrar_pago_pr_interno"(p_alumno_id text, p_fecha_pago date, p_registrado_por_id text, p_registrado_por_nombre text) TO "service_role";
CREATE OR REPLACE FUNCTION public.set_personalizadas_abiertas_2026(p_abiertas boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if auth.uid() is null or not public.soy_admin() then
    raise exception 'No autorizado';
  end if;

  insert into public.pr_inscripciones_config (id, personalizadas_abiertas, updated_at, updated_by)
  values ('global', coalesce(p_abiertas, false), now(), auth.uid())
  on conflict (id) do update
    set personalizadas_abiertas = excluded.personalizadas_abiertas,
        updated_at = excluded.updated_at,
        updated_by = excluded.updated_by;

  return jsonb_build_object('ok', true, 'personalizadas_abiertas', coalesce(p_abiertas, false));
end;
$function$
;
ALTER FUNCTION "public"."set_personalizadas_abiertas_2026"(p_abiertas boolean) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."set_personalizadas_abiertas_2026"(p_abiertas boolean) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."set_personalizadas_abiertas_2026"(p_abiertas boolean) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."set_personalizadas_abiertas_2026"(p_abiertas boolean) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."set_personalizadas_abiertas_2026"(p_abiertas boolean) TO "service_role";
CREATE OR REPLACE FUNCTION public.set_pr_groups_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
                                                  begin
                                                    new.updated_at = now();
                                                      return new;
                                                      end;
                                                      $function$
;
ALTER FUNCTION "public"."set_pr_groups_updated_at"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."set_pr_groups_updated_at"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."set_pr_groups_updated_at"() TO PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."set_pr_groups_updated_at"() TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."set_pr_groups_updated_at"() TO "anon";
GRANT EXECUTE ON FUNCTION "public"."set_pr_groups_updated_at"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."set_pr_groups_updated_at"() TO "service_role";
CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  new.updated_at = now();
    return new;
    end;
    $function$
;
ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."set_updated_at"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."set_updated_at"() TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."set_updated_at"() TO "service_role";
CREATE OR REPLACE FUNCTION public.soy_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
                  select coalesce(
                      (
                            select role = 'admin'
                                  from public.profiles
                                        where auth_user_id = auth.uid()
                                              limit 1
                                                  ),
                                                      false
                                                        );
                                                        $function$
;
ALTER FUNCTION "public"."soy_admin"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."soy_admin"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."soy_admin"() TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."soy_admin"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."soy_admin"() TO "service_role";
CREATE OR REPLACE FUNCTION public.soy_staff()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
                                                          select coalesce(
                                                              (
                                                                    select role in ('admin', 'profesor')
                                                                          from public.profiles
                                                                                where auth_user_id = auth.uid()
                                                                                      limit 1
                                                                                          ),
                                                                                              false
                                                                                                );
                                                                                                $function$
;
ALTER FUNCTION "public"."soy_staff"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."soy_staff"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."soy_staff"() TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."soy_staff"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."soy_staff"() TO "service_role";
CREATE OR REPLACE FUNCTION public.soy_tesoreria()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select coalesce(
      (
            select es_tesoreria = true
                  from public.profiles
                        where auth_user_id = auth.uid()
                              limit 1
                                  ),
                                      false
                                        );
                                        $function$
;
ALTER FUNCTION "public"."soy_tesoreria"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."soy_tesoreria"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."soy_tesoreria"() TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."soy_tesoreria"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."soy_tesoreria"() TO "service_role";
CREATE OR REPLACE FUNCTION public.submit_student_access_request(p_nombre text, p_apellido text, p_documento text, p_telefono text, p_email text, p_pin text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_id uuid;
  v_doc text := regexp_replace(coalesce(p_documento,''),'\D','','g');
  v_tel text := regexp_replace(coalesce(p_telefono,''),'[^0-9+]','','g');
begin
  if length(trim(coalesce(p_nombre,''))) < 2 then raise exception 'Ingresá tu nombre.'; end if;
  if length(trim(coalesce(p_apellido,''))) < 2 then raise exception 'Ingresá tu apellido.'; end if;
  if length(v_doc) < 6 then raise exception 'Documento inválido.'; end if;
  if length(v_tel) < 8 then raise exception 'WhatsApp inválido.'; end if;
  if position('@' in trim(coalesce(p_email,''))) <= 1 or position('.' in split_part(trim(coalesce(p_email,'')),'@',2)) <= 1 then raise exception 'Email inválido.'; end if;
  if coalesce(p_pin,'') !~ '^[0-9]{4}$' then raise exception 'El PIN debe tener 4 números.'; end if;
  if p_pin in ('0000','1111','2222','3333','4444','5555','6666','7777','8888','9999','1234','4321') then raise exception 'Elegí un PIN menos obvio.'; end if;
  if exists (select 1 from public.student_access_requests r where regexp_replace(r.documento,'\D','','g')=v_doc and r.status in ('pending','profile_created')) then raise exception 'Ya recibimos una solicitud con este documento.'; end if;
  insert into public.student_access_requests(nombre,apellido,documento,telefono,email,pin)
  values (trim(p_nombre),trim(p_apellido),v_doc,trim(p_telefono),lower(trim(p_email)),p_pin)
  returning id into v_id;
  return v_id;
end;
$function$
;
ALTER FUNCTION "public"."submit_student_access_request"(p_nombre text, p_apellido text, p_documento text, p_telefono text, p_email text, p_pin text) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."submit_student_access_request"(p_nombre text, p_apellido text, p_documento text, p_telefono text, p_email text, p_pin text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."submit_student_access_request"(p_nombre text, p_apellido text, p_documento text, p_telefono text, p_email text, p_pin text) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."submit_student_access_request"(p_nombre text, p_apellido text, p_documento text, p_telefono text, p_email text, p_pin text) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."submit_student_access_request"(p_nombre text, p_apellido text, p_documento text, p_telefono text, p_email text, p_pin text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."submit_student_access_request"(p_nombre text, p_apellido text, p_documento text, p_telefono text, p_email text, p_pin text) TO "service_role";
SET check_function_bodies = on;

