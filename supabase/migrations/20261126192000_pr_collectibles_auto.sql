-- Automatic grants are separate from staff actions, persistent, and idempotent.
-- Only verified existing PR sources are consulted; RSVP alone does not prove attendance.
alter table public.pr_collectibles_grants alter column granted_by drop not null;
alter table public.pr_collectibles_grants add column source text not null default 'manual'
  check (source in ('manual','automatic'));
alter table public.pr_collectibles_grants add constraint pr_collectibles_source_actor
  check ((source='manual' and granted_by is not null) or (source='automatic' and granted_by is null));
create schema pr_collectibles_internal;
revoke all on schema pr_collectibles_internal from public,anon,authenticated;
grant usage on schema pr_collectibles_internal to authenticated;
create function pr_collectibles_internal.sync_my_cards()
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 v_profile text; v_is_admin boolean; v_launch boolean:=now()>='2026-12-01 00:00:00-03'::timestamptz;
 v_att integer:=0; v_out integer:=0; v_in integer:=0; v_streak integer:=0;
 v_km numeric:=0; v_max numeric:=0; v_duties integer:=0; v_months integer:=0; v_clinics integer:=0;
 v_badges integer[]:=array[]::integer[]; v_candidates integer[]:=array[]::integer[];
 v_new integer:=0;
