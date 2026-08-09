-- ============================================================
-- PUNTA ROLLERS · PR MUSIC 2.0
-- Buzón moderado de playlists recomendadas por alumnos.
-- Seguro para ejecutar varias veces.
-- ============================================================

begin;

create extension if not exists pgcrypto;

create table if not exists public.pr_music_suggestions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  profile_name text not null,
  profile_photo text,
  spotify_url text not null,
  spotify_playlist_id text not null,
  playlist_name text,
  note text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  constraint pr_music_suggestions_status_check
    check (status in ('pending', 'approved', 'rejected')),
  constraint pr_music_suggestions_spotify_id_check
    check (spotify_playlist_id ~ '^[A-Za-z0-9]+$'),
  constraint pr_music_suggestions_note_length_check
    check (note is null or char_length(note) <= 220),
  constraint pr_music_suggestions_name_length_check
    check (playlist_name is null or char_length(playlist_name) <= 90),
  constraint pr_music_suggestions_profile_playlist_unique
    unique (profile_id, spotify_playlist_id)
);

create index if not exists pr_music_suggestions_status_created_idx
  on public.pr_music_suggestions(status, created_at desc);

alter table public.pr_music_suggestions enable row level security;

-- Limpia únicamente nuestras policies para que el script sea re-ejecutable.
drop policy if exists "pr_music_insert_own" on public.pr_music_suggestions;
drop policy if exists "pr_music_select_approved_or_own" on public.pr_music_suggestions;
drop policy if exists "pr_music_admin_select_all" on public.pr_music_suggestions;
drop policy if exists "pr_music_admin_update" on public.pr_music_suggestions;

-- Alumno autenticado: solo puede enviar una recomendación a nombre de su propio perfil.
create policy "pr_music_insert_own"
on public.pr_music_suggestions
for insert
to authenticated
with check (
  status = 'pending'
  and exists (
    select 1
    from public.profiles p
    where p.id = profile_id
      and p.auth_user_id = auth.uid()
      and coalesce(p.acceso_habilitado, true) = true
  )
);

-- Toda persona autenticada puede ver las aprobadas. Cada usuario también puede ver las suyas.
create policy "pr_music_select_approved_or_own"
on public.pr_music_suggestions
for select
to authenticated
using (
  status = 'approved'
  or exists (
    select 1
    from public.profiles p
    where p.id = profile_id
      and p.auth_user_id = auth.uid()
  )
);

-- Admin: puede revisar toda la bandeja.
create policy "pr_music_admin_select_all"
on public.pr_music_suggestions
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles admin_profile
    where admin_profile.auth_user_id = auth.uid()
      and lower(coalesce(admin_profile.role, '')) = 'admin'
  )
);

-- Admin: puede aprobar/descartar. No se habilita delete desde la app.
create policy "pr_music_admin_update"
on public.pr_music_suggestions
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles admin_profile
    where admin_profile.auth_user_id = auth.uid()
      and lower(coalesce(admin_profile.role, '')) = 'admin'
  )
)
with check (
  status in ('pending', 'approved', 'rejected')
  and exists (
    select 1
    from public.profiles admin_profile
    where admin_profile.auth_user_id = auth.uid()
      and lower(coalesce(admin_profile.role, '')) = 'admin'
  )
);

commit;
