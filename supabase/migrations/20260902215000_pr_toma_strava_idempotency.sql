-- Una actividad de Strava solo puede originar una toma activa.
-- El índice parcial permite conservar historial eliminado sin romper la
-- idempotencia de nuevas sincronizaciones.
create unique index if not exists uq_pr_performance_tomas_strava_activity
on public.pr_performance_tomas (observacion_original_id)
where eliminado = false
  and origen = 'strava'
  and observacion_original_id is not null;
