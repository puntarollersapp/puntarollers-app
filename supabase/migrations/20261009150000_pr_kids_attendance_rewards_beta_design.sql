-- PR Kids attendance passport and rewards — STAGING DESIGN ONLY.
-- This migration is NOT deployed. Verify the existing scanner event source before
-- writing any bridge; never manufacture attendance from page visits.
create table if not exists public.pr_kids_attendance_stamps (
 id uuid primary key default gen_random_uuid(),
 child_id uuid not null references public.pr_kids_children(id) on delete restrict,
 attendance_source text not null check (attendance_source in ('scanner','admin_correction')),
 source_event_id text not null,
 attended_at timestamptz not null,
 recorded_at timestamptz not null default now(),
 recorded_by uuid references auth.users(id),
 voided_at timestamptz,
 void_reason text,
 voided_by uuid references auth.users(id),
 constraint pr_kids_attendance_stamp_source_unique unique (attendance_source,source_event_id),
 constraint pr_kids_attendance_stamp_void_check check (
  (voided_at is null and void_reason is null and voided_by is null)
  or (voided_at is not null and nullif(trim(void_reason),'') is not null and voided_by is not null)
 )
);
create index if not exists pr_kids_attendance_stamps_child_date_idx
 on public.pr_kids_attendance_stamps(child_id,attended_at desc);
alter table public.pr_kids_attendance_stamps enable row level security;
revoke all on public.pr_kids_attendance_stamps from anon, authenticated;

-- Reuse the existing pr_kids_rewards and pr_kids_redemptions tables.
-- Do not introduce duplicate catalogs or redemption ledgers.

-- Server transaction rules (mandatory before activation):
-- 1. Verify a child is enrolled, the scanner event is authentic, and the
--    check-in was confirmed; idempotently insert using source_event_id.
-- 2. Correct mistakes by voiding an event with an audit reason, never deleting.
-- 3. Calculate total valid stamps minus non-cancelled redeemed stamps.
-- 4. Redeem only with an authorized staff identity, row locking and a
--    transactional balance check to prevent simultaneous overspending.
-- 5. A guardian may view only children in their active approved relationships.
-- 6. Do not expose scanner tokens, guardian PINs or child medical information.
-- 7. Decide whether historic attendance before launch is imported, and verify
--    a stable child-ID mapping. Do not backfill by matching names alone.
