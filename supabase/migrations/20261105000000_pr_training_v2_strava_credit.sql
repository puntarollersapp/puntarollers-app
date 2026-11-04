-- PR Training 2.0: automatic Strava accreditation. Run after reviewing on staging.
-- Only current cycle, explicitly coded inline-skating activities and objective metrics.
create or replace function public.pr_training_v2_strava_credit()
returns trigger language plpgsql security definer set search_path=public as $fn$
declare item record; token text; minimum numeric; actual numeric;
begin
 if new.fuente is distinct from 'strava' or new.eliminada is true or new.deporte_strava is distinct from 'InlineSkate' then return new; end if;
 for item in
  select ad.id as assignment_duty_id, dt.duty_code, cy.cycle_month
  from public.pr_training_v2_assignments a
  join public.pr_training_v2_cycles cy on cy.id=a.cycle_id
  join public.pr_training_v2_assignment_duties ad on ad.assignment_id=a.id
  join public.pr_training_v2_duties dt on dt.id=ad.duty_id
  where a.profile_id=new.alumno_id and cy.is_visible=true and ad.slot between 1 and 6
    and dt.evidence_type='strava' and dt.duty_code in ('B3-04','B3-05','B3-10','B3-11','B3-17')
 loop
  if date_trunc('month',new.fecha_inicio)::date is distinct from item.cycle_month then continue; end if;
  token:='PRT-'||upper(substr(replace(item.assignment_duty_id::text,'-',''),1,12));
  if upper(coalesce(new.nombre,'')) !~ ('(^|[^A-Z0-9])'||token||'($|[^A-Z0-9])') then continue; end if;
  minimum:=case item.duty_code when 'B3-10' then 3000 when 'B3-11' then 6000 else 900 end;
  actual:=case when item.duty_code in ('B3-10','B3-11') then new.distancia_metros else new.tiempo_movimiento_segundos end;
  if coalesce(actual,0)<minimum then continue; end if;
  if exists(select 1 from public.pr_training_v2_submissions s where s.assignment_duty_id=item.assignment_duty_id and s.profile_id=new.alumno_id) then continue; end if;
  insert into public.pr_training_v2_submissions(assignment_duty_id,profile_id,evidence,status,submitted_at,reviewed_at,reviewer_note)
  values(item.assignment_duty_id,new.alumno_id,jsonb_build_object('source','strava','activity_id',new.id,'strava_activity_id',new.strava_activity_id),'approved',now(),now(),'Sincronización automática Strava · PR Training 2.0');
 end loop;
 return new;
end $fn$;
revoke all on function public.pr_training_v2_strava_credit() from public,anon,authenticated;
drop trigger if exists pr_training_v2_strava_credit_trigger on public.pr_activities;
create trigger pr_training_v2_strava_credit_trigger
after insert or update of nombre,distancia_metros,tiempo_movimiento_segundos on public.pr_activities
for each row execute function public.pr_training_v2_strava_credit();
