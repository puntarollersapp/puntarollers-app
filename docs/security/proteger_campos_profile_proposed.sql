-- PREPARED ONLY: do not execute without staging tests and a recoverable backup.
-- The current trigger uses current_user in a SECURITY DEFINER function owned by postgres.
-- Fix privilege escalation without modifying historical payments.
CREATE OR REPLACE FUNCTION public.proteger_campos_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- current_user is NOT the caller for SECURITY DEFINER functions.
  IF auth.role() = 'service_role' OR public.soy_admin() THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NULL OR OLD.auth_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'No podés modificar este perfil.';
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role
    OR NEW.es_tesoreria IS DISTINCT FROM OLD.es_tesoreria
    OR NEW.es_profesor IS DISTINCT FROM OLD.es_profesor
    OR NEW.auth_user_id IS DISTINCT FROM OLD.auth_user_id
    OR NEW.auth_migrado IS DISTINCT FROM OLD.auth_migrado
    OR NEW.auth_migrado_en IS DISTINCT FROM OLD.auth_migrado_en
    OR NEW.documento IS DISTINCT FROM OLD.documento
    OR NEW.pin IS DISTINCT FROM OLD.pin
    OR NEW.estado IS DISTINCT FROM OLD.estado
    OR NEW.acceso_habilitado IS DISTINCT FROM OLD.acceso_habilitado
    OR NEW.mensualidad_hasta IS DISTINCT FROM OLD.mensualidad_hasta
    OR NEW.ultimo_pago IS DISTINCT FROM OLD.ultimo_pago
    OR NEW.prcard_activa IS DISTINCT FROM OLD.prcard_activa
    OR NEW.tracking_activo IS DISTINCT FROM OLD.tracking_activo
    OR NEW.verificado IS DISTINCT FROM OLD.verificado
    OR NEW.grupos_info IS DISTINCT FROM OLD.grupos_info
    OR NEW.exento_mensualidad IS DISTINCT FROM OLD.exento_mensualidad
    OR NEW.particulares_habilitadas IS DISTINCT FROM OLD.particulares_habilitadas
  THEN
    RAISE EXCEPTION 'Ese dato solo puede modificarlo el equipo de Punta Rollers.';
  END IF;

  RETURN NEW;
END;
$$;
