-- PR Personal: make reservation status, pass balance and history changes atomic.
-- Public reservations remain controlled by pr_personal_config. This function is
-- only callable by authenticated users and verifies the existing admin role.

create or replace function public.pr_personal_cambiar_estado(
  p_reserva_id bigint,
  p_estado text,
  p_motivo text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
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
$$;

revoke all on function public.pr_personal_cambiar_estado(bigint, text, text) from public;
revoke all on function public.pr_personal_cambiar_estado(bigint, text, text) from anon;
grant execute on function public.pr_personal_cambiar_estado(bigint, text, text) to authenticated;

comment on function public.pr_personal_cambiar_estado(bigint, text, text)
is 'Atomic admin-only PR Personal reservation transition with pass balance and history.';
