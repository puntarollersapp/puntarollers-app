-- Authentic original public RLS and grants, beta only.
DROP POLICY IF EXISTS "replica_test_read" ON public."actividad_pr";
DROP POLICY IF EXISTS "replica_test_read" ON public."clases_particulares_historial";
DROP POLICY IF EXISTS "replica_test_read" ON public."community_album_comments";
DROP POLICY IF EXISTS "replica_test_read" ON public."community_album_media";
DROP POLICY IF EXISTS "replica_test_read" ON public."community_album_members";
DROP POLICY IF EXISTS "replica_test_read" ON public."community_album_photo_comments";
DROP POLICY IF EXISTS "replica_test_read" ON public."community_album_photo_reactions";
DROP POLICY IF EXISTS "replica_test_read" ON public."community_album_reactions";
DROP POLICY IF EXISTS "replica_test_read" ON public."community_albums";
DROP POLICY IF EXISTS "replica_test_read" ON public."community_blocks";
DROP POLICY IF EXISTS "replica_test_read" ON public."community_friend_requests";
DROP POLICY IF EXISTS "replica_test_read" ON public."community_friendships";
DROP POLICY IF EXISTS "replica_test_read" ON public."community_notifications";
DROP POLICY IF EXISTS "replica_test_read" ON public."community_post_comments";
DROP POLICY IF EXISTS "replica_test_read" ON public."community_post_media";
DROP POLICY IF EXISTS "replica_test_read" ON public."community_post_reactions";
DROP POLICY IF EXISTS "replica_test_read" ON public."community_post_tags";
DROP POLICY IF EXISTS "replica_test_read" ON public."community_posts";
DROP POLICY IF EXISTS "replica_test_read" ON public."community_privacy";
DROP POLICY IF EXISTS "replica_test_read" ON public."community_reposts";
DROP POLICY IF EXISTS "replica_test_read" ON public."contactos_pr";
DROP POLICY IF EXISTS "replica_test_read" ON public."cuponeras_particulares";
DROP POLICY IF EXISTS "replica_test_read" ON public."insignias_catalogo";
DROP POLICY IF EXISTS "replica_test_read" ON public."pagos_pr";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_access_requests";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_activities";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_activity_goals";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_activity_reactions";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_campaign_benefits";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_clinica_oct_2026_inscripciones";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_clinica_sept_2026_inscripciones";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_dm_conversations";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_dm_message_hides";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_dm_messages";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_email_campaign_sends";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_email_contacts";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_event_rsvps";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_groups";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_inscripciones_2026";
DROP POLICY IF EXISTS "replica_public_test_read" ON public."pr_inscripciones_config";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_inscripciones_config";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_kids_children";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_kids_family_approval_audit";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_kids_family_requests";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_kids_family_review_audit";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_kids_guardian_children";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_kids_guardians";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_kids_redemption_photos";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_kids_redemptions";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_kids_rewards";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_mensualidades";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_mercadopago_payments";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_moment_comments";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_moment_reactions";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_moments";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_music_suggestions";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_performance";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_performance_notes";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_performance_objetivos";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_performance_tomas";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_personal_config";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_personal_disponibilidad";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_personal_reservas";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_profile_showcase";
DROP POLICY IF EXISTS "replica_public_test_read" ON public."pr_ranking_statuses";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_ranking_statuses";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_referral_codes";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_referral_rewards";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_referrals";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_rollermap_contacts";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_rollermap_email_config";
DROP POLICY IF EXISTS "replica_public_test_read" ON public."pr_rollermap_locations";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_rollermap_locations";
DROP POLICY IF EXISTS "replica_public_test_read" ON public."pr_rollermap_public_config";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_rollermap_public_config";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_rollermap_route_actions";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_rollermap_route_comments";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_rollermap_route_photos";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_rollermap_route_ratings";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_rollermap_route_reports";
DROP POLICY IF EXISTS "replica_public_test_read" ON public."pr_rollermap_routes";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_rollermap_routes";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_rollermap_welcome";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_strava_reconcile_state";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_strava_sync_audit";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_strava_sync_state";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_tesoreria_config";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_tesoreria_movimientos";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_tesoreria_recordatorios";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_track_items";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_track_reports";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_track_scans";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_track_tags";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_training_enrollments";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_training_feed_publications";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_training_plan_achievements";
DROP POLICY IF EXISTS "replica_public_test_read" ON public."pr_training_public_checks";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_training_public_checks";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_training_task_results";
DROP POLICY IF EXISTS "replica_public_test_read" ON public."pr_training_tasks";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_training_tasks";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_unlock_campaigns";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_unlock_comments";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_unlock_reactions";
DROP POLICY IF EXISTS "replica_test_read" ON public."pr_unlock_results";
DROP POLICY IF EXISTS "replica_test_read" ON public."prday_comments";
DROP POLICY IF EXISTS "replica_test_read" ON public."prday_posts";
DROP POLICY IF EXISTS "replica_test_read" ON public."prday_reactions";
DROP POLICY IF EXISTS "replica_test_read" ON public."prday_testers";
DROP POLICY IF EXISTS "replica_test_read" ON public."productos_pr";
DROP POLICY IF EXISTS "replica_profile_self_read" ON public."profiles";
DROP POLICY IF EXISTS "replica_profile_self_update" ON public."profiles";
DROP POLICY IF EXISTS "replica_test_read" ON public."rollerfeed_comments";
DROP POLICY IF EXISTS "replica_public_test_read" ON public."rollerfeed_events";
DROP POLICY IF EXISTS "replica_test_read" ON public."rollerfeed_events";
DROP POLICY IF EXISTS "replica_public_test_read" ON public."rollerfeed_live_posts";
DROP POLICY IF EXISTS "replica_test_read" ON public."rollerfeed_live_posts";
DROP POLICY IF EXISTS "replica_test_read" ON public."rollerfeed_reactions";
DROP POLICY IF EXISTS "replica_test_read" ON public."student_access_requests";
DROP POLICY IF EXISTS "actividad_delete_admin" ON public."actividad_pr";
CREATE POLICY "actividad_delete_admin" ON public."actividad_pr" AS PERMISSIVE FOR DELETE TO "authenticated" USING (soy_admin());
DROP POLICY IF EXISTS "actividad_insert_staff" ON public."actividad_pr";
CREATE POLICY "actividad_insert_staff" ON public."actividad_pr" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (soy_staff());
DROP POLICY IF EXISTS "actividad_select_comunidad_pr" ON public."actividad_pr";
CREATE POLICY "actividad_select_comunidad_pr" ON public."actividad_pr" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((soy_staff() OR (alumno_id = mi_profile_id()) OR (lower(COALESCE(tipo, ''::text)) = ANY (ARRAY['deberes'::text, 'evento'::text, 'insignia'::text, 'cumpleanos'::text, 'cumpleaños'::text, 'entrenamiento'::text, 'publicacion'::text, 'publicación'::text]))));
DROP POLICY IF EXISTS "actividad_update_admin" ON public."actividad_pr";
CREATE POLICY "actividad_update_admin" ON public."actividad_pr" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (soy_admin()) WITH CHECK (soy_admin());
DROP POLICY IF EXISTS "historial_particulares_delete_admin" ON public."clases_particulares_historial";
CREATE POLICY "historial_particulares_delete_admin" ON public."clases_particulares_historial" AS PERMISSIVE FOR DELETE TO "authenticated" USING (soy_admin());
DROP POLICY IF EXISTS "historial_particulares_insert_admin" ON public."clases_particulares_historial";
CREATE POLICY "historial_particulares_insert_admin" ON public."clases_particulares_historial" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (soy_admin());
DROP POLICY IF EXISTS "historial_particulares_select_seguro" ON public."clases_particulares_historial";
CREATE POLICY "historial_particulares_select_seguro" ON public."clases_particulares_historial" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((alumno_id = mi_profile_id()) OR soy_admin()));
DROP POLICY IF EXISTS "historial_particulares_update_admin" ON public."clases_particulares_historial";
CREATE POLICY "historial_particulares_update_admin" ON public."clases_particulares_historial" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (soy_admin()) WITH CHECK (soy_admin());
DROP POLICY IF EXISTS "p_album_media_i" ON public."community_album_media";
CREATE POLICY "p_album_media_i" ON public."community_album_media" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((uploader_id = pr_current_profile_id()) AND (EXISTS ( SELECT 1
   FROM community_albums a
  WHERE ((a.id = community_album_media.album_id) AND ((a.owner_id = pr_current_profile_id()) OR (EXISTS ( SELECT 1
           FROM community_album_members m
          WHERE ((m.album_id = a.id) AND (m.profile_id = pr_current_profile_id()) AND (m.status = 'accepted'::text))))))))));
DROP POLICY IF EXISTS "p_album_media_r" ON public."community_album_media";
CREATE POLICY "p_album_media_r" ON public."community_album_media" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((EXISTS ( SELECT 1
   FROM community_albums a
  WHERE (a.id = community_album_media.album_id))));
DROP POLICY IF EXISTS "p_members_i" ON public."community_album_members";
CREATE POLICY "p_members_i" ON public."community_album_members" AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK (((EXISTS ( SELECT 1
   FROM community_albums a
  WHERE ((a.id = community_album_members.album_id) AND (a.owner_id = (auth.uid())::text)))) AND community_are_friends((auth.uid())::text, profile_id)));
DROP POLICY IF EXISTS "p_members_r" ON public."community_album_members";
CREATE POLICY "p_members_r" ON public."community_album_members" AS PERMISSIVE FOR SELECT TO PUBLIC USING (((profile_id = (auth.uid())::text) OR (EXISTS ( SELECT 1
   FROM community_albums a
  WHERE ((a.id = community_album_members.album_id) AND (a.owner_id = (auth.uid())::text))))));
DROP POLICY IF EXISTS "p_members_u" ON public."community_album_members";
CREATE POLICY "p_members_u" ON public."community_album_members" AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((profile_id = (auth.uid())::text));
DROP POLICY IF EXISTS "p_albums_i" ON public."community_albums";
CREATE POLICY "p_albums_i" ON public."community_albums" AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((owner_id = (auth.uid())::text));
DROP POLICY IF EXISTS "p_albums_r" ON public."community_albums";
CREATE POLICY "p_albums_r" ON public."community_albums" AS PERMISSIVE FOR SELECT TO PUBLIC USING (community_are_friends((auth.uid())::text, owner_id));
DROP POLICY IF EXISTS "Participantes leen amistades" ON public."community_friendships";
CREATE POLICY "Participantes leen amistades" ON public."community_friendships" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((profile_a_id = pr_current_profile_id()) OR (profile_b_id = pr_current_profile_id()) OR soy_admin()));
DROP POLICY IF EXISTS "p_notif_r" ON public."community_notifications";
CREATE POLICY "p_notif_r" ON public."community_notifications" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((recipient_id = (auth.uid())::text));
DROP POLICY IF EXISTS "p_notif_u" ON public."community_notifications";
CREATE POLICY "p_notif_u" ON public."community_notifications" AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((recipient_id = (auth.uid())::text));
DROP POLICY IF EXISTS "p_comments_i" ON public."community_post_comments";
CREATE POLICY "p_comments_i" ON public."community_post_comments" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((profile_id = pr_current_profile_id()) AND (EXISTS ( SELECT 1
   FROM community_posts p
  WHERE (p.id = community_post_comments.post_id)))));
