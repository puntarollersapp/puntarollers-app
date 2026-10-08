# Revisión de permisos de Tesorería — 08/10/2026

## Evidencia (consultas de solo lectura)
- La tabla `public.pr_tesoreria_movimientos` tiene 60 registros; ninguno con monto negativo, cero o NULL.
- No se detectaron triggers propios en esa tabla.
- Las políticas RLS incluyen `tesoreria gestiona movimientos` (ALL) y `tesoreria puede ver movimientos` (SELECT); ambas dependen de `puedo_gestionar_pagos()`.
- Los roles `anon` y `authenticated` tienen concesiones a nivel de tabla para SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES y TRIGGER. RLS limita acceso a filas pero no sustituye la reducción de permisos de tabla, y operaciones como TRUNCATE no están sujetas a RLS.
- `puedo_gestionar_pagos()` devuelve `soy_admin() OR soy_tesoreria()`.
- En `profiles`: 1 admin, 1 tesorería, 2 profesores (los grupos podrían solaparse).

## Acciones recomendadas (sin ejecutar)
1. Revocar TRUNCATE y TRIGGER a `anon` y `authenticated` para tablas financieras. Auditar además concesiones sobre `pr_mensualidades` y otras tablas sensibles.
2. Revisar privilegios y dependencias del frontend/RPC antes de revocar DML. El RPC de registro de pagos es SECURITY DEFINER y tiene su propio control de autorización.
3. Mantener SELECT/DML exclusivamente donde el flujo administrativo lo necesite; revisar políticas RLS con roles de prueba.
4. Probar que usuario anónimo/alumno no puede leer, escribir ni truncar movimientos, mientras Tesorería y admin sí realizan operaciones autorizadas.
5. Respaldo recuperable y despliegue reversible antes de cambiar permisos en producción.

**No se modificaron datos ni grants.** Este documento no certifica que una operación no autorizada sea explotable; identifica permisos excesivos y la necesidad de validación.
