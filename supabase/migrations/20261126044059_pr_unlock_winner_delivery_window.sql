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
      new.winner_name||' cerró la misión en el #1 con '||trim(to_char(new.winner_km,'FM999999990.0'))||' km. La comunidad sumó '||trim(to_char(new.group_km,'FM999999990.0'))||' km.'||case when new.unlocked_level>0 then ' Premio desbloqueado: '||new.prize_title||'. ¡Felicitaciones! Nos pondremos en contacto contigo para coordinar la entrega. La entrega de premios se realizará dentro de los primeros 10 días hábiles del mes siguiente al cierre del desafío.' else ' Esta edición cerró sin premio desbloqueado.' end,
      new.finalized_at,'pr_unlock_winner:'||new.campaign_id::text,new.winner_name,'alumno',new.winner_photo,false,false);
  end if;
  return new;
end; $function$
;