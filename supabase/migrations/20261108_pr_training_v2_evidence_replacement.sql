-- PR Tareas 2.0: safe evidence replacement. Apply to staging before production.
-- The existing submission row is updated so the staff queue always reads the current file.
-- Previous paths remain in private JSON audit history; no storage objects are deleted.
create or replace function public.pr_training_v2_replace_evidence(
  p_assignment_duty_id uuid, p_paths text[]
) returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_profile text;
  v_row public.pr_training_v2_submissions%rowtype;
  v_path text;
  v_count int;
  v_evidence jsonb;
begin
  select id into v_profile from public.profiles where auth_user_id=auth.uid() limit 1;
  if v_profile is null then raise exception 'AUTH_REQUIRED'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_assignment_duty_id::text,0));
  select s.* into v_row
  from public.pr_training_v2_submissions s
  join public.pr_training_v2_assignment_duties ad on ad.id=s.assignment_duty_id
  join public.pr_training_v2_assignments a on a.id=ad.assignment_id
  where s.assignment_duty_id=p_assignment_duty_id and s.profile_id=v_profile
    and a.profile_id=v_profile
  order by s.submitted_at desc,s.id desc limit 1 for update of s;
  if not found then raise exception 'SUBMISSION_NOT_FOUND'; end if;
  if v_row.status not in ('submitted','under_review','returned','rejected','changes_requested') then
    raise exception 'SUBMISSION_NOT_EDITABLE';
  end if;
  if exists(select 1 from public.pr_training_v2_submissions s
    where s.assignment_duty_id=p_assignment_duty_id and s.profile_id=v_profile
    and s.status='approved') then raise exception 'SUBMISSION_ALREADY_APPROVED'; end if;
  v_count:=coalesce(array_length(p_paths,1),0);
  if v_count<1 or v_count>3 then raise exception 'INVALID_FILE_COUNT'; end if;
  foreach v_path in array p_paths loop
    if v_path is null or left(v_path,length(v_profile)+1)<>v_profile||'/'
       or position('..' in v_path)>0 then raise exception 'INVALID_PATH'; end if;
    if not exists(select 1 from storage.objects o where o.bucket_id='pr-training-v2-evidence' and o.name=v_path)
       then raise exception 'FILE_NOT_UPLOADED'; end if;
  end loop;
  v_evidence:=coalesce(v_row.evidence,'{}'::jsonb);
  update public.pr_training_v2_submissions
  set evidence=jsonb_build_object(
      'bucket','pr-training-v2-evidence','paths',to_jsonb(p_paths),
      'replaced_at',now(),
      'history',coalesce(v_evidence->'history','[]'::jsonb) ||
        jsonb_build_array(jsonb_build_object('paths',v_evidence->'paths','replaced_at',now()))
    ),
    status='submitted',submitted_at=now(),reviewer_note=null,reviewer_id=null,reviewed_at=null
  where id=v_row.id and status in ('submitted','under_review','returned','rejected','changes_requested');
  if not found then raise exception 'SUBMISSION_CHANGED'; end if;
  return jsonb_build_object('ok',true,'submission_id',v_row.id,'status','submitted','replaced',true);
end $$;
revoke all on function public.pr_training_v2_replace_evidence(uuid,text[]) from public;
grant execute on function public.pr_training_v2_replace_evidence(uuid,text[]) to authenticated;

create or replace function public.pr_training_v2_my_evidence(p_assignment_duty_id uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_profile text; v_result jsonb;
begin
  select id into v_profile from public.profiles where auth_user_id=auth.uid() limit 1;
  if v_profile is null then raise exception 'AUTH_REQUIRED'; end if;
  select jsonb_build_object('status',s.status,'paths',s.evidence->'paths',
    'replaced_at',s.evidence->'replaced_at')
  into v_result from public.pr_training_v2_submissions s
  join public.pr_training_v2_assignment_duties ad on ad.id=s.assignment_duty_id
  join public.pr_training_v2_assignments a on a.id=ad.assignment_id
  where s.assignment_duty_id=p_assignment_duty_id and s.profile_id=v_profile and a.profile_id=v_profile
  order by case when s.status='approved' then 0 else 1 end,s.submitted_at desc,s.id desc limit 1;
  return coalesce(v_result,'{}'::jsonb);
end $$;
revoke all on function public.pr_training_v2_my_evidence(uuid) from public;
grant execute on function public.pr_training_v2_my_evidence(uuid) to authenticated;
