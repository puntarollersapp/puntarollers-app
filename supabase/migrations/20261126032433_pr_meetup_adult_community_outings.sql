
create table pr_social_internal.meetups (
 id uuid primary key default gen_random_uuid(), organizer_id text not null references public.profiles(id) on delete cascade,
 title text not null check(char_length(title) between 3 and 90), meeting_point text not null check(char_length(meeting_point) between 3 and 150),
 starts_at timestamptz not null, distance_km numeric(5,1) check(distance_km>0 and distance_km<=100), pace text not null check(pace in('tranquilo','moderado','intenso')),
 skill_level text not null check(skill_level in('todos','principiante','intermedio','avanzado')), audience text not null check(audience in('friends','members')),
 notes text not null default '' check(char_length(notes)<=600), capacity integer not null check(capacity between 2 and 50),
 created_at timestamptz not null default now(), cancelled_at timestamptz
);
create table pr_social_internal.meetup_members (
 meetup_id uuid not null references pr_social_internal.meetups(id) on delete cascade,
 profile_id text not null references public.profiles(id) on delete cascade, joined_at timestamptz not null default now(),
 primary key(meetup_id,profile_id)
);
alter table pr_social_internal.meetups enable row level security;
alter table pr_social_internal.meetup_members enable row level security;
revoke all on pr_social_internal.meetups,pr_social_internal.meetup_members from public,anon,authenticated;
create index meetup_upcoming_idx on pr_social_internal.meetups(starts_at) where cancelled_at is null;
create index meetup_members_profile_idx on pr_social_internal.meetup_members(profile_id);
create or replace function pr_social_internal.meetup_adult(p_id text) returns boolean language plpgsql stable set search_path='' as $$
declare p record; dob date;
begin
 select role,fecha_nacimiento,estado,acceso_habilitado into p from public.profiles where id=p_id;
 if not found or p.estado is distinct from 'Activo' or p.acceso_habilitado is distinct from true then return false;end if;
 if p.role in ('admin','profesor') then return true;end if;
 if p.role is distinct from 'alumno' or coalesce(p.fecha_nacimiento,'') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then return false;end if;
 begin dob:=p.fecha_nacimiento::date;exception when others then return false;end;
 return dob<=((now() at time zone 'America/Montevideo')::date-interval '18 years')::date and dob>date '1900-01-01';
end $$;
create or replace function pr_social_internal.meetup_visible(p_id uuid,p_viewer text) returns boolean language sql stable set search_path='' as $$
select exists(select 1 from pr_social_internal.meetups m where m.id=p_id and pr_social_internal.meetup_adult(m.organizer_id) and (m.organizer_id=p_viewer or m.audience='members' or public.community_are_friends(m.organizer_id,p_viewer)) and not exists(select 1 from public.community_blocks b where (b.blocker_profile_id=p_viewer and b.blocked_profile_id=m.organizer_id) or (b.blocker_profile_id=m.organizer_id and b.blocked_profile_id=p_viewer)))
$$;
revoke all on function pr_social_internal.meetup_adult(text),pr_social_internal.meetup_visible(uuid,text) from public,anon,authenticated;
create or replace function public.pr_meetup_list() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare pid text:=public.pr_current_profile_id();
begin
 if not pr_social_internal.allowed() then return jsonb_build_object('eligible',false,'items','[]'::jsonb);end if;
 if not pr_social_internal.meetup_adult(pid) then return jsonb_build_object('eligible',false,'items','[]'::jsonb);end if;
 return jsonb_build_object('eligible',true,'items',coalesce((select jsonb_agg(x.item order by x.starts_at) from (
 select m.starts_at,jsonb_build_object('id',m.id,'title',m.title,'meeting_point',m.meeting_point,'starts_at',m.starts_at,'distance_km',m.distance_km,'pace',m.pace,'skill_level',m.skill_level,'audience',m.audience,'notes',m.notes,'capacity',m.capacity,'cancelled',m.cancelled_at is not null,'mine',m.organizer_id=pid,'joined',exists(select 1 from pr_social_internal.meetup_members mm where mm.meetup_id=m.id and mm.profile_id=pid),'count',1+(select count(*) from pr_social_internal.meetup_members mm where mm.meetup_id=m.id and pr_social_internal.meetup_adult(mm.profile_id)),'organizer',jsonb_build_object('name',concat_ws(' ',p.nombre,p.apellido),'photo',p.foto),'participants',coalesce((select jsonb_agg(jsonb_build_object('name',concat_ws(' ',q.nombre,q.apellido),'photo',q.foto)) from pr_social_internal.meetup_members mm join public.profiles q on q.id=mm.profile_id left join public.community_privacy cp on cp.profile_id=q.id where mm.meetup_id=m.id and pr_social_internal.meetup_adult(q.id) and (q.id=pid or (coalesce(cp.discoverable,true) and public.community_are_friends(pid,q.id))) and not exists(select 1 from public.community_blocks b where (b.blocker_profile_id=pid and b.blocked_profile_id=q.id) or (b.blocker_profile_id=q.id and b.blocked_profile_id=pid))),'[]'::jsonb)) item
 from pr_social_internal.meetups m join public.profiles p on p.id=m.organizer_id where m.starts_at>now()-interval '2 hours' and m.starts_at<now()+interval '60 days' and pr_social_internal.meetup_visible(m.id,pid) and (m.cancelled_at is null or m.organizer_id=pid or exists(select 1 from pr_social_internal.meetup_members mm where mm.meetup_id=m.id and mm.profile_id=pid)) order by m.starts_at limit 60)x),'[]'::jsonb));
