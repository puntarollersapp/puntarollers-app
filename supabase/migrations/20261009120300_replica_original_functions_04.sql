-- Original definitions restored exclusively to PR NEXT beta.
SET check_function_bodies = off;
CREATE SCHEMA IF NOT EXISTS rollermap_private;
CREATE SCHEMA IF NOT EXISTS pr_training_internal;
REVOKE ALL ON SCHEMA rollermap_private, pr_training_internal FROM PUBLIC;
CREATE OR REPLACE FUNCTION public.pr_dm_admin_clear_conversation(conversation_id_value uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  me text;
  my_role text;
begin
  me := public.community_current_profile_id();
  select p.role
  into my_role
  from public.profiles p
  where p.id = me;

  if my_role <> 'admin' then
    return jsonb_build_object('success', false, 'error', 'Acción disponible solo para administradores.');
  end if;

  if not exists (
    select 1
    from public.pr_dm_conversations c
    where c.id = conversation_id_value
      and (c.profile_a_id = me or c.profile_b_id = me)
  ) then
    return jsonb_build_object('success', false, 'error', 'Conversación no encontrada.');
  end if;

  delete from public.pr_dm_messages
  where conversation_id = conversation_id_value;

  update public.pr_dm_conversations
  set updated_at = now()
  where id = conversation_id_value;

  return jsonb_build_object('success', true);
end;
$function$
;
ALTER FUNCTION "public"."pr_dm_admin_clear_conversation"(conversation_id_value uuid) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_dm_admin_clear_conversation"(conversation_id_value uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_dm_admin_clear_conversation"(conversation_id_value uuid) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_dm_admin_clear_conversation"(conversation_id_value uuid) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."pr_dm_admin_clear_conversation"(conversation_id_value uuid) TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_dm_are_friends(a text, b text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1 from public.community_friendships f
    where f.profile_a_id = least(a,b) and f.profile_b_id = greatest(a,b)
  ) and not exists (
    select 1 from public.community_blocks x
    where (x.blocker_profile_id=a and x.blocked_profile_id=b)
       or (x.blocker_profile_id=b and x.blocked_profile_id=a)
  );
$function$
;
ALTER FUNCTION "public"."pr_dm_are_friends"(a text, b text) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_dm_are_friends"(a text, b text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_dm_are_friends"(a text, b text) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_dm_are_friends"(a text, b text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."pr_dm_are_friends"(a text, b text) TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_dm_clear_for_me(conversation_id_value uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  me text;
begin
  me := public.community_current_profile_id();

  if not exists (
    select 1
    from public.pr_dm_conversations c
    where c.id = conversation_id_value
      and (c.profile_a_id = me or c.profile_b_id = me)
  ) then
    return jsonb_build_object('success', false, 'error', 'Conversación no encontrada.');
  end if;

  insert into public.pr_dm_message_hides(message_id, profile_id)
  select m.id, me
  from public.pr_dm_messages m
  where m.conversation_id = conversation_id_value
  on conflict do nothing;

  return jsonb_build_object('success', true);
end;
$function$
;
ALTER FUNCTION "public"."pr_dm_clear_for_me"(conversation_id_value uuid) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_dm_clear_for_me"(conversation_id_value uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_dm_clear_for_me"(conversation_id_value uuid) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_dm_clear_for_me"(conversation_id_value uuid) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."pr_dm_clear_for_me"(conversation_id_value uuid) TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_dm_delete_message_for_all(message_id_value uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  me text;
begin
  me := public.community_current_profile_id();

  delete from public.pr_dm_messages
  where id = message_id_value
    and sender_profile_id = me;

  if not found then
    return jsonb_build_object(
      'success',
      false,
      'error',
      'Solo podés eliminar para ambos los mensajes que enviaste vos.'
    );
  end if;

  return jsonb_build_object('success', true);
end;
$function$
;
ALTER FUNCTION "public"."pr_dm_delete_message_for_all"(message_id_value uuid) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_dm_delete_message_for_all"(message_id_value uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_dm_delete_message_for_all"(message_id_value uuid) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_dm_delete_message_for_all"(message_id_value uuid) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."pr_dm_delete_message_for_all"(message_id_value uuid) TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_dm_hide_message(message_id_value uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  me text;
  msg public.pr_dm_messages%rowtype;
  conv public.pr_dm_conversations%rowtype;
begin
  me := public.community_current_profile_id();

  select * into msg
  from public.pr_dm_messages
  where id = message_id_value;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Mensaje no encontrado.');
  end if;

  select * into conv
  from public.pr_dm_conversations
  where id = msg.conversation_id
    and (profile_a_id = me or profile_b_id = me);

  if not found then
    return jsonb_build_object('success', false, 'error', 'No tenés acceso a este mensaje.');
  end if;

  insert into public.pr_dm_message_hides(message_id, profile_id)
  values(message_id_value, me)
  on conflict do nothing;

  return jsonb_build_object('success', true);
