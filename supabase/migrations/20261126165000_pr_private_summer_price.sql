-- New private lesson registrations only; preserve all existing saved prices.
do $migration$
declare f record; updated text; n int:=0;
begin
 for f in select p.oid,p.proname,pg_get_functiondef(p.oid) as def from pg_proc p join pg_namespace s on s.oid=p.pronamespace where s.nspname='public' and p.proname in ('registrar_inscripcion_2026_v3','registrar_inscripcion_2026_v4') and p.prokind='f' loop
   updated:=replace(replace(f.def,'v_base:=2900;','v_base:=3200;'),'v_monto := 2900;','v_monto := 3200;');
   if updated=f.def then raise exception 'Unexpected registration function: %', f.proname;end if;
   execute updated;n:=n+1;
 end loop;
 if n<>2 then raise exception 'Expected both registration entrypoints';end if;
end $migration$;