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
grant select,insert on public.pr_conversometro_marks to authenticated;
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
