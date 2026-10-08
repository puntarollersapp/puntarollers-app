# Seguridad de perfiles — incidente y plan de corrección (08-10-2026)

## Hallazgo confirmado en producción (solo lectura)
- `public.proteger_campos_profile()` es `SECURITY DEFINER` y su propietario es `postgres`.
- La primera condición es `IF current_user IN ('postgres','service_role') THEN RETURN NEW;`.
- En una función SECURITY DEFINER, `current_user` es el propietario efectivo (`postgres`): el trigger permite actualizaciones antes de verificar los campos.
- `authenticated` tiene permiso UPDATE sobre `public.profiles`; hay políticas UPDATE que permiten al usuario modificar su fila.
- Los campos `role`, `es_tesoreria`, `es_profesor`, `auth_user_id` y otros privilegios están en la misma tabla.
- `soy_admin()` lee `role` y `soy_tesoreria()` lee `es_tesoreria` de profiles, por lo que la integridad de esos campos es esencial.

## Prioridad
ALTA. No se comprobó explotación real ni se modificaron datos. No desplegar cambios financieros o de permisos sin pruebas.

## Corrección propuesta (NO aplicada)
1. Inventariar todas las columnas de `profiles` y los UPDATE directos del cliente (especialmente panel admin, profesores y tesorería).
2. Preferir defensa a nivel de permisos de columna: quitar UPDATE genérico a `authenticated` y conceder UPDATE únicamente sobre columnas editables por el alumno. Esto mantiene los RPC SECURITY DEFINER de pagos funcionando, pero puede requerir nuevos RPC administrativos para operaciones hoy realizadas con UPDATE directo.
3. Corregir el trigger para que NO confíe en `current_user` como indicador de la identidad del solicitante y para que valide cambios a todos los campos privilegiados, incluyendo `es_tesoreria` y `es_profesor`. Evaluar los RPC legítimos que actualizan pagos antes de activar el nuevo trigger.
4. Ensayar en un entorno aislado con usuarios alumno, profesor, tesorería y administrador. Verificar que un alumno no pueda cambiar permisos y que los RPC de pago mantengan funcionamiento.
5. Antes de tocar producción, obtener respaldo recuperable de datos y esquema; contar con plan de rollback. No ejecutar cambios de pagos ni borrar registros.

## Pruebas mínimas antes de despliegue
- Alumno: modificar foto/biografía funciona; modificar `role`, `es_tesoreria`, `es_profesor`, `acceso_habilitado` y fechas de pagos es denegado.
- Tesorería: registrar y acreditar pago mediante RPC funciona y no duplica movimientos en reintentos.
- Administrador: editar roles y datos permitidos mediante ruta autorizada funciona.
- Profesor: conserva permisos actuales, sin capacidad de escalar privilegios.
- Usuario no autenticado: no puede actualizar perfiles.
- Validar integridad de datos financieros pre/post y comparar auditoría de RLS.

## Aislamiento
Esta nota pertenece a `maintenance/current-platform-audit`. No modificar `beta/pr-next-work-batch` ni fusionar con `main` hasta completar las pruebas.
