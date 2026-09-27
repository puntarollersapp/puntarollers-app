-- PR Tracking / Track ID v1
-- Prepared for the PR 2026 refresh branch.
-- Apply only after review in Supabase.

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
  estado text not null default 'draft'
    check (estado in ('draft','active','paused','lost','retired')),
  activado_por text,
  activado_en timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pr_track_tags (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.pr_track_items(id) on delete cascade,
  tag_code text not null unique default encode(gen_random_bytes(10), 'hex'),
  etiqueta text,
  estado text not null default 'assigned'
    check (estado in ('assigned','active','paused','retired','replaced')),
  asignado_por text,
  asignado_en timestamptz not null default now(),
  ultimo_scan timestamptz,
  scans integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pr_track_items_alumno_idx
  on public.pr_track_items(alumno_id);

create index if not exists pr_track_tags_item_idx
  on public.pr_track_tags(item_id);

alter table public.pr_track_items enable row level security;
alter table public.pr_track_tags enable row level security;

create or replace function public.pr_track_current_profile_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.id
  from public.profiles p
  where p.auth_user_id = auth.uid()
  limit 1
$$;

create or replace function public.pr_track_is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.auth_user_id = auth.uid()
      and (p.role in ('admin','profesor') or p.es_profesor = true)
  )
$$;

drop policy if exists track_items_read on public.pr_track_items;
create policy track_items_read
on public.pr_track_items for select
to authenticated
using (
  alumno_id = public.pr_track_current_profile_id()
  or public.pr_track_is_staff()
);

drop policy if exists track_items_update on public.pr_track_items;
create policy track_items_update
on public.pr_track_items for update
to authenticated
using (
  alumno_id = public.pr_track_current_profile_id()
  or public.pr_track_is_staff()
)
with check (
  alumno_id = public.pr_track_current_profile_id()
  or public.pr_track_is_staff()
);

drop policy if exists track_items_staff_insert on public.pr_track_items;
create policy track_items_staff_insert
on public.pr_track_items for insert
to authenticated
with check (public.pr_track_is_staff());

drop policy if exists track_items_staff_delete on public.pr_track_items;
create policy track_items_staff_delete
on public.pr_track_items for delete
to authenticated
using (public.pr_track_is_staff());

drop policy if exists track_tags_read on public.pr_track_tags;
create policy track_tags_read
on public.pr_track_tags for select
to authenticated
using (
  exists (
    select 1
    from public.pr_track_items i
    where i.id = item_id
      and (
        i.alumno_id = public.pr_track_current_profile_id()
        or public.pr_track_is_staff()
      )
  )
);

drop policy if exists track_tags_staff_write on public.pr_track_tags;
create policy track_tags_staff_write
on public.pr_track_tags for all
to authenticated
using (public.pr_track_is_staff())
with check (public.pr_track_is_staff());

create or replace function public.pr_track_public(p_public_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  i public.pr_track_items;
  p public.profiles;
  enforcement boolean := false;
  due public.pr_mensualidades;
  allowed boolean := false;
begin
  select * into i
  from public.pr_track_items
  where public_id = p_public_id
  limit 1;

  if i.id is null then
    return jsonb_build_object('status', 'not_found');
  end if;

  select * into p
  from public.profiles
  where id = i.alumno_id
  limit 1;

  select coalesce(enforcement_enabled, false)
    into enforcement
  from public.pr_tesoreria_config
  where id = 1;

  select * into due
  from public.pr_mensualidades
  where alumno_id = i.alumno_id
    and periodo = date_trunc('month', timezone('America/Montevideo', now()))::date
  limit 1;

  allowed :=
    i.estado in ('active','lost')
    and coalesce(p.acceso_habilitado, true)
    and (
      coalesce(p.exento_mensualidad, false)
      or p.role in ('admin','profesor')
      or not enforcement
      or extract(day from timezone('America/Montevideo', now()))::int < 11
      or lower(coalesce(due.estado,'')) in ('pagado','bonificado','acuerdo')
      or coalesce(due.gracia_hasta, due.vencimiento) >= timezone('America/Montevideo', now())::date
    );

  if not allowed then
    return jsonb_build_object(
      'status', 'paused',
      'public_id', i.public_id
    );
  end if;

  return jsonb_build_object(
    'status', i.estado,
    'public_id', i.public_id,
    'item', jsonb_build_object(
      'nombre', i.nombre,
      'tipo', i.tipo,
      'marca', i.marca,
      'modelo', i.modelo,
      'color', i.color,
      'descripcion', i.descripcion,
      'foto_url', i.foto_url
    ),
    'owner', jsonb_strip_nulls(jsonb_build_object(
      'nombre', case when i.mostrar_nombre then p.nombre end,
      'foto', p.foto,
      'telefono', case when i.mostrar_telefono then p.telefono end,
      'email', case when i.mostrar_email then p.email end,
      'ciudad', case when i.mostrar_ciudad then p.ciudad end
    ))
  );
end
$$;

grant execute on function public.pr_track_public(text) to anon, authenticated;
