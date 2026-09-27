-- PR Tracking / Track ID — hardened reference schema
-- Mirrors the security model currently used by Punta Rollers.
-- Keep this file aligned with Supabase migrations before reusing it elsewhere.

create extension if not exists pgcrypto;

create table if not exists public.pr_track_items (
  id uuid primary key default gen_random_uuid(),
  alumno_id text not null references public.profiles(id) on delete cascade,
  public_id text not null unique default encode(gen_random_bytes(12), 'hex'),
  nombre text not null default 'Mi equipo',
  tipo text not null default 'patines',
  marca text,
  modelo text,
  color text,
  descripcion text,
  foto_url text,
  mostrar_nombre boolean not null default true,
  mostrar_telefono boolean not null default true,
  mostrar_email boolean not null default false,
  mostrar_ciudad boolean not null default true,
  estado text not null default 'draft' check (estado in ('draft','active','paused','lost','retired')),
  activado_por text,
  activado_en timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  scans integer not null default 0,
  ultimo_scan timestamptz
);

create table if not exists public.pr_track_tags (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.pr_track_items(id) on delete cascade,
  tag_code text not null unique default encode(gen_random_bytes(10), 'hex'),
  etiqueta text,
  estado text not null default 'assigned' check (estado in ('assigned','active','paused','retired','replaced')),
  asignado_por text,
  asignado_en timestamptz not null default now(),
  ultimo_scan timestamptz,
  scans integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pr_track_scans (
  id bigint generated always as identity primary key,
  item_id uuid not null references public.pr_track_items(id) on delete cascade,
  scanned_at timestamptz not null default now(),
  scan_key text
);

create index if not exists pr_track_items_alumno_idx on public.pr_track_items(alumno_id);
create index if not exists pr_track_tags_item_idx on public.pr_track_tags(item_id);
create index if not exists pr_track_scans_item_idx on public.pr_track_scans(item_id);
create unique index if not exists pr_track_scans_item_scan_key_uidx on public.pr_track_scans(item_id,scan_key) where scan_key is not null;

alter table public.pr_track_items enable row level security;
alter table public.pr_track_tags enable row level security;
alter table public.pr_track_scans enable row level security;

create or replace function public.pr_track_current_profile_id()
returns text language sql stable security definer set search_path=public as $$
  select p.id from public.profiles p where p.auth_user_id=auth.uid() limit 1
$$;

create or replace function public.pr_track_is_staff()
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles p where p.auth_user_id=auth.uid() and (p.role in ('admin','profesor') or p.es_profesor=true))
$$;

-- Students can read their own Track IDs. Direct writes are staff-only;
-- student-editable fields go through the guarded RPC below.
drop policy if exists track_items_read on public.pr_track_items;
create policy track_items_read on public.pr_track_items for select to authenticated
using(
  public.pr_track_is_staff()
  or (
    alumno_id=public.pr_track_current_profile_id()
    and estado in ('active','lost')
  )
);

drop policy if exists track_items_update on public.pr_track_items;
drop policy if exists track_items_staff_update on public.pr_track_items;
create policy track_items_staff_update on public.pr_track_items for update to authenticated
using(public.pr_track_is_staff()) with check(public.pr_track_is_staff());

drop policy if exists track_items_staff_insert on public.pr_track_items;
create policy track_items_staff_insert on public.pr_track_items for insert to authenticated
with check(public.pr_track_is_staff());

drop policy if exists track_items_staff_delete on public.pr_track_items;
create policy track_items_staff_delete on public.pr_track_items for delete to authenticated
using(public.pr_track_is_staff());

drop policy if exists track_tags_read on public.pr_track_tags;
create policy track_tags_read on public.pr_track_tags for select to authenticated using(exists(
  select 1
  from public.pr_track_items i
  where i.id=item_id
    and (
      public.pr_track_is_staff()
      or (
        i.alumno_id=public.pr_track_current_profile_id()
        and i.estado in ('active','lost')
      )
    )
));

drop policy if exists track_tags_staff_write on public.pr_track_tags;
create policy track_tags_staff_write on public.pr_track_tags for all to authenticated
using(public.pr_track_is_staff()) with check(public.pr_track_is_staff());

drop policy if exists track_scans_staff_read on public.pr_track_scans;
create policy track_scans_staff_read on public.pr_track_scans for select to authenticated
using(public.pr_track_is_staff());

