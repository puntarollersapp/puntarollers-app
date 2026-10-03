-- RollerMap Explorer private preview baseline.
-- Idempotent by design because the preview database was prototyped before this file was added.

create table if not exists public.pr_rollermap_routes (
 id uuid primary key default gen_random_uuid(),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 created_by text null references public.profiles(id) on delete set null, guest_name text null,
 name text not null check(char_length(name) between 3 and 100), description text null,
 route_type text not null default 'calle' check(route_type in ('calle','rambla','ciclovia','parque','pista','circuito')),
 level text not null default 'intermedio' check(level in ('inicial','intermedio','avanzado')),
 surface text null, traffic text null, lighting text null, city text null, department text null, country text not null default 'Uruguay',
 path jsonb not null default '[]'::jsonb, distance_m integer null check(distance_m is null or distance_m>=0),
 hazards text[] not null default '{}', photo_url text null,
 status text not null default 'pending' check(status in ('pending','approved','rejected','archived')),
 moderation_note text null, approved_at timestamptz null, approved_by text null references public.profiles(id) on delete set null,
 last_confirmed_at timestamptz null,
 check(created_by is not null or nullif(btrim(guest_name),'') is not null)
);
create index if not exists pr_rollermap_routes_status_idx on public.pr_rollermap_routes(status,created_at desc);
create index if not exists pr_rollermap_routes_creator_idx on public.pr_rollermap_routes(created_by,created_at desc);
alter table public.pr_rollermap_routes enable row level security;
grant select,insert on public.pr_rollermap_routes to anon,authenticated; grant update,delete on public.pr_rollermap_routes to authenticated;
drop policy if exists explorer_routes_public_read on public.pr_rollermap_routes;
drop policy if exists explorer_routes_auth_insert on public.pr_rollermap_routes;
drop policy if exists explorer_routes_guest_insert on public.pr_rollermap_routes;
drop policy if exists explorer_routes_admin_update on public.pr_rollermap_routes;
drop policy if exists explorer_routes_admin_delete on public.pr_rollermap_routes;
create policy explorer_routes_public_read on public.pr_rollermap_routes for select using(status='approved' or public.soy_admin() or created_by=(select id from public.profiles where auth_user_id=auth.uid() limit 1));
create policy explorer_routes_auth_insert on public.pr_rollermap_routes for insert to authenticated with check(status='pending' and created_by=(select id from public.profiles where auth_user_id=auth.uid() limit 1));
create policy explorer_routes_guest_insert on public.pr_rollermap_routes for insert to anon with check(status='pending' and created_by is null and nullif(btrim(guest_name),'') is not null);
create policy explorer_routes_admin_update on public.pr_rollermap_routes for update to authenticated using(public.soy_admin()) with check(public.soy_admin());
create policy explorer_routes_admin_delete on public.pr_rollermap_routes for delete to authenticated using(public.soy_admin());

create table if not exists public.pr_rollermap_route_photos (
 id uuid primary key default gen_random_uuid(), route_id uuid not null references public.pr_rollermap_routes(id) on delete cascade,
 created_at timestamptz not null default now(), created_by text null references public.profiles(id) on delete set null,
 image_url text not null, storage_path text not null, caption text null, sort_order integer not null default 0,
 status text not null default 'pending' check(status in ('pending','approved','rejected'))
);
create index if not exists pr_rollermap_route_photos_route_idx on public.pr_rollermap_route_photos(route_id,sort_order,created_at);
alter table public.pr_rollermap_route_photos enable row level security; grant select,insert,update on public.pr_rollermap_route_photos to authenticated;
drop policy if exists explorer_route_photos_read on public.pr_rollermap_route_photos;
drop policy if exists explorer_route_photos_insert on public.pr_rollermap_route_photos;
drop policy if exists explorer_route_photos_admin_update on public.pr_rollermap_route_photos;
create policy explorer_route_photos_read on public.pr_rollermap_route_photos for select to authenticated using(public.soy_admin() or created_by=(select id from public.profiles where auth_user_id=auth.uid() limit 1) or (status='approved' and exists(select 1 from public.pr_rollermap_routes r where r.id=route_id and r.status='approved')));
create policy explorer_route_photos_insert on public.pr_rollermap_route_photos for insert to authenticated with check(status='pending' and created_by=(select id from public.profiles where auth_user_id=auth.uid() limit 1) and exists(select 1 from public.pr_rollermap_routes r where r.id=route_id and r.created_by=(select id from public.profiles where auth_user_id=auth.uid() limit 1)));
create policy explorer_route_photos_admin_update on public.pr_rollermap_route_photos for update to authenticated using(public.soy_admin()) with check(public.soy_admin());

