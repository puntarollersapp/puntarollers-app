-- PR NEXT / Post-Shifter 2026
-- Safe-view + RLS foundation.
-- IMPORTANT: beta-only migration. Do not apply to production until isolated staging QA passes.
-- Goal: replace SECURITY DEFINER public/feed views with SECURITY INVOKER safely,
-- without changing the public projection or exposing base tables directly.

begin;

-- Explicitly document the intended API surface. Base-table grants are NOT widened here.
-- The current public projections remain the contract:
--   profiles_public: id, nombre, apellido, foto, verificado
--   profiles_feed: profile/feed metadata for authenticated users
--   actividad_pr_public: allowed activity types only
--   pr_training_progress_public: Shifter progress for authenticated users
--   pr_training_completed_feed: completed Shifter tasks for authenticated users
--   pr_unlock_live_contributions: public, non-private Strava contributions only

-- Convert views to invoker semantics only in an isolated Supabase branch after
-- corresponding base-table SELECT policies have been installed and regression-tested.
-- Keeping the statements here commented makes this migration a non-destructive
-- foundation until the beta data layer exists.
-- alter view public.profiles_public set (security_invoker = true);
-- alter view public.profiles_feed set (security_invoker = true);
-- alter view public.actividad_pr_public set (security_invoker = true);
-- alter view public.pr_training_progress_public set (security_invoker = true);
-- alter view public.pr_training_completed_feed set (security_invoker = true);
-- alter view public.pr_unlock_live_contributions set (security_invoker = true);

-- Regression contract for activation:
-- 1) anonymous visitor can read only the intentionally public profile projection;
-- 2) anonymous visitor can read only intentionally public RollerFeed/Unlock data;
-- 3) authenticated students keep current profile/feed/training behaviour;
-- 4) private/deleted activities never leak;
-- 5) inactive profiles stay excluded;
-- 6) Shifter 6K/12K progress remains identical before/after migration;
-- 7) no direct SELECT grant is added to sensitive base tables merely to satisfy a view.

commit;
