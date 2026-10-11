-- PR Training 2.0 — schema proposal (BETA, NOT APPLIED)
-- Additive design. Preserves legacy Road to Shifter tables and data.
-- Source of truth: PR Training 2.0 Master PR NEXT (08/10/2026).

create table if not exists public.pr_training_cycles_v2 (
  id uuid primary key default gen_random_uuid(),
  cycle_key text not null unique,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  activation_at timestamptz not null,
  closes_at timestamptz,
  correction_window_ends_at timestamptz,
  status text not null default 'draft' check (status in ('draft','active','closed')),
  rules_version text not null default 'v1',
  created_at timestamptz not null default now()
);

create table if not exists public.pr_training_duties_v2 (
  id uuid primary key default gen_random_uuid(),
  stable_code text not null,
  version integer not null default 1,
  title text not null,
  objective text not null default '',
  work_spec jsonb not null default '{}'::jsonb,
  delivery_spec jsonb not null default '{}'::jsonb,
  progression text not null check (progression in ('B1','B2','B3','B4')),
  evidence_type text not null check (evidence_type in ('strava','video','photo','mixed')),
  demo_asset_ids text[] not null default '{}',
  requires_demo boolean not null default false,
  eligibility_rules jsonb not null default '{}'::jsonb,
  strava_rule jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(stable_code,version)
);

-- One persisted assignment set per student/cycle. Created lazily on first eligible access.
create table if not exists public.pr_training_assignments_v2 (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.pr_training_cycles_v2(id) on delete restrict,
  profile_id text not null references public.profiles(id) on delete restrict,
  progression_snapshot text not null check (progression_snapshot in ('B1','B2','B3','B4')),
  eligibility_snapshot jsonb not null default '{}'::jsonb,
  rules_snapshot jsonb not null default '{}'::jsonb,
  assigned_at timestamptz not null default now(),
  spin_discovered_at timestamptz,
  spin_reveal_progress smallint not null default 0 check (spin_reveal_progress between 0 and 6),
  assignment_source text not null default 'system',
  unique(cycle_id,profile_id)
);

-- Exactly six rows are inserted transactionally by the assignment engine.
-- position is the stable PR SPIN reveal order and never rerandomizes on reload.
create table if not exists public.pr_training_assignment_duties_v2 (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.pr_training_assignments_v2(id) on delete restrict,
  duty_id uuid not null references public.pr_training_duties_v2(id) on delete restrict,
  position smallint not null check (position between 1 and 6),
  duty_code_snapshot text not null,
  duty_version_snapshot integer not null,
  duty_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(assignment_id,position),
  unique(assignment_id,duty_id)
);

create table if not exists public.pr_training_results_v2 (
  id uuid primary key default gen_random_uuid(),
  assignment_duty_id uuid not null unique references public.pr_training_assignment_duties_v2(id) on delete restrict,
  status text not null default 'pending'
    check (status in ('pending','completed_review','approved','practice_more','resubmission_review')),
  evidence jsonb not null default '{}'::jsonb,
  subprogress jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by text references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Administrative incidence instead of unsafe fallback when six eligible duties cannot be produced.
create table if not exists public.pr_training_assignment_incidents_v2 (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.pr_training_cycles_v2(id) on delete restrict,
  profile_id text not null references public.profiles(id) on delete restrict,
  reason text not null,
  detail jsonb not null default '{}'::jsonb,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

-- First productive cycle. October 2026 is intentionally not created.
insert into public.pr_training_cycles_v2(
  cycle_key,title,starts_at,ends_at,activation_at,status,rules_version
)
values(
 '2026-11','Noviembre 2026',
 '2026-11-01 00:00:00-03',
 '2026-11-30 23:59:59-03',
 '2026-11-01 15:00:00-03',
 'draft','v1'
)
on conflict(cycle_key) do nothing;

-- Engine invariants to implement in the transactional RPC/service:
-- 1) eligibility uses existing active/pause/Treasury/email truth; never parallel financial state.
-- 2) assignment is lazy; no access => no six fake duties => history "No iniciado".
-- 3) cumulative pool B1..current progression, plus per-student technique eligibility.
-- 4) mandatory demo missing/invalid => duty ineligible.
-- 5) prefer non-recent duties, then category/technique variety; historical reuse is allowed.
-- 6) fewer than six safe candidates => create incidence and assign nothing.
-- 7) persist assignment + exactly six assignment_duties atomically before PR SPIN.
-- 8) PR SPIN only reveals persisted positions; refresh/skip never rerandomizes.
-- 9) B4-13 (4x500m) occupies ONE of the six duties. Its four Strava activities are subprogress 1/4..4/4.
-- 10) progression changes affect next cycle only; current assignment remains immutable/history-safe.

-- IMPORTANT: RLS/policies, private evidence storage and assignment RPC remain intentionally
-- unapplied until existing profile/Treasury/pause semantics are mapped and reviewed.