DROP POLICY IF EXISTS "p_comments_r" ON public."community_post_comments";
CREATE POLICY "p_comments_r" ON public."community_post_comments" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((EXISTS ( SELECT 1
   FROM community_posts p
  WHERE (p.id = community_post_comments.post_id))));
DROP POLICY IF EXISTS "community_post_media_add" ON public."community_post_media";
CREATE POLICY "community_post_media_add" ON public."community_post_media" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((uploader_id = pr_current_profile_id()) AND (EXISTS ( SELECT 1
   FROM community_posts p
  WHERE ((p.id = community_post_media.post_id) AND (p.author_id = pr_current_profile_id()))))));
DROP POLICY IF EXISTS "community_post_media_read" ON public."community_post_media";
CREATE POLICY "community_post_media_read" ON public."community_post_media" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM community_posts p
  WHERE (p.id = community_post_media.post_id))));
DROP POLICY IF EXISTS "p_react" ON public."community_post_reactions";
CREATE POLICY "p_react" ON public."community_post_reactions" AS PERMISSIVE FOR ALL TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM community_posts p
  WHERE (p.id = community_post_reactions.post_id)))) WITH CHECK (((profile_id = pr_current_profile_id()) AND (EXISTS ( SELECT 1
   FROM community_posts p
  WHERE (p.id = community_post_reactions.post_id)))));
DROP POLICY IF EXISTS "p_tags_i" ON public."community_post_tags";
CREATE POLICY "p_tags_i" ON public."community_post_tags" AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK (((EXISTS ( SELECT 1
   FROM community_posts p
  WHERE ((p.id = community_post_tags.post_id) AND (p.author_id = (auth.uid())::text)))) AND community_are_friends((auth.uid())::text, profile_id)));
DROP POLICY IF EXISTS "p_tags_r" ON public."community_post_tags";
CREATE POLICY "p_tags_r" ON public."community_post_tags" AS PERMISSIVE FOR SELECT TO PUBLIC USING (((profile_id = (auth.uid())::text) OR (EXISTS ( SELECT 1
   FROM community_posts p
  WHERE (p.id = community_post_tags.post_id)))));
DROP POLICY IF EXISTS "p_tags_u" ON public."community_post_tags";
CREATE POLICY "p_tags_u" ON public."community_post_tags" AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((profile_id = (auth.uid())::text));
DROP POLICY IF EXISTS "p_posts_i" ON public."community_posts";
CREATE POLICY "p_posts_i" ON public."community_posts" AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((author_id = (auth.uid())::text));
DROP POLICY IF EXISTS "p_posts_m" ON public."community_posts";
CREATE POLICY "p_posts_m" ON public."community_posts" AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((author_id = (auth.uid())::text));
DROP POLICY IF EXISTS "p_posts_r" ON public."community_posts";
CREATE POLICY "p_posts_r" ON public."community_posts" AS PERMISSIVE FOR SELECT TO PUBLIC USING (((deleted_at IS NULL) AND community_are_friends((auth.uid())::text, author_id)));
DROP POLICY IF EXISTS "p_reposts" ON public."community_reposts";
CREATE POLICY "p_reposts" ON public."community_reposts" AS PERMISSIVE FOR ALL TO PUBLIC USING (((profile_id = (auth.uid())::text) OR community_are_friends((auth.uid())::text, profile_id))) WITH CHECK (((profile_id = (auth.uid())::text) AND (EXISTS ( SELECT 1
   FROM community_posts p
  WHERE (p.id = community_reposts.post_id)))));
DROP POLICY IF EXISTS "contactos_delete_admin" ON public."contactos_pr";
CREATE POLICY "contactos_delete_admin" ON public."contactos_pr" AS PERMISSIVE FOR DELETE TO "authenticated" USING (soy_admin());
DROP POLICY IF EXISTS "contactos_insert_admin" ON public."contactos_pr";
CREATE POLICY "contactos_insert_admin" ON public."contactos_pr" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (soy_admin());
DROP POLICY IF EXISTS "contactos_select_autenticados" ON public."contactos_pr";
CREATE POLICY "contactos_select_autenticados" ON public."contactos_pr" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((activo = true) OR soy_admin()));
DROP POLICY IF EXISTS "contactos_update_admin" ON public."contactos_pr";
CREATE POLICY "contactos_update_admin" ON public."contactos_pr" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (soy_admin()) WITH CHECK (soy_admin());
DROP POLICY IF EXISTS "cuponeras_delete_admin" ON public."cuponeras_particulares";
CREATE POLICY "cuponeras_delete_admin" ON public."cuponeras_particulares" AS PERMISSIVE FOR DELETE TO "authenticated" USING (soy_admin());
DROP POLICY IF EXISTS "cuponeras_insert_admin" ON public."cuponeras_particulares";
CREATE POLICY "cuponeras_insert_admin" ON public."cuponeras_particulares" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (soy_admin());
DROP POLICY IF EXISTS "cuponeras_select_seguro" ON public."cuponeras_particulares";
CREATE POLICY "cuponeras_select_seguro" ON public."cuponeras_particulares" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((alumno_id = mi_profile_id()) OR soy_admin()));
DROP POLICY IF EXISTS "cuponeras_update_admin" ON public."cuponeras_particulares";
CREATE POLICY "cuponeras_update_admin" ON public."cuponeras_particulares" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (soy_admin()) WITH CHECK (soy_admin());
DROP POLICY IF EXISTS "Allow public read insignias_catalogo" ON public."insignias_catalogo";
CREATE POLICY "Allow public read insignias_catalogo" ON public."insignias_catalogo" AS PERMISSIVE FOR SELECT TO PUBLIC USING (true);
DROP POLICY IF EXISTS "insignias_admin_delete" ON public."insignias_catalogo";
CREATE POLICY "insignias_admin_delete" ON public."insignias_catalogo" AS PERMISSIVE FOR DELETE TO "authenticated" USING (soy_admin());
DROP POLICY IF EXISTS "insignias_admin_insert" ON public."insignias_catalogo";
CREATE POLICY "insignias_admin_insert" ON public."insignias_catalogo" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (soy_admin());
DROP POLICY IF EXISTS "insignias_admin_update" ON public."insignias_catalogo";
CREATE POLICY "insignias_admin_update" ON public."insignias_catalogo" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (soy_admin()) WITH CHECK (soy_admin());
DROP POLICY IF EXISTS "pagos_delete_admin" ON public."pagos_pr";
CREATE POLICY "pagos_delete_admin" ON public."pagos_pr" AS PERMISSIVE FOR DELETE TO "authenticated" USING (soy_admin());
DROP POLICY IF EXISTS "pagos_insert_admin" ON public."pagos_pr";
CREATE POLICY "pagos_insert_admin" ON public."pagos_pr" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (soy_admin());
DROP POLICY IF EXISTS "pagos_select_seguro" ON public."pagos_pr";
CREATE POLICY "pagos_select_seguro" ON public."pagos_pr" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((alumno_id = mi_profile_id()) OR soy_admin()));
DROP POLICY IF EXISTS "pagos_update_admin" ON public."pagos_pr";
CREATE POLICY "pagos_update_admin" ON public."pagos_pr" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (soy_admin()) WITH CHECK (soy_admin());
DROP POLICY IF EXISTS "Actividades PR seguras" ON public."pr_activities";
CREATE POLICY "Actividades PR seguras" ON public."pr_activities" AS PERMISSIVE FOR SELECT TO PUBLIC USING (((es_privada IS NOT TRUE) OR ((auth.uid() IS NOT NULL) AND ((alumno_id = mi_profile_id()) OR soy_staff()))));
DROP POLICY IF EXISTS "Usuarios leen objetivos de actividad" ON public."pr_activity_goals";
CREATE POLICY "Usuarios leen objetivos de actividad" ON public."pr_activity_goals" AS PERMISSIVE FOR SELECT TO PUBLIC USING (true);
DROP POLICY IF EXISTS "Comunidad autenticada lee reacciones" ON public."pr_activity_reactions";
CREATE POLICY "Comunidad autenticada lee reacciones" ON public."pr_activity_reactions" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);
DROP POLICY IF EXISTS "clinica_oct_admin_delete" ON public."pr_clinica_oct_2026_inscripciones";
CREATE POLICY "clinica_oct_admin_delete" ON public."pr_clinica_oct_2026_inscripciones" AS PERMISSIVE FOR DELETE TO "authenticated" USING (soy_admin());
DROP POLICY IF EXISTS "clinica_oct_admin_select" ON public."pr_clinica_oct_2026_inscripciones";
CREATE POLICY "clinica_oct_admin_select" ON public."pr_clinica_oct_2026_inscripciones" AS PERMISSIVE FOR SELECT TO "authenticated" USING (soy_admin());
DROP POLICY IF EXISTS "clinica_oct_admin_update" ON public."pr_clinica_oct_2026_inscripciones";
CREATE POLICY "clinica_oct_admin_update" ON public."pr_clinica_oct_2026_inscripciones" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (soy_admin()) WITH CHECK (soy_admin());
DROP POLICY IF EXISTS "clinica_admin_delete" ON public."pr_clinica_sept_2026_inscripciones";
CREATE POLICY "clinica_admin_delete" ON public."pr_clinica_sept_2026_inscripciones" AS PERMISSIVE FOR DELETE TO "authenticated" USING (soy_admin());
DROP POLICY IF EXISTS "clinica_admin_select" ON public."pr_clinica_sept_2026_inscripciones";
CREATE POLICY "clinica_admin_select" ON public."pr_clinica_sept_2026_inscripciones" AS PERMISSIVE FOR SELECT TO "authenticated" USING (soy_admin());
DROP POLICY IF EXISTS "clinica_admin_update" ON public."pr_clinica_sept_2026_inscripciones";
CREATE POLICY "clinica_admin_update" ON public."pr_clinica_sept_2026_inscripciones" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (soy_admin()) WITH CHECK (soy_admin());
DROP POLICY IF EXISTS "event_rsvps_authenticated_read" ON public."pr_event_rsvps";
CREATE POLICY "event_rsvps_authenticated_read" ON public."pr_event_rsvps" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);
DROP POLICY IF EXISTS "event_rsvps_delete_own" ON public."pr_event_rsvps";
CREATE POLICY "event_rsvps_delete_own" ON public."pr_event_rsvps" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((profile_id = pr_current_profile_id()));
DROP POLICY IF EXISTS "event_rsvps_insert_own" ON public."pr_event_rsvps";
CREATE POLICY "event_rsvps_insert_own" ON public."pr_event_rsvps" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((profile_id = pr_current_profile_id()));
DROP POLICY IF EXISTS "event_rsvps_update_own" ON public."pr_event_rsvps";
CREATE POLICY "event_rsvps_update_own" ON public."pr_event_rsvps" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((profile_id = pr_current_profile_id())) WITH CHECK ((profile_id = pr_current_profile_id()));
DROP POLICY IF EXISTS "pr_groups_delete_staff" ON public."pr_groups";
CREATE POLICY "pr_groups_delete_staff" ON public."pr_groups" AS PERMISSIVE FOR DELETE TO "authenticated" USING (soy_staff());
DROP POLICY IF EXISTS "pr_groups_insert_staff" ON public."pr_groups";
CREATE POLICY "pr_groups_insert_staff" ON public."pr_groups" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (soy_staff());
DROP POLICY IF EXISTS "pr_groups_select_authenticated" ON public."pr_groups";
CREATE POLICY "pr_groups_select_authenticated" ON public."pr_groups" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);
DROP POLICY IF EXISTS "pr_groups_update_staff" ON public."pr_groups";
CREATE POLICY "pr_groups_update_staff" ON public."pr_groups" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (soy_staff()) WITH CHECK (soy_staff());
DROP POLICY IF EXISTS "inscripciones_admin_delete" ON public."pr_inscripciones_2026";
CREATE POLICY "inscripciones_admin_delete" ON public."pr_inscripciones_2026" AS PERMISSIVE FOR DELETE TO "authenticated" USING (soy_admin());
DROP POLICY IF EXISTS "inscripciones_admin_insert" ON public."pr_inscripciones_2026";
CREATE POLICY "inscripciones_admin_insert" ON public."pr_inscripciones_2026" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (soy_admin());
DROP POLICY IF EXISTS "inscripciones_admin_select" ON public."pr_inscripciones_2026";
CREATE POLICY "inscripciones_admin_select" ON public."pr_inscripciones_2026" AS PERMISSIVE FOR SELECT TO "authenticated" USING (soy_admin());
DROP POLICY IF EXISTS "inscripciones_admin_update" ON public."pr_inscripciones_2026";
CREATE POLICY "inscripciones_admin_update" ON public."pr_inscripciones_2026" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (soy_admin()) WITH CHECK (soy_admin());
DROP POLICY IF EXISTS "tesoreria gestiona mensualidades" ON public."pr_mensualidades";
CREATE POLICY "tesoreria gestiona mensualidades" ON public."pr_mensualidades" AS PERMISSIVE FOR ALL TO "authenticated" USING (puedo_gestionar_pagos()) WITH CHECK (puedo_gestionar_pagos());
DROP POLICY IF EXISTS "tesoreria puede ver mensualidades" ON public."pr_mensualidades";
CREATE POLICY "tesoreria puede ver mensualidades" ON public."pr_mensualidades" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((puedo_gestionar_pagos() OR (alumno_id = mi_profile_id())));
DROP POLICY IF EXISTS "Admins can view Mercado Pago attempts" ON public."pr_mercadopago_payments";
CREATE POLICY "Admins can view Mercado Pago attempts" ON public."pr_mercadopago_payments" AS PERMISSIVE FOR SELECT TO "authenticated" USING (soy_admin());
DROP POLICY IF EXISTS "Crear comentario moment propio" ON public."pr_moment_comments";
CREATE POLICY "Crear comentario moment propio" ON public."pr_moment_comments" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((profile_id = pr_current_profile_id()) AND (EXISTS ( SELECT 1
   FROM pr_moments m
  WHERE (m.id = pr_moment_comments.moment_id)))));
