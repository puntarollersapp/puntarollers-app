-- Conversómetro PR: independent of attendance, bookings, payments and training.
create table if not exists public.pr_conversometro_marks (
  id uuid primary key default gen_random_uuid(),
  student_id text not null references public.profiles(id),
  marked_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  voided_at timestamptz,
  constraint pr_conversometro_void_after_create check (voided_at is null or voided_at >= created_at)
);
create index if not exists pr_conversometro_marks_student_date_idx
  on public.pr_conversometro_marks(student_id,created_at desc);
alter table public.pr_conversometro_marks enable row level security;
revoke all on public.pr_conversometro_marks from anon,authenticated;
grant select on public.pr_conversometro_marks to authenticated;
grant insert (student_id) on public.pr_conversometro_marks to authenticated;
grant update (voided_at) on public.pr_conversometro_marks to authenticated;
create policy "authenticated can view conversation marks" on public.pr_conversometro_marks
  for select to authenticated using ((select auth.uid()) is not null);
create policy "teachers can add conversation marks" on public.pr_conversometro_marks
  for insert to authenticated with check (
    marked_by = (select auth.uid()) and voided_at is null and created_at <= now()
    and exists (select 1 from public.profiles p
      where p.auth_user_id = (select auth.uid())
      and (p.role in ('admin','profesor') or p.es_profesor = true))
  );
create policy "teachers can undo conversation marks" on public.pr_conversometro_marks
  for update to authenticated
  using (voided_at is null and exists (select 1 from public.profiles p
    where p.auth_user_id = (select auth.uid())
    and (p.role in ('admin','profesor') or p.es_profesor = true)))
  with check (voided_at is not null and exists (select 1 from public.profiles p
    where p.auth_user_id = (select auth.uid())
    and (p.role in ('admin','profesor') or p.es_profesor = true)));

-- The public ranking exposes ONLY the names/photos of students with active marks.
-- SECURITY DEFINER is restricted to authenticated callers; search_path is fixed.
create or replace function public.pr_conversometro_participants()
returns table(id text, name text, avatar_url text)
language sql stable security definer set search_path = ''
as $$
  select p.id, trim(concat_ws(' ',p.nombre,p.apellido))::text, p.foto::text
  from public.profiles p
  where (select auth.uid()) is not null
    and exists (select 1 from public.pr_conversometro_marks m
      where m.student_id=p.id and m.voided_at is null)
$$;
revoke all on function public.pr_conversometro_participants() from public,anon;
grant execute on function public.pr_conversometro_participants() to authenticated;
