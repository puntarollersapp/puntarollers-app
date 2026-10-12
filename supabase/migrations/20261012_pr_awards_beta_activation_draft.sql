-- Apply ONLY after all PR Awards schema/security migrations have been reviewed
-- and installed on the verified isolated staging Supabase project.
-- Activates nomination and suggestion RPCs for early invited testing.
-- Voting and public winner reveal remain disabled.
update public.pr_awards_settings
set nomination_open=true,
    voting_open=false,
    results_revealed=false,
    nominations_close_at=timestamptz '2026-12-01 00:00:00-03',
    voting_close_at=timestamptz '2026-12-21 00:00:00-03',
    updated_at=now()
where singleton=true;
-- IMPORTANT: This is not an invitation/access-control system.
-- Anyone who learns the public beta URL may submit anonymously while open.
-- Use a genuinely isolated database for tests and keep it unlinked publicly.
-- Do not carry beta submissions into production unless explicitly approved.
