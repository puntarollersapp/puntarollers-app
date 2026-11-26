-- Public staff posts in RollerFeed: one notice per recipient, never for private posts.
create or replace function pr_social_internal.rf_visible_staff_post(p_id uuid)
returns boolean language sql stable set search_path='' as $$
 select exists(select 1 from public.community_posts p join public.profiles a on a.id=p.author_id where p.id=p_id and p.deleted_at is null and p.visibility='members' and a.role in ('admin','profesor'))
$$;
revoke all on function pr_social_internal.rf_visible_staff_post(uuid) from public,anon,authenticated;

create or replace function public.pr_rollerfeed_notifications(p_count_only boolean default false)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare pid text:=public.pr_current_profile_id(); cnt bigint; result jsonb:='[]'::jsonb;
begin
 if not public.community_is_active_member(pid) then return jsonb_build_object('items',result,'unread_count',0);end if;
 select count(*) into cnt from public.community_notifications n where n.recipient_id=pid and n.read_at is null and pr_social_internal.is_general_notice(n.kind) and (n.kind<>'pr_general_news' or pr_social_internal.rf_visible_news(n.entity_id)) and (n.kind<>'pr_general_staff_post' or pr_social_internal.rf_visible_staff_post(n.entity_id));
 if not p_count_only then
 select coalesce(jsonb_agg(jsonb_build_object('id',n.id,'kind',n.kind,'entity_type',n.entity_type,'entity_id',n.entity_id,'text',case when n.kind='pr_general_news' then coalesce('Novedad en RollerFeed: '||f.title,n.text) else n.text end,'created_at',n.created_at,'read_at',n.read_at) order by (n.read_at is not null),n.created_at desc nulls last,n.id),'[]'::jsonb) into result
 from (select * from public.community_notifications n where n.recipient_id=pid and pr_social_internal.is_general_notice(n.kind) and (n.kind<>'pr_general_news' or pr_social_internal.rf_visible_news(n.entity_id)) and (n.kind<>'pr_general_staff_post' or pr_social_internal.rf_visible_staff_post(n.entity_id)) order by (n.read_at is not null),n.created_at desc nulls last,n.id limit 100) n
 left join public.pr_feed_news f on n.kind='pr_general_news' and f.id=n.entity_id;
 end if;
 return jsonb_build_object('items',result,'unread_count',cnt);
end $$;

create or replace function public.pr_rollerfeed_mark_read(p_notice uuid default null)
returns integer language plpgsql security definer set search_path='' as $$
declare pid text:=public.pr_current_profile_id(); affected integer;
begin
 if not public.community_is_active_member(pid) then raise exception 'RollerFeed no disponible' using errcode='42501';end if;
 update public.community_notifications n set read_at=now() where n.recipient_id=pid and n.read_at is null and pr_social_internal.is_general_notice(n.kind) and (n.kind<>'pr_general_news' or pr_social_internal.rf_visible_news(n.entity_id)) and (n.kind<>'pr_general_staff_post' or pr_social_internal.rf_visible_staff_post(n.entity_id)) and (p_notice is null or n.id=p_notice);
 get diagnostics affected=row_count;
 return affected;
end $$;
revoke all on function public.pr_rollerfeed_notifications(boolean),public.pr_rollerfeed_mark_read(uuid) from public,anon;
grant execute on function public.pr_rollerfeed_notifications(boolean),public.pr_rollerfeed_mark_read(uuid) to authenticated;


-- Preserve the original personal/friend notification behavior for all other posts.
create or replace function public.community_notify_new_post()
returns trigger language plpgsql security definer set search_path='' as $$
declare nm text;
begin
 if new.visibility='members' and new.deleted_at is null and exists(select 1 from public.profiles a where a.id=new.author_id and a.role in ('admin','profesor')) then
   insert into public.community_notifications(recipient_id,actor_id,kind,entity_type,entity_id,text)
   select p.id,new.author_id,'pr_general_staff_post','post',new.id,'Punta Rollers compartió una nueva publicación.'
   from public.profiles p where p.id<>new.author_id and p.estado='Activo' and p.acceso_habilitado is true and p.role in ('admin','profesor','alumno')
   and not exists(select 1 from public.community_notifications n where n.recipient_id=p.id and n.entity_id=new.id and n.kind='pr_general_staff_post');
 else
   select coalesce(nombre,'Alguien') into nm from public.profiles where id=new.author_id;
   insert into public.community_notifications(recipient_id,actor_id,kind,entity_type,entity_id,text)
   select case when f.profile_a_id=new.author_id then f.profile_b_id else f.profile_a_id end,new.author_id,'new_post','post',new.id,nm||' publicó algo nuevo.'
   from public.community_friendships f where f.profile_a_id=new.author_id or f.profile_b_id=new.author_id;
 end if;
 return new;
end $$;
-- Backfill the two event posts explicitly requested, preserving read timestamps.
update public.community_notifications n
set kind='pr_general_staff_post',text='Punta Rollers compartió una nueva publicación.'
where n.kind='new_post' and n.entity_type='post' and n.entity_id in ('f1dcc6fb-596b-4a35-bf85-e6718ba8dabc','5dab45cb-6b3e-45ce-b6d3-100ec0ec4953')
and pr_social_internal.rf_visible_staff_post(n.entity_id)
and not exists(select 1 from public.community_notifications x where x.recipient_id=n.recipient_id and x.kind='pr_general_staff_post' and x.entity_id=n.entity_id);

insert into public.community_notifications(recipient_id,actor_id,kind,entity_type,entity_id,text,created_at)
select p.id,s.author_id,'pr_general_staff_post','post',s.id,'Punta Rollers compartió una nueva publicación.',s.created_at
from public.community_posts s cross join public.profiles p
where s.id in ('f1dcc6fb-596b-4a35-bf85-e6718ba8dabc','5dab45cb-6b3e-45ce-b6d3-100ec0ec4953')
and pr_social_internal.rf_visible_staff_post(s.id) and p.id<>s.author_id and p.estado='Activo' and p.acceso_habilitado is true and p.role in ('admin','profesor','alumno')
and not exists(select 1 from public.community_notifications n where n.recipient_id=p.id and n.entity_id=s.id and n.kind='pr_general_staff_post');