DROP POLICY IF EXISTS "Eliminar comentario moment propio" ON public."pr_moment_comments";
CREATE POLICY "Eliminar comentario moment propio" ON public."pr_moment_comments" AS PERMISSIVE FOR DELETE TO "authenticated" USING (((profile_id = pr_current_profile_id()) OR soy_staff()));
DROP POLICY IF EXISTS "Ver comentarios moments" ON public."pr_moment_comments";
CREATE POLICY "Ver comentarios moments" ON public."pr_moment_comments" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM pr_moments m
  WHERE (m.id = pr_moment_comments.moment_id))));
DROP POLICY IF EXISTS "Crear reaccion moment propia" ON public."pr_moment_reactions";
CREATE POLICY "Crear reaccion moment propia" ON public."pr_moment_reactions" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((profile_id = pr_current_profile_id()) AND (EXISTS ( SELECT 1
   FROM pr_moments m
  WHERE (m.id = pr_moment_reactions.moment_id)))));
DROP POLICY IF EXISTS "Eliminar reaccion moment propia" ON public."pr_moment_reactions";
CREATE POLICY "Eliminar reaccion moment propia" ON public."pr_moment_reactions" AS PERMISSIVE FOR DELETE TO "authenticated" USING (((profile_id = pr_current_profile_id()) OR soy_staff()));
DROP POLICY IF EXISTS "Modificar reaccion moment propia" ON public."pr_moment_reactions";
CREATE POLICY "Modificar reaccion moment propia" ON public."pr_moment_reactions" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((profile_id = pr_current_profile_id())) WITH CHECK ((profile_id = pr_current_profile_id()));
DROP POLICY IF EXISTS "Ver reacciones moments" ON public."pr_moment_reactions";
CREATE POLICY "Ver reacciones moments" ON public."pr_moment_reactions" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM pr_moments m
  WHERE (m.id = pr_moment_reactions.moment_id))));
DROP POLICY IF EXISTS "Actualizar moment propio" ON public."pr_moments";
CREATE POLICY "Actualizar moment propio" ON public."pr_moments" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (((profile_id = pr_current_profile_id()) OR soy_staff())) WITH CHECK (((profile_id = pr_current_profile_id()) OR soy_staff()));
DROP POLICY IF EXISTS "Crear moment propio" ON public."pr_moments";
CREATE POLICY "Crear moment propio" ON public."pr_moments" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((profile_id = pr_current_profile_id()));
DROP POLICY IF EXISTS "Eliminar moment propio" ON public."pr_moments";
CREATE POLICY "Eliminar moment propio" ON public."pr_moments" AS PERMISSIVE FOR DELETE TO "authenticated" USING (((profile_id = pr_current_profile_id()) OR soy_staff()));
DROP POLICY IF EXISTS "Ver moments permitidos" ON public."pr_moments";
CREATE POLICY "Ver moments permitidos" ON public."pr_moments" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((deleted_at IS NULL) AND ((profile_id = pr_current_profile_id()) OR ((expires_at > now()) AND ((visibility = 'all'::text) OR ((visibility = 'friends'::text) AND (EXISTS ( SELECT 1
   FROM community_friendships f
  WHERE (((f.profile_a_id = pr_moments.profile_id) AND (f.profile_b_id = pr_current_profile_id())) OR ((f.profile_b_id = pr_moments.profile_id) AND (f.profile_a_id = pr_current_profile_id())))))))))));
DROP POLICY IF EXISTS "pr_music_admin_select_all" ON public."pr_music_suggestions";
CREATE POLICY "pr_music_admin_select_all" ON public."pr_music_suggestions" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM profiles admin_profile
  WHERE ((admin_profile.auth_user_id = auth.uid()) AND (lower(COALESCE(admin_profile.role, ''::text)) = 'admin'::text)))));
DROP POLICY IF EXISTS "pr_music_admin_update" ON public."pr_music_suggestions";
CREATE POLICY "pr_music_admin_update" ON public."pr_music_suggestions" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM profiles admin_profile
  WHERE ((admin_profile.auth_user_id = auth.uid()) AND (lower(COALESCE(admin_profile.role, ''::text)) = 'admin'::text))))) WITH CHECK (((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])) AND (EXISTS ( SELECT 1
   FROM profiles admin_profile
  WHERE ((admin_profile.auth_user_id = auth.uid()) AND (lower(COALESCE(admin_profile.role, ''::text)) = 'admin'::text))))));