create or replace function public.pr_track_update_item(
  p_item_id uuid,p_nombre text,p_tipo text,p_marca text,p_modelo text,p_color text,
  p_descripcion text,p_foto_url text,p_mostrar_nombre boolean,p_mostrar_telefono boolean,
  p_mostrar_email boolean,p_mostrar_ciudad boolean
) returns public.pr_track_items language plpgsql security definer set search_path=public as $$
declare r public.pr_track_items;
begin
  select * into r
  from public.pr_track_items
  where id=p_item_id
    and (
      public.pr_track_is_staff()
      or (
        alumno_id=public.pr_track_current_profile_id()
        and estado in ('active','lost')
      )
    )
  limit 1;
  if r.id is null then raise exception 'Track ID no disponible'; end if;
  update public.pr_track_items set
    nombre=left(coalesce(p_nombre,''),120),tipo=left(coalesce(p_tipo,'otro'),40),marca=left(coalesce(p_marca,''),100),
    modelo=left(coalesce(p_modelo,''),100),color=left(coalesce(p_color,''),80),descripcion=left(coalesce(p_descripcion,''),500),
    foto_url=left(coalesce(p_foto_url,''),1000),mostrar_nombre=coalesce(p_mostrar_nombre,true),
    mostrar_telefono=coalesce(p_mostrar_telefono,true),mostrar_email=coalesce(p_mostrar_email,false),
    mostrar_ciudad=coalesce(p_mostrar_ciudad,true),updated_at=now()
  where id=p_item_id returning * into r;
  return r;
end $$;

create or replace function public.pr_track_set_state(p_item_id uuid,p_state text)
returns public.pr_track_items language plpgsql security definer set search_path=public as $$
declare r public.pr_track_items;
begin
  if p_state not in ('active','paused','lost','retired') then raise exception 'Estado inválido'; end if;
  select * into r from public.pr_track_items where id=p_item_id limit 1;
  if r.id is null then raise exception 'Track ID no disponible'; end if;
  if public.pr_track_is_staff() then
    null;
  elsif r.alumno_id=public.pr_track_current_profile_id() then
    if not ((r.estado='active' and p_state='lost') or (r.estado='lost' and p_state='active')) then
      raise exception 'Transición de estado no permitida';
    end if;
  else
    raise exception 'Track ID no disponible';
  end if;
  update public.pr_track_items set estado=p_state,updated_at=now() where id=p_item_id returning * into r;
  return r;
end $$;

create or replace function public.pr_track_sync_profile(p_alumno_id text)
returns void language plpgsql security definer set search_path=public as $$
begin
  update public.profiles p set tracking_activo=exists(select 1 from public.pr_track_items i where i.alumno_id=p_alumno_id and i.estado in ('active','lost')) where p.id=p_alumno_id;
end $$;

create or replace function public.pr_track_sync_profile_trigger()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  perform public.pr_track_sync_profile(coalesce(new.alumno_id,old.alumno_id));
  if tg_op='UPDATE' and old.alumno_id is distinct from new.alumno_id then perform public.pr_track_sync_profile(old.alumno_id); end if;
  return coalesce(new,old);
end $$;

drop trigger if exists pr_track_items_sync_profile on public.pr_track_items;
create trigger pr_track_items_sync_profile after insert or update or delete on public.pr_track_items
for each row execute function public.pr_track_sync_profile_trigger();

