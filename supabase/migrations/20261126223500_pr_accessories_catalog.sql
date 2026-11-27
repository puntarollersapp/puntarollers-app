insert into public.pr_accessory_catalog(code,title,asset_file,unlock_description,unlock_rule,enabled,sort_order) values
('pr-logo','Punta Rollers','Pr logo.png','Regalo para todos los alumnos','{"kind":"everyone","target":0}'::jsonb,true,0),
('racha-1','Fuego inicial','Racha 1.png','2 semanas consecutivas con asistencia','{"kind":"streak","target":2}'::jsonb,true,1),
('racha-2','Fuego turquesa','Racha 2.png','4 semanas consecutivas con asistencia','{"kind":"streak","target":4}'::jsonb,true,2),
('racha-3','Fuego prismático','Racha 3.png','8 semanas consecutivas con asistencia','{"kind":"streak","target":8}'::jsonb,true,3),
('100km','100 KM','100km.png','100 km acumulados de patinaje registrado','{"kind":"km","target":100}'::jsonb,true,4),
('ranking-km','Campeón del ranking KM','Ganadora del rankin Km.png','Ganar una edición de kilómetros con resultado oficial cerrado','{"kind":"winner","target":0}'::jsonb,true,5),
('medalla-pr','Nominación PR Awards','Medalla PR.png','Formar parte de una terna oficial de PR Awards','{"kind":"nominee","target":0}'::jsonb,true,6),
('perfect-asistencia','Asistencia perfecta','Perfect asistencia clase.png','Reconocimiento oficial del equipo PR por asistencia perfecta','{"kind":"perfect","target":0}'::jsonb,true,7),
('racha-smiley','Racha con actitud','Racha smiley.png','12 semanas consecutivas con asistencia','{"kind":"streak","target":12}'::jsonb,true,8),
('buena-onda','Buena onda','Buena onda.png','Recibir la insignia Actitud positiva','{"kind":"badge","target":0}'::jsonb,true,9),
('funny-dedos','Funny dedos','Funny Dedos.png','1 asistencia registrada','{"kind":"attendance","target":1}'::jsonb,true,10),
('cono-1','Primer cono','Cono 1.png','2 asistencias registradas','{"kind":"attendance","target":2}'::jsonb,true,11),
('dos-rollers','Dos rollers','Dos Rollers.png','3 asistencias registradas','{"kind":"attendance","target":3}'::jsonb,true,12),
('cool-heart','Cool Heart','Cool Heart.png','4 asistencias registradas','{"kind":"attendance","target":4}'::jsonb,true,13),
('crazy-smiley','Crazy smiley','Crazy smiley.png','5 asistencias registradas','{"kind":"attendance","target":5}'::jsonb,true,14),
('simley','Smiley dorado','Simley.png','6 asistencias registradas','{"kind":"attendance","target":6}'::jsonb,true,15),
('funny-face','Funny face','Funny face.png','7 asistencias registradas','{"kind":"attendance","target":7}'::jsonb,true,16),
('spinner','Spinner','Spinner.png','8 asistencias registradas','{"kind":"attendance","target":8}'::jsonb,true,17),
('gummie','Gummie','Gummie.png','10 asistencias registradas','{"kind":"attendance","target":10}'::jsonb,true,18),
('burger','Burger','Burger.png','12 asistencias registradas','{"kind":"attendance","target":12}'::jsonb,true,19),
('music-fan','Music fan','Music Fan.png','15 asistencias registradas','{"kind":"attendance","target":15}'::jsonb,true,20),
('gamer-fan','Gamer fan','Gamer fan.png','18 asistencias registradas','{"kind":"attendance","target":18}'::jsonb,true,21),
('millenial','Millennial','Millenial.png','20 asistencias registradas','{"kind":"attendance","target":20}'::jsonb,true,22),
('princess','Princess','Princess.png','25 asistencias registradas','{"kind":"attendance","target":25}'::jsonb,true,23),
('stop','Never stop','Stop.png','30 asistencias registradas','{"kind":"attendance","target":30}'::jsonb,true,24),
('crazy-cono','Crazy cono','Crazy cono.png','35 asistencias registradas','{"kind":"attendance","target":35}'::jsonb,true,25),
('calavera','Calavera','Calavera.png','40 asistencias registradas','{"kind":"attendance","target":40}'::jsonb,true,26),
('cool-zombie','Cool zombie','Cool zombie.png','50 asistencias registradas','{"kind":"attendance","target":50}'::jsonb,true,27);
-- Owner can use all official assets now. Only one is equipped at a time.
insert into public.pr_accessory_grants(profile_id,accessory_code,source)
select 'admin-claudio',code,'owner_preview' from public.pr_accessory_catalog where enabled on conflict do nothing;
insert into public.pr_accessory_equipped(profile_id,accessory_code) values('admin-claudio','pr-logo') on conflict do nothing;
create schema pr_accessories_internal;
revoke all on schema pr_accessories_internal from public,anon,authenticated;
grant usage on schema pr_accessories_internal to authenticated;
create function pr_accessories_internal.sync_my_accessories()
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_profile text; v_admin boolean; v_att int; v_streak int; v_km numeric;
v_week date; v_new int; v_nominee boolean; v_winner boolean; v_perfect boolean; v_good boolean;
begin
 if auth.uid() is null then raise exception 'Not authenticated'; end if;
 v_profile:=public.pr_current_profile_id();
 if v_profile is null then raise exception 'No profile'; end if;
 v_admin:=v_profile='admin-claudio' and public.pr_frames_is_admin();
 if not v_admin and now()<'2026-12-01 00:00:00-03'::timestamptz then raise exception 'Not released'; end if;
 if not v_admin and not exists(select 1 from public.profiles p where p.id=v_profile and (p.role='alumno' or p.participa_como_alumno)) then raise exception 'Not eligible'; end if;
 v_week:=date_trunc('week',now() at time zone 'America/Montevideo')::date;
 with verified as (
 select distinct c.id,date_trunc('week',c.starts_at at time zone 'America/Montevideo')::date as week
 from public.pr_check_attendance a join public.pr_check_ids i on i.id=a.identity_id join public.pr_check_classes c on c.id=a.class_id
 where i.profile_id=v_profile and i.child_id is null and c.is_test is false and c.starts_at<=now() and a.scanned_at<=now()
 and coalesce(c.status,'') not in ('cancelled','canceled','cancelado','cancelada','anulado','anulada')
 ), weeks as (select distinct week from verified), islands as (
 select week,week-(row_number() over(order by week)::int*7) grp from weeks
 ), streaks as(select count(*) n,max(week) last_week from islands group by grp)
 select count(*)::int,coalesce((select n from streaks where last_week>=v_week-7 order by last_week desc limit 1),0)::int into v_att,v_streak from verified;
 select coalesce(sum(t.distancia_metros),0)/1000 into v_km from (
 select distinct on(a.strava_activity_id) a.strava_activity_id,a.distancia_metros from public.pr_activities a
 where a.alumno_id=v_profile and a.fuente='strava' and a.strava_activity_id is not null and a.eliminada is false and a.fecha_inicio<=now() and a.distancia_metros>0
 and lower(coalesce(a.tipo,'')) in ('rollerskating','inline skating','inline_skating','skating','patinaje','rollerblading')
 and lower(coalesce(a.estado_validacion,'')) in ('validada','validado','aprobada','aprobado','verified','approved')
 order by a.strava_activity_id,a.fecha_inicio desc,a.id) t;
 select exists(select 1 from public.pr_awards_finalists f join public.pr_awards_candidates c on c.id=f.candidate_id where c.source_profile_id::text=v_profile or c.source_profile_key::text=v_profile) into v_nominee;
 select exists(select 1 from public.pr_unlock_results r where r.winner_profile_id::text=v_profile and r.finalized_at is not null and r.finalized_at<=now()) into v_winner;
 select exists(select 1 from public.pr_awards_winners w join public.pr_awards_finalists f on f.id=w.finalist_id join public.pr_awards_candidates c on c.id=f.candidate_id join public.pr_awards_categories k on k.id=w.category_id cross join public.pr_awards_settings s where k.title='Asistencia Perfecta' and s.results_revealed and (c.source_profile_id::text=v_profile or c.source_profile_key::text=v_profile)) into v_perfect;
 select exists(select 1 from public.actividad_pr b where b.alumno_id=v_profile and b.tipo='Insignia' and not coalesce(b.eliminado,false) and lower(trim(b.titulo))='actitud positiva') into v_good;
 insert into public.pr_accessory_grants(profile_id,accessory_code,source)
 select v_profile,c.code,case when v_admin then 'owner_preview' else 'automatic' end
 from public.pr_accessory_catalog c where c.enabled and (v_admin or case c.unlock_rule->>'kind'
 when 'everyone' then true when 'attendance' then v_att >= (c.unlock_rule->>'target')::int
 when 'streak' then v_streak >= (c.unlock_rule->>'target')::int
 when 'km' then v_km >= (c.unlock_rule->>'target')::numeric
 when 'nominee' then v_nominee when 'winner' then v_winner when 'perfect' then v_perfect when 'badge' then v_good
 else false end)
 on conflict do nothing;
 get diagnostics v_new=row_count;
 return jsonb_build_object('new',v_new,'attendance',v_att,'streak',v_streak,'km',v_km);
end $$;
revoke all on function pr_accessories_internal.sync_my_accessories() from public,anon,authenticated;
grant execute on function pr_accessories_internal.sync_my_accessories() to authenticated;
create function public.pr_accessories_sync_my() returns jsonb language sql security invoker set search_path='' as $$ select pr_accessories_internal.sync_my_accessories(); $$;
revoke all on function public.pr_accessories_sync_my() from public,anon,authenticated;
grant execute on function public.pr_accessories_sync_my() to authenticated;
