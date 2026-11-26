-- New adult group enrollments only. Existing registration amounts and treasury periods unchanged.
do $migration$
declare f record; updated text; n int:=0;
begin
 for f in select p.proname,pg_get_functiondef(p.oid) as def from pg_proc p join pg_namespace s on s.oid=p.pronamespace where s.nspname='public' and p.proname in ('registrar_inscripcion_2026_v3','registrar_inscripcion_2026_v4') and p.prokind='f' loop
  updated:=replace(replace(f.def,'v_base:=1500;','v_base:=1700;'),'v_monto := 1500;','v_monto := 1700;');
  if updated=f.def then raise exception 'Unexpected registration function: %',f.proname;end if;
  execute updated;n:=n+1;
 end loop;
 if n<>2 then raise exception 'Expected two registration entrypoints';end if;
end $migration$;