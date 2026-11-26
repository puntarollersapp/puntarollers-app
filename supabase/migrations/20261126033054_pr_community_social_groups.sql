
create table pr_social_internal.social_groups(
 id uuid primary key default gen_random_uuid(), owner_id text not null references public.profiles(id) on delete cascade,
 title text not null check(char_length(title) between 3 and 70), description text not null default '' check(char_length(description)<=400),
 category text not null check(category in('salidas','entrenamiento','social','equipamiento','otros')),
 audience text not null check(audience in('members','friends')),created_at timestamptz not null default now(),archived_at timestamptz
);
create table pr_social_internal.social_group_members(
 group_id uuid not null references pr_social_internal.social_groups(id) on delete cascade,profile_id text not null references public.profiles(id) on delete cascade,joined_at timestamptz not null default now(),primary key(group_id,profile_id)
);
create table pr_social_internal.social_group_posts(
 id uuid primary key default gen_random_uuid(),group_id uuid not null references pr_social_internal.social_groups(id) on delete cascade,author_id text not null references public.profiles(id) on delete cascade,body text not null check(char_length(body) between 1 and 1200),created_at timestamptz not null default now(),deleted_at timestamptz
);
alter table pr_social_internal.social_groups enable row level security;
alter table pr_social_internal.social_group_members enable row level security;
alter table pr_social_internal.social_group_posts enable row level security;
revoke all on pr_social_internal.social_groups,pr_social_internal.social_group_members,pr_social_internal.social_group_posts from public,anon,authenticated;
create index social_group_posts_idx on pr_social_internal.social_group_posts(group_id,created_at desc) where deleted_at is null;
create index social_group_member_idx on pr_social_internal.social_group_members(profile_id);
create or replace function pr_social_internal.group_visible(gid uuid,pid text) returns boolean language sql stable set search_path='' as $$
 select exists(select 1 from pr_social_internal.social_groups g where g.id=gid and g.archived_at is null and pr_social_internal.meetup_adult(g.owner_id) and (g.owner_id=pid or g.audience='members' or public.community_are_friends(pid,g.owner_id)) and not exists(select 1 from public.community_blocks b where (b.blocker_profile_id=pid and b.blocked_profile_id=g.owner_id) or (b.blocker_profile_id=g.owner_id and b.blocked_profile_id=pid)))
$$;
create or replace function pr_social_internal.group_member(gid uuid,pid text) returns boolean language sql stable set search_path='' as $$
select pr_social_internal.group_visible(gid,pid) and exists(select 1 from pr_social_internal.social_group_members m where m.group_id=gid and m.profile_id=pid)
$$;
revoke all on function pr_social_internal.group_visible(uuid,text),pr_social_internal.group_member(uuid,text) from public,anon,authenticated;
create or replace function public.pr_groups_social_list() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare pid text:=public.pr_current_profile_id();
begin
 if not pr_social_internal.allowed() or not pr_social_internal.meetup_adult(pid) then return jsonb_build_object('eligible',false,'groups','[]'::jsonb);end if;
 return jsonb_build_object('eligible',true,'groups',coalesce((select jsonb_agg(x.item order by x.created_at desc) from (
 select g.created_at,jsonb_build_object('id',g.id,'title',g.title,'description',g.description,'category',g.category,'audience',g.audience,'mine',g.owner_id=pid,'joined',pr_social_internal.group_member(g.id,pid),'member_count',(select count(*) from pr_social_internal.social_group_members m where m.group_id=g.id and pr_social_internal.meetup_adult(m.profile_id) and pr_social_internal.group_visible(g.id,m.profile_id)),'owner_name',concat_ws(' ',p.nombre,p.apellido)) item from pr_social_internal.social_groups g join public.profiles p on p.id=g.owner_id where pr_social_internal.group_visible(g.id,pid) order by g.created_at desc limit 100)x),'[]'::jsonb));
end $$;
create or replace function public.pr_groups_social_create(p_title text,p_description text,p_category text,p_audience text) returns uuid language plpgsql security definer set search_path='' as $$
declare pid text:=public.pr_current_profile_id(); gid uuid;
begin
 if not pr_social_internal.allowed() or not pr_social_internal.meetup_adult(pid) then raise exception 'Grupos no disponibles' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended('socialgroup:'||pid,0));
 if (select count(*) from pr_social_internal.social_groups where owner_id=pid and archived_at is null)>=5 then raise exception 'Podés crear hasta cinco grupos activos.';end if;
 insert into pr_social_internal.social_groups(owner_id,title,description,category,audience) values(pid,btrim(p_title),btrim(coalesce(p_description,'')),p_category,p_audience) returning id into gid;
 insert into pr_social_internal.social_group_members(group_id,profile_id) values(gid,pid);
 return gid;
