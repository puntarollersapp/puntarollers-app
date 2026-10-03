
CREATE TABLE public.pr_training_plan_achievements (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 profile_id text NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 event_slug text NOT NULL,
 completed_at timestamptz NOT NULL DEFAULT now(),
 feed_id uuid REFERENCES public.actividad_pr(id) ON DELETE SET NULL,
 notification_id uuid REFERENCES public.community_notifications(id) ON DELETE SET NULL,
 UNIQUE(profile_id,event_slug)
);
ALTER TABLE public.pr_training_plan_achievements ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.pr_training_plan_achievements FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.pr_training_plan_achievements TO authenticated;
GRANT ALL ON public.pr_training_plan_achievements TO service_role;
CREATE POLICY training_achievement_own ON public.pr_training_plan_achievements FOR SELECT TO authenticated
 USING(profile_id=public.mi_profile_id() OR public.soy_staff());
CREATE OR REPLACE FUNCTION pr_training_internal.award_plan_completion(p_profile text,p_event text)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
 DECLARE v_category text; v_total int; v_done int; v_id uuid; v_feed uuid; v_notification uuid; v_name text; v_photo text;
 BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('training-achievement:'||p_profile||':'||p_event,0));
  SELECT category INTO v_category FROM public.pr_training_enrollments WHERE profile_id=p_profile AND event_slug=p_event AND active=true AND category IN ('6K','12K');
  IF v_category IS NULL THEN RETURN; END IF;
  SELECT count(*),count(*) FILTER(WHERE lower(coalesce(r.status,''))='completed')
   INTO v_total,v_done FROM public.pr_training_tasks t
   LEFT JOIN public.pr_training_task_results r ON r.task_id=t.id AND r.profile_id=p_profile
   WHERE t.event_slug=p_event AND t.active=true AND t.category IN ('ALL',v_category);
  IF v_total=0 OR v_done<v_total THEN RETURN; END IF;
  INSERT INTO public.pr_training_plan_achievements(profile_id,event_slug)
   VALUES(p_profile,p_event) ON CONFLICT(profile_id,event_slug) DO NOTHING RETURNING id INTO v_id;
  IF v_id IS NULL THEN RETURN; END IF;
  SELECT trim(concat_ws(' ',nombre,nullif(apellido,''))),foto INTO v_name,v_photo FROM public.profiles WHERE id=p_profile;
  INSERT INTO public.actividad_pr(alumno_id,tipo,titulo,descripcion,fecha,created_at,creado_por_id,creado_por_nombre,creado_por_role,creado_por_foto,eliminado)
   VALUES(p_profile,'Logro',coalesce(nullif(v_name,''),'Un integrante PR')||' completó todos los Deberes',
    'ROAD TO SHIFTER · '||v_total||'/'||v_total||' deberes hechos. La constancia se construye un entrenamiento a la vez. ¡Estás a un paso de la Shifter!',
    now(),now(),'training-achievement:'||v_id::text,'Road to Shifter','system',v_photo,false) RETURNING id INTO v_feed;
  INSERT INTO public.community_notifications(recipient_id,actor_id,kind,entity_type,entity_id,text)
   VALUES(p_profile,NULL,'training_plan_completed','training_plan',v_id,
    '¡Felicidades! Completaste todas las tareas marcadas. Estás a un paso de la Shifter. Cada entrenamiento cuenta: confiá en el camino que construiste y seguí disfrutando de las ruedas.')
   RETURNING id INTO v_notification;
  UPDATE public.pr_training_plan_achievements SET feed_id=v_feed,notification_id=v_notification WHERE id=v_id;
 END $$;
REVOKE ALL ON FUNCTION pr_training_internal.award_plan_completion(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION pr_training_internal.award_plan_completion(text,text) TO service_role;
CREATE OR REPLACE FUNCTION pr_training_internal.on_plan_completion()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
 DECLARE v_event text;
 BEGIN
  IF lower(coalesce(new.status,''))<>'completed' THEN RETURN new; END IF;
  SELECT event_slug INTO v_event FROM public.pr_training_tasks WHERE id=new.task_id;
  IF v_event='shifter-marathon-2026' THEN PERFORM pr_training_internal.award_plan_completion(new.profile_id,v_event); END IF;
  RETURN new;
 END $$;
REVOKE ALL ON FUNCTION pr_training_internal.on_plan_completion() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER zz_training_plan_completion AFTER INSERT OR UPDATE ON public.pr_training_task_results
 FOR EACH ROW EXECUTE FUNCTION pr_training_internal.on_plan_completion();
DO $$ DECLARE e record; BEGIN
 FOR e IN SELECT profile_id,event_slug FROM public.pr_training_enrollments WHERE active=true AND category IN ('6K','12K') AND event_slug='shifter-marathon-2026' LOOP
  PERFORM pr_training_internal.award_plan_completion(e.profile_id,e.event_slug);
 END LOOP;
END $$;


CREATE OR REPLACE FUNCTION pr_training_internal.on_plan_enrollment_completion()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
 BEGIN
  IF new.active=true AND new.category IN ('6K','12K') AND new.event_slug='shifter-marathon-2026' THEN
   PERFORM pr_training_internal.award_plan_completion(new.profile_id,new.event_slug);
  END IF;
  RETURN new;
 END $$;
REVOKE ALL ON FUNCTION pr_training_internal.on_plan_enrollment_completion() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER training_enrollment_completion AFTER INSERT OR UPDATE ON public.pr_training_enrollments
 FOR EACH ROW EXECUTE FUNCTION pr_training_internal.on_plan_enrollment_completion();
