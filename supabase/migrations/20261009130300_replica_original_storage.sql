-- Bucket configuration and original policies only. No production objects copied.
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types) VALUES('avatars','avatars',true,NULL,NULL) ON CONFLICT(id) DO UPDATE SET public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types) VALUES('banners','banners',true,NULL,NULL) ON CONFLICT(id) DO UPDATE SET public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types) VALUES('professors','professors',true,NULL,NULL) ON CONFLICT(id) DO UPDATE SET public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types) VALUES('observations','observations',true,NULL,NULL) ON CONFLICT(id) DO UPDATE SET public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types) VALUES('products','products',true,NULL,NULL) ON CONFLICT(id) DO UPDATE SET public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types) VALUES('badges','badges',true,NULL,NULL) ON CONFLICT(id) DO UPDATE SET public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types) VALUES('pr-chat-media','pr-chat-media',true,10485760,ARRAY['image/jpeg','image/png','image/webp','image/gif','audio/webm','audio/ogg','audio/mpeg','audio/mp4','audio/wav']::text[]) ON CONFLICT(id) DO UPDATE SET public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types) VALUES('prday-media','prday-media',false,8388608,ARRAY['image/jpeg','image/png','image/webp']::text[]) ON CONFLICT(id) DO UPDATE SET public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types) VALUES('pr-moments','pr-moments',false,15728640,ARRAY['image/jpeg','image/png','image/webp','video/mp4','video/webm','video/quicktime']::text[]) ON CONFLICT(id) DO UPDATE SET public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types) VALUES('pr-profile-media','pr-profile-media',true,26214400,ARRAY['image/jpeg','image/png','image/webp']::text[]) ON CONFLICT(id) DO UPDATE SET public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types) VALUES('community-media','community-media',true,26214400,ARRAY['image/jpeg','image/png','image/webp']::text[]) ON CONFLICT(id) DO UPDATE SET public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types) VALUES('community-albums','community-albums',true,26214400,ARRAY['image/jpeg','image/png','image/webp']::text[]) ON CONFLICT(id) DO UPDATE SET public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types) VALUES('pr-tracking-media','pr-tracking-media',true,26214400,ARRAY['image/jpeg','image/png','image/webp']::text[]) ON CONFLICT(id) DO UPDATE SET public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types) VALUES('pr-kids-sellos','pr-kids-sellos',false,20971520,ARRAY['image/jpeg','image/png','image/webp','image/heic','image/heif']::text[]) ON CONFLICT(id) DO UPDATE SET public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types) VALUES('pr-rollermap-images','pr-rollermap-images',true,5242880,ARRAY['image/jpeg','image/png','image/webp']::text[]) ON CONFLICT(id) DO UPDATE SET public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
DROP POLICY IF EXISTS "avatars_banners_delete_seguro" ON storage."objects";
CREATE POLICY "avatars_banners_delete_seguro" ON storage."objects" AS PERMISSIVE FOR DELETE TO "authenticated" USING (((bucket_id = ANY (ARRAY['avatars'::text, 'banners'::text])) AND (((storage.foldername(name))[1] = mi_profile_id()) OR soy_admin())));
DROP POLICY IF EXISTS "avatars_banners_insert_seguro" ON storage."objects";
CREATE POLICY "avatars_banners_insert_seguro" ON storage."objects" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((bucket_id = ANY (ARRAY['avatars'::text, 'banners'::text])) AND (((storage.foldername(name))[1] = mi_profile_id()) OR soy_admin())));
DROP POLICY IF EXISTS "avatars_banners_select_seguro" ON storage."objects";
CREATE POLICY "avatars_banners_select_seguro" ON storage."objects" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((bucket_id = ANY (ARRAY['avatars'::text, 'banners'::text])) AND (((storage.foldername(name))[1] = mi_profile_id()) OR soy_admin())));
DROP POLICY IF EXISTS "avatars_banners_update_seguro" ON storage."objects";
CREATE POLICY "avatars_banners_update_seguro" ON storage."objects" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (((bucket_id = ANY (ARRAY['avatars'::text, 'banners'::text])) AND (((storage.foldername(name))[1] = mi_profile_id()) OR soy_admin()))) WITH CHECK (((bucket_id = ANY (ARRAY['avatars'::text, 'banners'::text])) AND (((storage.foldername(name))[1] = mi_profile_id()) OR soy_admin())));
DROP POLICY IF EXISTS "badges_delete_admin" ON storage."objects";
CREATE POLICY "badges_delete_admin" ON storage."objects" AS PERMISSIVE FOR DELETE TO "authenticated" USING (((bucket_id = 'badges'::text) AND soy_admin()));
DROP POLICY IF EXISTS "badges_insert_staff" ON storage."objects";
CREATE POLICY "badges_insert_staff" ON storage."objects" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((bucket_id = 'badges'::text) AND soy_staff()));
DROP POLICY IF EXISTS "badges_select_staff" ON storage."objects";
CREATE POLICY "badges_select_staff" ON storage."objects" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((bucket_id = 'badges'::text) AND soy_staff()));
DROP POLICY IF EXISTS "badges_update_staff" ON storage."objects";
CREATE POLICY "badges_update_staff" ON storage."objects" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (((bucket_id = 'badges'::text) AND soy_staff())) WITH CHECK (((bucket_id = 'badges'::text) AND soy_staff()));
DROP POLICY IF EXISTS "community_album_storage_delete" ON storage."objects";
CREATE POLICY "community_album_storage_delete" ON storage."objects" AS PERMISSIVE FOR DELETE TO "authenticated" USING (((bucket_id = 'community-albums'::text) AND (((storage.foldername(name))[1] = pr_current_profile_id()) OR ((storage.foldername(name))[1] = (auth.uid())::text))));
DROP POLICY IF EXISTS "community_album_storage_insert" ON storage."objects";
CREATE POLICY "community_album_storage_insert" ON storage."objects" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((bucket_id = 'community-albums'::text) AND (((storage.foldername(name))[1] = pr_current_profile_id()) OR ((storage.foldername(name))[1] = (auth.uid())::text))));
DROP POLICY IF EXISTS "community_media_delete" ON storage."objects";
CREATE POLICY "community_media_delete" ON storage."objects" AS PERMISSIVE FOR DELETE TO "authenticated" USING (((bucket_id = 'community-media'::text) AND (((storage.foldername(name))[1] = pr_current_profile_id()) OR ((storage.foldername(name))[1] = (auth.uid())::text))));
DROP POLICY IF EXISTS "community_media_insert" ON storage."objects";
CREATE POLICY "community_media_insert" ON storage."objects" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((bucket_id = 'community-media'::text) AND (((storage.foldername(name))[1] = pr_current_profile_id()) OR ((storage.foldername(name))[1] = (auth.uid())::text))));
DROP POLICY IF EXISTS "community_media_update" ON storage."objects";
CREATE POLICY "community_media_update" ON storage."objects" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (((bucket_id = 'community-media'::text) AND (((storage.foldername(name))[1] = pr_current_profile_id()) OR ((storage.foldername(name))[1] = (auth.uid())::text)))) WITH CHECK (((bucket_id = 'community-media'::text) AND (((storage.foldername(name))[1] = pr_current_profile_id()) OR ((storage.foldername(name))[1] = (auth.uid())::text))));
DROP POLICY IF EXISTS "explorer_rollermap_image_owner_delete" ON storage."objects";
CREATE POLICY "explorer_rollermap_image_owner_delete" ON storage."objects" AS PERMISSIVE FOR DELETE TO "authenticated" USING (((bucket_id = 'pr-rollermap-images'::text) AND (owner_id = ( SELECT (auth.uid())::text AS uid)) AND ((storage.foldername(name))[1] = ( SELECT (auth.uid())::text AS uid))));
DROP POLICY IF EXISTS "explorer_rollermap_image_upload" ON storage."objects";
CREATE POLICY "explorer_rollermap_image_upload" ON storage."objects" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((bucket_id = 'pr-rollermap-images'::text) AND ((storage.foldername(name))[1] = ( SELECT (auth.uid())::text AS uid))));
DROP POLICY IF EXISTS "observations_delete_admin" ON storage."objects";
CREATE POLICY "observations_delete_admin" ON storage."objects" AS PERMISSIVE FOR DELETE TO "authenticated" USING (((bucket_id = 'observations'::text) AND soy_admin()));
DROP POLICY IF EXISTS "observations_insert_staff" ON storage."objects";
CREATE POLICY "observations_insert_staff" ON storage."objects" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((bucket_id = 'observations'::text) AND soy_staff()));
DROP POLICY IF EXISTS "observations_select_staff" ON storage."objects";
CREATE POLICY "observations_select_staff" ON storage."objects" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((bucket_id = 'observations'::text) AND soy_staff()));
DROP POLICY IF EXISTS "observations_update_staff" ON storage."objects";
CREATE POLICY "observations_update_staff" ON storage."objects" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (((bucket_id = 'observations'::text) AND soy_staff())) WITH CHECK (((bucket_id = 'observations'::text) AND soy_staff()));
DROP POLICY IF EXISTS "pr kids sellos authenticated read" ON storage."objects";
CREATE POLICY "pr kids sellos authenticated read" ON storage."objects" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((bucket_id = 'pr-kids-sellos'::text));
DROP POLICY IF EXISTS "pr kids sellos uploads" ON storage."objects";
CREATE POLICY "pr kids sellos uploads" ON storage."objects" AS PERMISSIVE FOR INSERT TO "anon","authenticated" WITH CHECK (((bucket_id = 'pr-kids-sellos'::text) AND ((storage.foldername(name))[1] = 'redemptions'::text)));
DROP POLICY IF EXISTS "pr_chat_media_insert" ON storage."objects";
CREATE POLICY "pr_chat_media_insert" ON storage."objects" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((bucket_id = 'pr-chat-media'::text));
DROP POLICY IF EXISTS "pr_chat_media_update" ON storage."objects";
CREATE POLICY "pr_chat_media_update" ON storage."objects" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((bucket_id = 'pr-chat-media'::text)) WITH CHECK ((bucket_id = 'pr-chat-media'::text));
DROP POLICY IF EXISTS "pr_moments_media_delete" ON storage."objects";
CREATE POLICY "pr_moments_media_delete" ON storage."objects" AS PERMISSIVE FOR DELETE TO "authenticated" USING (((bucket_id = 'pr-moments'::text) AND (((storage.foldername(name))[1] = pr_current_profile_id()) OR soy_admin())));
DROP POLICY IF EXISTS "pr_moments_media_insert" ON storage."objects";
CREATE POLICY "pr_moments_media_insert" ON storage."objects" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((bucket_id = 'pr-moments'::text) AND ((storage.foldername(name))[1] = pr_current_profile_id())));
DROP POLICY IF EXISTS "pr_moments_media_select" ON storage."objects";
CREATE POLICY "pr_moments_media_select" ON storage."objects" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((bucket_id = 'pr-moments'::text));
DROP POLICY IF EXISTS "pr_tracking_media_owner_delete" ON storage."objects";
CREATE POLICY "pr_tracking_media_owner_delete" ON storage."objects" AS PERMISSIVE FOR DELETE TO "authenticated" USING (((bucket_id = 'pr-tracking-media'::text) AND (owner_id = ( SELECT (auth.uid())::text AS uid))));
DROP POLICY IF EXISTS "pr_tracking_media_owner_insert" ON storage."objects";
CREATE POLICY "pr_tracking_media_owner_insert" ON storage."objects" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((bucket_id = 'pr-tracking-media'::text) AND ((storage.foldername(name))[1] = pr_track_current_profile_id()) AND (EXISTS ( SELECT 1
   FROM pr_track_items i
  WHERE (((i.id)::text = (storage.foldername(objects.name))[2]) AND ((i.alumno_id = pr_track_current_profile_id()) OR pr_track_is_staff()))))));
