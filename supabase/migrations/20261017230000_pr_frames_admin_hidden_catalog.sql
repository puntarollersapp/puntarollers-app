-- Allow authorized administrators to manage hidden manual frames without exposing them in the public gallery.
create or replace function public.pr_frames_admin_catalog()
returns table(id text,name text,visible boolean,active boolean)
language plpgsql security definer set search_path=''
as $$
begin
 if auth.uid() is null or not exists(
  select 1 from public.profiles p where p.auth_user_id=auth.uid() and p.role='admin'
 ) then raise exception 'Administrator access required' using errcode='42501'; end if;
 return query select c.id,c.name,c.visible,c.active from public.pr_frame_catalog c
 where c.unlock_kind='manual' order by c.sort_order,c.name;
end $$;
revoke all on function public.pr_frames_admin_catalog() from public,anon;
grant execute on function public.pr_frames_admin_catalog() to authenticated;
