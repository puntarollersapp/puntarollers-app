
create or replace function public.pr_dm_inbox() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare me text:=public.pr_current_profile_id(); result jsonb;
begin
 if not public.community_is_active_member(me) then return '[]'::jsonb;end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',c.id,'updated_at',c.updated_at,'other_profile',jsonb_build_object('id',p.id,'nombre',p.nombre,'apellido',p.apellido,'foto',p.foto),'last_message',last_msg.preview,'last_message_at',last_msg.created_at,'unread_count',unread.n) order by last_msg.created_at desc nulls last,c.updated_at desc),'[]'::jsonb) into result
 from public.pr_dm_conversations c
 join public.profiles p on p.id=case when c.profile_a_id=me then c.profile_b_id else c.profile_a_id end
 left join lateral(select coalesce(nullif(m.body,''),case when m.media_type='image' then '📷 Foto' when m.media_type='audio' then '🎙️ Audio' else 'Mensaje' end) preview,m.created_at from public.pr_dm_messages m where m.conversation_id=c.id and not exists(select 1 from public.pr_dm_message_hides h where h.message_id=m.id and h.profile_id=me) order by m.created_at desc,m.id desc limit 1) last_msg on true
 cross join lateral(select count(*) n from public.pr_dm_messages m where m.conversation_id=c.id and m.sender_profile_id<>me and m.read_at is null and not exists(select 1 from public.pr_dm_message_hides h where h.message_id=m.id and h.profile_id=me)) unread
 where me in(c.profile_a_id,c.profile_b_id) and p.estado='Activo' and p.acceso_habilitado is true and public.pr_dm_are_friends(c.profile_a_id,c.profile_b_id);
 return result;
end $$;
create or replace function public.pr_community_badge_counts() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare me text:=public.pr_current_profile_id(); notes bigint; messages bigint; requests bigint; extra_requests bigint;
begin
 if not public.community_is_active_member(me) then return jsonb_build_object('notifications',0,'messages',0,'requests',0,'total',0);end if;
 select count(*) into notes from public.community_notifications n where n.recipient_id=me and n.read_at is null;
 select count(*) into messages from public.pr_dm_messages m join public.pr_dm_conversations c on c.id=m.conversation_id join public.profiles p on p.id=case when c.profile_a_id=me then c.profile_b_id else c.profile_a_id end where me in(c.profile_a_id,c.profile_b_id) and p.estado='Activo' and p.acceso_habilitado is true and public.pr_dm_are_friends(c.profile_a_id,c.profile_b_id) and m.sender_profile_id<>me and m.read_at is null and not exists(select 1 from public.pr_dm_message_hides h where h.message_id=m.id and h.profile_id=me);
 select count(*),count(*) filter(where not exists(select 1 from public.community_notifications n where n.recipient_id=me and n.kind='friend_request' and n.entity_id=r.id and n.read_at is null)) into requests,extra_requests from public.community_friend_requests r join public.profiles p on p.id=r.sender_profile_id where r.receiver_profile_id=me and r.status='pending' and p.estado='Activo' and p.acceso_habilitado is true and not exists(select 1 from public.community_blocks b where (b.blocker_profile_id=me and b.blocked_profile_id=p.id) or (b.blocker_profile_id=p.id and b.blocked_profile_id=me));
 return jsonb_build_object('notifications',notes,'messages',messages,'requests',requests,'total',notes+messages+extra_requests);
end $$;
revoke all on function public.pr_dm_inbox(),public.pr_community_badge_counts() from public,anon;
grant execute on function public.pr_dm_inbox(),public.pr_community_badge_counts() to authenticated;
create index if not exists community_notifications_unread_recipient_idx on public.community_notifications(recipient_id,kind,entity_id) where read_at is null;
create index if not exists community_pending_receiver_idx on public.community_friend_requests(receiver_profile_id) where status='pending';
create index if not exists pr_dm_unread_conversation_idx on public.pr_dm_messages(conversation_id,sender_profile_id) where read_at is null;
