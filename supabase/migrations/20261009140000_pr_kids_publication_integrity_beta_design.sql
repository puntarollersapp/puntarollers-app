-- PR Kids Club: publication integrity and audit (beta design, not deployed)
-- Apply only in a separately provisioned staging database after schema review.
create or replace function public.pr_kids_post_is_saturday(value date)
returns boolean language sql immutable as $$
 select extract(isodow from value) = 6
$$;
alter table public.pr_kids_class_posts
 add constraint pr_kids_class_posts_saturday_check
 check (public.pr_kids_post_is_saturday(class_date));
alter table public.pr_kids_class_posts
 add constraint pr_kids_class_posts_publication_state_check
 check (
  (status = 'draft' and published_at is null)
  or (status in ('published','archived') and published_at is not null)
 );
alter table public.pr_kids_class_posts
 add constraint pr_kids_class_posts_skills_limit_check
 check (cardinality(skills) <= 20);
alter table public.pr_kids_class_post_media
 add constraint pr_kids_class_post_media_order_limit_check
 check (sort_order between 0 and 7);
create unique index if not exists pr_kids_class_post_media_unique_order
 on public.pr_kids_class_post_media(post_id,sort_order);
create table if not exists public.pr_kids_class_post_audit (
 id uuid primary key default gen_random_uuid(),
 post_id uuid not null references public.pr_kids_class_posts(id) on delete restrict,
 actor_auth_user_id uuid not null references auth.users(id),
 action text not null check (action in ('created','updated','published','archived','restored','media_added','media_removed','audience_changed')),
 event_at timestamptz not null default now(),
 details jsonb not null default '{}'::jsonb
);
create index if not exists pr_kids_class_post_audit_post_idx
 on public.pr_kids_class_post_audit(post_id,event_at desc);
alter table public.pr_kids_class_post_audit enable row level security;
revoke all on public.pr_kids_class_post_audit from anon, authenticated;
-- The server must append audit events transactionally with post changes.
-- Do not write child names, photos, PINs or private health information to details.
-- This table is append-only at the application layer; restrict DELETE/UPDATE
-- to explicitly authorized maintenance procedures.
