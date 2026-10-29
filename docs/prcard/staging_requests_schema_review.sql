-- STAGING PROPOSAL ONLY. Apply after security review; never run against production without approval.
create table if not exists public.prcard_requests (
 id bigint generated always as identity primary key,
 profile_id text not null references public.profiles(id) on delete restrict,
 first_name text not null,
 last_name text not null,
 document text not null,
 email text not null,
 birthdate date not null,
 status text not null default 'pending' check (status in ('pending','approved','rejected')),
 requested_at timestamptz not null default now(),
 reviewed_at timestamptz,
 reviewed_by text
);
create unique index if not exists prcard_requests_one_pending_per_profile
 on public.prcard_requests(profile_id) where status='pending';
create index if not exists prcard_requests_status_requested_idx
 on public.prcard_requests(status,requested_at desc);
alter table public.prcard_requests enable row level security;
revoke all on public.prcard_requests from anon, authenticated;
comment on table public.prcard_requests is 'Private PR Card requests. Only authenticated server handlers may access. Never store PIN.';
