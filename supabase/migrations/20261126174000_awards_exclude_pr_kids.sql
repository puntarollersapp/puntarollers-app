-- PR Awards excludes PR Kids, whose treasury-linked profiles also have role alumno.
-- Preserve prior candidate ids, nominations, public consent rules and publication dates.
create or replace function pr_awards_internal.candidate_is_kid(p_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.pr_awards_candidates c join public.pr_kids_children k on k.treasury_profile_id=c.source_profile_key where c.id=p_id)
$$;
revoke all on function pr_awards_internal.candidate_is_kid(uuid) from public,anon,authenticated;

create or replace function pr_awards_internal.private_nomination_candidate(p_candidate uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select public.pr_awards_nominations_open() and pr_awards_internal.member_can_nominate() and exists(
 select 1 from public.pr_awards_candidates c join public.profiles p on p.id=c.source_profile_key
 where c.id=p_candidate and p.role='alumno' and not pr_awards_internal.candidate_is_kid(c.id))
$$;

create or replace function pr_awards_internal.manual_name_is_kid(p_name text)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.pr_kids_children k join public.profiles p on p.id=k.treasury_profile_id
 where lower(regexp_replace(trim(coalesce(p_name,'')),'[[:space:]]+',' ','g')) in
 (lower(regexp_replace(trim(k.nombre_confirmado),'[[:space:]]+',' ','g')),lower(regexp_replace(trim(concat_ws(' ',p.nombre,p.apellido)),'[[:space:]]+',' ','g'))))
 and not exists(select 1 from public.profiles p where p.role='alumno' and not exists(select 1 from public.pr_kids_children k where k.treasury_profile_id=p.id)
 and lower(regexp_replace(trim(concat_ws(' ',p.nombre,p.apellido)),'[[:space:]]+',' ','g'))=lower(regexp_replace(trim(coalesce(p_name,'')),'[[:space:]]+',' ','g')))
$$;
revoke all on function pr_awards_internal.manual_name_is_kid(text) from public,anon,authenticated;

do $migration$
declare f record; updated text; n int:=0;
begin
 for f in select p.proname,pg_get_functiondef(p.oid) def from pg_proc p join pg_namespace s on s.oid=p.pronamespace where s.nspname='public' and p.proname in ('pr_awards_candidate_visible','pr_awards_submit_nomination','pr_awards_submit_nomination_batch','pr_awards_resolve_manual') loop
  updated:=f.def;
  if f.proname='pr_awards_candidate_visible' then
   updated:=replace(updated,'where p.id=p_candidate and p.is_public','where p.id=p_candidate and not pr_awards_internal.candidate_is_kid(p.id) and p.is_public');
  elsif f.proname='pr_awards_resolve_manual' then
   updated:=replace(updated,'where id=p_candidate and is_public','where id=p_candidate and not pr_awards_internal.candidate_is_kid(id) and is_public');
  else
   updated:=replace(updated,'and (is_public or pr_awards_internal.private_nomination_candidate(id))','and not pr_awards_internal.candidate_is_kid(id) and (is_public or pr_awards_internal.private_nomination_candidate(id))');
   updated:=replace(updated,'if not public.pr_awards_nominations_open() then raise exception ''Nominations are closed''; end if;', 'if not public.pr_awards_nominations_open() then raise exception ''Nominations are closed''; end if; if pr_awards_internal.manual_name_is_kid(p_manual_name) then raise exception ''Candidate unavailable''; end if;');
  end if;
  if updated=f.def then raise exception 'Unexpected function %',f.proname;end if;
  execute updated;n:=n+1;
 end loop;
 if n<>4 then raise exception 'Expected four Awards functions';end if;
end $migration$;