create table if not exists public.pr_rollermap_route_comments (
 id uuid primary key default gen_random_uuid(), route_id uuid not null references public.pr_rollermap_routes(id) on delete cascade,
 created_at timestamptz not null default now(), created_by text null references public.profiles(id) on delete set null, guest_name text null,
 body text not null check(char_length(body) between 1 and 800), parent_id uuid null references public.pr_rollermap_route_comments(id) on delete cascade,
 status text not null default 'visible' check(status in ('visible','hidden','pending')),
 check(created_by is not null or nullif(btrim(guest_name),'') is not null)
);
alter table public.pr_rollermap_route_comments enable row level security; grant select,insert,update on public.pr_rollermap_route_comments to anon,authenticated;
drop policy if exists explorer_comments_read on public.pr_rollermap_route_comments;
drop policy if exists explorer_comments_auth_insert on public.pr_rollermap_route_comments;
drop policy if exists explorer_comments_guest_insert on public.pr_rollermap_route_comments;
drop policy if exists explorer_comments_admin_update on public.pr_rollermap_route_comments;
create policy explorer_comments_read on public.pr_rollermap_route_comments for select using((status='visible' and exists(select 1 from public.pr_rollermap_routes r where r.id=route_id and r.status='approved')) or public.soy_admin());
create policy explorer_comments_auth_insert on public.pr_rollermap_route_comments for insert to authenticated with check(created_by=(select id from public.profiles where auth_user_id=auth.uid() limit 1) and guest_name is null and status='visible' and exists(select 1 from public.pr_rollermap_routes r where r.id=route_id and r.status='approved'));
create policy explorer_comments_guest_insert on public.pr_rollermap_route_comments for insert to anon with check(status='pending' and created_by is null and nullif(btrim(guest_name),'') is not null);
create policy explorer_comments_admin_update on public.pr_rollermap_route_comments for update to authenticated using(public.soy_admin()) with check(public.soy_admin());

create table if not exists public.pr_rollermap_route_ratings (
 id uuid primary key default gen_random_uuid(), route_id uuid not null references public.pr_rollermap_routes(id) on delete cascade,
 created_at timestamptz not null default now(), created_by text null references public.profiles(id) on delete cascade, guest_key text null,
 score smallint not null check(score between 1 and 5), check(created_by is not null or nullif(btrim(guest_key),'') is not null)
);
create unique index if not exists pr_rollermap_rating_user_uq on public.pr_rollermap_route_ratings(route_id,created_by) where created_by is not null;
create unique index if not exists pr_rollermap_rating_guest_uq on public.pr_rollermap_route_ratings(route_id,guest_key) where guest_key is not null;
alter table public.pr_rollermap_route_ratings enable row level security; grant select,insert,update,delete on public.pr_rollermap_route_ratings to anon,authenticated;
drop policy if exists explorer_ratings_read on public.pr_rollermap_route_ratings;
drop policy if exists explorer_ratings_auth_insert on public.pr_rollermap_route_ratings;
drop policy if exists explorer_ratings_guest_insert on public.pr_rollermap_route_ratings;
drop policy if exists explorer_ratings_owner_update on public.pr_rollermap_route_ratings;
drop policy if exists explorer_ratings_owner_delete on public.pr_rollermap_route_ratings;
create policy explorer_ratings_read on public.pr_rollermap_route_ratings for select using(exists(select 1 from public.pr_rollermap_routes r where r.id=route_id and r.status='approved') or public.soy_admin());
create policy explorer_ratings_auth_insert on public.pr_rollermap_route_ratings for insert to authenticated with check(created_by=(select id from public.profiles where auth_user_id=auth.uid() limit 1) and guest_key is null and exists(select 1 from public.pr_rollermap_routes r where r.id=route_id and r.status='approved'));
create policy explorer_ratings_guest_insert on public.pr_rollermap_route_ratings for insert to anon with check(created_by is null and nullif(btrim(guest_key),'') is not null and exists(select 1 from public.pr_rollermap_routes r where r.id=route_id and r.status='approved'));
create policy explorer_ratings_owner_update on public.pr_rollermap_route_ratings for update to authenticated using(created_by=(select id from public.profiles where auth_user_id=auth.uid() limit 1)) with check(created_by=(select id from public.profiles where auth_user_id=auth.uid() limit 1));
create policy explorer_ratings_owner_delete on public.pr_rollermap_route_ratings for delete to authenticated using(created_by=(select id from public.profiles where auth_user_id=auth.uid() limit 1));

