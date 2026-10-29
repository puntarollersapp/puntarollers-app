-- Version existing staging-tested admin and catalog-aware equip functions.
CREATE OR REPLACE FUNCTION public.pr_frames_admin_manage(p_action text, p_frame_id text, p_name text DEFAULT NULL::text, p_description text DEFAULT NULL::text, p_profile_id text DEFAULT NULL::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_is_admin boolean;
begin
 select exists(select 1 from public.profiles p where p.auth_user_id=auth.uid() and p.role='admin') into v_is_admin;
 if auth.uid() is null or not v_is_admin then raise exception 'Administrator only' using errcode='42501'; end if;
 if p_action='create' then
  if p_frame_id !~ '^[a-z0-9-]{3,40}$' or length(trim(coalesce(p_name,'')))<2 then raise exception 'Invalid frame' using errcode='22023'; end if;
  insert into public.pr_frame_catalog(id,name,description,unlock_kind,sort_order)
  values(p_frame_id,trim(p_name),coalesce(p_description,''),'manual',100);
 elsif p_action='grant' then
  if not exists(select 1 from public.pr_frame_catalog c where c.id=p_frame_id and c.unlock_kind='manual') then raise exception 'Only manual frames may be granted' using errcode='42501'; end if;
  if not exists(select 1 from public.profiles p where p.id=p_profile_id) then raise exception 'Student not found' using errcode='P0002'; end if;
  insert into public.pr_frame_unlocks(profile_id,frame_id,source) values(p_profile_id,p_frame_id,'admin')
  on conflict(profile_id,frame_id) do nothing;
 elsif p_action='revoke' then
  if not exists(select 1 from public.pr_frame_catalog c where c.id=p_frame_id and c.unlock_kind='manual') then raise exception 'Only manual frames may be revoked' using errcode='42501'; end if;
  delete from public.pr_frame_unlocks u where u.profile_id=p_profile_id and u.frame_id=p_frame_id and u.source='admin';
 elsif p_action='hide' then
  update public.pr_frame_catalog c set visible=false where c.id=p_frame_id and c.unlock_kind='manual';
 elsif p_action='show' then
  update public.pr_frame_catalog c set visible=true where c.id=p_frame_id and c.unlock_kind='manual';
 else raise exception 'Unknown action' using errcode='22023';
 end if;
 return p_action;
end $function$
;
revoke all on function public.pr_frames_admin_manage(text,text,text,text,text) from public,anon;
grant execute on function public.pr_frames_admin_manage(text,text,text,text,text) to authenticated;

CREATE OR REPLACE FUNCTION public.pr_frames_admin_students()
 RETURNS TABLE(profile_id text, display_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
 if auth.uid() is null or not exists(select 1 from public.profiles p where p.auth_user_id=auth.uid() and p.role='admin')
 then raise exception 'Administrator only' using errcode='42501'; end if;
 return query select p.id,coalesce(nullif(trim(p.nombre),''),p.id) from public.profiles p order by 2 limit 1000;
end $function$
;
revoke all on function public.pr_frames_admin_students() from public,anon;
grant execute on function public.pr_frames_admin_students() to authenticated;

CREATE OR REPLACE FUNCTION public.pr_frames_equip(p_frame_id text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_profile text; v_today date; v_kind text; v_start date; v_end date;
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='28000'; end if;
 select p.id into v_profile from public.profiles p where p.auth_user_id=auth.uid() limit 1;
 if v_profile is null then raise exception 'Profile not found' using errcode='P0002'; end if;
 select c.unlock_kind,c.starts_on,c.ends_on into v_kind,v_start,v_end
 from public.pr_frame_catalog c where c.id=p_frame_id and c.visible and c.active;
 if v_kind is null then raise exception 'Unknown or inactive frame' using errcode='22023'; end if;
 v_today := (now() at time zone 'America/Montevideo')::date;
 if p_frame_id='constancia' then
 insert into public.pr_frame_unlocks(profile_id,frame_id,source)
 select v_profile,'constancia','pr_check_10_distinct_classes'
 where (select count(distinct a.class_id) from public.pr_check_attendance a
 join public.pr_check_ids i on i.id=a.identity_id where i.profile_id=v_profile)>=10
 on conflict(profile_id,frame_id) do nothing;
 end if;
 if v_kind <> 'default'
 and not exists(select 1 from public.pr_frame_unlocks u where u.profile_id=v_profile and u.frame_id=p_frame_id)
 and not (v_kind='seasonal' and v_today between v_start and v_end)
 then raise exception 'Frame locked' using errcode='42501'; end if;
 update public.profiles p set pr_avatar=jsonb_set(
 jsonb_set(coalesce(p.pr_avatar,'{}'::jsonb),'{frames}',coalesce(p.pr_avatar->'frames','{}'::jsonb),true),
 '{frames,equipped}',to_jsonb(p_frame_id),true),updated_at=now() where p.id=v_profile;
 return p_frame_id;
end $function$
;
revoke all on function public.pr_frames_equip(text) from public,anon;
grant execute on function public.pr_frames_equip(text) to authenticated;
