-- Link an authenticated member to a separate PR Personal booking record without moving credits.
create schema if not exists pr_personal_internal;
revoke all on schema pr_personal_internal from public,anon,authenticated;
create table if not exists pr_personal_internal.member_links(
 member_id text primary key references public.profiles(id) on delete cascade,
 personal_id text unique not null references public.profiles(id) on delete cascade,
 linked_at timestamptz not null default now(),
 check(member_id<>personal_id)
);
alter table pr_personal_internal.member_links enable row level security;
revoke all on pr_personal_internal.member_links from public,anon,authenticated;
create or replace function pr_personal_internal.has_active_pass(p_id text)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.cuponeras_particulares c where
 (c.alumno_id=p_id or c.alumno_id=(select personal_id from pr_personal_internal.member_links where member_id=p_id))
 and c.habilitada and c.visible_al_alumno and c.estado='activa' and c.clases_disponibles>0
 and (c.fecha_inicio is null or c.fecha_inicio <= (now() at time zone 'America/Montevideo')::date)
 and (c.fecha_vencimiento is null or c.fecha_vencimiento >= (now() at time zone 'America/Montevideo')::date))
$$;
revoke all on function pr_personal_internal.has_active_pass(text) from public,anon,authenticated;
create or replace function pr_personal_internal.sync_member(p_id text)
returns void language sql security definer set search_path='' as $$
 update public.profiles p set acceso_habilitado=pr_personal_internal.has_active_pass(p.id),updated_at=now()
 where p.id=p_id and p.role='alumno' and p.auth_user_id is not null and p.es_solo_personalizadas and p.estado='Activo'
 and p.acceso_habilitado is distinct from pr_personal_internal.has_active_pass(p.id)
$$;
revoke all on function pr_personal_internal.sync_member(text) from public,anon,authenticated;
create or replace function pr_personal_internal.pass_changed()
returns trigger language plpgsql security definer set search_path='' as $$
declare pid text;
begin
 for pid in select distinct id from (select case when TG_OP<>'INSERT' then old.alumno_id end id union all select case when TG_OP<>'DELETE' then new.alumno_id end) x where id is not null loop
 perform pr_personal_internal.sync_member(pid);
 perform pr_personal_internal.sync_member(member_id) from pr_personal_internal.member_links where personal_id=pid;
 end loop;
 return null;
end $$;
revoke all on function pr_personal_internal.pass_changed() from public,anon,authenticated;
drop trigger if exists pr_personal_member_pass_sync on public.cuponeras_particulares;
create trigger pr_personal_member_pass_sync after insert or update or delete on public.cuponeras_particulares for each row execute function pr_personal_internal.pass_changed();
create or replace function pr_personal_internal.profile_changed()
returns trigger language plpgsql security definer set search_path='' as $$
begin perform pr_personal_internal.sync_member(new.id);return null;end $$;
revoke all on function pr_personal_internal.profile_changed() from public,anon,authenticated;
drop trigger if exists pr_personal_member_profile_sync on public.profiles;
create trigger pr_personal_member_profile_sync after insert or update of auth_user_id,es_solo_personalizadas,estado on public.profiles for each row execute function pr_personal_internal.profile_changed();

-- Only the authenticated owner can read these minimal pass details.
create or replace function public.pr_personal_my_membership()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare p public.profiles%rowtype; c public.cuponeras_particulares%rowtype; n integer:=0; active boolean;
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED';end if;
 select * into p from public.profiles where auth_user_id=auth.uid() limit 1;
 if not found or p.role<>'alumno' then return jsonb_build_object('exclusive',false,'active',false,'pass',null);end if;
 active:=p.estado='Activo' and pr_personal_internal.has_active_pass(p.id);
 select v.* into c from public.cuponeras_particulares v where v.visible_al_alumno and (v.alumno_id=p.id or v.alumno_id=(select personal_id from pr_personal_internal.member_links where member_id=p.id))
 order by (v.habilitada and v.estado='activa' and v.clases_disponibles>0 and (v.fecha_inicio is null or v.fecha_inicio <= (now() at time zone 'America/Montevideo')::date) and (v.fecha_vencimiento is null or v.fecha_vencimiento >= (now() at time zone 'America/Montevideo')::date)) desc,v.created_at desc,v.id desc limit 1;
 if found then select count(*)::int into n from public.pr_personal_reservas r where r.cuponera_id=c.id and r.estado='reservada';end if;
 return jsonb_build_object('exclusive',coalesce(p.es_solo_personalizadas,false),'active',active,'pass',case when c.id is null then null else jsonb_build_object('id',c.id,'nombre_cuponera',c.nombre_cuponera,'clases_cargadas',c.clases_cargadas,'clases_utilizadas',c.clases_utilizadas,'clases_disponibles',c.clases_disponibles,'habilitada',c.habilitada,'estado',c.estado,'fecha_vencimiento',c.fecha_vencimiento) end,'reservedCredits',n,'bookableCredits',case when active and c.habilitada then greatest(0,c.clases_disponibles-n) else 0 end);
