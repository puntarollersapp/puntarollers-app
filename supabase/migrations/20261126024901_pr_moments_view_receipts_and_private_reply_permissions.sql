
create table if not exists pr_social_internal.moment_views (
 moment_id uuid not null references public.pr_moments(id) on delete cascade,
 viewer_id text not null references public.profiles(id) on delete cascade,
 viewed_at timestamptz not null default now(),
 primary key(moment_id,viewer_id)
);
alter table pr_social_internal.moment_views enable row level security;
revoke all on pr_social_internal.moment_views from public,anon,authenticated;
create or replace function pr_social_internal.moment_visible(p_moment uuid,p_viewer text)
returns boolean language sql stable set search_path='' as $$
select exists(select 1 from public.pr_moments m join public.profiles p on p.id=m.profile_id where m.id=p_moment and m.deleted_at is null and m.expires_at>now() and p.estado='Activo' and p.acceso_habilitado is true and (m.profile_id=p_viewer or m.visibility='all' or (m.visibility='friends' and public.community_are_friends(p_viewer,m.profile_id))) and not exists(select 1 from public.community_blocks b where (b.blocker_profile_id=p_viewer and b.blocked_profile_id=m.profile_id) or (b.blocker_profile_id=m.profile_id and b.blocked_profile_id=p_viewer)))
$$;
revoke all on function pr_social_internal.moment_visible(uuid,text) from public,anon,authenticated;
create or replace function public.pr_social_moment_view(p_moment uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare pid text:=public.pr_current_profile_id();
begin
 if not pr_social_internal.allowed() or not public.community_is_active_member(pid) or not pr_social_internal.moment_visible(p_moment,pid) then raise exception 'Moment no disponible' using errcode='42501';end if;
 if now()<'2026-12-01 03:00:00+00'::timestamptz or exists(select 1 from public.pr_moments where id=p_moment and profile_id=pid) then return false;end if;
 insert into pr_social_internal.moment_views(moment_id,viewer_id) values(p_moment,pid) on conflict do nothing;
 return true;
end $$;
create or replace function public.pr_social_moment_seen()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare pid text:=public.pr_current_profile_id();
begin
 if not pr_social_internal.allowed() or not public.community_is_active_member(pid) then return '[]'::jsonb;end if;
 return coalesce((select jsonb_agg(v.moment_id) from pr_social_internal.moment_views v where v.viewer_id=pid and pr_social_internal.moment_visible(v.moment_id,pid)),'[]'::jsonb);
end $$;
create or replace function public.pr_social_moment_info(p_moment uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare pid text:=public.pr_current_profile_id(); owner_id text;
begin
 if not pr_social_internal.allowed() or not public.community_is_active_member(pid) or not pr_social_internal.moment_visible(p_moment,pid) then raise exception 'Moment no disponible' using errcode='42501';end if;
 select profile_id into owner_id from public.pr_moments where id=p_moment;
 return jsonb_build_object('can_dm',owner_id<>pid and public.pr_dm_are_friends(pid,owner_id) and coalesce((select allow_messages_from_friends from public.community_privacy where profile_id=owner_id),true),'viewers',case when owner_id=pid then coalesce((select jsonb_agg(jsonb_build_object('name',concat_ws(' ',p.nombre,p.apellido),'photo',p.foto,'viewed_at',v.viewed_at) order by v.viewed_at desc) from pr_social_internal.moment_views v join public.profiles p on p.id=v.viewer_id where v.moment_id=p_moment and p.estado='Activo' and p.acceso_habilitado and not exists(select 1 from public.community_blocks b where (b.blocker_profile_id=pid and b.blocked_profile_id=p.id) or (b.blocker_profile_id=p.id and b.blocked_profile_id=pid))),'[]'::jsonb) else null end);
end $$;
revoke all on function public.pr_social_moment_view(uuid), public.pr_social_moment_seen(),public.pr_social_moment_info(uuid) from public,anon;
grant execute on function public.pr_social_moment_view(uuid),public.pr_social_moment_seen(),public.pr_social_moment_info(uuid) to authenticated;
