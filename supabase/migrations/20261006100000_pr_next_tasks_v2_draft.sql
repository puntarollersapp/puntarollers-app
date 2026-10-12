-- PR NEXT · Tareas 2.0 foundation (DRAFT / BETA ONLY)
-- 2026-10-06
--
-- IMPORTANT:
-- This migration is intentionally stored on the PR NEXT beta branch and MUST NOT
-- be applied to the current production Supabase while the preview shares the
-- production database. It is an additive compatibility design for isolated QA.
--
-- Design rules:
-- 1) Preserve pr_training_tasks / pr_training_task_results and all Shifter logic.
-- 2) Keep event_slug compatible: Shifter remains a program, not deleted history.
-- 3) Store every evidence attempt append-only; never overwrite previous attempts.
-- 4) Keep moderation auditable: reviewer, feedback, score and timestamps.
-- 5) Personal objectives are separate from tasks.
-- 6) No storage bucket is created here.

begin;

create table if not exists public.pr_training_programs (
  slug text primary key,
  name text not null,
  description text,
  kind text not null default 'training' check (kind in ('training','event','season','onboarding')),
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default true,
  archived boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.pr_training_programs is 'PR NEXT program metadata. Existing event_slug values remain compatible and may be backfilled later after QA.';

alter table public.pr_training_tasks
  add column if not exists validation_mode text,
  add column if not exists audience jsonb not null default '{}'::jsonb,
  add column if not exists opens_at timestamptz,
  add column if not exists due_at timestamptz,
  add column if not exists points numeric,
  add column if not exists requires_evidence boolean not null default false;

-- Constraints are deliberately NOT added yet to existing task columns because
-- production values must be inventoried before enforcing a closed vocabulary.

create table if not exists public.pr_training_task_submissions (
  id uuid primary key default gen_random_uuid(),
  profile_id text not null,
  task_id uuid not null references public.pr_training_tasks(id) on delete cascade,
  attempt_no integer not null check (attempt_no > 0),
  status text not null default 'submitted' check (status in ('submitted','in_review','approved','needs_correction','withdrawn')),
  evidence jsonb not null default '{}'::jsonb,
  note text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewer_profile_id text,
  feedback text,
  score numeric,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(profile_id, task_id, attempt_no)
);

create index if not exists pr_training_task_submissions_profile_task_idx
  on public.pr_training_task_submissions(profile_id, task_id, submitted_at desc);
create index if not exists pr_training_task_submissions_status_idx
  on public.pr_training_task_submissions(status, submitted_at asc);

comment on table public.pr_training_task_submissions is 'Append-only evidence attempts and professor moderation history for Tareas 2.0.';

create table if not exists public.pr_training_objectives (
  id uuid primary key default gen_random_uuid(),
  profile_id text not null,
  title text not null,
  description text,
  objective_type text not null default 'personal' check (objective_type in ('personal','teacher','starter')),
  metric_type text,
  target_value numeric,
  current_value numeric not null default 0,
  unit text,
  target_date date,
  status text not null default 'active' check (status in ('active','completed','paused','cancelled')),
  created_by_profile_id text,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pr_training_objectives_profile_status_idx
  on public.pr_training_objectives(profile_id, status, created_at desc);

create table if not exists public.pr_training_objective_history (
  id uuid primary key default gen_random_uuid(),
  objective_id uuid not null references public.pr_training_objectives(id) on delete cascade,
  profile_id text not null,
  previous_value numeric,
  new_value numeric,
  note text,
  source text not null default 'manual',
  created_by_profile_id text,
  created_at timestamptz not null default now()
);

create index if not exists pr_training_objective_history_objective_idx
  on public.pr_training_objective_history(objective_id, created_at desc);

-- RLS is enabled before any future client use. Policies are intentionally not
-- guessed here: they must reuse the verified production identity helpers and be
-- regression-tested against alumno/profesor/admin roles in an isolated database.
alter table public.pr_training_programs enable row level security;
alter table public.pr_training_task_submissions enable row level security;
alter table public.pr_training_objectives enable row level security;
alter table public.pr_training_objective_history enable row level security;

-- Defense in depth: no new table is exposed to anon by this draft.
revoke all on table public.pr_training_programs from anon;
revoke all on table public.pr_training_task_submissions from anon;
revoke all on table public.pr_training_objectives from anon;
revoke all on table public.pr_training_objective_history from anon;

-- Intentionally no authenticated grants/policies yet. The beta UI remains
-- read-only until isolated Supabase QA exists.

commit;