begin
 if auth.uid() is null then raise exception 'Not authenticated'; end if;
 v_profile:=public.pr_current_profile_id();
 if v_profile is null then raise exception 'No profile'; end if;
 v_is_admin:=v_profile='admin-claudio' and public.pr_frames_is_admin();
 if not v_launch and not v_is_admin then raise exception 'Not released'; end if;
 if not exists(select 1 from public.profiles p where p.id=v_profile and (p.role='alumno' or p.participa_como_alumno or v_is_admin)) then raise exception 'Not an eligible profile'; end if;

 with verified as (
   select distinct c.id,c.venue,date_trunc('week',c.starts_at at time zone 'America/Montevideo')::date as week
   from public.pr_check_attendance a join public.pr_check_ids i on i.id=a.identity_id join public.pr_check_classes c on c.id=a.class_id
   where i.profile_id=v_profile and i.child_id is null and c.is_test is false
   and coalesce(c.status,'') not in ('cancelled','canceled','cancelado','cancelada','anulado','anulada')
   and c.starts_at<=now() and a.scanned_at<=now()
 ), weeks as (select distinct week from verified), islands as (
   select week,week-(row_number() over(order by week)::int*7) as grp from weeks
 ), streaks as (select count(*) n from islands group by grp)
 select count(*)::int,count(*) filter(where venue='aire_libre')::int,count(*) filter(where venue='pista')::int,
  coalesce((select max(n) from streaks),0)::int into v_att,v_out,v_in,v_streak from verified;

 -- Match the existing PR Patch validated Strava criteria; never count pending/synchronized-only records.
 select coalesce(sum(t.distancia_metros),0)/1000,coalesce(max(t.distancia_metros),0)/1000 into v_km,v_max
 from (select distinct on(a.strava_activity_id) a.strava_activity_id,a.distancia_metros
   from public.pr_activities a where a.alumno_id=v_profile and a.fuente='strava' and a.strava_activity_id is not null
   and a.eliminada is false and a.fecha_inicio<=now() and a.distancia_metros>0
   and lower(coalesce(a.tipo,'')) in ('rollerskating','inline skating','inline_skating','skating','patinaje','rollerblading')
   and lower(coalesce(a.estado_validacion,'')) in ('validada','validado','aprobada','aprobado','verified','approved')
   order by a.strava_activity_id,a.fecha_inicio desc,a.id) t;

 with latest as (
 select distinct on(s.assignment_duty_id) s.assignment_duty_id,s.status
 from public.pr_training_v2_submissions s where s.profile_id=v_profile
 order by s.assignment_duty_id,s.submitted_at desc nulls last,s.reviewed_at desc nulls last,s.id desc
 ), approved as (
 select l.assignment_duty_id,cy.cycle_month,d.slot from latest l
 join public.pr_training_v2_assignment_duties d on d.id=l.assignment_duty_id
 join public.pr_training_v2_assignments a on a.id=d.assignment_id
 join public.pr_training_v2_cycles cy on cy.id=a.cycle_id
 where l.status='approved' and a.profile_id=v_profile and cy.is_visible is true
 ), full_months as (
 select cycle_month from approved where slot between 1 and 6 group by cycle_month having count(distinct slot)=6
 )
 select count(*)::int,(select count(*)::int from full_months) into v_duties,v_months from approved;

 select count(distinct clinic_key)::int into v_clinics from public.pr_clinic_participation
 where profile_id=v_profile and attended is true;
 select coalesce(array_agg(distinct m.n),array[]::integer[]) into v_badges
 from public.actividad_pr b join (values
  (4,'actitud positiva'),(5,'buen companero'),(6,'ya frena con taco'),(7,'ya frena en t'),
  (8,'primer evento pr'),(10,'primeros 6k'),(13,'primeros 10k'),(14,'rodador frecuente'),
  (15,'espiritu pr'),(24,'primera clinica 2026'),(25,'entrenador potencial'),
  (41,'6 km solidarios · juntos por valentino'),(42,'travesia la barra 19k')
 ) as m(n,title) on translate(lower(trim(b.titulo)),'áéíóúüñ','aeiouun')=m.title
 where b.alumno_id=v_profile and b.tipo='Insignia' and not coalesce(b.eliminado,false);

 select coalesce(array_agg(n),array[]::integer[]) into v_candidates from (values
 (1,v_att>=1),(2,v_out>=1),(3,v_in>=1),(9,v_max>=3),(10,v_max>=6),
 (11,v_duties>=1),(12,v_att>=5),(13,v_max>=10),(16,v_att>=10),(17,v_att>=20),
 (18,v_km>=50),(19,v_km>=100),(20,v_km>=250),(21,v_streak>=4),(22,v_months>=1),
 (24,v_clinics>=1),(26,v_att>=25),(27,v_att>=50),(28,v_km>=500),(29,v_max>=20),
 (30,v_clinics>=3),(31,v_streak>=13),(32,v_months>=3),(35,v_km>=1000),(36,v_km>=2000),
 (37,v_att>=100),(38,v_att>=200),(39,v_streak>=52),(40,v_months>=6)
 ) as candidate(n,eligible) where eligible;

 if v_launch then
 insert into public.pr_collectibles_grants(profile_id,card_code,granted_by,reason,source)
 select v_profile,c.code,null,'Desbloqueada por registros verificados de Punta Rollers.','automatic'
 from public.pr_collectibles_catalog c
 where c.grant_enabled and c.card_number=any(v_candidates||v_badges)
 on conflict(profile_id,card_code) do nothing;
 get diagnostics v_new=row_count;
 end if;
 return jsonb_build_object('new_grants',v_new,'preview',not v_launch,
 'eligible_numbers',to_jsonb(v_candidates||v_badges),
 'metrics',jsonb_build_object('attendance',v_att,'attendance_outdoor',v_out,'attendance_indoor',v_in,'distance_total',v_km,'distance_single',v_max,'weekly_streak',v_streak,'duties_total',v_duties,'duties_full_months',v_months,'clinics',v_clinics));
end $$;
revoke all on function pr_collectibles_internal.sync_my_cards() from public,anon,authenticated;
grant execute on function pr_collectibles_internal.sync_my_cards() to authenticated;
create function public.pr_collectibles_sync_my_cards() returns jsonb language sql security invoker set search_path='' as $$
 select pr_collectibles_internal.sync_my_cards();
$$;
revoke all on function public.pr_collectibles_sync_my_cards() from public,anon,authenticated;
grant execute on function public.pr_collectibles_sync_my_cards() to authenticated;
