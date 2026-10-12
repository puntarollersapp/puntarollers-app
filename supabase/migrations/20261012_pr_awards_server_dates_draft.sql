-- Apply after the base awards schema and the public-status migration.
-- Server-side time limits prevent manual toggles from opening awards early.
create or replace function public.pr_awards_nominations_open()
returns boolean language sql stable security definer set search_path=''
as $$
 select exists(
  select 1 from public.pr_awards_settings s
  where s.singleton and s.nomination_open
  and now() >= timestamptz '2026-11-01 00:00:00-03'
  and now() < timestamptz '2026-12-01 00:00:00-03'
  and (s.nominations_close_at is null or now()<s.nominations_close_at)
 )
$$;
create or replace function public.pr_awards_voting_open()
returns boolean language sql stable security definer set search_path=''
as $$
 select exists(
  select 1 from public.pr_awards_settings s
  where s.singleton and s.voting_open
  and now() >= timestamptz '2026-12-01 00:00:00-03'
  and now() < timestamptz '2026-12-21 00:00:00-03'
  and (s.voting_close_at is null or now()<s.voting_close_at)
 )
$$;
revoke all on function public.pr_awards_nominations_open(), public.pr_awards_voting_open() from public;
grant execute on function public.pr_awards_nominations_open(),public.pr_awards_voting_open() to anon,authenticated;
-- Enforce server time on all write RPCs, including legacy single nomination.
create or replace function public.pr_awards_submit_nomination(p_category uuid,p_candidate uuid,p_manual_name text default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
 if not public.pr_awards_nominations_open() then raise exception 'Nominations are closed'; end if;
 if not exists(select 1 from public.pr_awards_categories where id=p_category and is_active and not is_automatic) then raise exception 'Category unavailable'; end if;
 if p_candidate is not null then
  if p_manual_name is not null or not exists(select 1 from public.pr_awards_candidates where id=p_candidate and is_public) then raise exception 'Candidate unavailable'; end if;
 else
  if length(trim(coalesce(p_manual_name,''))) not between 2 and 120 then raise exception 'Invalid candidate name'; end if;
 end if;
 insert into public.pr_awards_nominations(category_id,candidate_id,manual_name)
 values(p_category,p_candidate,case when p_candidate is null then trim(p_manual_name) else null end) returning id into v_id;
 return v_id;
end $$;
create or replace function public.pr_awards_submit_suggestion(p_title text,p_description text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
 if not public.pr_awards_nominations_open() then raise exception 'Suggestions are closed'; end if;
 if length(trim(coalesce(p_title,''))) not between 3 and 90 or length(trim(coalesce(p_description,''))) not between 5 and 500 then raise exception 'Invalid suggestion'; end if;
 insert into public.pr_awards_suggestions(proposed_title,description)
 values(trim(p_title),trim(p_description)) returning id into v_id;
 return v_id;
end $$;
create or replace function public.pr_awards_cast_vote(p_finalist uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
 if not public.pr_awards_voting_open() then raise exception 'Voting is closed'; end if;
 if not exists(select 1 from public.pr_awards_finalists f join public.pr_awards_categories c on c.id=f.category_id where f.id=p_finalist and c.is_active and not c.is_automatic) then raise exception 'Finalist unavailable'; end if;
 insert into public.pr_awards_votes(finalist_id) values(p_finalist) returning id into v_id;
 return v_id;
end $$;
create or replace function public.pr_awards_submit_nomination_batch(
 p_category uuid,p_candidates uuid[] default '{}'::uuid[],p_manual_name text default null
) returns integer language plpgsql security definer set search_path='' as $$
declare v_candidate uuid;v_count integer:=0;v_unique uuid[];
begin
 if not public.pr_awards_nominations_open() then raise exception 'Nominations are closed'; end if;
 if not exists(select 1 from public.pr_awards_categories where id=p_category and is_active and not is_automatic) then raise exception 'Category unavailable'; end if;
 select array_agg(distinct x) into v_unique from unnest(coalesce(p_candidates,'{}'::uuid[])) x where x is not null;
 if coalesce(cardinality(v_unique),0)>100 then raise exception 'Too many candidates'; end if;
 if coalesce(cardinality(v_unique),0)=0 and nullif(trim(coalesce(p_manual_name,'')),'') is null then raise exception 'Choose at least one candidate'; end if;
 if p_manual_name is not null and nullif(trim(p_manual_name),'') is not null and length(trim(p_manual_name)) not between 2 and 120 then raise exception 'Invalid manual name'; end if;
 foreach v_candidate in array coalesce(v_unique,'{}'::uuid[]) loop
  if not exists(select 1 from public.pr_awards_candidates where id=v_candidate and is_public) then raise exception 'Candidate unavailable'; end if;
 end loop;
 foreach v_candidate in array coalesce(v_unique,'{}'::uuid[]) loop
  insert into public.pr_awards_nominations(category_id,candidate_id) values(p_category,v_candidate);
  v_count:=v_count+1;
 end loop;
 if nullif(trim(coalesce(p_manual_name,'')),'') is not null then
  insert into public.pr_awards_nominations(category_id,manual_name) values(p_category,trim(p_manual_name));
  v_count:=v_count+1;
 end if;
 return v_count;
end $$;
-- Finalist public read is embargoed until the server calendar allows voting.
create or replace function public.pr_awards_public_finalists_open()
returns boolean language sql stable security definer set search_path=''
as $$select public.pr_awards_voting_open()$$;