create table if not exists public.pr_rollermap_route_actions (
 id uuid primary key default gen_random_uuid(), route_id uuid not null references public.pr_rollermap_routes(id) on delete cascade,
 created_at timestamptz not null default now(), created_by text not null references public.profiles(id) on delete cascade,
 action text not null check(action in ('save','done')), unique(route_id,created_by,action)
);
alter table public.pr_rollermap_route_actions enable row level security; grant select,insert,delete on public.pr_rollermap_route_actions to authenticated;
drop policy if exists explorer_actions_own on public.pr_rollermap_route_actions;
create policy explorer_actions_own on public.pr_rollermap_route_actions for all to authenticated using(created_by=(select id from public.profiles where auth_user_id=auth.uid() limit 1)) with check(created_by=(select id from public.profiles where auth_user_id=auth.uid() limit 1));

create table if not exists public.pr_rollermap_route_reports (
 id uuid primary key default gen_random_uuid(), route_id uuid not null references public.pr_rollermap_routes(id) on delete cascade,
 created_at timestamptz not null default now(), created_by text null references public.profiles(id) on delete set null, guest_name text null,
 kind text not null, detail text null, status text not null default 'pending' check(status in ('pending','reviewed','dismissed'))
);
alter table public.pr_rollermap_route_reports enable row level security; grant insert on public.pr_rollermap_route_reports to anon,authenticated; grant select,update on public.pr_rollermap_route_reports to authenticated;
drop policy if exists explorer_reports_auth_insert on public.pr_rollermap_route_reports;
drop policy if exists explorer_reports_guest_insert on public.pr_rollermap_route_reports;
drop policy if exists explorer_reports_admin_read on public.pr_rollermap_route_reports;
drop policy if exists explorer_reports_admin_update on public.pr_rollermap_route_reports;
create policy explorer_reports_auth_insert on public.pr_rollermap_route_reports for insert to authenticated with check(created_by=(select id from public.profiles where auth_user_id=auth.uid() limit 1) and guest_name is null and exists(select 1 from public.pr_rollermap_routes r where r.id=route_id and r.status='approved'));
create policy explorer_reports_guest_insert on public.pr_rollermap_route_reports for insert to anon with check(created_by is null and nullif(btrim(guest_name),'') is not null and exists(select 1 from public.pr_rollermap_routes r where r.id=route_id and r.status='approved'));
create policy explorer_reports_admin_read on public.pr_rollermap_route_reports for select to authenticated using(public.soy_admin());
create policy explorer_reports_admin_update on public.pr_rollermap_route_reports for update to authenticated using(public.soy_admin()) with check(public.soy_admin());

drop policy if exists explorer_rollermap_image_upload on storage.objects;
drop policy if exists explorer_rollermap_image_owner_delete on storage.objects;
create policy explorer_rollermap_image_upload on storage.objects for insert to authenticated with check(bucket_id='pr-rollermap-images' and (storage.foldername(name))[1]=(select auth.uid()::text));
create policy explorer_rollermap_image_owner_delete on storage.objects for delete to authenticated using(bucket_id='pr-rollermap-images' and owner_id=(select auth.uid()::text) and (storage.foldername(name))[1]=(select auth.uid()::text));
