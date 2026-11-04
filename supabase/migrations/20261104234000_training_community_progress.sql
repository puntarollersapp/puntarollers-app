-- Public-to-PR-members motivational task completion; only approved current-month six duties, no private evidence.
create or replace function public.pr_training_v2_community_progress(p_month date)
returns jsonb language plpgsql stable security definer set search_path=public as $fn$
declare result jsonb;
begin
 if auth.uid() is null or public.pr_current_profile_id() is null then return '[]'::jsonb; end if;
 with cycle as (select id from public.pr_training_v2_cycles where cycle_month=p_month and is_visible=true limit 1),
 assigned as (select a.id,a.profile_id from public.pr_training_v2_assignments a join cycle c on c.id=a.cycle_id),
 duties as (select a.profile_id,d.id from assigned a join public.pr_training_v2_assignment_duties d on d.assignment_id=a.id where d.slot between 1 and 6),
 latest as (select distinct on (s.profile_id,s.assignment_duty_id) s.profile_id,s.assignment_duty_id,s.status from public.pr_training_v2_submissions s join duties d on d.id=s.assignment_duty_id and d.profile_id=s.profile_id order by s.profile_id,s.assignment_duty_id,s.submitted_at desc),
 scores as (select d.profile_id,count(*)::int total,count(*) filter(where l.status='approved')::int approved from duties d left join latest l on l.assignment_duty_id=d.id and l.profile_id=d.profile_id group by d.profile_id)
 select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'nombre',p.nombre,'apellido',p.apellido,'foto',p.foto,'total',s.total,'approved',s.approved,'percent',round(100.0*s.approved/nullif(s.total,0))) order by s.approved desc,p.nombre),'[]'::jsonb) into result
 from scores s join public.profiles p on p.id=s.profile_id where p.estado='Activo' and p.acceso_habilitado=true;
 return result;
end $fn$;
revoke all on function public.pr_training_v2_community_progress(date) from public,anon;
grant execute on function public.pr_training_v2_community_progress(date) to authenticated;