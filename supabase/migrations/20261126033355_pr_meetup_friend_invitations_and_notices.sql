
create table pr_social_internal.meetup_invites(
 meetup_id uuid not null references pr_social_internal.meetups(id) on delete cascade,
 recipient_id text not null references public.profiles(id) on delete cascade,
 created_at timestamptz not null default now(), declined_at timestamptz,
 primary key(meetup_id,recipient_id)
);
alter table pr_social_internal.meetup_invites enable row level security;
revoke all on pr_social_internal.meetup_invites from public,anon,authenticated;
create or replace function public.pr_meetup_invite_candidates(p_id uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare pid text:=public.pr_current_profile_id();
begin
 if not pr_social_internal.allowed() or not pr_social_internal.meetup_adult(pid) or not exists(select 1 from pr_social_internal.meetups m where m.id=p_id and m.organizer_id=pid and m.cancelled_at is null and m.starts_at>now()) then raise exception 'Salida no disponible' using errcode='42501';end if;
 return coalesce((select jsonb_agg(x.item order by x.name) from (select p.nombre as name,jsonb_build_object('id',p.id,'name',concat_ws(' ',p.nombre,p.apellido),'photo',p.foto,'invited',exists(select 1 from pr_social_internal.meetup_invites i where i.meetup_id=p_id and i.recipient_id=p.id),'joined',exists(select 1 from pr_social_internal.meetup_members mm where mm.meetup_id=p_id and mm.profile_id=p.id)) item from public.profiles p where p.id<>pid and pr_social_internal.meetup_adult(p.id) and public.pr_dm_are_friends(pid,p.id) and pr_social_internal.meetup_visible(p_id,p.id) order by p.nombre,p.apellido limit 100)x),'[]'::jsonb);
end $$;
create or replace function public.pr_meetup_invite(p_id uuid,p_recipients text[]) returns integer language plpgsql security definer set search_path='' as $$
declare pid text:=public.pr_current_profile_id(); m pr_social_internal.meetups%rowtype; n integer;
begin
 if not pr_social_internal.allowed() or not pr_social_internal.meetup_adult(pid) or now()<'2026-12-01 03:00:00+00'::timestamptz then raise exception 'Las invitaciones se habilitan el 1 de diciembre.' using errcode='42501';end if;
 select * into m from pr_social_internal.meetups where id=p_id for update;
 if not found or m.organizer_id<>pid or m.cancelled_at is not null or m.starts_at<=now() then raise exception 'Salida no disponible' using errcode='42501';end if;
 if cardinality(p_recipients) is null or cardinality(p_recipients) not between 1 and 20 or array_position(p_recipients,null) is not null then raise exception 'Elegí entre 1 y 20 amigos.';end if;
 if exists(select 1 from unnest(p_recipients) r(id) where r.id=pid or not pr_social_internal.meetup_adult(r.id) or not public.pr_dm_are_friends(pid,r.id) or not pr_social_internal.meetup_visible(p_id,r.id)) then raise exception 'Una de las personas no está disponible para esta invitación.';end if;
 with inserted as (
 insert into pr_social_internal.meetup_invites(meetup_id,recipient_id) select p_id,r.id from (select distinct unnest(p_recipients) id) r where not exists(select 1 from pr_social_internal.meetup_members mm where mm.meetup_id=p_id and mm.profile_id=r.id) on conflict do nothing returning recipient_id
 ) insert into public.community_notifications(recipient_id,actor_id,kind,entity_type,entity_id,text) select recipient_id,pid,'meetup_invite','meetup',p_id,'Te invitaron a una salida de PR Meet Up. Entrá para conocer los detalles.' from inserted;
 get diagnostics n=row_count;return n;
end $$;
create or replace function public.pr_meetup_decline(p_id uuid) returns boolean language plpgsql security definer set search_path='' as $$
declare pid text:=public.pr_current_profile_id();
begin
 if not pr_social_internal.allowed() or not pr_social_internal.meetup_adult(pid) then raise exception 'No disponible' using errcode='42501';end if;
 update pr_social_internal.meetup_invites set declined_at=coalesce(declined_at,now()) where meetup_id=p_id and recipient_id=pid;
 update public.community_notifications set read_at=coalesce(read_at,now()) where recipient_id=pid and kind='meetup_invite' and entity_id=p_id;return true;
end $$;
create or replace function pr_social_internal.meetup_notify() returns trigger language plpgsql security definer set search_path='' as $$
declare oid text; rid text; mid uuid;
begin
 if now()<'2026-12-01 03:00:00+00'::timestamptz then return new;end if;
 if tg_table_name='meetup_members' then
 mid:=new.meetup_id;rid:=new.profile_id;select organizer_id into oid from pr_social_internal.meetups where id=mid;
 if oid<>rid and not exists(select 1 from public.community_notifications n where n.recipient_id=oid and n.actor_id=rid and n.kind='meetup_join' and n.entity_id=mid) then
 insert into public.community_notifications(recipient_id,actor_id,kind,entity_type,entity_id,text) values(oid,rid,'meetup_join','meetup',mid,'Un integrante se sumó a tu salida de PR Meet Up.');
 end if;
 update public.community_notifications set read_at=coalesce(read_at,now()) where recipient_id=rid and kind='meetup_invite' and entity_id=mid;
 elsif tg_table_name='meetups' and old.cancelled_at is null and new.cancelled_at is not null then
 insert into public.community_notifications(recipient_id,actor_id,kind,entity_type,entity_id,text)
 select q.id,new.organizer_id,'meetup_cancel','meetup',new.id,'Una salida de PR Meet Up en la que participabas o a la que fuiste invitado fue cancelada.' from (select profile_id id from pr_social_internal.meetup_members where meetup_id=new.id union select recipient_id id from pr_social_internal.meetup_invites where meetup_id=new.id and declined_at is null) q where q.id<>new.organizer_id and pr_social_internal.meetup_adult(q.id) and not exists(select 1 from public.community_blocks b where (b.blocker_profile_id=q.id and b.blocked_profile_id=new.organizer_id) or (b.blocker_profile_id=new.organizer_id and b.blocked_profile_id=q.id));
 end if;return new;
end $$;
revoke all on function pr_social_internal.meetup_notify() from public,anon,authenticated;
create trigger meetup_join_notice after insert on pr_social_internal.meetup_members for each row execute function pr_social_internal.meetup_notify();
create trigger meetup_cancel_notice after update of cancelled_at on pr_social_internal.meetups for each row execute function pr_social_internal.meetup_notify();
revoke all on function public.pr_meetup_invite_candidates(uuid),public.pr_meetup_invite(uuid,text[]),public.pr_meetup_decline(uuid) from public,anon;
grant execute on function public.pr_meetup_invite_candidates(uuid),public.pr_meetup_invite(uuid,text[]),public.pr_meetup_decline(uuid) to authenticated;
