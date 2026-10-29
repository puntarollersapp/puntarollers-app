-- Catalog is reproducible on fresh environments, without touching existing profile records.
create table if not exists public.pr_frame_catalog (
 id text primary key, name text not null, description text not null default '',
 accent text not null default '#65a7ff', image_url text,
 visible boolean not null default true, active boolean not null default true,
 unlock_kind text not null check (unlock_kind in ('default','attendance','time_trial','distance','seasonal','manual')),
 unlock_target numeric, starts_on date, ends_on date,
 sort_order integer not null default 100
);
alter table public.pr_frame_catalog enable row level security;
revoke all on public.pr_frame_catalog from anon,authenticated;
insert into public.pr_frame_catalog (id,name,description,accent,unlock_kind,unlock_target,starts_on,ends_on,sort_order)
values
 ('original','PR Original','Marco inicial de Punta Rollers.','#65a7ff','default',null,null,null,0),
 ('constancia','Constancia','10 asistencias verificadas en PR Check.','#49e3c0','attendance',10,null,null,10),
 ('shifter-2026','Shifter 2026','Una toma de tiempo registrada y validada.','#ff9138','time_trial',1,null,null,20),
 ('100km','100 KM Club','100 km acumulados y verificados.','#b6ee70','distance',100,null,null,30),
 ('navidad-2026','Navidad','Disponible durante diciembre de 2026.','#e85064','seasonal',null,'2026-12-01','2026-12-31',40),
 ('nuevo-2027','Año Nuevo 2027','Celebración de Año Nuevo 2027.','#e7bd67','seasonal',null,'2027-01-01','2027-01-07',50)
on conflict (id) do nothing;
create or replace function public.pr_frames_catalog()
returns table(id text,name text,description text,accent text,image_url text,unlock_kind text,unlocked boolean)
language plpgsql security definer set search_path=''
as $$
declare v_profile text; v_today date;
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='28000'; end if;
 select p.id into v_profile from public.profiles p where p.auth_user_id=auth.uid() limit 1;
 v_today := (now() at time zone 'America/Montevideo')::date;
 return query select c.id,c.name,c.description,c.accent,c.image_url,c.unlock_kind,
 (c.unlock_kind='default' or (c.unlock_kind='seasonal' and v_today between c.starts_on and c.ends_on)
 or exists(select 1 from public.pr_frame_unlocks u where u.profile_id=v_profile and u.frame_id=c.id)) as unlocked
 from public.pr_frame_catalog c where c.visible and c.active order by c.sort_order,c.id;
end $$;
revoke all on function public.pr_frames_catalog() from public,anon;
grant execute on function public.pr_frames_catalog() to authenticated;
