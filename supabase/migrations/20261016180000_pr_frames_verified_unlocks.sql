-- PR Frames: immutable verified rewards, staging/beta first.
create table if not exists public.pr_frame_unlocks (
 profile_id text not null references public.profiles(id) on delete cascade,
 frame_id text not null check (frame_id in ('constancia','shifter-2026','navidad-2026','nuevo-2027')),
 unlocked_at timestamptz not null default now(),
 source text not null,
 primary key (profile_id, frame_id)
);
alter table public.pr_frame_unlocks enable row level security;
revoke all on public.pr_frame_unlocks from anon, authenticated;

create or replace function public.pr_frames_my_unlocks()
returns table(frame_id text, unlocked_at timestamptz)
language plpgsql security definer set search_path = ''
as $$
declare v_profile text;
begin
 if auth.uid() is null then
   raise exception 'Authentication required' using errcode='28000';
 end if;
 select p.id into v_profile from public.profiles p where p.auth_user_id=auth.uid() limit 1;
 if v_profile is null then return; end if;
 insert into public.pr_frame_unlocks(profile_id,frame_id,source)
 select v_profile,'constancia','pr_check_10_distinct_classes'
 where (select count(distinct a.class_id)
        from public.pr_check_attendance a
        join public.pr_check_ids i on i.id=a.identity_id
        where i.profile_id=v_profile) >= 10
 on conflict(profile_id,frame_id) do nothing;
 return query select u.frame_id,u.unlocked_at from public.pr_frame_unlocks u
 where u.profile_id=v_profile order by u.unlocked_at;
end $$;
revoke all on function public.pr_frames_my_unlocks() from public, anon;
grant execute on function public.pr_frames_my_unlocks() to authenticated;