DROP POLICY IF EXISTS "pr_music_insert_own" ON public."pr_music_suggestions";
CREATE POLICY "pr_music_insert_own" ON public."pr_music_suggestions" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((status = 'pending'::text) AND (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = pr_music_suggestions.profile_id) AND (p.auth_user_id = auth.uid()) AND (COALESCE(p.acceso_habilitado, true) = true))))));
DROP POLICY IF EXISTS "pr_music_select_approved_or_own" ON public."pr_music_suggestions";
CREATE POLICY "pr_music_select_approved_or_own" ON public."pr_music_suggestions" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((status = 'approved'::text) OR (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = pr_music_suggestions.profile_id) AND (p.auth_user_id = auth.uid()))))));
DROP POLICY IF EXISTS "Alumno ve su PR Performance" ON public."pr_performance";
CREATE POLICY "Alumno ve su PR Performance" ON public."pr_performance" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((is_pr_staff() OR (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = pr_performance.alumno_id) AND (((p.auth_user_id)::text = (auth.uid())::text) OR (p.id = (auth.uid())::text)))))));
DROP POLICY IF EXISTS "Staff actualiza PR Performance" ON public."pr_performance";
CREATE POLICY "Staff actualiza PR Performance" ON public."pr_performance" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (is_pr_staff()) WITH CHECK (is_pr_staff());
DROP POLICY IF EXISTS "Staff crea PR Performance" ON public."pr_performance";
CREATE POLICY "Staff crea PR Performance" ON public."pr_performance" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (is_pr_staff());
DROP POLICY IF EXISTS "Staff elimina PR Performance" ON public."pr_performance";
CREATE POLICY "Staff elimina PR Performance" ON public."pr_performance" AS PERMISSIVE FOR DELETE TO "authenticated" USING (is_pr_staff());
DROP POLICY IF EXISTS "performance_notes_staff_delete" ON public."pr_performance_notes";
CREATE POLICY "performance_notes_staff_delete" ON public."pr_performance_notes" AS PERMISSIVE FOR DELETE TO "authenticated" USING (soy_staff());
DROP POLICY IF EXISTS "performance_notes_staff_insert" ON public."pr_performance_notes";
CREATE POLICY "performance_notes_staff_insert" ON public."pr_performance_notes" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (soy_staff());
DROP POLICY IF EXISTS "performance_notes_staff_select" ON public."pr_performance_notes";
CREATE POLICY "performance_notes_staff_select" ON public."pr_performance_notes" AS PERMISSIVE FOR SELECT TO "authenticated" USING (soy_staff());
DROP POLICY IF EXISTS "performance_notes_staff_update" ON public."pr_performance_notes";
CREATE POLICY "performance_notes_staff_update" ON public."pr_performance_notes" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (soy_staff()) WITH CHECK (soy_staff());
DROP POLICY IF EXISTS "Alumno ve sus objetivos PR" ON public."pr_performance_objetivos";
CREATE POLICY "Alumno ve sus objetivos PR" ON public."pr_performance_objetivos" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((eliminado = false) AND (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = pr_performance_objetivos.alumno_id) AND (((p.auth_user_id)::text = (auth.uid())::text) OR (p.id = (auth.uid())::text)))))));
DROP POLICY IF EXISTS "Staff administra objetivos PR" ON public."pr_performance_objetivos";
CREATE POLICY "Staff administra objetivos PR" ON public."pr_performance_objetivos" AS PERMISSIVE FOR ALL TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((((p.auth_user_id)::text = (auth.uid())::text) OR (p.id = (auth.uid())::text)) AND (p.role = ANY (ARRAY['admin'::text, 'profesor'::text])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((((p.auth_user_id)::text = (auth.uid())::text) OR (p.id = (auth.uid())::text)) AND (p.role = ANY (ARRAY['admin'::text, 'profesor'::text]))))));
DROP POLICY IF EXISTS "Alumno ve sus tomas" ON public."pr_performance_tomas";
CREATE POLICY "Alumno ve sus tomas" ON public."pr_performance_tomas" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((is_pr_staff() OR ((eliminado = false) AND (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = pr_performance_tomas.alumno_id) AND (((p.auth_user_id)::text = (auth.uid())::text) OR (p.id = (auth.uid())::text))))))));
DROP POLICY IF EXISTS "Staff actualiza tomas" ON public."pr_performance_tomas";
CREATE POLICY "Staff actualiza tomas" ON public."pr_performance_tomas" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (is_pr_staff()) WITH CHECK (is_pr_staff());
DROP POLICY IF EXISTS "Staff crea tomas" ON public."pr_performance_tomas";
CREATE POLICY "Staff crea tomas" ON public."pr_performance_tomas" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (is_pr_staff());
DROP POLICY IF EXISTS "Staff elimina tomas" ON public."pr_performance_tomas";
CREATE POLICY "Staff elimina tomas" ON public."pr_performance_tomas" AS PERMISSIVE FOR DELETE TO "authenticated" USING (is_pr_staff());
DROP POLICY IF EXISTS "pr_personal_config_admin_all" ON public."pr_personal_config";
CREATE POLICY "pr_personal_config_admin_all" ON public."pr_personal_config" AS PERMISSIVE FOR ALL TO "authenticated" USING (soy_admin()) WITH CHECK (soy_admin());
DROP POLICY IF EXISTS "pr_personal_disponibilidad_admin_all" ON public."pr_personal_disponibilidad";
CREATE POLICY "pr_personal_disponibilidad_admin_all" ON public."pr_personal_disponibilidad" AS PERMISSIVE FOR ALL TO "authenticated" USING (soy_admin()) WITH CHECK (soy_admin());
DROP POLICY IF EXISTS "pr_personal_reservas_admin_all" ON public."pr_personal_reservas";
CREATE POLICY "pr_personal_reservas_admin_all" ON public."pr_personal_reservas" AS PERMISSIVE FOR ALL TO "authenticated" USING (soy_admin()) WITH CHECK (soy_admin());
DROP POLICY IF EXISTS "pr_personal_reservas_alumno_select" ON public."pr_personal_reservas";
CREATE POLICY "pr_personal_reservas_alumno_select" ON public."pr_personal_reservas" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((alumno_id = mi_profile_id()));
DROP POLICY IF EXISTS "profile_showcase_own_delete" ON public."pr_profile_showcase";
CREATE POLICY "profile_showcase_own_delete" ON public."pr_profile_showcase" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((profile_id = pr_current_profile_id()));
DROP POLICY IF EXISTS "profile_showcase_own_insert" ON public."pr_profile_showcase";
CREATE POLICY "profile_showcase_own_insert" ON public."pr_profile_showcase" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((profile_id = pr_current_profile_id()));
DROP POLICY IF EXISTS "profile_showcase_own_update" ON public."pr_profile_showcase";
CREATE POLICY "profile_showcase_own_update" ON public."pr_profile_showcase" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((profile_id = pr_current_profile_id())) WITH CHECK ((profile_id = pr_current_profile_id()));
DROP POLICY IF EXISTS "profile_showcase_read" ON public."pr_profile_showcase";
CREATE POLICY "profile_showcase_read" ON public."pr_profile_showcase" AS PERMISSIVE FOR SELECT TO PUBLIC USING (true);
DROP POLICY IF EXISTS "ranking_statuses_owner_insert" ON public."pr_ranking_statuses";
CREATE POLICY "ranking_statuses_owner_insert" ON public."pr_ranking_statuses" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = pr_ranking_statuses.alumno_id) AND ((p.auth_user_id = auth.uid()) OR (p.id = (auth.uid())::text))))));
DROP POLICY IF EXISTS "ranking_statuses_owner_update" ON public."pr_ranking_statuses";
CREATE POLICY "ranking_statuses_owner_update" ON public."pr_ranking_statuses" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = pr_ranking_statuses.alumno_id) AND ((p.auth_user_id = auth.uid()) OR (p.id = (auth.uid())::text)))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = pr_ranking_statuses.alumno_id) AND ((p.auth_user_id = auth.uid()) OR (p.id = (auth.uid())::text))))));
DROP POLICY IF EXISTS "ranking_statuses_public_read" ON public."pr_ranking_statuses";
CREATE POLICY "ranking_statuses_public_read" ON public."pr_ranking_statuses" AS PERMISSIVE FOR SELECT TO PUBLIC USING (true);
DROP POLICY IF EXISTS "referral_codes_authenticated_read" ON public."pr_referral_codes";
CREATE POLICY "referral_codes_authenticated_read" ON public."pr_referral_codes" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);
DROP POLICY IF EXISTS "referral_rewards_owner_read" ON public."pr_referral_rewards";
CREATE POLICY "referral_rewards_owner_read" ON public."pr_referral_rewards" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((referrer_profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))) OR (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.auth_user_id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'profesor'::text])))))));
DROP POLICY IF EXISTS "referrals_owner_read" ON public."pr_referrals";
CREATE POLICY "referrals_owner_read" ON public."pr_referrals" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((referrer_profile_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid()))) OR (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.auth_user_id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'profesor'::text])))))));
DROP POLICY IF EXISTS "rollermap_contacts_admin" ON public."pr_rollermap_contacts";
CREATE POLICY "rollermap_contacts_admin" ON public."pr_rollermap_contacts" AS PERMISSIVE FOR ALL TO "authenticated" USING (soy_admin()) WITH CHECK (soy_admin());
DROP POLICY IF EXISTS "rollermap_email_config_admin" ON public."pr_rollermap_email_config";
CREATE POLICY "rollermap_email_config_admin" ON public."pr_rollermap_email_config" AS PERMISSIVE FOR ALL TO "authenticated" USING (soy_admin()) WITH CHECK (soy_admin());
DROP POLICY IF EXISTS "rollermap_admin_delete" ON public."pr_rollermap_locations";
CREATE POLICY "rollermap_admin_delete" ON public."pr_rollermap_locations" AS PERMISSIVE FOR DELETE TO "authenticated" USING (soy_admin());
DROP POLICY IF EXISTS "rollermap_admin_insert" ON public."pr_rollermap_locations";
CREATE POLICY "rollermap_admin_insert" ON public."pr_rollermap_locations" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (soy_admin());
DROP POLICY IF EXISTS "rollermap_admin_update" ON public."pr_rollermap_locations";
CREATE POLICY "rollermap_admin_update" ON public."pr_rollermap_locations" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (soy_admin()) WITH CHECK (soy_admin());
DROP POLICY IF EXISTS "rollermap_member_read" ON public."pr_rollermap_locations";
CREATE POLICY "rollermap_member_read" ON public."pr_rollermap_locations" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((status = 'approved'::text) OR soy_admin()));
DROP POLICY IF EXISTS "rollermap_public_read" ON public."pr_rollermap_locations";
CREATE POLICY "rollermap_public_read" ON public."pr_rollermap_locations" AS PERMISSIVE FOR SELECT TO "anon" USING ((status = 'approved'::text));
DROP POLICY IF EXISTS "rollermap_public_map_config" ON public."pr_rollermap_public_config";
CREATE POLICY "rollermap_public_map_config" ON public."pr_rollermap_public_config" AS PERMISSIVE FOR SELECT TO "anon","authenticated" USING ((id = 1));
DROP POLICY IF EXISTS "explorer_actions_own" ON public."pr_rollermap_route_actions";
CREATE POLICY "explorer_actions_own" ON public."pr_rollermap_route_actions" AS PERMISSIVE FOR ALL TO "authenticated" USING ((created_by = ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())
 LIMIT 1))) WITH CHECK ((created_by = ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())
 LIMIT 1)));
DROP POLICY IF EXISTS "explorer_comments_admin_update" ON public."pr_rollermap_route_comments";
CREATE POLICY "explorer_comments_admin_update" ON public."pr_rollermap_route_comments" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (soy_admin()) WITH CHECK (soy_admin());
DROP POLICY IF EXISTS "explorer_comments_auth_insert" ON public."pr_rollermap_route_comments";
CREATE POLICY "explorer_comments_auth_insert" ON public."pr_rollermap_route_comments" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((created_by = ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())
 LIMIT 1)) AND (guest_name IS NULL) AND (status = 'visible'::text) AND (EXISTS ( SELECT 1
   FROM pr_rollermap_routes r
  WHERE ((r.id = pr_rollermap_route_comments.route_id) AND (r.status = 'approved'::text))))));
DROP POLICY IF EXISTS "explorer_comments_guest_insert" ON public."pr_rollermap_route_comments";
CREATE POLICY "explorer_comments_guest_insert" ON public."pr_rollermap_route_comments" AS PERMISSIVE FOR INSERT TO "anon" WITH CHECK (((status = 'pending'::text) AND (created_by IS NULL) AND (NULLIF(btrim(guest_name), ''::text) IS NOT NULL)));
DROP POLICY IF EXISTS "explorer_comments_read" ON public."pr_rollermap_route_comments";
CREATE POLICY "explorer_comments_read" ON public."pr_rollermap_route_comments" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((((status = 'visible'::text) AND (EXISTS ( SELECT 1
   FROM pr_rollermap_routes r
  WHERE ((r.id = pr_rollermap_route_comments.route_id) AND (r.status = 'approved'::text))))) OR soy_admin()));
DROP POLICY IF EXISTS "explorer_route_photos_admin_update" ON public."pr_rollermap_route_photos";
CREATE POLICY "explorer_route_photos_admin_update" ON public."pr_rollermap_route_photos" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (soy_admin()) WITH CHECK (soy_admin());
DROP POLICY IF EXISTS "explorer_route_photos_insert" ON public."pr_rollermap_route_photos";
CREATE POLICY "explorer_route_photos_insert" ON public."pr_rollermap_route_photos" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((status = 'pending'::text) AND (created_by = ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())
 LIMIT 1)) AND (EXISTS ( SELECT 1
   FROM pr_rollermap_routes r
  WHERE ((r.id = pr_rollermap_route_photos.route_id) AND (r.created_by = ( SELECT profiles.id
           FROM profiles
          WHERE (profiles.auth_user_id = auth.uid())
         LIMIT 1)))))));
