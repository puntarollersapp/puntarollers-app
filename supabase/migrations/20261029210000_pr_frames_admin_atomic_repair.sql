-- Keep manual-frame revocation/hiding and avatar fallback in one transaction.
CREATE OR REPLACE FUNCTION public.pr_frames_admin_manage(
 p_action text, p_frame_id text, p_name text DEFAULT NULL,
 p_description text DEFAULT NULL, p_profile_id text DEFAULT NULL
) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS (
   SELECT 1 FROM public.profiles p WHERE p.auth_user_id=auth.uid() AND p.role='admin'
 ) THEN RAISE EXCEPTION 'Administrator only' USING errcode='42501'; END IF;
 IF p_action='create' THEN
   IF p_frame_id !~ '^[a-z0-9-]{3,40}$' OR length(trim(coalesce(p_name,'')))<2
   THEN RAISE EXCEPTION 'Invalid frame' USING errcode='22023'; END IF;
   INSERT INTO public.pr_frame_catalog(id,name,description,unlock_kind,sort_order)
   VALUES(p_frame_id,trim(p_name),coalesce(p_description,''),'manual',100);
 ELSIF p_action='grant' THEN
   IF NOT EXISTS(SELECT 1 FROM public.pr_frame_catalog WHERE id=p_frame_id AND unlock_kind='manual')
   THEN RAISE EXCEPTION 'Only manual frames may be granted' USING errcode='42501'; END IF;
   IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=p_profile_id)
   THEN RAISE EXCEPTION 'Student not found' USING errcode='P0002'; END IF;
   INSERT INTO public.pr_frame_unlocks(profile_id,frame_id,source)
   VALUES(p_profile_id,p_frame_id,'admin') ON CONFLICT DO NOTHING;
 ELSIF p_action='revoke' THEN
   IF NOT EXISTS(SELECT 1 FROM public.pr_frame_catalog WHERE id=p_frame_id AND unlock_kind='manual')
   THEN RAISE EXCEPTION 'Only manual frames may be revoked' USING errcode='42501'; END IF;
   DELETE FROM public.pr_frame_unlocks u WHERE u.profile_id=p_profile_id
     AND u.frame_id=p_frame_id AND u.source='admin';
   PERFORM public.pr_frames_reset_invalid_manual_equips(p_frame_id,p_profile_id);
 ELSIF p_action='hide' THEN
   UPDATE public.pr_frame_catalog SET visible=false WHERE id=p_frame_id AND unlock_kind='manual';
   IF NOT FOUND THEN RAISE EXCEPTION 'Manual frame not found' USING errcode='P0002'; END IF;
   PERFORM public.pr_frames_reset_invalid_manual_equips(p_frame_id,NULL);
 ELSIF p_action='show' THEN
   UPDATE public.pr_frame_catalog SET visible=true WHERE id=p_frame_id AND unlock_kind='manual';
   IF NOT FOUND THEN RAISE EXCEPTION 'Manual frame not found' USING errcode='P0002'; END IF;
 ELSE RAISE EXCEPTION 'Unknown action' USING errcode='22023'; END IF;
 RETURN p_action;
END $$;
REVOKE ALL ON FUNCTION public.pr_frames_admin_manage(text,text,text,text,text) FROM public,anon;
GRANT EXECUTE ON FUNCTION public.pr_frames_admin_manage(text,text,text,text,text) TO authenticated;