end;
$function$
;
ALTER FUNCTION "public"."pr_dm_hide_message"(message_id_value uuid) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_dm_hide_message"(message_id_value uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_dm_hide_message"(message_id_value uuid) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_dm_hide_message"(message_id_value uuid) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."pr_dm_hide_message"(message_id_value uuid) TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_dm_inbox()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me text; result jsonb;
begin
  me:=public.community_current_profile_id();
  if me is null then return '[]'::jsonb; end if;
  select coalesce(jsonb_agg(row_data order by (row_data->>'last_message_at')::timestamptz desc nulls last),'[]'::jsonb) into result
  from (
    select jsonb_build_object(
      'id',c.id,'updated_at',c.updated_at,
      'other_profile',jsonb_build_object('id',p.id,'nombre',p.nombre,'apellido',p.apellido,'foto',p.foto),
      'last_message',(select coalesce(nullif(m.body,''), case when m.media_type='image' then '📷 Foto' when m.media_type='audio' then '🎙️ Audio' else 'Mensaje' end) from public.pr_dm_messages m where m.conversation_id=c.id order by m.created_at desc limit 1),
      'last_message_at',(select m.created_at from public.pr_dm_messages m where m.conversation_id=c.id order by m.created_at desc limit 1),
      'unread_count',(select count(*) from public.pr_dm_messages m where m.conversation_id=c.id and m.sender_profile_id<>me and m.read_at is null)
    ) row_data
    from public.pr_dm_conversations c
    join public.profiles p on p.id=case when c.profile_a_id=me then c.profile_b_id else c.profile_a_id end
    where (c.profile_a_id=me or c.profile_b_id=me)
      and public.pr_dm_are_friends(c.profile_a_id,c.profile_b_id)
  ) q;
  return coalesce(result,'[]'::jsonb);
end $function$
;
ALTER FUNCTION "public"."pr_dm_inbox"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_dm_inbox"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_dm_inbox"() TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_dm_inbox"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."pr_dm_inbox"() TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_dm_mark_read(conversation_id_value uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me text;
begin
  me:=public.community_current_profile_id();
  if not exists(select 1 from public.pr_dm_conversations c where c.id=conversation_id_value and (c.profile_a_id=me or c.profile_b_id=me)) then return jsonb_build_object('success',false); end if;
  update public.pr_dm_messages set read_at=coalesce(read_at,now()) where conversation_id=conversation_id_value and sender_profile_id<>me and read_at is null;
  return jsonb_build_object('success',true);
end $function$
;
ALTER FUNCTION "public"."pr_dm_mark_read"(conversation_id_value uuid) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_dm_mark_read"(conversation_id_value uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_dm_mark_read"(conversation_id_value uuid) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_dm_mark_read"(conversation_id_value uuid) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."pr_dm_mark_read"(conversation_id_value uuid) TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_dm_messages(conversation_id_value uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  me text;
  c public.pr_dm_conversations%rowtype;
  result jsonb;
begin
  me := public.community_current_profile_id();

  select *
  into c
  from public.pr_dm_conversations
  where id = conversation_id_value
    and (profile_a_id = me or profile_b_id = me);

  if not found
     or not public.pr_dm_are_friends(c.profile_a_id, c.profile_b_id) then
    return '[]'::jsonb;
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', m.id,
        'body', m.body,
        'media_type', m.media_type,
        'media_url', m.media_url,
        'media_name', m.media_name,
        'created_at', m.created_at,
        'read_at', m.read_at,
        'is_mine', m.sender_profile_id = me
      )
      order by m.created_at
    ),
    '[]'::jsonb
  )
  into result
  from public.pr_dm_messages m
  where m.conversation_id = conversation_id_value
    and not exists (
      select 1
      from public.pr_dm_message_hides h
      where h.message_id = m.id
        and h.profile_id = me
    );

  return result;
