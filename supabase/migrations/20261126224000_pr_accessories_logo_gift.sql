-- Prepare the universal PR logo gift; RLS hides it until release.
insert into public.pr_accessory_grants(profile_id,accessory_code,source)
select id,'pr-logo','launch_gift' from public.profiles where role='alumno' or participa_como_alumno=true on conflict do nothing;
