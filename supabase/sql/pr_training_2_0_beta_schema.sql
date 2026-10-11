-- PR Training 2.0 — schema proposal (BETA, NOT APPLIED)
-- Preserves legacy Road to Shifter tables and data.

create table if not exists public.pr_training_cycles_v2 (
  id uuid primary key default gen_random_uuid(),
  cycle_key text not null unique,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reveal_opens_at timestamptz not null,
  status text not null default 'draft' check (status in ('draft','active','closed')),
  created_at timestamptz not null default now()
);

create table if not exists public.pr_training_duties_v2 (
  id uuid primary key default gen_random_uuid(),
  stable_code text not null,
  version integer not null default 1,
  title text not null,
  description text not null default '',
  level text not null check (level in ('basic','advanced')),
  evidence_type text not null check (evidence_type in ('strava','video','photo','mixed')),
  strava_rule jsonb not null default '{}'::jsonb,
  instructions jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(stable_code,version)
);

create table if not exists public.pr_training_assignments_v2 (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.pr_training_cycles_v2(id) on delete restrict,
  profile_id text not null references public.profiles(id) on delete restrict,
  level text not null check (level in ('basic','advanced')),
  duty_ids uuid[] not null,
  assigned_at timestamptz not null default now(),
  spin_revealed_at timestamptz,
  assignment_source text not null default 'system',
  constraint exactly_six_duties check (cardinality(duty_ids)=6),
  unique(cycle_id,profile_id)
);

create table if not exists public.pr_training_results_v2 (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.pr_training_assignments_v2(id) on delete restrict,
  duty_id uuid not null references public.pr_training_duties_v2(id) on delete restrict,
  status text not null default 'pending' check (status in ('pending','completed_review','approved','rejected')),
  evidence jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by text references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(assignment_id,duty_id)
);

-- First production cycle; activation is configurable and remains draft until approved.
insert into public.pr_training_cycles_v2(cycle_key,title,starts_at,ends_at,reveal_opens_at,status)
values(
 '2026-11','Noviembre 2026',
 '2026-11-01 00:00:00-03',
 '2026-11-30 23:59:59-03',
 '2026-11-01 15:00:00-03',
 'draft'
)
on conflict(cycle_key) do nothing;

-- IMPORTANT: RLS/policies and assignment RPC are intentionally added only after
-- eligibility rules are mapped against current profiles/treasury/pause semantics.