create or replace function public.pr_track_public(p_public_id text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare i public.pr_track_items;p public.profiles;enforcement boolean:=false;due public.pr_mensualidades;allowed boolean:=false;
begin
  select * into i from public.pr_track_items where public_id=p_public_id limit 1;
  if i.id is null then return jsonb_build_object('status','not_found'); end if;
  select * into p from public.profiles where id=i.alumno_id limit 1;
  select coalesce(enforcement_enabled,false) into enforcement from public.pr_tesoreria_config where id=1;
  select * into due from public.pr_mensualidades where alumno_id=i.alumno_id and periodo=date_trunc('month',timezone('America/Montevideo',now()))::date limit 1;
  allowed:=i.estado in ('active','lost') and coalesce(p.acceso_habilitado,true) and (
    coalesce(p.exento_mensualidad,false) or p.role in ('admin','profesor') or not enforcement
    or extract(day from timezone('America/Montevideo',now()))::int<11
    or lower(coalesce(due.estado,'')) in ('pagado','bonificado','acuerdo')
    or coalesce(due.gracia_hasta,due.vencimiento)>=timezone('America/Montevideo',now())::date
  );
  if not allowed then return jsonb_build_object('status','paused','public_id',i.public_id); end if;
  return jsonb_build_object('status',i.estado,'public_id',i.public_id,
    'item',jsonb_build_object('nombre',i.nombre,'tipo',i.tipo,'marca',i.marca,'modelo',i.modelo,'color',i.color,'descripcion',i.descripcion,'foto_url',i.foto_url),
    'owner',jsonb_strip_nulls(jsonb_build_object('nombre',case when i.mostrar_nombre then p.nombre end,'foto',p.foto,'telefono',case when i.mostrar_telefono then p.telefono end,'email',case when i.mostrar_email then p.email end,'ciudad',case when i.mostrar_ciudad then p.ciudad end)));
end $$;

create or replace function public.pr_track_scan(p_public_id text,p_scan_key text default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare i public.pr_track_items; inserted_count integer:=0;
begin
  select * into i from public.pr_track_items where public_id=p_public_id limit 1;
  if i.id is null then return jsonb_build_object('ok',false); end if;
  if p_scan_key is null or length(trim(p_scan_key))<8 then
    insert into public.pr_track_scans(item_id) values(i.id); inserted_count:=1;
  else
    insert into public.pr_track_scans(item_id,scan_key) values(i.id,left(p_scan_key,120)) on conflict do nothing;
    get diagnostics inserted_count=row_count;
  end if;
  if inserted_count>0 then update public.pr_track_items set scans=scans+1,ultimo_scan=now() where id=i.id; end if;
  return jsonb_build_object('ok',true,'counted',inserted_count>0);
end $$;

-- RPC grants: expose only what each client needs.
revoke execute on function public.pr_track_current_profile_id() from public,anon;
revoke execute on function public.pr_track_is_staff() from public,anon;
revoke execute on function public.pr_track_sync_profile(text) from public,anon,authenticated;
revoke execute on function public.pr_track_sync_profile_trigger() from public,anon,authenticated;
revoke execute on function public.pr_track_update_item(uuid,text,text,text,text,text,text,text,boolean,boolean,boolean,boolean) from public,anon;
revoke execute on function public.pr_track_set_state(uuid,text) from public,anon;
revoke execute on function public.pr_track_public(text) from public;
revoke execute on function public.pr_track_scan(text,text) from public;

grant execute on function public.pr_track_current_profile_id() to authenticated;
grant execute on function public.pr_track_is_staff() to authenticated;
grant execute on function public.pr_track_update_item(uuid,text,text,text,text,text,text,text,boolean,boolean,boolean,boolean) to authenticated;
grant execute on function public.pr_track_set_state(uuid,text) to authenticated;
grant execute on function public.pr_track_public(text) to anon,authenticated;
grant execute on function public.pr_track_scan(text,text) to anon,authenticated;

-- If upgrading an older install that had the one-argument scan RPC, keep it inaccessible.
do $$ begin
  if to_regprocedure('public.pr_track_scan(text)') is not null then
    execute 'revoke execute on function public.pr_track_scan(text) from public,anon,authenticated';
  end if;
end $$;


-- Public equipment photos used by Track ID cards.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('pr-tracking-media','pr-tracking-media',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set
  public=excluded.public,
  file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists pr_tracking_media_authenticated_insert on storage.objects;
drop policy if exists pr_tracking_media_owner_insert on storage.objects;
create policy pr_tracking_media_owner_insert on storage.objects
for insert to authenticated
with check (
  bucket_id='pr-tracking-media'
  and (storage.foldername(name))[1]=public.pr_track_current_profile_id()
  and exists (
    select 1 from public.pr_track_items i
    where i.id::text=(storage.foldername(name))[2]
      and (i.alumno_id=public.pr_track_current_profile_id() or public.pr_track_is_staff())
  )
);

drop policy if exists pr_tracking_media_owner_update on storage.objects;
create policy pr_tracking_media_owner_update on storage.objects
for update to authenticated
using(bucket_id='pr-tracking-media' and owner_id=auth.uid()::text)
with check(bucket_id='pr-tracking-media' and owner_id=auth.uid()::text);

drop policy if exists pr_tracking_media_owner_delete on storage.objects;
create policy pr_tracking_media_owner_delete on storage.objects
for delete to authenticated
using(bucket_id='pr-tracking-media' and owner_id=auth.uid()::text);


create or replace function public.pr_track_admin_create_item(
  p_alumno_id text,
  p_nombre text default 'Nuevo equipo',
  p_tipo text default 'patines'
) returns public.pr_track_items
language plpgsql
security definer
set search_path=public
as $$
declare r public.pr_track_items;
begin
  if not public.pr_track_is_staff() then raise exception 'No autorizado'; end if;
  if not exists(select 1 from public.profiles p where p.id=p_alumno_id) then
    raise exception 'Alumno no disponible';
  end if;

  insert into public.pr_track_items(alumno_id,nombre,tipo,estado,activado_por)
  values(
    p_alumno_id,
    left(coalesce(nullif(trim(p_nombre),''),'Nuevo equipo'),120),
    left(coalesce(nullif(trim(p_tipo),''),'patines'),40),
    'draft',
    public.pr_track_current_profile_id()
  )
  returning * into r;

  insert into public.pr_track_tags(item_id,etiqueta,estado,asignado_por)
  values(r.id,'NFC principal','assigned',public.pr_track_current_profile_id());

  return r;
end $$;

revoke execute on function public.pr_track_admin_create_item(text,text,text) from public,anon;
grant execute on function public.pr_track_admin_create_item(text,text,text) to authenticated;
