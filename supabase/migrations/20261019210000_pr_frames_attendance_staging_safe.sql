-- Preserve attendance grants while allowing staging without PR Check tables.
create or replace function public.pr_frames_my_unlocks()
returns table(frame_id text,unlocked_at timestamptz)
language plpgsql security definer set search_path=''
as $$
declare v_profile text; v_classes integer:=0;
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='28000'; end if;
 select p.id into v_profile from public.profiles p where p.auth_user_id=auth.uid() limit 1;
 if v_profile is null then return; end if;
 if to_regclass('public.pr_check_attendance') is not null and to_regclass('public.pr_check_ids') is not null then
  execute 'select count(distinct a.class_id) from public.pr_check_attendance a join public.pr_check_ids i on i.id=a.identity_id where i.profile_id=$1'
  into v_classes using v_profile;
 end if;
 if v_classes>=10 then
  insert into public.pr_frame_unlocks(profile_id,frame_id,source)
  values(v_profile,'constancia','pr_check_10_distinct_classes') on conflict do nothing;
 end if;
 return query select u.frame_id,u.unlocked_at from public.pr_frame_unlocks u
 where u.profile_id=v_profile order by u.unlocked_at;
end $$;
revoke all on function public.pr_frames_my_unlocks() from public,anon;
grant execute on function public.pr_frames_my_unlocks() to authenticated;