end;
$function$
;
ALTER FUNCTION "public"."pr_dm_messages"(conversation_id_value uuid) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_dm_messages"(conversation_id_value uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_dm_messages"(conversation_id_value uuid) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_dm_messages"(conversation_id_value uuid) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."pr_dm_messages"(conversation_id_value uuid) TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_dm_open(target_profile_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me text; a text; b text; cid uuid; allow_dm boolean;
begin
  me := public.community_current_profile_id();
  if me is null then return jsonb_build_object('success',false,'error','Perfil no encontrado.'); end if;
  if target_profile_id is null or target_profile_id=me then return jsonb_build_object('success',false,'error','Chat inválido.'); end if;
  if not public.pr_dm_are_friends(me,target_profile_id) then return jsonb_build_object('success',false,'error','Solo podés escribirle a tus amigos.'); end if;
  select coalesce(cp.allow_messages_from_friends,true) into allow_dm from public.community_privacy cp where cp.profile_id=target_profile_id;
  if allow_dm is false then return jsonb_build_object('success',false,'error','Esta persona no recibe mensajes privados.'); end if;
  a:=least(me,target_profile_id); b:=greatest(me,target_profile_id);
  insert into public.pr_dm_conversations(profile_a_id,profile_b_id) values(a,b)
  on conflict(profile_a_id,profile_b_id) do update set updated_at=public.pr_dm_conversations.updated_at
  returning id into cid;
  return jsonb_build_object('success',true,'conversation_id',cid);
end $function$
;
ALTER FUNCTION "public"."pr_dm_open"(target_profile_id text) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_dm_open"(target_profile_id text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_dm_open"(target_profile_id text) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_dm_open"(target_profile_id text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."pr_dm_open"(target_profile_id text) TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_dm_send(conversation_id_value uuid, body_value text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me text; c public.pr_dm_conversations%rowtype; clean text;
begin
  me:=public.community_current_profile_id(); clean:=btrim(coalesce(body_value,''));
  if char_length(clean)<1 or char_length(clean)>1200 then return jsonb_build_object('success',false,'error','El mensaje debe tener entre 1 y 1200 caracteres.'); end if;
  select * into c from public.pr_dm_conversations where id=conversation_id_value and (profile_a_id=me or profile_b_id=me);
  if not found or not public.pr_dm_are_friends(c.profile_a_id,c.profile_b_id) then return jsonb_build_object('success',false,'error','Ya no podés escribir en esta conversación.'); end if;
  insert into public.pr_dm_messages(conversation_id,sender_profile_id,body) values(conversation_id_value,me,clean);
  update public.pr_dm_conversations set updated_at=now() where id=conversation_id_value;
  return jsonb_build_object('success',true);
end $function$
;
ALTER FUNCTION "public"."pr_dm_send"(conversation_id_value uuid, body_value text) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_dm_send"(conversation_id_value uuid, body_value text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_dm_send"(conversation_id_value uuid, body_value text) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_dm_send"(conversation_id_value uuid, body_value text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."pr_dm_send"(conversation_id_value uuid, body_value text) TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_dm_send_media(conversation_id_value uuid, media_type_value text, media_url_value text, media_name_value text DEFAULT NULL::text, body_value text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me text; c public.pr_dm_conversations%rowtype; clean text;
begin
  me:=public.community_current_profile_id();
  clean:=nullif(btrim(coalesce(body_value,'')),'');
  if media_type_value not in ('image','audio') or nullif(btrim(coalesce(media_url_value,'')),'') is null then
    return jsonb_build_object('success',false,'error','Archivo inválido.');
  end if;
  select * into c from public.pr_dm_conversations where id=conversation_id_value and (profile_a_id=me or profile_b_id=me);
  if not found or not public.pr_dm_are_friends(c.profile_a_id,c.profile_b_id) then
    return jsonb_build_object('success',false,'error','Ya no podés escribir en esta conversación.');
  end if;
  insert into public.pr_dm_messages(conversation_id,sender_profile_id,body,media_type,media_url,media_name)
  values(conversation_id_value,me,clean,media_type_value,media_url_value,media_name_value);
  update public.pr_dm_conversations set updated_at=now() where id=conversation_id_value;
  return jsonb_build_object('success',true);
end $function$
;
ALTER FUNCTION "public"."pr_dm_send_media"(conversation_id_value uuid, media_type_value text, media_url_value text, media_name_value text, body_value text) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_dm_send_media"(conversation_id_value uuid, media_type_value text, media_url_value text, media_name_value text, body_value text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_dm_send_media"(conversation_id_value uuid, media_type_value text, media_url_value text, media_name_value text, body_value text) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_dm_send_media"(conversation_id_value uuid, media_type_value text, media_url_value text, media_name_value text, body_value text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."pr_dm_send_media"(conversation_id_value uuid, media_type_value text, media_url_value text, media_name_value text, body_value text) TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_enforce_inline_skate_strava_visibility()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  if lower(coalesce(new.fuente, '')) = 'strava' then
    new.visible_feed := (
      new.es_privada is not true
      and new.eliminada is not true
      and new.deporte_strava = 'InlineSkate'
    );
  end if;
  return new;
