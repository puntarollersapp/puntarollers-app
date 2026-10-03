create table public.pr_rollermap_email_config(
id integer primary key check(id=1), sender text not null default 'RollerMap · Punta Rollers <hola@puntarollers.com>',
subject text not null default 'Bienvenidos a RollerMap: su registro ya está aprobado',
intro text not null default 'RollerMap conecta a quienes quieren patinar con escuelas y grupos de todo Uruguay. Ahora forma parte del ecosistema Punta Rollers.',
updated_at timestamptz not null default now());
insert into public.pr_rollermap_email_config(id) values(1);
alter table public.pr_rollermap_email_config enable row level security;
revoke all on public.pr_rollermap_email_config from anon,authenticated;
grant select,update on public.pr_rollermap_email_config to authenticated;
create policy rollermap_email_config_admin on public.pr_rollermap_email_config for all to authenticated using(public.soy_admin()) with check(public.soy_admin());
create table public.pr_rollermap_welcome(
location_id uuid primary key references public.pr_rollermap_locations(id) on delete cascade,
recipient_email text, location_name text not null, slug text not null,
status text not null default 'pending' check(status in ('pending','sending','sent','failed','missing_email')),
attempts integer not null default 0,created_at timestamptz not null default now(),last_attempt_at timestamptz,sent_at timestamptz,resend_id text,last_error text,
sender text,subject text,html text,plain_text text);
alter table public.pr_rollermap_welcome enable row level security;
revoke all on public.pr_rollermap_welcome from anon,authenticated;
grant select on public.pr_rollermap_welcome to authenticated;
create policy rollermap_welcome_admin_read on public.pr_rollermap_welcome for select to authenticated using(public.soy_admin());
create function rollermap_private.approve_location(location_id uuid,slug text) returns uuid language plpgsql security definer set search_path='' as $$
declare loc public.pr_rollermap_locations; email_value text;
begin
 if auth.uid() is null or not public.soy_admin() then raise exception 'Solo administradores' using errcode='42501';end if;
 select * into loc from public.pr_rollermap_locations where id=location_id for update;
 if not found then raise exception 'Lugar no encontrado';end if;
 select email into email_value from public.pr_rollermap_contacts where id=location_id;
 update public.pr_rollermap_locations set status='approved' where id=location_id;
 insert into public.pr_rollermap_welcome(location_id,recipient_email,location_name,slug,status)
 values(location_id,lower(trim(email_value)),loc.name,slug,case when coalesce(email_value,'') ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then 'pending' else 'missing_email' end)
 on conflict on constraint pr_rollermap_welcome_pkey do nothing;
 return location_id;
end;$$;
revoke all on function rollermap_private.approve_location(uuid,text) from public,anon;
grant execute on function rollermap_private.approve_location(uuid,text) to authenticated;
create function public.pr_rollermap_approve_location(location_id uuid,slug text) returns uuid language sql security invoker set search_path='' as $$select rollermap_private.approve_location(location_id,slug)$$;
revoke all on function public.pr_rollermap_approve_location(uuid,text) from public,anon;
grant execute on function public.pr_rollermap_approve_location(uuid,text) to authenticated;

