-- PR Beta: treasury permission must never be granted to beta identities.
-- REVIEW BEFORE APPLYING to the shared production Supabase database.
-- Preserves the existing treasury flag behavior for every non-beta role.
CREATE OR REPLACE FUNCTION public.soy_tesoreria()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE((
    SELECT es_tesoreria IS TRUE AND role IS DISTINCT FROM 'beta'
    FROM public.profiles
    WHERE auth_user_id = auth.uid()
    LIMIT 1
  ), false);
$function$;
