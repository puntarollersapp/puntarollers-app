-- Scope institutional notices independently from PR Social; preserve every existing row.
create or replace function pr_social_internal.is_general_notice(p_kind text)
returns boolean language sql immutable set search_path='' as $$
 select p_kind in ('pr_profile_verified','training_approved','training_returned','training_feedback','training_plan_completed','pr_awards_nomination','pr_awards_pending','rollermap_explorer_launch') or left(p_kind,11)='pr_general_'
$$;
revoke all on function pr_social_internal.is_general_notice(text) from public,anon,authenticated;

create or replace function public.pr_community_badge_counts() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare me text:=public.pr_current_profile_id(); notes bigint; messages bigint; requests bigint; extra_requests bigint;
begin
 if not public.community_is_active_member(me) then return jsonb_build_object('notifications',0,'messages',0,'requests',0,'total',0);end if;
 select count(*) into notes from public.community_notifications n where n.recipient_id=me and n.read_at is null and not pr_social_internal.is_general_notice(n.kind);
 select count(*) into messages from public.pr_dm_messages m join public.pr_dm_conversations c on c.id=m.conversation_id join public.profiles p on p.id=case when c.profile_a_id=me then c.profile_b_id else c.profile_a_id end where me in(c.profile_a_id,c.profile_b_id) and p.estado='Activo' and p.acceso_habilitado is true and public.pr_dm_are_friends(c.profile_a_id,c.profile_b_id) and m.sender_profile_id<>me and m.read_at is null and not exists(select 1 from public.pr_dm_message_hides h where h.message_id=m.id and h.profile_id=me);
 select count(*),count(*) filter(where not exists(select 1 from public.community_notifications n where n.recipient_id=me and n.kind='friend_request' and n.entity_id=r.id and n.read_at is null)) into requests,extra_requests from public.community_friend_requests r join public.profiles p on p.id=r.sender_profile_id where r.receiver_profile_id=me and r.status='pending' and p.estado='Activo' and p.acceso_habilitado is true and not exists(select 1 from public.community_blocks b where (b.blocker_profile_id=me and b.blocked_profile_id=p.id) or (b.blocker_profile_id=p.id and b.blocked_profile_id=me));
 return jsonb_build_object('notifications',notes,'messages',messages,'requests',requests,'total',notes+messages+extra_requests);
end $$;

revoke all on function public.pr_community_badge_counts() from public,anon;
grant execute on function public.pr_community_badge_counts() to authenticated;

create or replace function pr_social_internal.rf_visible_news(p_id uuid)
returns boolean language sql stable set search_path='' as $$
 select exists(select 1 from public.pr_feed_news n where n.id=p_id and n.published is true and concat_ws(' ',n.title,n.body,n.kind) !~* 'cl[ií]nica internacional|miguel flores|rollerween|caramelos?|top ranking pr|pr km challenge')
$$;
revoke all on function pr_social_internal.rf_visible_news(uuid) from public,anon,authenticated;

create or replace function public.pr_rollerfeed_notifications(p_count_only boolean default false)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare pid text:=public.pr_current_profile_id(); cnt bigint; result jsonb:='[]'::jsonb;
begin
 if not public.community_is_active_member(pid) then return jsonb_build_object('items',result,'unread_count',0);end if;
 select count(*) into cnt from public.community_notifications n where n.recipient_id=pid and n.read_at is null and pr_social_internal.is_general_notice(n.kind) and (n.kind<>'pr_general_news' or pr_social_internal.rf_visible_news(n.entity_id));
 if not p_count_only then
 select coalesce(jsonb_agg(jsonb_build_object('id',n.id,'kind',n.kind,'entity_type',n.entity_type,'entity_id',n.entity_id,'text',case when n.kind='pr_general_news' then coalesce('Novedad en RollerFeed: '||f.title,n.text) else n.text end,'created_at',n.created_at,'read_at',n.read_at) order by (n.read_at is not null),n.created_at desc nulls last,n.id),'[]'::jsonb) into result
 from (select * from public.community_notifications n where n.recipient_id=pid and pr_social_internal.is_general_notice(n.kind) and (n.kind<>'pr_general_news' or pr_social_internal.rf_visible_news(n.entity_id)) order by (n.read_at is not null),n.created_at desc nulls last,n.id limit 100) n
 left join public.pr_feed_news f on n.kind='pr_general_news' and f.id=n.entity_id;
 end if;
 return jsonb_build_object('items',result,'unread_count',cnt);
end $$;

create or replace function public.pr_rollerfeed_mark_read(p_notice uuid default null)
returns integer language plpgsql security definer set search_path='' as $$
declare pid text:=public.pr_current_profile_id(); affected integer;
begin
 if not public.community_is_active_member(pid) then raise exception 'RollerFeed no disponible' using errcode='42501';end if;
 update public.community_notifications n set read_at=now() where n.recipient_id=pid and n.read_at is null and pr_social_internal.is_general_notice(n.kind) and (n.kind<>'pr_general_news' or pr_social_internal.rf_visible_news(n.entity_id)) and (p_notice is null or n.id=p_notice);
 get diagnostics affected=row_count;
 return affected;
end $$;
revoke all on function public.pr_rollerfeed_notifications(boolean),public.pr_rollerfeed_mark_read(uuid) from public,anon;
grant execute on function public.pr_rollerfeed_notifications(boolean),public.pr_rollerfeed_mark_read(uuid) to authenticated;

-- The trigger is private, and fires only for actually published, visible news.
create or replace function pr_social_internal.rf_notify_news()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.published is not true or not pr_social_internal.rf_visible_news(new.id) then return new;end if;
 if tg_op='UPDATE' then
   if old.published is true and concat_ws(' ',old.title,old.body,old.kind) !~* 'cl[ií]nica internacional|miguel flores|rollerween|caramelos?|top ranking pr|pr km challenge' then return new;end if;
 end if;
 insert into public.community_notifications(recipient_id,actor_id,kind,entity_type,entity_id,text)
 select p.id,null,'pr_general_news','pr_feed_news',new.id,'Hay una nueva novedad en RollerFeed.'
 from public.profiles p where p.estado='Activo' and p.acceso_habilitado is true and p.role in ('admin','profesor','alumno')
 and not exists(select 1 from public.community_notifications n where n.recipient_id=p.id and n.kind='pr_general_news' and n.entity_id=new.id);
 return new;
end $$;
revoke all on function pr_social_internal.rf_notify_news() from public,anon,authenticated;
drop trigger if exists pr_rf_news_notify on public.pr_feed_news;
create trigger pr_rf_news_notify after insert or update of published,title,body,kind on public.pr_feed_news for each row execute function pr_social_internal.rf_notify_news();

-- Existing publicly visible campaigns only. No Awards or Wrapped pre-release notices.
insert into public.community_notifications(recipient_id,actor_id,kind,entity_type,text)
select p.id,null,v.kind,'rollerfeed',v.message
from public.profiles p cross join (values
 ('pr_general_feedback_nov24','PR Voice · Tu opinión nos importa. Completá el formulario de Feedback.'),
 ('pr_general_poll_results_nov24','¡Ustedes decidieron! Ya podés consultar los resultados de las votaciones de fin de año.')
) v(kind,message)
where p.estado='Activo' and p.acceso_habilitado is true and p.role in ('admin','profesor','alumno')
and not exists(select 1 from public.community_notifications n where n.recipient_id=p.id and n.kind=v.kind);

-- Existing RLS remains in force; no grants or policies are broadened.
do $$ begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime') and not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='community_notifications') then
  alter publication supabase_realtime add table public.community_notifications;
 end if;
end $$;