end;
$function$
;
ALTER FUNCTION "public"."pr_enforce_inline_skate_strava_visibility"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_enforce_inline_skate_strava_visibility"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_enforce_inline_skate_strava_visibility"() TO PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."pr_enforce_inline_skate_strava_visibility"() TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_enforce_inline_skate_strava_visibility"() TO "anon";
GRANT EXECUTE ON FUNCTION "public"."pr_enforce_inline_skate_strava_visibility"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."pr_enforce_inline_skate_strava_visibility"() TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_get_inline_ranking(p_start_date date, p_end_date date)
 RETURNS TABLE(alumno_id text, km numeric, sessions bigint)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select
    a.alumno_id,
    round((sum(greatest(coalesce(a.distancia_metros,0),0)) / 1000.0)::numeric, 3) as km,
    count(*)::bigint as sessions
  from public.pr_inline_skate_activities a
  where a.fecha_inicio >= (p_start_date::timestamp at time zone 'America/Montevideo')
    and a.fecha_inicio < (((p_end_date + 1)::timestamp) at time zone 'America/Montevideo')
    and a.alumno_id is not null
    and greatest(coalesce(a.distancia_metros,0),0) > 0
  group by a.alumno_id
  order by km desc, sessions desc, alumno_id asc;
$function$
;
ALTER FUNCTION "public"."pr_get_inline_ranking"(p_start_date date, p_end_date date) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_get_inline_ranking"(p_start_date date, p_end_date date) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_get_inline_ranking"(p_start_date date, p_end_date date) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_get_inline_ranking"(p_start_date date, p_end_date date) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."pr_get_inline_ranking"(p_start_date date, p_end_date date) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."pr_get_inline_ranking"(p_start_date date, p_end_date date) TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_guard_strava_inline_skate_anomalies()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if lower(coalesce(new.fuente,'')) = 'strava'
     and new.deporte_strava = 'InlineSkate'
     and (
       coalesce(new.velocidad_maxima_ms,0) > 30
       or coalesce(new.tiempo_total_segundos,0) > 172800
     ) then
    new.eliminada := true;
    new.visible_feed := false;
    new.estado_validacion := 'rechazada';
    new.motivo_validacion := 'Excluida automáticamente por control de integridad PR: registro Strava anómalo (velocidad máxima >108 km/h o duración total >48 h).';
  end if;
  return new;
end;
$function$
;
ALTER FUNCTION "public"."pr_guard_strava_inline_skate_anomalies"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_guard_strava_inline_skate_anomalies"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_guard_strava_inline_skate_anomalies"() TO PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."pr_guard_strava_inline_skate_anomalies"() TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_guard_strava_inline_skate_anomalies"() TO "anon";
GRANT EXECUTE ON FUNCTION "public"."pr_guard_strava_inline_skate_anomalies"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."pr_guard_strava_inline_skate_anomalies"() TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_kids_admin_redemptions()
 RETURNS TABLE(id uuid, reward_id uuid, reward_name text, reward_sellos integer, child_name text, child_document text, parent_name text, parent_phone text, parent_document text, declared_stamps integer, status text, stamps_used integer, admin_note text, validated_by text, validated_at timestamp with time zone, delivered_at timestamp with time zone, created_at timestamp with time zone, photo_paths text[])
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not exists (
    select 1
    from public.profiles prof
    where prof.id = auth.uid()::text
      and prof.role = 'admin'
  ) then
    raise exception 'No autorizado';
  end if;

  return query
  select
    x.id,
    x.reward_id,
    r.nombre,
    r.sellos,
    x.child_name,
    x.child_document,
    x.parent_name,
    x.parent_phone,
    x.parent_document,
    x.declared_stamps,
    x.status,
    x.stamps_used,
    x.admin_note,
    x.validated_by,
    x.validated_at,
    x.delivered_at,
    x.created_at,
    coalesce(
      array_agg(p.photo_url) filter (where p.id is not null),
      array[]::text[]
    )
  from public.pr_kids_redemptions x
  join public.pr_kids_rewards r on r.id = x.reward_id
  left join public.pr_kids_redemption_photos p on p.redemption_id = x.id
  group by
    x.id,
    x.reward_id,
    r.id,
    r.nombre,
    r.sellos,
    x.child_name,
    x.child_document,
    x.parent_name,
    x.parent_phone,
    x.parent_document,
    x.declared_stamps,
    x.status,
    x.stamps_used,
    x.admin_note,
    x.validated_by,
    x.validated_at,
    x.delivered_at,
    x.created_at
  order by x.created_at desc;
