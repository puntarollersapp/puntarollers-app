-- The completion check records participation; evaluation remains with the instructor.
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
