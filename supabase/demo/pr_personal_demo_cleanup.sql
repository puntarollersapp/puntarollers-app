-- Removes only the controlled PR Personal demo data created for preview E2E.
-- The public reservation switch is intentionally left unchanged.
begin;

delete from public.pr_personal_reservas
where alumno_id = 'pr_personal_demo_v1';

delete from public.clases_particulares_historial
where alumno_id = 'pr_personal_demo_v1';

delete from public.cuponeras_particulares
where alumno_id = 'pr_personal_demo_v1';

delete from public.pr_personal_disponibilidad
where nota_interna = '[DEMO PR PERSONAL]';

delete from public.profiles
where id = 'pr_personal_demo_v1';

commit;
