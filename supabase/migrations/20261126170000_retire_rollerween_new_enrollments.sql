-- Retire the expired RollerWeen campaign for NEW enrollments. Preserve prior entitlements and saved prices.
do $migration$
declare f record; updated text;
begin
 select pg_get_functiondef('public.validate_pr_referral_code(text)'::regprocedure) as def into f;
 updated:=replace(f.def, 'from norm where code=''ROLLERWEENPR''', 'from norm where false');
 if updated=f.def then raise exception 'Unexpected referral validator';end if;
 execute updated;
 select pg_get_functiondef('public.registrar_inscripcion_2026_v4(text,text,integer,text,text,text,text,text,text,text,boolean,text)'::regprocedure) as def into f;
 updated:=replace(f.def, 'if v_ref_code is not null then if v_ref_code=', 'if v_ref_code=''ROLLERWEENPR'' then raise exception ''CODIGO_AMIGOS_PR_INVALIDO''; end if; if v_ref_code is not null then if v_ref_code=');
 if updated=f.def then raise exception 'Unexpected registration function';end if;
 execute updated;
end $migration$;