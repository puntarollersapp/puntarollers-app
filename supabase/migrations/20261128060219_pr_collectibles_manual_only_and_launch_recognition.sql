-- Only manual-only rules may be granted by the owner through the admin panel.
ALTER POLICY pr_collectibles_grants_insert ON public.pr_collectibles_grants
WITH CHECK (
 public.pr_frames_is_admin() AND public.pr_current_profile_id()='admin-claudio'
 AND granted_by=public.pr_current_profile_id()
 AND source='manual'
 AND card_code IN ('PR-023','PR-033','PR-034','PR-043','PR-045','PR-046','PR-047','PR-048','PR-049','PR-050')
 AND EXISTS (SELECT 1 FROM public.pr_collectibles_catalog c WHERE c.code=card_code AND c.grant_enabled)
 AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=profile_id AND (p.role='alumno' OR p.participa_como_alumno IS TRUE))
);
-- One-time founding release recognition for the current active roster, explicitly approved by PR.
-- This is not a QR scan and does not modify attendance, payments, or activity statistics.
INSERT INTO public.pr_collectibles_grants(profile_id,card_code,granted_by,reason,source)
SELECT p.id,v.code,NULL,v.reason,'automatic'
FROM public.profiles p
CROSS JOIN (VALUES
 ('PR-002','Reconocimiento de primera clase al aire libre confirmado por Punta Rollers para el padrón activo al lanzamiento.'),
 ('PR-044','Edición conmemorativa de los 10 años de Punta Rollers para el padrón activo al lanzamiento.')
) v(code,reason)
JOIN public.pr_collectibles_catalog c ON c.code=v.code AND c.grant_enabled
WHERE p.estado='Activo' AND (p.role='alumno' OR p.participa_como_alumno IS TRUE)
ON CONFLICT(profile_id,card_code) DO NOTHING;
