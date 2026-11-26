-- Internal nomination roster: never grant public consent or expose private profile fields.
create or replace function pr_awards_internal.member_can_nominate()
returns boolean language sql stable security definer set search_path='' as $$
 select public.community_is_active_member(public.pr_current_profile_id()) and exists(select 1 from public.profiles p where p.id=public.pr_current_profile_id() and p.role in ('alumno','admin','profesor'))
$$;
revoke all on function pr_awards_internal.member_can_nominate() from public,anon,authenticated;

insert into public.pr_awards_candidates(display_name,source_profile_key,is_public,consent_note,sync_profile_photo)
select trim(concat_ws(' ',nullif(trim(p.nombre),''),nullif(trim(p.apellido),''))),p.id,false,'Directorio interno de postulaciones; publicación pendiente de consentimiento',false
from public.profiles p where p.role='alumno' and length(trim(concat_ws(' ',nullif(trim(p.nombre),''),nullif(trim(p.apellido),'')))) between 2 and 120
on conflict(source_profile_key) where source_profile_key is not null do nothing;

create or replace function pr_awards_internal.sync_student_nomination_candidate()
returns trigger language plpgsql security definer set search_path='' as $$
declare label text;
begin
 if new.role='alumno' and public.pr_awards_nominations_open() then
  label:=trim(concat_ws(' ',nullif(trim(new.nombre),''),nullif(trim(new.apellido),'')));
  if length(label) between 2 and 120 then
   insert into public.pr_awards_candidates(display_name,source_profile_key,is_public,consent_note,sync_profile_photo)
   values(label,new.id,false,'Directorio interno de postulaciones; publicación pendiente de consentimiento',false)
   on conflict(source_profile_key) where source_profile_key is not null do nothing;
  end if;
 end if;
 return new;
end $$;
revoke all on function pr_awards_internal.sync_student_nomination_candidate() from public,anon,authenticated;
drop trigger if exists pr_awards_sync_student_candidate on public.profiles;
create trigger pr_awards_sync_student_candidate after insert or update of role,nombre,apellido on public.profiles for each row execute function pr_awards_internal.sync_student_nomination_candidate();

create or replace function pr_awards_internal.private_nomination_candidate(p_candidate uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select public.pr_awards_nominations_open() and pr_awards_internal.member_can_nominate() and exists(
 select 1 from public.pr_awards_candidates c join public.profiles p on p.id=c.source_profile_key
 where c.id=p_candidate and p.role='alumno' and c.consent_note='Directorio interno de postulaciones; publicación pendiente de consentimiento'
 and not c.is_public and c.consent_recorded_at is null)
$$;
revoke all on function pr_awards_internal.private_nomination_candidate(uuid) from public,anon,authenticated;

create or replace function public.pr_awards_public_directory()
returns table(id uuid,display_name text,public_photo_url text)
language sql stable security definer set search_path='' as $$
 select c.id,c.display_name,case when public.pr_awards_candidate_visible(c.id) then c.public_photo_url else null end
 from public.pr_awards_candidates c
 where public.pr_awards_candidate_visible(c.id) or pr_awards_internal.private_nomination_candidate(c.id)
 order by c.display_name
$$;

-- Public candidates remain governed by existing consent rules. Internal nominations are authenticated only.
do $migration$
declare f record; updated text; n int:=0;
begin
 for f in select p.proname,pg_get_functiondef(p.oid) as def from pg_proc p join pg_namespace s on s.oid=p.pronamespace where s.nspname='public' and p.proname in ('pr_awards_submit_nomination','pr_awards_submit_nomination_batch') loop
  updated:=replace(f.def,'where id=p_candidate and is_public','where id=p_candidate and (is_public or pr_awards_internal.private_nomination_candidate(id))');
  updated:=replace(updated,'where id=v_candidate and is_public','where id=v_candidate and (is_public or pr_awards_internal.private_nomination_candidate(id))');
  if updated=f.def then raise exception 'Unexpected nomination function %',f.proname;end if;
  execute updated;n:=n+1;
 end loop;
 if n<>2 then raise exception 'Expected both nomination entrypoints';end if;
end $migration$;