-- PR Awards 2026 schema: apply to verified isolated project only.
-- Public can submit nominations and category suggestions, and vote without login.
-- Public never receives vote totals or winner selections.
create extension if not exists pgcrypto;
create table if not exists public.pr_awards_categories (
 id uuid primary key default gen_random_uuid(),
 title text not null unique,
 description text not null default '',
 section text not null default 'community',
 is_automatic boolean not null default false,
 is_active boolean not null default true,
 sort_order integer not null default 0,
 created_at timestamptz not null default now()
);
create table if not exists public.pr_awards_candidates (
 id uuid primary key default gen_random_uuid(),
 display_name text not null check(length(trim(display_name)) between 2 and 120),
 public_photo_url text,
 source_profile_id uuid,
 is_public boolean not null default false,
 created_at timestamptz not null default now()
);
create unique index if not exists pr_awards_candidate_source_unique on public.pr_awards_candidates(source_profile_id) where source_profile_id is not null;
create table if not exists public.pr_awards_suggestions (
 id uuid primary key default gen_random_uuid(),
 proposed_title text not null check(length(trim(proposed_title)) between 3 and 90),
 description text not null check(length(trim(description)) between 5 and 500),
 moderation_status text not null default 'pending' check(moderation_status in ('pending','approved','rejected')),
 created_at timestamptz not null default now()
);
create table if not exists public.pr_awards_nominations (
 id uuid primary key default gen_random_uuid(),
 category_id uuid not null references public.pr_awards_categories(id),
 candidate_id uuid references public.pr_awards_candidates(id),
 manual_name text,
 created_at timestamptz not null default now(),
 check ((candidate_id is not null and manual_name is null) or (candidate_id is null and length(trim(manual_name)) between 2 and 120))
);
create table if not exists public.pr_awards_finalists (
 id uuid primary key default gen_random_uuid(),
 category_id uuid not null references public.pr_awards_categories(id),
 candidate_id uuid not null references public.pr_awards_candidates(id),
 finalist_position smallint not null check(finalist_position between 1 and 3),
 unique(category_id,candidate_id),
 unique(category_id,finalist_position)
);
create table if not exists public.pr_awards_votes (
 id uuid primary key default gen_random_uuid(),
 finalist_id uuid not null references public.pr_awards_finalists(id),
 created_at timestamptz not null default now()
);
create table if not exists public.pr_awards_settings (
 singleton boolean primary key default true check(singleton),
 nomination_open boolean not null default false,
 voting_open boolean not null default false,
 nominations_close_at timestamptz,
 voting_close_at timestamptz,
 results_revealed boolean not null default false,
 updated_at timestamptz not null default now()
);
insert into public.pr_awards_settings(singleton) values(true) on conflict do nothing;
create table if not exists public.pr_awards_winners (
 category_id uuid primary key references public.pr_awards_categories(id),
 finalist_id uuid not null references public.pr_awards_finalists(id),
 decided_at timestamptz not null default now()
);
alter table public.pr_awards_categories enable row level security;
alter table public.pr_awards_candidates enable row level security;
alter table public.pr_awards_suggestions enable row level security;
alter table public.pr_awards_nominations enable row level security;
alter table public.pr_awards_finalists enable row level security;
alter table public.pr_awards_votes enable row level security;
alter table public.pr_awards_settings enable row level security;
alter table public.pr_awards_winners enable row level security;
revoke all on public.pr_awards_categories, public.pr_awards_candidates, public.pr_awards_suggestions, public.pr_awards_nominations, public.pr_awards_finalists, public.pr_awards_votes, public.pr_awards_settings, public.pr_awards_winners from anon, authenticated;
grant select on public.pr_awards_categories, public.pr_awards_finalists to anon, authenticated;
grant select(id,display_name,public_photo_url) on public.pr_awards_candidates to anon, authenticated;
create policy "awards public active categories" on public.pr_awards_categories for select to anon,authenticated using (is_active);
create policy "awards public candidates" on public.pr_awards_candidates for select to anon,authenticated using (is_public);
create policy "awards public finalists" on public.pr_awards_finalists for select to anon,authenticated using (exists(select 1 from public.pr_awards_categories c where c.id=category_id and c.is_active));
-- SECURITY DEFINER functions deliberately expose no private aggregate or winner data.
create or replace function public.pr_awards_submit_suggestion(p_title text,p_description text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_open boolean;
begin
 select nomination_open into v_open from public.pr_awards_settings where singleton;
 if not coalesce(v_open,false) then raise exception 'Suggestions are closed'; end if;
 if length(trim(coalesce(p_title,''))) not between 3 and 90 or length(trim(coalesce(p_description,''))) not between 5 and 500 then raise exception 'Invalid suggestion'; end if;
 insert into public.pr_awards_suggestions(proposed_title,description) values(trim(p_title),trim(p_description)) returning id into v_id;
 return v_id;
end $$;
create or replace function public.pr_awards_submit_nomination(p_category uuid,p_candidate uuid,p_manual_name text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_open boolean;
begin
 select nomination_open into v_open from public.pr_awards_settings where singleton;
 if not coalesce(v_open,false) then raise exception 'Nominations are closed'; end if;
 if not exists(select 1 from public.pr_awards_categories where id=p_category and is_active and not is_automatic) then raise exception 'Category unavailable'; end if;
 if p_candidate is not null then
   if p_manual_name is not null or not exists(select 1 from public.pr_awards_candidates where id=p_candidate and is_public) then raise exception 'Candidate unavailable'; end if;
 else
   if length(trim(coalesce(p_manual_name,''))) not between 2 and 120 then raise exception 'Invalid candidate name'; end if;
 end if;
 insert into public.pr_awards_nominations(category_id,candidate_id,manual_name) values(p_category,p_candidate,case when p_candidate is null then trim(p_manual_name) else null end) returning id into v_id;
 return v_id;
end $$;
create or replace function public.pr_awards_cast_vote(p_finalist uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_open boolean; v_deadline timestamptz;
begin
 select voting_open,voting_close_at into v_open,v_deadline from public.pr_awards_settings where singleton;
 if not coalesce(v_open,false) or (v_deadline is not null and now() >= v_deadline) then raise exception 'Voting is closed'; end if;
 if not exists(select 1 from public.pr_awards_finalists f join public.pr_awards_categories c on c.id=f.category_id where f.id=p_finalist and c.is_active and not c.is_automatic) then raise exception 'Finalist unavailable'; end if;
 insert into public.pr_awards_votes(finalist_id) values(p_finalist) returning id into v_id;
 return v_id;
end $$;
revoke all on function public.pr_awards_submit_suggestion(text,text),public.pr_awards_submit_nomination(uuid,uuid,text),public.pr_awards_cast_vote(uuid) from public;
grant execute on function public.pr_awards_submit_suggestion(text,text),public.pr_awards_submit_nomination(uuid,uuid,text),public.pr_awards_cast_vote(uuid) to anon,authenticated;
-- Before activation: verify policies, grant admin-only access, establish moderation,
-- real directory consent, abuse resilience, and source-of-truth kilometer calculations.
