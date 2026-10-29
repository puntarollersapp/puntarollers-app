-- Secure server-authorized PR Frames equip; preserves other pr_avatar settings.
create or replace function public.pr_frames_equip(p_frame_id text)
returns text language plpgsql security definer set search_path = ''
as $$
declare v_profile text; v_today date;
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='28000'; end if;
 if p_frame_id not in ('original','constancia','shifter-2026','navidad-2026','nuevo-2027') or p_frame_id is null
 then raise exception 'Unknown frame' using errcode='22023'; end if;
 select p.id into v_profile from public.profiles p where p.auth_user_id=auth.uid() limit 1;
 if v_profile is null then raise exception 'Profile not found' using errcode='P0002'; end if;
 v_today := (now() at time zone 'America/Montevideo')::date;
 if p_frame_id = 'constancia' then
  insert into public.pr_frame_unlocks(profile_id,frame_id,source)
  select v_profile,'constancia','pr_check_10_distinct_classes'
  where (select count(distinct a.class_id) from public.pr_check_attendance a
   join public.pr_check_ids i on i.id=a.identity_id where i.profile_id=v_profile) >= 10
  on conflict(profile_id,frame_id) do nothing;
 end if;
 if p_frame_id <> 'original'
 and not exists(select 1 from public.pr_frame_unlocks u where u.profile_id=v_profile and u.frame_id=p_frame_id)
 and not (p_frame_id='navidad-2026' and v_today between date '2026-12-01' and date '2026-12-26')
 and not (p_frame_id='nuevo-2027' and v_today between date '2026-12-27' and date '2027-01-07')
 then raise exception 'Frame locked' using errcode='42501'; end if;
 update public.profiles p set pr_avatar=jsonb_set(
 jsonb_set(coalesce(p.pr_avatar,'{}'::jsonb),'{frames}',coalesce(p.pr_avatar->'frames','{}'::jsonb),true),
 '{frames,equipped}',to_jsonb(p_frame_id),true), updated_at=now()
 where p.id=v_profile;
 return p_frame_id;
end $$;
revoke all on function public.pr_frames_equip(text) from public,anon;
grant execute on function public.pr_frames_equip(text) to authenticated;