DROP POLICY IF EXISTS "pr_tracking_media_owner_update" ON storage."objects";
CREATE POLICY "pr_tracking_media_owner_update" ON storage."objects" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (((bucket_id = 'pr-tracking-media'::text) AND (owner_id = ( SELECT (auth.uid())::text AS uid)))) WITH CHECK (((bucket_id = 'pr-tracking-media'::text) AND (owner_id = ( SELECT (auth.uid())::text AS uid))));
DROP POLICY IF EXISTS "prday_media_testers_delete_own" ON storage."objects";
CREATE POLICY "prday_media_testers_delete_own" ON storage."objects" AS PERMISSIVE FOR DELETE TO "authenticated" USING (((bucket_id = 'prday-media'::text) AND ((storage.foldername(name))[1] = ( SELECT mi_profile_id() AS mi_profile_id)) AND (EXISTS ( SELECT 1
   FROM prday_testers t
  WHERE ((t.profile_id = ( SELECT mi_profile_id() AS mi_profile_id)) AND t.enabled))) AND (NOT (EXISTS ( SELECT 1
   FROM prday_posts p
  WHERE ((p.profile_id = ( SELECT mi_profile_id() AS mi_profile_id)) AND (p.media_path = objects.name) AND (p.deleted_at IS NULL) AND (p.expires_at > now())))))));
