-- Repair an equipped frame if its manual grant was revoked or the frame hidden.
create or replace function public.pr_frames_reset_invalid_manual_equips(p_frame_id text,p_profile_id text default null)
returns integer language plpgsql security definer set search_path='' as $$
declare v_count integer;
begin
 if auth.uid() is null or not exists(select 1 from public.profiles where auth_user_id=auth.uid() and role='admin') then
 raise exception 'Administrator only' using errcode='42501'; end if;
 update public.profiles p set pr_avatar=jsonb_set(coalesce(p.pr_avatar,'{}'::jsonb),'{frames,equipped}',to_jsonb('original'::text),true)
 where p.pr_avatar #>> '{frames,equipped}'=p_frame_id
 and (p_profile_id is null or p.id=p_profile_id)
 and not exists(select 1 from public.pr_frame_catalog c where c.id=p_frame_id and c.visible and c.active
 and exists(select 1 from public.pr_frame_unlocks u where u.profile_id=p.id and u.frame_id=c.id));
 get diagnostics v_count=row_count;
 return v_count;
end $$;
revoke all on function public.pr_frames_reset_invalid_manual_equips(text,text) from public,anon;
grant execute on function public.pr_frames_reset_invalid_manual_equips(text,text) to authenticated;
