-- Staged foundation only. Do NOT deploy until community RPC, media delivery and RLS are updated together.
-- Existing posts retain their original friends-only audience.
alter table public.community_posts
  add column if not exists visibility text not null default 'friends';
alter table public.community_posts
  drop constraint if exists community_posts_visibility_check;
alter table public.community_posts
  add constraint community_posts_visibility_check
  check (visibility in ('friends','members'));
comment on column public.community_posts.visibility is
  'friends = legacy audience; members = authenticated Punta Rollers members. No existing post is promoted automatically.';
-- Future member-wide RPCs must check pr_current_profile_id() and visibility.
-- Do not enable members publishing until public storage buckets are migrated
-- and post interaction RPCs enforce the same visibility predicate.
