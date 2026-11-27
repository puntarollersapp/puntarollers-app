-- Public aggregate history only; the original singleton and its cron remain unchanged.
CREATE TABLE IF NOT EXISTS public.pr_home_monthly_history (
 month_start date PRIMARY KEY CHECK (extract(day from month_start)=1),
 km numeric, outings bigint, participants bigint,
 weekly jsonb NOT NULL DEFAULT '[]'::jsonb,
 students_only boolean NOT NULL DEFAULT false,
 updated_at timestamptz NOT NULL,
 activated_at timestamptz
);
ALTER TABLE public.pr_home_monthly_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.pr_home_monthly_history FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.pr_home_monthly_history TO anon,authenticated;
CREATE POLICY pr_home_history_read ON public.pr_home_monthly_history FOR SELECT TO anon,authenticated
 USING (month_start BETWEEN (date_trunc('month',now() AT TIME ZONE 'America/Montevideo')-interval '1 month')::date AND date_trunc('month',now() AT TIME ZONE 'America/Montevideo')::date);
CREATE OR REPLACE FUNCTION public.pr_home_should_activate(day_of_month integer, distance_km numeric, ride_count bigint, participant_count bigint, previous_available boolean)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path='' AS $$
 SELECT day_of_month >= 22 OR (coalesce(participant_count,0)>=3 AND
  (NOT previous_available OR (day_of_month>=8 AND coalesce(distance_km,0)>=150 AND (coalesce(ride_count,0)>=20 OR participant_count>=8))));
$$;
REVOKE ALL ON FUNCTION public.pr_home_should_activate(integer,numeric,bigint,bigint,boolean) FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.pr_home_refresh_monthly_history()
RETURNS void LANGUAGE plpgsql SET search_path='' AS $$
DECLARE
 today date := (now() AT TIME ZONE 'America/Montevideo')::date;
 current_month date := date_trunc('month',today)::date;
 previous_month date := (current_month-interval '1 month')::date;
 period date;
 last_day date;
 previous_available boolean;
BEGIN
 PERFORM pg_advisory_xact_lock(614251702);
 FOREACH period IN ARRAY ARRAY[previous_month,current_month] LOOP
  last_day := least(today,(period+interval '1 month - 1 day')::date);
  WITH rides AS (
    SELECT a.alumno_id,a.distancia_metros,
      floor((extract(day from a.fecha_inicio AT TIME ZONE 'America/Montevideo')-1)/7)::int+1 AS bucket,
      coalesce(p.role='alumno' AND p.es_profesor IS NOT TRUE AND p.es_tesoreria IS NOT TRUE,false) AS is_student
    FROM public.pr_inline_skate_public_activities a
    LEFT JOIN public.profiles p ON p.id::text=a.alumno_id
    WHERE a.fecha_inicio >= (period::timestamp AT TIME ZONE 'America/Montevideo')
      AND a.fecha_inicio < ((period+interval '1 month') AT TIME ZONE 'America/Montevideo')
      AND a.fecha_inicio <= now() AND a.visible_feed IS TRUE AND a.es_privada IS FALSE
      AND a.eliminada IS FALSE AND a.fuente='strava' AND a.distancia_metros>0 AND a.alumno_id IS NOT NULL
  ), totals AS (
    SELECT count(DISTINCT alumno_id) AS participants,count(*) AS outings,
      coalesce(round(sum(distancia_metros)/1000,1),0) AS km,coalesce(bool_and(is_student),false) AS students_only FROM rides
  ), buckets AS (
    SELECT n AS bucket,count(DISTINCT r.alumno_id) AS participants,count(r.alumno_id) AS outings,
      coalesce(round(sum(r.distancia_metros)/1000,1),0) AS km
    FROM generate_series(1,((extract(day from last_day)::int-1)/7)+1) n LEFT JOIN rides r ON r.bucket=n GROUP BY n
  ), chart AS (
    SELECT CASE WHEN bool_and(participants>=3 OR outings=0) THEN jsonb_agg(jsonb_build_object('bucket',bucket,'km',km) ORDER BY bucket) ELSE '[]'::jsonb END AS weekly FROM buckets
  )
  INSERT INTO public.pr_home_monthly_history(month_start,km,outings,participants,weekly,students_only,updated_at)
  SELECT period,CASE WHEN participants>=3 THEN km END,CASE WHEN participants>=3 THEN outings END,CASE WHEN participants>=3 THEN participants END,
    CASE WHEN participants>=3 THEN weekly ELSE '[]'::jsonb END,participants>=3 AND students_only,now()
  FROM totals CROSS JOIN chart
  ON CONFLICT(month_start) DO UPDATE SET km=excluded.km,outings=excluded.outings,participants=excluded.participants,weekly=excluded.weekly,students_only=excluded.students_only,updated_at=excluded.updated_at;
 END LOOP;
 SELECT EXISTS(SELECT 1 FROM public.pr_home_monthly_history WHERE month_start=previous_month AND km IS NOT NULL AND participants>=3) INTO previous_available;
 UPDATE public.pr_home_monthly_history h SET activated_at=now()
 WHERE h.month_start=current_month AND h.activated_at IS NULL AND public.pr_home_should_activate(extract(day from today)::integer,h.km,h.outings,h.participants,previous_available);
END;
$$;
REVOKE ALL ON FUNCTION public.pr_home_refresh_monthly_history() FROM PUBLIC,anon,authenticated;
SELECT public.pr_home_refresh_monthly_history();
SELECT cron.schedule('pr-home-monthly-history','*/30 * * * *','SELECT public.pr_home_refresh_monthly_history();');