end $$;
create or replace function public.pr_groups_social_action(p_group uuid,p_action text) returns boolean language plpgsql security definer set search_path='' as $$
declare pid text:=public.pr_current_profile_id(); g pr_social_internal.social_groups%rowtype;
begin
 if not pr_social_internal.allowed() or not pr_social_internal.meetup_adult(pid) then raise exception 'Grupos no disponibles' using errcode='42501';end if;
 select * into g from pr_social_internal.social_groups where id=p_group for update;
 if not found or not pr_social_internal.group_visible(p_group,pid) then raise exception 'Grupo no disponible' using errcode='42501';end if;
 if p_action='join' then insert into pr_social_internal.social_group_members(group_id,profile_id) values(p_group,pid) on conflict do nothing;
 elsif p_action='leave' then if g.owner_id=pid then raise exception 'El creador debe archivar su grupo.';end if;delete from pr_social_internal.social_group_members where group_id=p_group and profile_id=pid;
 elsif p_action='archive' then if g.owner_id<>pid and not pr_social_internal.is_owner() then raise exception 'Sin permiso' using errcode='42501';end if;update pr_social_internal.social_groups set archived_at=now() where id=p_group;
 else raise exception 'Acción inválida';end if;
 return true;
end $$;
create or replace function public.pr_groups_social_posts(p_group uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare pid text:=public.pr_current_profile_id();
begin
 if not pr_social_internal.allowed() or not pr_social_internal.meetup_adult(pid) or not pr_social_internal.group_member(p_group,pid) then raise exception 'Grupo privado para sus integrantes' using errcode='42501';end if;
 return coalesce((select jsonb_agg(x.item order by x.created_at desc) from (select p.created_at,jsonb_build_object('id',p.id,'body',p.body,'created_at',p.created_at,'mine',p.author_id=pid,'can_delete',p.author_id=pid or g.owner_id=pid or pr_social_internal.is_owner(),'author',jsonb_build_object('name',concat_ws(' ',a.nombre,a.apellido),'photo',a.foto)) item from pr_social_internal.social_group_posts p join pr_social_internal.social_groups g on g.id=p.group_id join public.profiles a on a.id=p.author_id where p.group_id=p_group and p.deleted_at is null and pr_social_internal.meetup_adult(p.author_id) and not exists(select 1 from public.community_blocks b where (b.blocker_profile_id=pid and b.blocked_profile_id=p.author_id) or (b.blocker_profile_id=p.author_id and b.blocked_profile_id=pid)) order by p.created_at desc limit 80)x),'[]'::jsonb);
end $$;
create or replace function public.pr_groups_social_publish(p_group uuid,p_body text) returns uuid language plpgsql security definer set search_path='' as $$
declare pid text:=public.pr_current_profile_id(); post_id uuid;
begin
 if not pr_social_internal.allowed() or not pr_social_internal.meetup_adult(pid) or not pr_social_internal.group_member(p_group,pid) then raise exception 'Sin permiso para publicar' using errcode='42501';end if;
 insert into pr_social_internal.social_group_posts(group_id,author_id,body) values(p_group,pid,btrim(p_body)) returning id into post_id;return post_id;
end $$;
create or replace function public.pr_groups_social_delete(p_post uuid) returns boolean language plpgsql security definer set search_path='' as $$
declare pid text:=public.pr_current_profile_id(); p pr_social_internal.social_group_posts%rowtype;
begin
 if not pr_social_internal.allowed() or not pr_social_internal.meetup_adult(pid) then raise exception 'Sin permiso' using errcode='42501';end if;
 select * into p from pr_social_internal.social_group_posts where id=p_post;
 if not found or not pr_social_internal.group_member(p.group_id,pid) or not (p.author_id=pid or exists(select 1 from pr_social_internal.social_groups g where g.id=p.group_id and g.owner_id=pid) or pr_social_internal.is_owner()) then raise exception 'Sin permiso' using errcode='42501';end if;
 update pr_social_internal.social_group_posts set deleted_at=coalesce(deleted_at,now()) where id=p_post;return true;
end $$;
revoke all on function public.pr_groups_social_list(),public.pr_groups_social_create(text,text,text,text),public.pr_groups_social_action(uuid,text),public.pr_groups_social_posts(uuid),public.pr_groups_social_publish(uuid,text),public.pr_groups_social_delete(uuid) from public,anon;
grant execute on function public.pr_groups_social_list(),public.pr_groups_social_create(text,text,text,text),public.pr_groups_social_action(uuid,text),public.pr_groups_social_posts(uuid),public.pr_groups_social_publish(uuid,text),public.pr_groups_social_delete(uuid) to authenticated;
