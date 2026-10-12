-- PR Awards hardening, staging only. Requires base draft migration.
-- Atomic multi-candidate nomination: either all nominations save, or none.
create or replace function public.pr_awards_submit_nomination_batch(
 p_category uuid,
 p_candidates uuid[] default '{}'::uuid[],
 p_manual_name text default null
) returns integer
language plpgsql security definer set search_path = ''
as $$
declare v_open boolean; v_close timestamptz; v_candidate uuid; v_count integer := 0; v_unique uuid[];
begin
 select nomination_open,nominations_close_at into v_open,v_close from public.pr_awards_settings where singleton;
 if not coalesce(v_open,false) or (v_close is not null and now() >= v_close) then
   raise exception 'Nominations are closed';
 end if;
 if not exists(select 1 from public.pr_awards_categories where id=p_category and is_active and not is_automatic) then
   raise exception 'Category unavailable';
 end if;
 select array_agg(distinct x) into v_unique from unnest(coalesce(p_candidates,'{}'::uuid[])) x where x is not null;
 if coalesce(cardinality(v_unique),0)>100 then raise exception 'Too many candidates'; end if;
 if coalesce(cardinality(v_unique),0)=0 and nullif(trim(coalesce(p_manual_name,'')),'') is null then
   raise exception 'Choose at least one candidate';
 end if;
 if p_manual_name is not null and nullif(trim(p_manual_name),'') is not null
    and length(trim(p_manual_name)) not between 2 and 120 then raise exception 'Invalid manual name'; end if;
 foreach v_candidate in array coalesce(v_unique,'{}'::uuid[]) loop
   if not exists(select 1 from public.pr_awards_candidates where id=v_candidate and is_public) then
     raise exception 'Candidate unavailable';
   end if;
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
revoke all on function public.pr_awards_submit_nomination_batch(uuid,uuid[],text) from public;
grant execute on function public.pr_awards_submit_nomination_batch(uuid,uuid[],text) to anon,authenticated;
-- Public votes deliberately have no one-vote-per-person restriction.
-- Admin writes and results access require separate server-verified identity policies.