DROP POLICY IF EXISTS "explorer_route_photos_read" ON public."pr_rollermap_route_photos";
CREATE POLICY "explorer_route_photos_read" ON public."pr_rollermap_route_photos" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((soy_admin() OR (created_by = ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())
 LIMIT 1)) OR ((status = 'approved'::text) AND (EXISTS ( SELECT 1
   FROM pr_rollermap_routes r
  WHERE ((r.id = pr_rollermap_route_photos.route_id) AND (r.status = 'approved'::text)))))));
DROP POLICY IF EXISTS "explorer_ratings_auth_insert" ON public."pr_rollermap_route_ratings";
CREATE POLICY "explorer_ratings_auth_insert" ON public."pr_rollermap_route_ratings" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((created_by = ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())
 LIMIT 1)) AND (guest_key IS NULL) AND (EXISTS ( SELECT 1
   FROM pr_rollermap_routes r
  WHERE ((r.id = pr_rollermap_route_ratings.route_id) AND (r.status = 'approved'::text))))));
DROP POLICY IF EXISTS "explorer_ratings_guest_insert" ON public."pr_rollermap_route_ratings";
CREATE POLICY "explorer_ratings_guest_insert" ON public."pr_rollermap_route_ratings" AS PERMISSIVE FOR INSERT TO "anon" WITH CHECK (((created_by IS NULL) AND (NULLIF(btrim(guest_key), ''::text) IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM pr_rollermap_routes r
  WHERE ((r.id = pr_rollermap_route_ratings.route_id) AND (r.status = 'approved'::text))))));
DROP POLICY IF EXISTS "explorer_ratings_owner_delete" ON public."pr_rollermap_route_ratings";
CREATE POLICY "explorer_ratings_owner_delete" ON public."pr_rollermap_route_ratings" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((created_by = ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())
 LIMIT 1)));
DROP POLICY IF EXISTS "explorer_ratings_owner_update" ON public."pr_rollermap_route_ratings";
CREATE POLICY "explorer_ratings_owner_update" ON public."pr_rollermap_route_ratings" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((created_by = ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())
 LIMIT 1))) WITH CHECK ((created_by = ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())
 LIMIT 1)));
DROP POLICY IF EXISTS "explorer_ratings_read" ON public."pr_rollermap_route_ratings";
CREATE POLICY "explorer_ratings_read" ON public."pr_rollermap_route_ratings" AS PERMISSIVE FOR SELECT TO PUBLIC USING (((EXISTS ( SELECT 1
   FROM pr_rollermap_routes r
  WHERE ((r.id = pr_rollermap_route_ratings.route_id) AND (r.status = 'approved'::text)))) OR soy_admin()));
DROP POLICY IF EXISTS "explorer_reports_admin_read" ON public."pr_rollermap_route_reports";
CREATE POLICY "explorer_reports_admin_read" ON public."pr_rollermap_route_reports" AS PERMISSIVE FOR SELECT TO "authenticated" USING (soy_admin());
DROP POLICY IF EXISTS "explorer_reports_admin_update" ON public."pr_rollermap_route_reports";
CREATE POLICY "explorer_reports_admin_update" ON public."pr_rollermap_route_reports" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (soy_admin()) WITH CHECK (soy_admin());
DROP POLICY IF EXISTS "explorer_reports_auth_insert" ON public."pr_rollermap_route_reports";
CREATE POLICY "explorer_reports_auth_insert" ON public."pr_rollermap_route_reports" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((created_by = ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())
 LIMIT 1)) AND (guest_name IS NULL) AND (EXISTS ( SELECT 1
   FROM pr_rollermap_routes r
  WHERE ((r.id = pr_rollermap_route_reports.route_id) AND (r.status = 'approved'::text))))));
DROP POLICY IF EXISTS "explorer_reports_guest_insert" ON public."pr_rollermap_route_reports";
CREATE POLICY "explorer_reports_guest_insert" ON public."pr_rollermap_route_reports" AS PERMISSIVE FOR INSERT TO "anon" WITH CHECK (((created_by IS NULL) AND (NULLIF(btrim(guest_name), ''::text) IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM pr_rollermap_routes r
  WHERE ((r.id = pr_rollermap_route_reports.route_id) AND (r.status = 'approved'::text))))));
DROP POLICY IF EXISTS "explorer_routes_admin_delete" ON public."pr_rollermap_routes";
CREATE POLICY "explorer_routes_admin_delete" ON public."pr_rollermap_routes" AS PERMISSIVE FOR DELETE TO "authenticated" USING (soy_admin());
DROP POLICY IF EXISTS "explorer_routes_admin_update" ON public."pr_rollermap_routes";
CREATE POLICY "explorer_routes_admin_update" ON public."pr_rollermap_routes" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (soy_admin()) WITH CHECK (soy_admin());
DROP POLICY IF EXISTS "explorer_routes_auth_insert" ON public."pr_rollermap_routes";
CREATE POLICY "explorer_routes_auth_insert" ON public."pr_rollermap_routes" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((status = 'pending'::text) AND ((created_by = ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())
 LIMIT 1)) OR ((created_by IS NULL) AND (NULLIF(btrim(guest_name), ''::text) IS NOT NULL)))));
DROP POLICY IF EXISTS "explorer_routes_guest_insert" ON public."pr_rollermap_routes";
CREATE POLICY "explorer_routes_guest_insert" ON public."pr_rollermap_routes" AS PERMISSIVE FOR INSERT TO "anon" WITH CHECK (((status = 'pending'::text) AND (created_by IS NULL) AND (NULLIF(btrim(guest_name), ''::text) IS NOT NULL)));
DROP POLICY IF EXISTS "explorer_routes_public_read" ON public."pr_rollermap_routes";
CREATE POLICY "explorer_routes_public_read" ON public."pr_rollermap_routes" AS PERMISSIVE FOR SELECT TO PUBLIC USING (((status = 'approved'::text) OR soy_admin() OR (created_by = ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.auth_user_id = auth.uid())
 LIMIT 1))));
DROP POLICY IF EXISTS "rollermap_welcome_admin_read" ON public."pr_rollermap_welcome";
CREATE POLICY "rollermap_welcome_admin_read" ON public."pr_rollermap_welcome" AS PERMISSIVE FOR SELECT TO "authenticated" USING (soy_admin());
DROP POLICY IF EXISTS "pr_strava_connections_self_read" ON public."pr_strava_connections";
CREATE POLICY "pr_strava_connections_self_read" ON public."pr_strava_connections" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((alumno_id = mi_profile_id()) OR soy_staff()));
DROP POLICY IF EXISTS "admin gestiona config" ON public."pr_tesoreria_config";
CREATE POLICY "admin gestiona config" ON public."pr_tesoreria_config" AS PERMISSIVE FOR ALL TO "authenticated" USING (soy_admin()) WITH CHECK (soy_admin());
DROP POLICY IF EXISTS "usuarios autenticados ven config" ON public."pr_tesoreria_config";
CREATE POLICY "usuarios autenticados ven config" ON public."pr_tesoreria_config" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((auth.uid() IS NOT NULL));
DROP POLICY IF EXISTS "tesoreria gestiona movimientos" ON public."pr_tesoreria_movimientos";
CREATE POLICY "tesoreria gestiona movimientos" ON public."pr_tesoreria_movimientos" AS PERMISSIVE FOR ALL TO "authenticated" USING (puedo_gestionar_pagos()) WITH CHECK (puedo_gestionar_pagos());
DROP POLICY IF EXISTS "tesoreria puede ver movimientos" ON public."pr_tesoreria_movimientos";
CREATE POLICY "tesoreria puede ver movimientos" ON public."pr_tesoreria_movimientos" AS PERMISSIVE FOR SELECT TO "authenticated" USING (puedo_gestionar_pagos());
DROP POLICY IF EXISTS "tesoreria ve recordatorios" ON public."pr_tesoreria_recordatorios";
CREATE POLICY "tesoreria ve recordatorios" ON public."pr_tesoreria_recordatorios" AS PERMISSIVE FOR SELECT TO "authenticated" USING (puedo_gestionar_pagos());
DROP POLICY IF EXISTS "track_items_read" ON public."pr_track_items";
CREATE POLICY "track_items_read" ON public."pr_track_items" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((pr_track_is_staff() OR ((alumno_id = pr_track_current_profile_id()) AND (estado = ANY (ARRAY['active'::text, 'lost'::text])))));
DROP POLICY IF EXISTS "track_items_staff_delete" ON public."pr_track_items";
CREATE POLICY "track_items_staff_delete" ON public."pr_track_items" AS PERMISSIVE FOR DELETE TO "authenticated" USING (pr_track_is_staff());
DROP POLICY IF EXISTS "track_items_staff_insert" ON public."pr_track_items";
CREATE POLICY "track_items_staff_insert" ON public."pr_track_items" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (pr_track_is_staff());
DROP POLICY IF EXISTS "track_items_staff_update" ON public."pr_track_items";
CREATE POLICY "track_items_staff_update" ON public."pr_track_items" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (pr_track_is_staff()) WITH CHECK (pr_track_is_staff());
DROP POLICY IF EXISTS "track_scans_staff_read" ON public."pr_track_scans";
CREATE POLICY "track_scans_staff_read" ON public."pr_track_scans" AS PERMISSIVE FOR SELECT TO "authenticated" USING (pr_track_is_staff());
DROP POLICY IF EXISTS "track_tags_read" ON public."pr_track_tags";
CREATE POLICY "track_tags_read" ON public."pr_track_tags" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM pr_track_items i
  WHERE ((i.id = pr_track_tags.item_id) AND (pr_track_is_staff() OR ((i.alumno_id = pr_track_current_profile_id()) AND (i.estado = ANY (ARRAY['active'::text, 'lost'::text]))))))));