end $$;
revoke all on function public.pr_personal_my_membership() from public,anon;
grant execute on function public.pr_personal_my_membership() to authenticated;

create or replace function public.pr_personal_admin_link_member(p_personal_id text,p_member_id text)
returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not public.soy_admin() then raise exception 'No autorizado' using errcode='42501';end if;
 if not exists(select 1 from public.profiles p where p.id=p_personal_id and p.role='alumno' and p.auth_user_id is null and p.es_solo_personalizadas and p.particulares_habilitadas)
 or not exists(select 1 from public.profiles p where p.id=p_member_id and p.role='alumno' and p.auth_user_id is not null and not exists(select 1 from public.pr_kids_children k where k.treasury_profile_id=p.id)) then raise exception 'Fichas no válidas';end if;
 insert into pr_personal_internal.member_links(member_id,personal_id) values(p_member_id,p_personal_id);
 perform pr_personal_internal.sync_member(p_member_id);
end $$;
revoke all on function public.pr_personal_admin_link_member(text,text) from public,anon;
grant execute on function public.pr_personal_admin_link_member(text,text) to authenticated;

-- Existing verified match: same unique phone, surname and existing private-only designation.
insert into pr_personal_internal.member_links(member_id,personal_id)
select m.id,p.id from public.profiles m join public.profiles p on p.id='personal_f2a38016-cfee-4e43-bbfd-42791e495121'
where m.id='alumno_25440652-3c06-4258-a56e-50c7c4e174b4' and m.auth_user_id is not null and m.es_solo_personalizadas and p.auth_user_id is null
and lower(trim(m.apellido))=lower(trim(p.apellido)) and lower(p.nombre) like '%'||lower(trim(m.nombre))||'%'
and length(regexp_replace(coalesce(m.telefono,''),'[^0-9]','','g'))>=8 and right(regexp_replace(m.telefono,'[^0-9]','','g'),8)=right(regexp_replace(p.telefono,'[^0-9]','','g'),8)
on conflict do nothing;
select pr_personal_internal.sync_member(p.id) from public.profiles p where p.es_solo_personalizadas and p.auth_user_id is not null;

-- Do not apply monthly collection or overdue status to exclusive private students.
do $migration$
declare f record; d text; n integer:=0;
begin
 for f in select p.proname,pg_get_functiondef(p.oid) def from pg_proc p join pg_namespace s on s.oid=p.pronamespace where s.nspname='public' and p.proname in ('pr_aplicar_bloqueos_mensuales','pr_actualizar_estado_mensualidades','pr_training_v2_my_cycle','community_is_active_member','proteger_campos_profile') loop
 d:=f.def;
 if f.proname in ('pr_aplicar_bloqueos_mensuales','pr_actualizar_estado_mensualidades') then
 d:=replace(d,'AND coalesce(p.exento_mensualidad,false)=false','AND coalesce(p.exento_mensualidad,false)=false AND NOT coalesce(p.es_solo_personalizadas,false)');
 elsif f.proname='pr_training_v2_my_cycle' then
 d:=replace(d,'if coalesce(v_profile.acceso_habilitado,false)=false','if (case when coalesce(v_profile.es_solo_personalizadas,false) then not (v_profile.estado=''Activo'' and pr_personal_internal.has_active_pass(v_profile.id)) else coalesce(v_profile.acceso_habilitado,false)=false end)');
 d:=replace(d,'v_profile.mensualidad_hasta < current_date and not coalesce(v_profile.exento_mensualidad,false)','v_profile.mensualidad_hasta < current_date and not coalesce(v_profile.exento_mensualidad,false) and not coalesce(v_profile.es_solo_personalizadas,false)');
 elsif f.proname='community_is_active_member' then
 d:=replace(d,'p.acceso_habilitado is true','(case when p.role=''alumno'' and p.es_solo_personalizadas then pr_personal_internal.has_active_pass(p.id) else p.acceso_habilitado is true end)');
 elsif f.proname='proteger_campos_profile' then
 d:=replace(d,'NEW.particulares_habilitadas IS DISTINCT FROM OLD.particulares_habilitadas','NEW.particulares_habilitadas IS DISTINCT FROM OLD.particulares_habilitadas OR NEW.es_solo_personalizadas IS DISTINCT FROM OLD.es_solo_personalizadas OR NEW.es_alumno_personalizadas IS DISTINCT FROM OLD.es_alumno_personalizadas');
 end if;
 if d=f.def then raise exception 'Unexpected function definition %',f.proname;end if;
 execute d;n:=n+1;
 end loop;
 if n<>5 then raise exception 'Expected 5 functions';end if;
end $migration$;