DROP POLICY IF EXISTS "prday_media_testers_insert_own" ON storage."objects";
CREATE POLICY "prday_media_testers_insert_own" ON storage."objects" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((bucket_id = 'prday-media'::text) AND ((storage.foldername(name))[1] = ( SELECT mi_profile_id() AS mi_profile_id)) AND (EXISTS ( SELECT 1
   FROM prday_testers t
  WHERE ((t.profile_id = ( SELECT mi_profile_id() AS mi_profile_id)) AND t.enabled)))));
DROP POLICY IF EXISTS "prday_media_testers_read" ON storage."objects";
CREATE POLICY "prday_media_testers_read" ON storage."objects" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((bucket_id = 'prday-media'::text) AND (EXISTS ( SELECT 1
   FROM prday_testers t
  WHERE ((t.profile_id = ( SELECT mi_profile_id() AS mi_profile_id)) AND t.enabled)))));
DROP POLICY IF EXISTS "products_delete_admin" ON storage."objects";
CREATE POLICY "products_delete_admin" ON storage."objects" AS PERMISSIVE FOR DELETE TO "authenticated" USING (((bucket_id = 'products'::text) AND soy_admin()));
DROP POLICY IF EXISTS "products_insert_admin" ON storage."objects";
CREATE POLICY "products_insert_admin" ON storage."objects" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((bucket_id = 'products'::text) AND soy_admin()));
DROP POLICY IF EXISTS "products_select_admin" ON storage."objects";
CREATE POLICY "products_select_admin" ON storage."objects" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((bucket_id = 'products'::text) AND soy_admin()));
DROP POLICY IF EXISTS "products_update_admin" ON storage."objects";
CREATE POLICY "products_update_admin" ON storage."objects" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (((bucket_id = 'products'::text) AND soy_admin())) WITH CHECK (((bucket_id = 'products'::text) AND soy_admin()));
DROP POLICY IF EXISTS "professors_delete_admin" ON storage."objects";
CREATE POLICY "professors_delete_admin" ON storage."objects" AS PERMISSIVE FOR DELETE TO "authenticated" USING (((bucket_id = 'professors'::text) AND soy_admin()));
DROP POLICY IF EXISTS "professors_insert_admin" ON storage."objects";
CREATE POLICY "professors_insert_admin" ON storage."objects" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((bucket_id = 'professors'::text) AND soy_admin()));
DROP POLICY IF EXISTS "professors_select_admin" ON storage."objects";
CREATE POLICY "professors_select_admin" ON storage."objects" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((bucket_id = 'professors'::text) AND soy_admin()));
DROP POLICY IF EXISTS "professors_update_admin" ON storage."objects";
CREATE POLICY "professors_update_admin" ON storage."objects" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (((bucket_id = 'professors'::text) AND soy_admin())) WITH CHECK (((bucket_id = 'professors'::text) AND soy_admin()));
DROP POLICY IF EXISTS "profile_media_delete" ON storage."objects";
CREATE POLICY "profile_media_delete" ON storage."objects" AS PERMISSIVE FOR DELETE TO "authenticated" USING (((bucket_id = 'pr-profile-media'::text) AND (((storage.foldername(name))[1] = pr_current_profile_id()) OR ((storage.foldername(name))[1] = (auth.uid())::text))));
DROP POLICY IF EXISTS "profile_media_insert" ON storage."objects";
CREATE POLICY "profile_media_insert" ON storage."objects" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((bucket_id = 'pr-profile-media'::text) AND (((storage.foldername(name))[1] = pr_current_profile_id()) OR ((storage.foldername(name))[1] = (auth.uid())::text))));
DROP POLICY IF EXISTS "profile_media_update" ON storage."objects";
CREATE POLICY "profile_media_update" ON storage."objects" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (((bucket_id = 'pr-profile-media'::text) AND (((storage.foldername(name))[1] = pr_current_profile_id()) OR ((storage.foldername(name))[1] = (auth.uid())::text)))) WITH CHECK (((bucket_id = 'pr-profile-media'::text) AND (((storage.foldername(name))[1] = pr_current_profile_id()) OR ((storage.foldername(name))[1] = (auth.uid())::text))));
DROP POLICY IF EXISTS "rollermap_images_admin" ON storage."objects";
CREATE POLICY "rollermap_images_admin" ON storage."objects" AS PERMISSIVE FOR ALL TO "authenticated" USING (((bucket_id = 'pr-rollermap-images'::text) AND soy_admin())) WITH CHECK (((bucket_id = 'pr-rollermap-images'::text) AND soy_admin()));

