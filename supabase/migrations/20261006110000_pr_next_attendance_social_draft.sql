-- PR NEXT · beta-only architecture draft
-- DO NOT APPLY TO PRODUCTION before isolated beta QA.
-- Attendance, polls and PR Voice are intentionally additive.

create table if not exists public.pr_check_sessions (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null,
  ends_at timestamptz,
  group_key text,
  venue text,
  label text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.pr_check_records (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.pr_check_sessions(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('presente','ausente','justificado','pausa','personalizada','evento')),
  source text not null default 'manual' check (source in ('qr','manual','system')),
  checked_at timestamptz not null default now(),
  checked_by uuid references public.profiles(id),
  note text,
  created_at timestamptz not null default now(),
  unique(session_id,profile_id)
);

create index if not exists pr_check_records_profile_idx on public.pr_check_records(profile_id,checked_at desc);
create index if not exists pr_check_records_session_idx on public.pr_check_records(session_id,status);

create table if not exists public.pr_polls (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text not null default 'draft' check (status in ('draft','open','closed','archived')),
  starts_at timestamptz,
  ends_at timestamptz,
  pinned boolean not null default false,
  private_votes boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.pr_poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.pr_polls(id) on delete cascade,
  label text not null,
  sort_order integer not null default 0
);

create table if not exists public.pr_poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.pr_polls(id) on delete cascade,
  option_id uuid not null references public.pr_poll_options(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(poll_id,profile_id)
);

create table if not exists public.pr_voice_entries (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  privacy_mode text not null check (privacy_mode in ('confidential','anonymous')),
  body text not null check (char_length(body) between 1 and 1200),
  status text not null default 'new' check (status in ('new','reviewing','closed')),
  created_at timestamptz not null default now()
);

alter table public.pr_check_sessions enable row level security;
alter table public.pr_check_records enable row level security;
alter table public.pr_polls enable row level security;
alter table public.pr_poll_options enable row level security;
alter table public.pr_poll_votes enable row level security;
alter table public.pr_voice_entries enable row level security;

-- Policies are intentionally omitted from this draft.
-- Before activation:
-- 1. isolate beta database or schema,
-- 2. map authenticated user -> profile safely,
-- 3. define staff read/write policies,
-- 4. expose aggregate poll results without voter identities,
-- 5. ensure anonymous PR Voice entries do not expose profile_id to staff-facing reads.