DROP POLICY IF EXISTS "track_tags_staff_write" ON public."pr_track_tags";
CREATE POLICY "track_tags_staff_write" ON public."pr_track_tags" AS PERMISSIVE FOR ALL TO "authenticated" USING (pr_track_is_staff()) WITH CHECK (pr_track_is_staff());
DROP POLICY IF EXISTS "training_enrollment_insert" ON public."pr_training_enrollments";
CREATE POLICY "training_enrollment_insert" ON public."pr_training_enrollments" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((profile_id = mi_profile_id()) OR soy_staff()));
DROP POLICY IF EXISTS "training_enrollment_select" ON public."pr_training_enrollments";
CREATE POLICY "training_enrollment_select" ON public."pr_training_enrollments" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((profile_id = mi_profile_id()) OR soy_staff()));
DROP POLICY IF EXISTS "training_enrollment_update" ON public."pr_training_enrollments";
CREATE POLICY "training_enrollment_update" ON public."pr_training_enrollments" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (((profile_id = mi_profile_id()) OR soy_staff())) WITH CHECK (((profile_id = mi_profile_id()) OR soy_staff()));
DROP POLICY IF EXISTS "training_achievement_own" ON public."pr_training_plan_achievements";
CREATE POLICY "training_achievement_own" ON public."pr_training_plan_achievements" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((profile_id = mi_profile_id()) OR soy_staff()));
DROP POLICY IF EXISTS "community_completed_checks" ON public."pr_training_public_checks";
CREATE POLICY "community_completed_checks" ON public."pr_training_public_checks" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);
DROP POLICY IF EXISTS "training_results_select" ON public."pr_training_task_results";
CREATE POLICY "training_results_select" ON public."pr_training_task_results" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((profile_id = mi_profile_id()) OR soy_staff()));
DROP POLICY IF EXISTS "training_results_staff" ON public."pr_training_task_results";
CREATE POLICY "training_results_staff" ON public."pr_training_task_results" AS PERMISSIVE FOR ALL TO "authenticated" USING (soy_staff()) WITH CHECK (soy_staff());
DROP POLICY IF EXISTS "training_tasks_select" ON public."pr_training_tasks";
CREATE POLICY "training_tasks_select" ON public."pr_training_tasks" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);
DROP POLICY IF EXISTS "training_tasks_staff" ON public."pr_training_tasks";
CREATE POLICY "training_tasks_staff" ON public."pr_training_tasks" AS PERMISSIVE FOR ALL TO "authenticated" USING (soy_staff()) WITH CHECK (soy_staff());
DROP POLICY IF EXISTS "pr_unlock_campaigns_public_read" ON public."pr_unlock_campaigns";
CREATE POLICY "pr_unlock_campaigns_public_read" ON public."pr_unlock_campaigns" AS PERMISSIVE FOR SELECT TO "anon","authenticated" USING ((active = true));
DROP POLICY IF EXISTS "pr_unlock_comments_delete_own" ON public."pr_unlock_comments";
CREATE POLICY "pr_unlock_comments_delete_own" ON public."pr_unlock_comments" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = pr_unlock_comments.profile_id) AND (p.auth_user_id = auth.uid())))));
DROP POLICY IF EXISTS "pr_unlock_comments_read" ON public."pr_unlock_comments";
CREATE POLICY "pr_unlock_comments_read" ON public."pr_unlock_comments" AS PERMISSIVE FOR SELECT TO "anon","authenticated" USING (true);
DROP POLICY IF EXISTS "pr_unlock_comments_write" ON public."pr_unlock_comments";
CREATE POLICY "pr_unlock_comments_write" ON public."pr_unlock_comments" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = pr_unlock_comments.profile_id) AND (p.auth_user_id = auth.uid())))));
DROP POLICY IF EXISTS "pr_unlock_reactions_delete" ON public."pr_unlock_reactions";
CREATE POLICY "pr_unlock_reactions_delete" ON public."pr_unlock_reactions" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = pr_unlock_reactions.profile_id) AND (p.auth_user_id = auth.uid())))));
DROP POLICY IF EXISTS "pr_unlock_reactions_read" ON public."pr_unlock_reactions";
CREATE POLICY "pr_unlock_reactions_read" ON public."pr_unlock_reactions" AS PERMISSIVE FOR SELECT TO "anon","authenticated" USING (true);
DROP POLICY IF EXISTS "pr_unlock_reactions_update" ON public."pr_unlock_reactions";
CREATE POLICY "pr_unlock_reactions_update" ON public."pr_unlock_reactions" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = pr_unlock_reactions.profile_id) AND (p.auth_user_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = pr_unlock_reactions.profile_id) AND (p.auth_user_id = auth.uid())))));
DROP POLICY IF EXISTS "pr_unlock_reactions_write" ON public."pr_unlock_reactions";
CREATE POLICY "pr_unlock_reactions_write" ON public."pr_unlock_reactions" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = pr_unlock_reactions.profile_id) AND (p.auth_user_id = auth.uid())))));
DROP POLICY IF EXISTS "pr_unlock_results_read" ON public."pr_unlock_results";
CREATE POLICY "pr_unlock_results_read" ON public."pr_unlock_results" AS PERMISSIVE FOR SELECT TO "anon","authenticated" USING (true);
DROP POLICY IF EXISTS "prday_comments_testers_delete_own" ON public."prday_comments";
CREATE POLICY "prday_comments_testers_delete_own" ON public."prday_comments" AS PERMISSIVE FOR DELETE TO "authenticated" USING (((profile_id = ( SELECT mi_profile_id() AS mi_profile_id)) AND (EXISTS ( SELECT 1
   FROM prday_testers t
  WHERE ((t.profile_id = ( SELECT mi_profile_id() AS mi_profile_id)) AND t.enabled)))));
DROP POLICY IF EXISTS "prday_comments_testers_insert_own" ON public."prday_comments";
CREATE POLICY "prday_comments_testers_insert_own" ON public."prday_comments" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((profile_id = ( SELECT mi_profile_id() AS mi_profile_id)) AND (EXISTS ( SELECT 1
   FROM prday_testers t
  WHERE ((t.profile_id = ( SELECT mi_profile_id() AS mi_profile_id)) AND t.enabled))) AND (EXISTS ( SELECT 1
   FROM prday_posts p
  WHERE ((p.id = prday_comments.post_id) AND (p.deleted_at IS NULL) AND (p.expires_at > now()))))));
DROP POLICY IF EXISTS "prday_comments_testers_read" ON public."prday_comments";
CREATE POLICY "prday_comments_testers_read" ON public."prday_comments" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM prday_testers t
  WHERE ((t.profile_id = ( SELECT mi_profile_id() AS mi_profile_id)) AND t.enabled))) AND (EXISTS ( SELECT 1
   FROM prday_posts p
  WHERE ((p.id = prday_comments.post_id) AND (p.deleted_at IS NULL) AND (p.expires_at > now()))))));
DROP POLICY IF EXISTS "prday_posts_testers_insert_own" ON public."prday_posts";
CREATE POLICY "prday_posts_testers_insert_own" ON public."prday_posts" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((profile_id = ( SELECT mi_profile_id() AS mi_profile_id)) AND (deleted_at IS NULL) AND (created_at = updated_at) AND (expires_at = (created_at + '24:00:00'::interval)) AND ((created_at >= (now() - '00:01:00'::interval)) AND (created_at <= (now() + '00:01:00'::interval))) AND ("left"(media_path, (char_length(profile_id) + 1)) = (profile_id || '/'::text)) AND (EXISTS ( SELECT 1
   FROM prday_testers t
  WHERE ((t.profile_id = ( SELECT mi_profile_id() AS mi_profile_id)) AND t.enabled)))));
DROP POLICY IF EXISTS "prday_posts_testers_read_active_or_own_window" ON public."prday_posts";
CREATE POLICY "prday_posts_testers_read_active_or_own_window" ON public."prday_posts" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM prday_testers t
  WHERE ((t.profile_id = ( SELECT mi_profile_id() AS mi_profile_id)) AND t.enabled))) AND (((deleted_at IS NULL) AND (expires_at > now())) OR (profile_id = ( SELECT mi_profile_id() AS mi_profile_id)))));
DROP POLICY IF EXISTS "prday_posts_testers_update_expired_own" ON public."prday_posts";
CREATE POLICY "prday_posts_testers_update_expired_own" ON public."prday_posts" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (((profile_id = ( SELECT mi_profile_id() AS mi_profile_id)) AND (expires_at <= now()) AND (EXISTS ( SELECT 1
   FROM prday_testers t
  WHERE ((t.profile_id = ( SELECT mi_profile_id() AS mi_profile_id)) AND t.enabled))))) WITH CHECK (((profile_id = ( SELECT mi_profile_id() AS mi_profile_id)) AND (deleted_at IS NULL) AND (created_at = updated_at) AND (expires_at = (created_at + '24:00:00'::interval)) AND ((created_at >= (now() - '00:01:00'::interval)) AND (created_at <= (now() + '00:01:00'::interval))) AND ("left"(media_path, (char_length(profile_id) + 1)) = (profile_id || '/'::text)) AND (EXISTS ( SELECT 1
   FROM prday_testers t
  WHERE ((t.profile_id = ( SELECT mi_profile_id() AS mi_profile_id)) AND t.enabled)))));
DROP POLICY IF EXISTS "prday_reactions_testers_delete_own" ON public."prday_reactions";
CREATE POLICY "prday_reactions_testers_delete_own" ON public."prday_reactions" AS PERMISSIVE FOR DELETE TO "authenticated" USING (((profile_id = ( SELECT mi_profile_id() AS mi_profile_id)) AND (EXISTS ( SELECT 1
   FROM prday_testers t
  WHERE ((t.profile_id = ( SELECT mi_profile_id() AS mi_profile_id)) AND t.enabled)))));
DROP POLICY IF EXISTS "prday_reactions_testers_insert_own" ON public."prday_reactions";
CREATE POLICY "prday_reactions_testers_insert_own" ON public."prday_reactions" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((profile_id = ( SELECT mi_profile_id() AS mi_profile_id)) AND (EXISTS ( SELECT 1
   FROM prday_testers t
  WHERE ((t.profile_id = ( SELECT mi_profile_id() AS mi_profile_id)) AND t.enabled))) AND (EXISTS ( SELECT 1
   FROM prday_posts p
  WHERE ((p.id = prday_reactions.post_id) AND (p.deleted_at IS NULL) AND (p.expires_at > now()))))));
DROP POLICY IF EXISTS "prday_reactions_testers_read" ON public."prday_reactions";
CREATE POLICY "prday_reactions_testers_read" ON public."prday_reactions" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM prday_testers t
  WHERE ((t.profile_id = ( SELECT mi_profile_id() AS mi_profile_id)) AND t.enabled))) AND (EXISTS ( SELECT 1
   FROM prday_posts p
  WHERE ((p.id = prday_reactions.post_id) AND (p.deleted_at IS NULL) AND (p.expires_at > now()))))));