end
$function$
;
ALTER FUNCTION "public"."pr_kids_admin_redemptions"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_kids_admin_redemptions"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_kids_admin_redemptions"() TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_kids_admin_redemptions"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."pr_kids_admin_redemptions"() TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_kids_admin_set_redemption_status(p_id uuid, p_status text, p_stamps_used integer DEFAULT NULL::integer, p_note text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ declare x public.pr_kids_redemptions; begin if not exists(select 1 from public.profiles where id=auth.uid()::text and role='admin') then raise exception 'No autorizado'; end if; if p_status not in ('solicitado','validado','preparando','listo','entregado','rechazado','cancelado') then raise exception 'Estado inválido'; end if; select * into x from public.pr_kids_redemptions where id=p_id for update; if x.id is null then raise exception 'Canje inexistente'; end if; if x.status='solicitado' and p_status in ('rechazado','cancelado') then update public.pr_kids_rewards set stock_reservado=greatest(stock_reservado-1,0),updated_at=now() where id=x.reward_id; end if; if p_status='entregado' and x.status<>'entregado' then update public.pr_kids_rewards set stock_reservado=greatest(stock_reservado-1,0),stock_entregado=stock_entregado+1,updated_at=now() where id=x.reward_id; end if; update public.pr_kids_redemptions set status=p_status,stamps_used=coalesce(p_stamps_used,stamps_used),admin_note=coalesce(p_note,admin_note),validated_by=case when p_status='validado' then auth.uid()::text else validated_by end,validated_at=case when p_status='validado' then now() else validated_at end,delivered_at=case when p_status='entregado' then now() else delivered_at end,updated_at=now() where id=p_id; end $function$
;
ALTER FUNCTION "public"."pr_kids_admin_set_redemption_status"(p_id uuid, p_status text, p_stamps_used integer, p_note text) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_kids_admin_set_redemption_status"(p_id uuid, p_status text, p_stamps_used integer, p_note text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_kids_admin_set_redemption_status"(p_id uuid, p_status text, p_stamps_used integer, p_note text) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_kids_admin_set_redemption_status"(p_id uuid, p_status text, p_stamps_used integer, p_note text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."pr_kids_admin_set_redemption_status"(p_id uuid, p_status text, p_stamps_used integer, p_note text) TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_kids_approve_family(p_request_id uuid, p_admin_user_id uuid, p_child_profile_ids jsonb DEFAULT '[]'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare req public.pr_kids_family_requests%rowtype; g_id uuid; child jsonb; c_id uuid; children jsonb; profile_id text; i int:=0; latest_checks jsonb;
begin
 select * into req from public.pr_kids_family_requests where id=p_request_id for update;
 if not found or req.estado<>'pendiente' then raise exception 'Solicitud no disponible'; end if;
 if not exists(select 1 from public.profiles where auth_user_id=p_admin_user_id and role='admin') then raise exception 'Administrador no autorizado'; end if;
 select checks into latest_checks from public.pr_kids_family_review_audit where request_id=p_request_id order by created_at desc,id desc limit 1;
 if latest_checks is null or not (coalesce(latest_checks->>'identity','false')='true' and coalesce(latest_checks->>'relation','false')='true' and coalesce(latest_checks->>'children','false')='true' and coalesce(latest_checks->>'treasury','false')='true' and coalesce(latest_checks->>'contact','false')='true') then raise exception 'Revision actual incompleta'; end if;
 children:=case when jsonb_typeof(req.hijos)='array' and jsonb_array_length(req.hijos)>0 then req.hijos else jsonb_build_array(jsonb_build_object('nombre',req.nombre_nino)) end;
 if jsonb_typeof(p_child_profile_ids)<>'array' or jsonb_array_length(children)<>jsonb_array_length(p_child_profile_ids) or jsonb_array_length(children)>6 then raise exception 'Seleccion de perfiles invalida'; end if;
 if exists(select 1 from jsonb_array_elements_text(p_child_profile_ids) x where nullif(trim(x),'') is null) then raise exception 'Cada niño requiere un perfil de Tesoreria confirmado'; end if;
 if (select count(distinct x) from jsonb_array_elements_text(p_child_profile_ids) x)<>jsonb_array_length(p_child_profile_ids) then raise exception 'No se puede asignar el mismo perfil a dos niños'; end if;
 if exists(select 1 from public.pr_kids_guardians where documento=req.documento_tutor) then raise exception 'Tutor existente requiere revision manual'; end if;
 insert into public.pr_kids_guardians(documento,nombre,email,phone,estado) values(req.documento_tutor,req.nombre_tutor,req.email_tutor,req.telefono_tutor,'pendiente') returning id into g_id;
 for child in select value from jsonb_array_elements(children) loop
   profile_id:=trim(p_child_profile_ids->>i);
   if not exists(select 1 from public.profiles where id=profile_id) then raise exception 'Perfil no encontrado'; end if;
   if exists(select 1 from public.pr_kids_children where treasury_profile_id=profile_id) then raise exception 'Perfil infantil ya vinculado'; end if;
   insert into public.pr_kids_children(nombre_confirmado,treasury_profile_id) values(child->>'nombre',profile_id) returning id into c_id;
   insert into public.pr_kids_guardian_children(guardian_id,child_id,family_request_id,vinculo,approved_at,approved_by) values(g_id,c_id,p_request_id,req.vinculo,now(),p_admin_user_id);
   i:=i+1;
 end loop;
 insert into public.pr_kids_family_approval_audit(request_id,guardian_id,admin_auth_user_id,child_profile_ids) values(p_request_id,g_id,p_admin_user_id,p_child_profile_ids);
 update public.pr_kids_family_requests set estado='aprobado',reviewed_at=now(),reviewed_by=p_admin_user_id where id=p_request_id;
 return jsonb_build_object('ok',true,'guardian_id',g_id,'children',i,'access_enabled',false);
