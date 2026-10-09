-- PR Kids Club · propuesta de almacenamiento privado (NO aplicada a producción)
-- Revisar contra los IDs y políticas reales antes de ejecutar en un entorno de pruebas.
create table if not exists public.pr_kids_class_posts (
 id uuid primary key default gen_random_uuid(),
 class_date date not null,
 title text not null check (char_length(trim(title)) between 4 and 100),
 summary text not null check (char_length(trim(summary)) between 12 and 2000),
 teacher_note text,
 skills text[] not null default '{}',
 author_auth_user_id uuid not null references auth.users(id),
 author_display_name text not null,
 status text not null default 'draft' check (status in ('draft','published','archived')),
 published_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists pr_kids_class_posts_date_idx on public.pr_kids_class_posts (class_date desc, created_at desc);
create table if not exists public.pr_kids_class_post_media (
 id uuid primary key default gen_random_uuid(),
 post_id uuid not null references public.pr_kids_class_posts(id) on delete cascade,
 storage_path text not null unique,
 content_type text not null check (content_type in ('image/jpeg','image/png','image/webp')),
 sort_order integer not null default 0 check (sort_order >= 0),
 created_at timestamptz not null default now()
);
create index if not exists pr_kids_class_post_media_post_idx on public.pr_kids_class_post_media(post_id,sort_order);
-- RLS closed by default. No direct client grants in this migration.
-- A privileged Edge Function must validate professor roles for writes,
-- approved guardian-child relations for reads, and per-child media permissions.
alter table public.pr_kids_class_posts enable row level security;
alter table public.pr_kids_class_post_media enable row level security;
revoke all on public.pr_kids_class_posts from anon, authenticated;
revoke all on public.pr_kids_class_post_media from anon, authenticated;
-- Storage bucket must be PRIVATE. Never expose public object URLs.
-- Signed URLs must be short-lived, issued only after authorization.
-- Do not add a broad guardian SELECT policy: posts may include photos of
-- multiple children and must be audience-scoped before publication.
-- Before deployment: implement explicit post_audience child/group mapping,
-- consent checks, administrative review, audit trail, and deletion policy.
