-- PR Kids Club · diseño de autorización de publicaciones (NO ejecutar sin revisión)
-- Each post must be scoped to children whose guardians are explicitly approved.
create table if not exists public.pr_kids_class_post_audience (
 post_id uuid not null references public.pr_kids_class_posts(id) on delete cascade,
 child_id uuid not null references public.pr_kids_children(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key (post_id, child_id)
);
create index if not exists pr_kids_class_post_audience_child_idx on public.pr_kids_class_post_audience(child_id,post_id);
alter table public.pr_kids_class_post_audience enable row level security;
revoke all on public.pr_kids_class_post_audience from anon, authenticated;
-- Sensitive photo visibility MUST be narrower than post visibility.
-- A child appearing in a photo requires verified consent for that specific
-- use; a guardian with access to one child must not automatically gain
-- access to all photos of the group.
create table if not exists public.pr_kids_class_media_subjects (
 media_id uuid not null references public.pr_kids_class_post_media(id) on delete cascade,
 child_id uuid not null references public.pr_kids_children(id) on delete cascade,
 consent_verified_by uuid references auth.users(id),
 consent_verified_at timestamptz,
 primary key (media_id,child_id)
);
alter table public.pr_kids_class_media_subjects enable row level security;
revoke all on public.pr_kids_class_media_subjects from anon, authenticated;
-- The API must enforce:
-- 1. A post is visible only if published and audience includes a child
--    linked to the requesting guardian through an active, approved relation.
-- 2. Every photo is visible only after every identifiable child's consent
--    has been checked; signed media URLs must be short-lived.
-- 3. Only authorized professor/admin accounts may create or publish posts.
-- 4. The author ID and display name must come from the authenticated session,
--    never from client-supplied strings.
-- 5. Archiving a post preserves its audit history; do not hard-delete silently.