end $$;
create or replace function public.pr_meetup_create(p_title text,p_point text,p_starts timestamptz,p_distance numeric,p_pace text,p_level text,p_audience text,p_notes text,p_capacity integer) returns uuid language plpgsql security definer set search_path='' as $$
declare pid text:=public.pr_current_profile_id(); mid uuid;
begin
 if not pr_social_internal.allowed() or not pr_social_internal.meetup_adult(pid) then raise exception 'Meet Up no disponible' using errcode='42501';end if;
 if p_starts is null or p_starts<=greatest(now()+interval '15 minutes','2026-12-01 03:00:00+00'::timestamptz) or p_starts>now()+interval '60 days' then raise exception 'Elegí una fecha futura dentro de los próximos 60 días y posterior al lanzamiento.';end if;
 perform pg_advisory_xact_lock(hashtextextended('meetup:'||pid,0));
 if (select count(*) from pr_social_internal.meetups where organizer_id=pid and starts_at>now() and cancelled_at is null)>=5 then raise exception 'Podés tener hasta cinco salidas próximas.';end if;
 insert into pr_social_internal.meetups(organizer_id,title,meeting_point,starts_at,distance_km,pace,skill_level,audience,notes,capacity) values(pid,btrim(p_title),btrim(p_point),p_starts,p_distance,p_pace,p_level,p_audience,btrim(coalesce(p_notes,'')),p_capacity) returning id into mid;return mid;
end $$;
create or replace function public.pr_meetup_action(p_id uuid,p_action text) returns boolean language plpgsql security definer set search_path='' as $$
declare pid text:=public.pr_current_profile_id(); m pr_social_internal.meetups%rowtype;
begin
 if not pr_social_internal.allowed() or not pr_social_internal.meetup_adult(pid) then raise exception 'Meet Up no disponible' using errcode='42501';end if;
 select * into m from pr_social_internal.meetups where id=p_id for update;
 if not found or not pr_social_internal.meetup_visible(p_id,pid) then raise exception 'Salida no disponible' using errcode='42501';end if;
 if p_action='cancel' then
 if m.organizer_id<>pid and not pr_social_internal.is_owner() then raise exception 'Solo el organizador puede cancelar' using errcode='42501';end if;
 update pr_social_internal.meetups set cancelled_at=coalesce(cancelled_at,now()) where id=p_id;return true;
 elsif p_action='leave' then delete from pr_social_internal.meetup_members where meetup_id=p_id and profile_id=pid;return true;
 elsif p_action='join' then
 if m.cancelled_at is not null or m.starts_at<=now() or m.organizer_id=pid then raise exception 'No podés sumarte a esta salida';end if;
 if exists(select 1 from pr_social_internal.meetup_members where meetup_id=p_id and profile_id=pid) then return true;end if;
 if 1+(select count(*) from pr_social_internal.meetup_members where meetup_id=p_id and pr_social_internal.meetup_adult(profile_id))>=m.capacity then raise exception 'La salida está completa';end if;
 insert into pr_social_internal.meetup_members(meetup_id,profile_id) values(p_id,pid) on conflict do nothing;return true;
 else raise exception 'Acción inválida';end if;
end $$;
revoke all on function public.pr_meetup_list(),public.pr_meetup_create(text,text,timestamptz,numeric,text,text,text,text,integer),public.pr_meetup_action(uuid,text) from public,anon;
grant execute on function public.pr_meetup_list(),public.pr_meetup_create(text,text,timestamptz,numeric,text,text,text,text,integer),public.pr_meetup_action(uuid,text) to authenticated;