end $function$
;
ALTER FUNCTION "public"."pr_kids_approve_family"(p_request_id uuid, p_admin_user_id uuid, p_child_profile_ids jsonb) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_kids_approve_family"(p_request_id uuid, p_admin_user_id uuid, p_child_profile_ids jsonb) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_kids_approve_family"(p_request_id uuid, p_admin_user_id uuid, p_child_profile_ids jsonb) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_kids_approve_family"(p_request_id uuid, p_admin_user_id uuid, p_child_profile_ids jsonb) TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_kids_attach_redemption_photo(p_redemption_id uuid, p_photo_path text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ declare pid uuid; begin if not exists(select 1 from public.pr_kids_redemptions where id=p_redemption_id and status='solicitado') then raise exception 'Solicitud no disponible'; end if; insert into public.pr_kids_redemption_photos(redemption_id,photo_url) values(p_redemption_id,p_photo_path) returning id into pid; return pid; end $function$
;
ALTER FUNCTION "public"."pr_kids_attach_redemption_photo"(p_redemption_id uuid, p_photo_path text) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_kids_attach_redemption_photo"(p_redemption_id uuid, p_photo_path text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_kids_attach_redemption_photo"(p_redemption_id uuid, p_photo_path text) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_kids_attach_redemption_photo"(p_redemption_id uuid, p_photo_path text) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."pr_kids_attach_redemption_photo"(p_redemption_id uuid, p_photo_path text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."pr_kids_attach_redemption_photo"(p_redemption_id uuid, p_photo_path text) TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_kids_attach_redemption_photo_v2(p_redemption_id uuid, p_upload_token uuid, p_photo_path text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ declare pid uuid; begin if not exists(select 1 from public.pr_kids_redemptions where id=p_redemption_id and upload_token=p_upload_token and status='solicitado') then raise exception 'Solicitud no disponible'; end if; if p_photo_path not like ('redemptions/'||p_redemption_id::text||'/%') then raise exception 'Ruta de imagen inválida'; end if; insert into public.pr_kids_redemption_photos(redemption_id,photo_url) values(p_redemption_id,p_photo_path) returning id into pid; return pid; end $function$
;
ALTER FUNCTION "public"."pr_kids_attach_redemption_photo_v2"(p_redemption_id uuid, p_upload_token uuid, p_photo_path text) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_kids_attach_redemption_photo_v2"(p_redemption_id uuid, p_upload_token uuid, p_photo_path text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_kids_attach_redemption_photo_v2"(p_redemption_id uuid, p_upload_token uuid, p_photo_path text) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_kids_attach_redemption_photo_v2"(p_redemption_id uuid, p_upload_token uuid, p_photo_path text) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."pr_kids_attach_redemption_photo_v2"(p_redemption_id uuid, p_upload_token uuid, p_photo_path text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."pr_kids_attach_redemption_photo_v2"(p_redemption_id uuid, p_upload_token uuid, p_photo_path text) TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_kids_create_redemption(p_reward_id uuid, p_child_name text, p_child_document text, p_parent_name text, p_parent_phone text, p_parent_document text, p_declared_stamps integer)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ declare rid uuid; r public.pr_kids_rewards; begin select * into r from public.pr_kids_rewards where id=p_reward_id and activo=true; if r.id is null then raise exception 'Premio no disponible'; end if; if (r.stock_total-r.stock_reservado-r.stock_entregado)<=0 then raise exception 'Premio sin stock disponible'; end if; if nullif(trim(p_child_name),'') is null or nullif(trim(p_parent_name),'') is null or nullif(trim(p_parent_phone),'') is null then raise exception 'Faltan datos obligatorios'; end if; insert into public.pr_kids_redemptions(reward_id,child_name,child_document,parent_name,parent_phone,parent_document,declared_stamps) values(r.id,trim(p_child_name),trim(coalesce(p_child_document,'')),trim(p_parent_name),trim(p_parent_phone),trim(coalesce(p_parent_document,'')),greatest(coalesce(p_declared_stamps,0),0)) returning id into rid; update public.pr_kids_rewards set stock_reservado=stock_reservado+1,updated_at=now() where id=r.id; return rid; end $function$
;
ALTER FUNCTION "public"."pr_kids_create_redemption"(p_reward_id uuid, p_child_name text, p_child_document text, p_parent_name text, p_parent_phone text, p_parent_document text, p_declared_stamps integer) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_kids_create_redemption"(p_reward_id uuid, p_child_name text, p_child_document text, p_parent_name text, p_parent_phone text, p_parent_document text, p_declared_stamps integer) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_kids_create_redemption"(p_reward_id uuid, p_child_name text, p_child_document text, p_parent_name text, p_parent_phone text, p_parent_document text, p_declared_stamps integer) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_kids_create_redemption"(p_reward_id uuid, p_child_name text, p_child_document text, p_parent_name text, p_parent_phone text, p_parent_document text, p_declared_stamps integer) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."pr_kids_create_redemption"(p_reward_id uuid, p_child_name text, p_child_document text, p_parent_name text, p_parent_phone text, p_parent_document text, p_declared_stamps integer) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."pr_kids_create_redemption"(p_reward_id uuid, p_child_name text, p_child_document text, p_parent_name text, p_parent_phone text, p_parent_document text, p_declared_stamps integer) TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_kids_create_redemption_v2(p_reward_id uuid, p_child_name text, p_child_document text, p_parent_name text, p_parent_phone text, p_parent_document text, p_declared_stamps integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ declare rid uuid; tok uuid; r public.pr_kids_rewards; begin select * into r from public.pr_kids_rewards where id=p_reward_id and activo=true; if r.id is null then raise exception 'Premio no disponible'; end if; if (r.stock_total-r.stock_reservado-r.stock_entregado)<=0 then raise exception 'Premio sin stock disponible'; end if; if nullif(trim(p_child_name),'') is null or nullif(trim(p_parent_name),'') is null or nullif(trim(p_parent_phone),'') is null then raise exception 'Faltan datos obligatorios'; end if; if coalesce(p_declared_stamps,0)<r.sellos then raise exception 'La cantidad declarada de sellos no alcanza para este premio'; end if; insert into public.pr_kids_redemptions(reward_id,child_name,child_document,parent_name,parent_phone,parent_document,declared_stamps) values(r.id,trim(p_child_name),trim(coalesce(p_child_document,'')),trim(p_parent_name),trim(p_parent_phone),trim(coalesce(p_parent_document,'')),greatest(coalesce(p_declared_stamps,0),0)) returning id,upload_token into rid,tok; update public.pr_kids_rewards set stock_reservado=stock_reservado+1,updated_at=now() where id=r.id; return jsonb_build_object('id',rid,'upload_token',tok); end $function$
;
ALTER FUNCTION "public"."pr_kids_create_redemption_v2"(p_reward_id uuid, p_child_name text, p_child_document text, p_parent_name text, p_parent_phone text, p_parent_document text, p_declared_stamps integer) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_kids_create_redemption_v2"(p_reward_id uuid, p_child_name text, p_child_document text, p_parent_name text, p_parent_phone text, p_parent_document text, p_declared_stamps integer) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_kids_create_redemption_v2"(p_reward_id uuid, p_child_name text, p_child_document text, p_parent_name text, p_parent_phone text, p_parent_document text, p_declared_stamps integer) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_kids_create_redemption_v2"(p_reward_id uuid, p_child_name text, p_child_document text, p_parent_name text, p_parent_phone text, p_parent_document text, p_declared_stamps integer) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."pr_kids_create_redemption_v2"(p_reward_id uuid, p_child_name text, p_child_document text, p_parent_name text, p_parent_phone text, p_parent_document text, p_declared_stamps integer) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."pr_kids_create_redemption_v2"(p_reward_id uuid, p_child_name text, p_child_document text, p_parent_name text, p_parent_phone text, p_parent_document text, p_declared_stamps integer) TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_kids_redemption_status(p_id uuid, p_upload_token uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ declare x public.pr_kids_redemptions; r public.pr_kids_rewards; begin select * into x from public.pr_kids_redemptions where id=p_id and upload_token=p_upload_token; if x.id is null then return jsonb_build_object('status','not_found'); end if; select * into r from public.pr_kids_rewards where id=x.reward_id; return jsonb_build_object('status',x.status,'reward_name',r.nombre,'reward_stamps',r.sellos,'child_name',x.child_name,'declared_stamps',x.declared_stamps,'created_at',x.created_at,'photos',(select count(*) from public.pr_kids_redemption_photos p where p.redemption_id=x.id)); end $function$
;
ALTER FUNCTION "public"."pr_kids_redemption_status"(p_id uuid, p_upload_token uuid) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_kids_redemption_status"(p_id uuid, p_upload_token uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_kids_redemption_status"(p_id uuid, p_upload_token uuid) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_kids_redemption_status"(p_id uuid, p_upload_token uuid) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."pr_kids_redemption_status"(p_id uuid, p_upload_token uuid) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."pr_kids_redemption_status"(p_id uuid, p_upload_token uuid) TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_kids_rewards_public()
 RETURNS SETOF pr_kids_rewards
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ select * from public.pr_kids_rewards where activo=true order by orden,sellos,nombre $function$
;
ALTER FUNCTION "public"."pr_kids_rewards_public"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_kids_rewards_public"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_kids_rewards_public"() TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_kids_rewards_public"() TO "anon";
GRANT EXECUTE ON FUNCTION "public"."pr_kids_rewards_public"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."pr_kids_rewards_public"() TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_marcar_mensualidad_especial(p_alumno_id text, p_periodo date, p_estado text, p_gracia_hasta date DEFAULT NULL::date, p_observacion text DEFAULT NULL::text, p_registrado_por_id text DEFAULT NULL::text, p_registrado_por_nombre text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
 v_periodo date:=date_trunc('month',p_periodo)::date;
 v_due_day int;
 v_mid uuid;
begin
 if not public.puedo_gestionar_pagos() then raise exception 'No tenés autorización para gestionar tesorería'; end if;
 if p_alumno_id is null or p_periodo is null or p_estado not in ('pendiente','bonificado','acuerdo') then
   raise exception 'Datos o estado no permitido';
 end if;
 select vencimiento_dia into v_due_day from public.pr_tesoreria_config where id=1;
 if v_due_day is null then raise exception 'Configuración de vencimiento no disponible'; end if;
 insert into public.pr_mensualidades(alumno_id,periodo,monto,vencimiento,estado,gracia_hasta,observacion,registrado_por_id,registrado_por_nombre,updated_at)
 values(p_alumno_id,v_periodo,0,v_periodo+(v_due_day-1),p_estado,p_gracia_hasta,p_observacion,p_registrado_por_id,p_registrado_por_nombre,now())
 on conflict(alumno_id,periodo) do update set
 estado=excluded.estado,gracia_hasta=excluded.gracia_hasta,
 observacion=excluded.observacion,registrado_por_id=excluded.registrado_por_id,
 registrado_por_nombre=excluded.registrado_por_nombre,updated_at=now()
 WHERE public.pr_mensualidades.estado IS DISTINCT FROM 'pagado'
 returning id into v_mid;
 if v_mid is null then
   raise exception 'La mensualidad ya figura como pagada. No se modificó el estado.';
 end if;
 if p_estado in ('bonificado','acuerdo') then
   update public.profiles set acceso_habilitado=true,estado='Activo',updated_at=now() where id=p_alumno_id;
 end if;
end $function$
;
ALTER FUNCTION "public"."pr_marcar_mensualidad_especial"(p_alumno_id text, p_periodo date, p_estado text, p_gracia_hasta date, p_observacion text, p_registrado_por_id text, p_registrado_por_nombre text) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_marcar_mensualidad_especial"(p_alumno_id text, p_periodo date, p_estado text, p_gracia_hasta date, p_observacion text, p_registrado_por_id text, p_registrado_por_nombre text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_marcar_mensualidad_especial"(p_alumno_id text, p_periodo date, p_estado text, p_gracia_hasta date, p_observacion text, p_registrado_por_id text, p_registrado_por_nombre text) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_marcar_mensualidad_especial"(p_alumno_id text, p_periodo date, p_estado text, p_gracia_hasta date, p_observacion text, p_registrado_por_id text, p_registrado_por_nombre text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."pr_marcar_mensualidad_especial"(p_alumno_id text, p_periodo date, p_estado text, p_gracia_hasta date, p_observacion text, p_registrado_por_id text, p_registrado_por_nombre text) TO "service_role";
CREATE OR REPLACE FUNCTION public.pr_match_shifter_training_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  perform public.pr_process_shifter_activity(new.id);
  return new;
end;
$function$
;
ALTER FUNCTION "public"."pr_match_shifter_training_activity"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."pr_match_shifter_training_activity"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."pr_match_shifter_training_activity"() TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."pr_match_shifter_training_activity"() TO "service_role";
SET check_function_bodies = on;

