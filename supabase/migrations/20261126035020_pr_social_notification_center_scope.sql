
create or replace function pr_social_internal.is_general_notice(p_kind text) returns boolean language sql immutable set search_path='' as $$
 select p_kind in ('pr_profile_verified','training_approved','training_returned','training_feedback','pr_awards_nomination','pr_awards_pending') or left(p_kind,11)='pr_general_'
$$;
revoke all on function pr_social_internal.is_general_notice(text) from public,anon,authenticated;
create or replace function public.pr_social_notifications() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare pid text:=public.pr_current_profile_id(); result jsonb; cnt bigint;
begin
 if not pr_social_internal.allowed() then return jsonb_build_object('items','[]'::jsonb,'unread_count',0);end if;
 select count(*) into cnt from public.community_notifications n where n.recipient_id=pid and n.read_at is null and not pr_social_internal.is_general_notice(n.kind);
 select coalesce(jsonb_agg(jsonb_build_object('id',n.id,'kind',n.kind,'entity_type',n.entity_type,'entity_id',n.entity_id,'text',n.text,'read_at',n.read_at,'created_at',n.created_at,'actor',jsonb_build_object('id',p.id,'nombre',p.nombre,'apellido',p.apellido,'foto',p.foto),'pending_invite',case when n.kind in('album_collab_invite','album_invite') then exists(select 1 from public.community_album_members m where m.album_id=n.entity_id and m.profile_id=pid and m.status in('pending','invited')) else false end) order by (n.read_at is not null),n.created_at desc,n.id),'[]'::jsonb) into result from (select * from public.community_notifications n where n.recipient_id=pid and not pr_social_internal.is_general_notice(n.kind) order by (n.read_at is not null),n.created_at desc,n.id limit 100)n left join public.profiles p on p.id=n.actor_id;
 return jsonb_build_object('items',result,'unread_count',cnt);
end $$;
create or replace function public.pr_social_mark_notifications_read(p_notice uuid default null) returns integer language plpgsql security definer set search_path='' as $$
declare pid text:=public.pr_current_profile_id(); n int;
begin
 if not pr_social_internal.allowed() then raise exception 'PR Social no disponible' using errcode='42501';end if;
 update public.community_notifications x set read_at=now() where x.recipient_id=pid and x.read_at is null and not pr_social_internal.is_general_notice(x.kind) and (p_notice is null or x.id=p_notice);
 get diagnostics n=row_count;return n;
end $$;
revoke all on function public.pr_social_notifications(),public.pr_social_mark_notifications_read(uuid) from public,anon;
grant execute on function public.pr_social_notifications(),public.pr_social_mark_notifications_read(uuid) to authenticated;