DROP POLICY IF EXISTS "prday_testers_read_own" ON public."prday_testers";
CREATE POLICY "prday_testers_read_own" ON public."prday_testers" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((enabled AND (profile_id = ( SELECT mi_profile_id() AS mi_profile_id))));
DROP POLICY IF EXISTS "Administradores gestionan productos" ON public."productos_pr";
CREATE POLICY "Administradores gestionan productos" ON public."productos_pr" AS PERMISSIVE FOR ALL TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.auth_user_id = auth.uid()) AND (profiles.role = 'admin'::text))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.auth_user_id = auth.uid()) AND (profiles.role = 'admin'::text)))));
DROP POLICY IF EXISTS "Productos visibles para todos" ON public."productos_pr";
CREATE POLICY "Productos visibles para todos" ON public."productos_pr" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((activo = true));
DROP POLICY IF EXISTS "Usuario actualiza su PR Avatar" ON public."profiles";
CREATE POLICY "Usuario actualiza su PR Avatar" ON public."profiles" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((((auth_user_id)::text = (auth.uid())::text) OR (id = (auth.uid())::text))) WITH CHECK ((((auth_user_id)::text = (auth.uid())::text) OR (id = (auth.uid())::text)));
DROP POLICY IF EXISTS "profiles_insert_admin" ON public."profiles";
CREATE POLICY "profiles_insert_admin" ON public."profiles" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (soy_admin());
DROP POLICY IF EXISTS "profiles_select_self_or_staff" ON public."profiles";
CREATE POLICY "profiles_select_self_or_staff" ON public."profiles" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((soy_staff() OR (auth_user_id = auth.uid()) OR (id = mi_profile_id())));
DROP POLICY IF EXISTS "profiles_select_treasury_staff" ON public."profiles";
CREATE POLICY "profiles_select_treasury_staff" ON public."profiles" AS PERMISSIVE FOR SELECT TO "authenticated" USING (puedo_gestionar_pagos());
DROP POLICY IF EXISTS "profiles_update_seguro" ON public."profiles";
CREATE POLICY "profiles_update_seguro" ON public."profiles" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (((auth_user_id = auth.uid()) OR soy_admin())) WITH CHECK (((auth_user_id = auth.uid()) OR soy_admin()));
DROP POLICY IF EXISTS "Crear comentario propio" ON public."rollerfeed_comments";
CREATE POLICY "Crear comentario propio" ON public."rollerfeed_comments" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = rollerfeed_comments.profile_id) AND (((p.auth_user_id)::text = (auth.uid())::text) OR (p.id = (auth.uid())::text))))));
DROP POLICY IF EXISTS "Eliminar comentario propio" ON public."rollerfeed_comments";
CREATE POLICY "Eliminar comentario propio" ON public."rollerfeed_comments" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((soy_staff() OR (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = rollerfeed_comments.profile_id) AND (((p.auth_user_id)::text = (auth.uid())::text) OR (p.id = (auth.uid())::text)))))));
DROP POLICY IF EXISTS "Ver comentarios del RollerFeed" ON public."rollerfeed_comments";
CREATE POLICY "Ver comentarios del RollerFeed" ON public."rollerfeed_comments" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);
DROP POLICY IF EXISTS "RollerFeed live posts visibles" ON public."rollerfeed_live_posts";
CREATE POLICY "RollerFeed live posts visibles" ON public."rollerfeed_live_posts" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((visible = true) AND (now() <= pinned_until)));
DROP POLICY IF EXISTS "Crear reaccion propia" ON public."rollerfeed_reactions";
CREATE POLICY "Crear reaccion propia" ON public."rollerfeed_reactions" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((profile_id = (auth.uid())::text) OR (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = rollerfeed_reactions.profile_id) AND ((p.id = (auth.uid())::text) OR ((p.auth_user_id)::text = (auth.uid())::text)))))));
DROP POLICY IF EXISTS "Eliminar reaccion propia" ON public."rollerfeed_reactions";
CREATE POLICY "Eliminar reaccion propia" ON public."rollerfeed_reactions" AS PERMISSIVE FOR DELETE TO "authenticated" USING (((profile_id = (auth.uid())::text) OR (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = rollerfeed_reactions.profile_id) AND ((p.id = (auth.uid())::text) OR ((p.auth_user_id)::text = (auth.uid())::text)))))));
DROP POLICY IF EXISTS "Modificar reaccion propia" ON public."rollerfeed_reactions";
CREATE POLICY "Modificar reaccion propia" ON public."rollerfeed_reactions" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (((profile_id = (auth.uid())::text) OR (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = rollerfeed_reactions.profile_id) AND ((p.id = (auth.uid())::text) OR ((p.auth_user_id)::text = (auth.uid())::text))))))) WITH CHECK (((profile_id = (auth.uid())::text) OR (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = rollerfeed_reactions.profile_id) AND ((p.id = (auth.uid())::text) OR ((p.auth_user_id)::text = (auth.uid())::text)))))));
DROP POLICY IF EXISTS "Ver reacciones del RollerFeed" ON public."rollerfeed_reactions";
CREATE POLICY "Ver reacciones del RollerFeed" ON public."rollerfeed_reactions" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);
ALTER TABLE public."actividad_pr" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."actividad_pr" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."clases_particulares_historial" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."clases_particulares_historial" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."community_album_comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."community_album_comments" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."community_album_media" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."community_album_media" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."community_album_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."community_album_members" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."community_album_photo_comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."community_album_photo_comments" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."community_album_photo_reactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."community_album_photo_reactions" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."community_album_reactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."community_album_reactions" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."community_albums" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."community_albums" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."community_blocks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."community_blocks" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."community_friend_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."community_friend_requests" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."community_friendships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."community_friendships" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."community_notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."community_notifications" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."community_post_comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."community_post_comments" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."community_post_media" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."community_post_media" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."community_post_reactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."community_post_reactions" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."community_post_tags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."community_post_tags" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."community_posts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."community_posts" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."community_privacy" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."community_privacy" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."community_reposts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."community_reposts" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."contactos_pr" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."contactos_pr" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."cuponeras_particulares" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."cuponeras_particulares" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."insignias_catalogo" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."insignias_catalogo" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pagos_pr" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pagos_pr" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_access_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_access_requests" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_activities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_activities" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_activity_goals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_activity_goals" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_activity_reactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_activity_reactions" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_campaign_benefits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_campaign_benefits" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_clinica_oct_2026_inscripciones" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_clinica_oct_2026_inscripciones" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_clinica_sept_2026_inscripciones" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_clinica_sept_2026_inscripciones" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_dm_conversations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_dm_conversations" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_dm_message_hides" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_dm_message_hides" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_dm_messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_dm_messages" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_email_campaign_sends" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_email_campaign_sends" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_email_contacts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_email_contacts" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_event_rsvps" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_event_rsvps" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_groups" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_groups" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_inscripciones_2026" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_inscripciones_2026" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_inscripciones_config" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_inscripciones_config" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_internal_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_internal_tokens" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_kids_children" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_kids_children" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_kids_family_approval_audit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_kids_family_approval_audit" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_kids_family_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_kids_family_requests" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_kids_family_review_audit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_kids_family_review_audit" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_kids_guardian_children" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_kids_guardian_children" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_kids_guardians" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_kids_guardians" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_kids_redemption_photos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_kids_redemption_photos" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_kids_redemptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_kids_redemptions" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_kids_rewards" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_kids_rewards" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_mensualidades" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_mensualidades" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_mercadopago_payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_mercadopago_payments" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_moment_comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_moment_comments" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_moment_reactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_moment_reactions" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_moments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_moments" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_music_suggestions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_music_suggestions" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_performance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_performance" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_performance_notes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_performance_notes" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_performance_objetivos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_performance_objetivos" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_performance_tomas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_performance_tomas" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_personal_config" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_personal_config" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_personal_disponibilidad" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_personal_disponibilidad" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_personal_reservas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_personal_reservas" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_profile_showcase" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_profile_showcase" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_ranking_statuses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_ranking_statuses" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_referral_codes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_referral_codes" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_referral_rewards" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_referral_rewards" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_referrals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_referrals" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_rollermap_contacts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_rollermap_contacts" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_rollermap_email_config" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_rollermap_email_config" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_rollermap_locations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_rollermap_locations" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_rollermap_public_config" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_rollermap_public_config" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_rollermap_route_actions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_rollermap_route_actions" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_rollermap_route_comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_rollermap_route_comments" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_rollermap_route_photos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_rollermap_route_photos" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_rollermap_route_ratings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_rollermap_route_ratings" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_rollermap_route_reports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_rollermap_route_reports" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_rollermap_routes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_rollermap_routes" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_rollermap_welcome" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_rollermap_welcome" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_strava_connections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_strava_connections" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_strava_reconcile_state" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_strava_reconcile_state" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_strava_sync_audit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_strava_sync_audit" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_strava_sync_state" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_strava_sync_state" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_tesoreria_config" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_tesoreria_config" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_tesoreria_movimientos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_tesoreria_movimientos" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_tesoreria_recordatorios" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_tesoreria_recordatorios" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_track_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_track_items" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_track_reports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_track_reports" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_track_scans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_track_scans" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_track_tags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_track_tags" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_training_enrollments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_training_enrollments" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_training_feed_publications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_training_feed_publications" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_training_plan_achievements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_training_plan_achievements" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_training_public_checks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_training_public_checks" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_training_task_results" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_training_task_results" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_training_tasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_training_tasks" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_unlock_campaigns" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_unlock_campaigns" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_unlock_comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_unlock_comments" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_unlock_reactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_unlock_reactions" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pr_unlock_results" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pr_unlock_results" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."prday_comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."prday_comments" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."prday_posts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."prday_posts" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."prday_reactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."prday_reactions" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."prday_testers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."prday_testers" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."productos_pr" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."productos_pr" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."profiles" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."rollerfeed_comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."rollerfeed_comments" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."rollerfeed_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."rollerfeed_events" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."rollerfeed_live_posts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."rollerfeed_live_posts" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."rollerfeed_reactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."rollerfeed_reactions" NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public."student_access_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."student_access_requests" NO FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."actividad_pr" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."clases_particulares_historial" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."community_album_comments" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."community_album_media" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."community_album_members" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."community_album_photo_comments" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."community_album_photo_reactions" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."community_album_reactions" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."community_albums" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."community_blocks" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."community_friend_requests" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."community_friendships" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."community_notifications" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."community_post_comments" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."community_post_media" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."community_post_reactions" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."community_post_tags" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."community_posts" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."community_privacy" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."community_reposts" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."contactos_pr" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."cuponeras_particulares" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."insignias_catalogo" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pagos_pr" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_access_requests" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_activities" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_activity_goals" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_activity_reactions" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_campaign_benefits" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_clinica_oct_2026_inscripciones" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_clinica_sept_2026_inscripciones" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_dm_conversations" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_dm_message_hides" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_dm_messages" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_email_campaign_sends" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_email_contacts" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_event_rsvps" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_groups" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_inscripciones_2026" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_inscripciones_config" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_internal_tokens" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_kids_children" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_kids_family_approval_audit" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_kids_family_requests" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_kids_family_review_audit" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_kids_guardian_children" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_kids_guardians" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_kids_redemption_photos" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_kids_redemptions" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_kids_rewards" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_mensualidades" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_mercadopago_payments" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_moment_comments" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_moment_reactions" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_moments" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_music_suggestions" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_performance" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_performance_notes" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_performance_objetivos" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_performance_tomas" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_personal_config" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_personal_disponibilidad" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_personal_reservas" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_profile_showcase" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_ranking_statuses" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_referral_codes" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_referral_rewards" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_referrals" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_rollermap_contacts" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_rollermap_email_config" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_rollermap_locations" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_rollermap_public_config" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_rollermap_route_actions" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_rollermap_route_comments" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_rollermap_route_photos" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_rollermap_route_ratings" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_rollermap_route_reports" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_rollermap_routes" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_rollermap_welcome" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_strava_connections" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_strava_reconcile_state" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_strava_sync_audit" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_strava_sync_state" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_tesoreria_config" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_tesoreria_movimientos" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_tesoreria_recordatorios" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_track_items" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_track_reports" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_track_scans" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_track_tags" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_training_enrollments" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_training_feed_publications" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_training_plan_achievements" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_training_public_checks" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_training_task_results" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_training_tasks" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_unlock_campaigns" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_unlock_comments" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_unlock_reactions" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_unlock_results" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."prday_comments" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."prday_posts" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."prday_reactions" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."prday_testers" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."productos_pr" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."profiles" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."rollerfeed_comments" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."rollerfeed_events" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."rollerfeed_live_posts" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."rollerfeed_reactions" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."student_access_requests" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."actividad_pr_public" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_activity_summary" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_health_snapshot" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_inline_skate_activities" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_inline_skate_public_activities" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_performance_tomas_calculadas" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_personalizadas_health" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_profiles_health" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_strava_ecosystem_health" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_strava_health" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_tesoreria_health" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_training_completed_feed" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_training_progress_public" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."pr_unlock_live_contributions" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."profiles_feed" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public."profiles_public" FROM PUBLIC, anon, authenticated, service_role;
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."actividad_pr" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."actividad_pr" TO "service_role";
GRANT SELECT ON TABLE public."actividad_pr_public" TO "anon";
GRANT SELECT ON TABLE public."actividad_pr_public" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."actividad_pr_public" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."clases_particulares_historial" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."clases_particulares_historial" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."community_album_comments" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."community_album_comments" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."community_album_comments" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."community_album_media" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."community_album_media" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."community_album_media" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."community_album_members" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."community_album_members" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."community_album_members" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."community_album_photo_comments" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."community_album_photo_comments" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."community_album_photo_comments" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."community_album_photo_reactions" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."community_album_photo_reactions" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."community_album_photo_reactions" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."community_album_reactions" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."community_album_reactions" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."community_album_reactions" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."community_albums" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."community_albums" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."community_albums" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."community_blocks" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."community_friend_requests" TO "service_role";
GRANT SELECT ON TABLE public."community_friendships" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."community_friendships" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."community_notifications" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."community_notifications" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."community_notifications" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."community_post_comments" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."community_post_comments" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."community_post_comments" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."community_post_media" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."community_post_media" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."community_post_media" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."community_post_reactions" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."community_post_reactions" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."community_post_reactions" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."community_post_tags" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."community_post_tags" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."community_post_tags" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."community_posts" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."community_posts" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."community_posts" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."community_privacy" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."community_reposts" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."community_reposts" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."community_reposts" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."contactos_pr" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."contactos_pr" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."cuponeras_particulares" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."cuponeras_particulares" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."insignias_catalogo" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."insignias_catalogo" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."insignias_catalogo" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pagos_pr" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pagos_pr" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_access_requests" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_activities" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_activities" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_activities" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_activity_goals" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_activity_goals" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_activity_goals" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_activity_reactions" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_activity_reactions" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_activity_reactions" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_activity_summary" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_activity_summary" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_activity_summary" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_campaign_benefits" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_campaign_benefits" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_campaign_benefits" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_clinica_oct_2026_inscripciones" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_clinica_oct_2026_inscripciones" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_clinica_oct_2026_inscripciones" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_clinica_sept_2026_inscripciones" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_clinica_sept_2026_inscripciones" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_clinica_sept_2026_inscripciones" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_dm_conversations" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_dm_message_hides" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_dm_messages" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_email_campaign_sends" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_email_contacts" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_event_rsvps" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_event_rsvps" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_groups" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_groups" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_groups" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_health_snapshot" TO "anon";
GRANT DELETE,INSERT,REFERENCES,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_health_snapshot" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_health_snapshot" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_inline_skate_activities" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_inline_skate_activities" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_inline_skate_activities" TO "service_role";
GRANT SELECT ON TABLE public."pr_inline_skate_public_activities" TO "anon";
GRANT SELECT ON TABLE public."pr_inline_skate_public_activities" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_inline_skate_public_activities" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_inscripciones_2026" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_inscripciones_2026" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_inscripciones_2026" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_inscripciones_config" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_inscripciones_config" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_inscripciones_config" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_internal_tokens" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_internal_tokens" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_internal_tokens" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_kids_children" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_kids_family_approval_audit" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_kids_family_requests" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_kids_family_review_audit" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_kids_guardian_children" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_kids_guardians" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_kids_redemption_photos" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_kids_redemption_photos" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_kids_redemption_photos" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_kids_redemptions" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_kids_redemptions" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_kids_redemptions" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_kids_rewards" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_kids_rewards" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_kids_rewards" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,UPDATE ON TABLE public."pr_mensualidades" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,UPDATE ON TABLE public."pr_mensualidades" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_mensualidades" TO "service_role";
GRANT SELECT ON TABLE public."pr_mercadopago_payments" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_mercadopago_payments" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_moment_comments" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_moment_comments" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_moment_comments" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_moment_reactions" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_moment_reactions" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_moment_reactions" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_moments" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_moments" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_moments" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_music_suggestions" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_music_suggestions" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_music_suggestions" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_performance" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_performance" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_performance" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_performance_notes" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_performance_notes" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_performance_notes" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_performance_objetivos" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_performance_objetivos" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_performance_objetivos" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_performance_tomas" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_performance_tomas" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_performance_tomas" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_performance_tomas_calculadas" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_performance_tomas_calculadas" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_performance_tomas_calculadas" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_personal_config" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_personal_config" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_personal_config" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_personal_disponibilidad" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_personal_disponibilidad" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_personal_disponibilidad" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_personal_reservas" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_personal_reservas" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_personal_reservas" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_personalizadas_health" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_personalizadas_health" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_personalizadas_health" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_profile_showcase" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_profile_showcase" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_profile_showcase" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_profiles_health" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_profiles_health" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_profiles_health" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_ranking_statuses" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_ranking_statuses" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_ranking_statuses" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_referral_codes" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_referral_codes" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_referral_codes" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_referral_rewards" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_referral_rewards" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_referral_rewards" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_referrals" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_referrals" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_referrals" TO "service_role";
GRANT DELETE,INSERT,SELECT,UPDATE ON TABLE public."pr_rollermap_contacts" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_rollermap_contacts" TO "service_role";
GRANT SELECT,UPDATE ON TABLE public."pr_rollermap_email_config" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_rollermap_email_config" TO "service_role";
GRANT SELECT ON TABLE public."pr_rollermap_locations" TO "anon";
GRANT DELETE,INSERT,SELECT,UPDATE ON TABLE public."pr_rollermap_locations" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_rollermap_locations" TO "service_role";
GRANT SELECT ON TABLE public."pr_rollermap_public_config" TO "anon";
GRANT SELECT ON TABLE public."pr_rollermap_public_config" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_rollermap_public_config" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_rollermap_route_actions" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_rollermap_route_actions" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_rollermap_route_actions" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_rollermap_route_comments" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_rollermap_route_comments" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_rollermap_route_comments" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_rollermap_route_photos" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_rollermap_route_photos" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_rollermap_route_photos" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_rollermap_route_ratings" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_rollermap_route_ratings" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_rollermap_route_ratings" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_rollermap_route_reports" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_rollermap_route_reports" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_rollermap_route_reports" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_rollermap_routes" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_rollermap_routes" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_rollermap_routes" TO "service_role";
GRANT SELECT ON TABLE public."pr_rollermap_welcome" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_rollermap_welcome" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_strava_connections" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_strava_connections" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_strava_connections" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_strava_ecosystem_health" TO "anon";
GRANT DELETE,INSERT,REFERENCES,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_strava_ecosystem_health" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_strava_ecosystem_health" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_strava_health" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_strava_health" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_strava_health" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_strava_reconcile_state" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_strava_sync_audit" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_strava_sync_state" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_strava_sync_state" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_strava_sync_state" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_tesoreria_config" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_tesoreria_config" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_tesoreria_config" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_tesoreria_health" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_tesoreria_health" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_tesoreria_health" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,UPDATE ON TABLE public."pr_tesoreria_movimientos" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,UPDATE ON TABLE public."pr_tesoreria_movimientos" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_tesoreria_movimientos" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_tesoreria_recordatorios" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_tesoreria_recordatorios" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_tesoreria_recordatorios" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_track_items" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_track_items" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_track_items" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_track_reports" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_track_reports" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_track_reports" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_track_scans" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_track_scans" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_track_scans" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_track_tags" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_track_tags" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_track_tags" TO "service_role";
GRANT SELECT ON TABLE public."pr_training_completed_feed" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_training_completed_feed" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_training_enrollments" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_training_enrollments" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_training_enrollments" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_training_feed_publications" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_training_feed_publications" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_training_feed_publications" TO "service_role";
GRANT SELECT ON TABLE public."pr_training_plan_achievements" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_training_plan_achievements" TO "service_role";
GRANT SELECT ON TABLE public."pr_training_progress_public" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_training_progress_public" TO "service_role";
GRANT SELECT ON TABLE public."pr_training_public_checks" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_training_public_checks" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_training_task_results" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_training_task_results" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_training_task_results" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_training_tasks" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_training_tasks" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_training_tasks" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_unlock_campaigns" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_unlock_campaigns" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_unlock_campaigns" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_unlock_comments" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_unlock_comments" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_unlock_comments" TO "service_role";
GRANT SELECT ON TABLE public."pr_unlock_live_contributions" TO "anon";
GRANT SELECT ON TABLE public."pr_unlock_live_contributions" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_unlock_live_contributions" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_unlock_reactions" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_unlock_reactions" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_unlock_reactions" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_unlock_results" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_unlock_results" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."pr_unlock_results" TO "service_role";
GRANT DELETE,INSERT,SELECT ON TABLE public."prday_comments" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."prday_comments" TO "service_role";
GRANT INSERT,SELECT,UPDATE ON TABLE public."prday_posts" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."prday_posts" TO "service_role";
GRANT DELETE,INSERT,SELECT ON TABLE public."prday_reactions" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."prday_reactions" TO "service_role";
GRANT SELECT ON TABLE public."prday_testers" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."prday_testers" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."productos_pr" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."productos_pr" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."productos_pr" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,UPDATE ON TABLE public."profiles" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."profiles" TO "service_role";
GRANT SELECT ON TABLE public."profiles_feed" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."profiles_feed" TO "service_role";
GRANT SELECT ON TABLE public."profiles_public" TO "anon";
GRANT SELECT ON TABLE public."profiles_public" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."profiles_public" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."rollerfeed_comments" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."rollerfeed_comments" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."rollerfeed_comments" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."rollerfeed_events" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."rollerfeed_events" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."rollerfeed_events" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."rollerfeed_live_posts" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."rollerfeed_live_posts" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."rollerfeed_live_posts" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."rollerfeed_reactions" TO "anon";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."rollerfeed_reactions" TO "authenticated";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."rollerfeed_reactions" TO "service_role";
GRANT DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE ON TABLE public."student_access_requests" TO "service_role";

