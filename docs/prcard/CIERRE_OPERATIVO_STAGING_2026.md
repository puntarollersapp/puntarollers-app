# PR Card — cierre operativo seguro (staging → producción)

Actualizado: 2026-10-29. **No confundir código en rama con funcionalidad publicada.**

## Estado comprobado
- Rama: `feature/prcard-unificacion-2026`; PR de revisión #79. No fusionar antes de pruebas.
- Staging: `nvrapvbbenyojkjgxfkj`. `prcard_benefits` tiene **22 registros** y RLS habilitado; `prcard_membership_links` está vacía.
- Staging: `prcard_requests` **NO existe** en la última inspección; no hay que declarar solicitudes operativas.
- Staging: solo `prcard-benefits` está desplegada, versión 1. `prcard-requests` y `prcard-admin-benefits` NO están desplegadas.
- Las operaciones de escritura en Supabase fueron bloqueadas por controles del entorno. No se debe intentar eludir ese bloqueo ni modificar producción para resolverlo.
- El catálogo está preparado, pero ningún perfil de staging tiene un vínculo PR Card verificado; la API de beneficios debe denegar el acceso en ese caso.

## Orden de activación — solo en staging
1. Revisar que `public.profiles` tenga `id`, `auth_user_id`, `role`, `nombre`, `apellido`, `documento`, `email`, `fecha_nacimiento`, `prcard_activa`. Si algún campo difiere, adaptar la función antes de desplegar.
2. Revisar y aplicar `docs/prcard/staging_requests_schema_review.sql` exclusivamente en staging. Confirmar RLS activado, ausencia de políticas públicas, privilegios anon/auth revocados e índice único para solicitudes pendientes.
3. Desplegar `supabase/functions/prcard-requests/index.ts` con JWT requerido.
4. Desplegar `supabase/functions/prcard-admin-benefits/index.ts` con JWT requerido.
5. Actualizar `supabase/functions/prcard-benefits/index.ts` con JWT requerido; verificar que los headers CORS permitan el cliente actual.
6. Confirmar que la beta está conectada **solo** al proyecto staging. Nunca apuntar una beta de pruebas a producción sin revisión.
7. Verificar en sesión autenticada: GET de solicitudes propias, POST de solicitud completa, duplicado rechazado, GET admin denegado a alumnos, GET admin autorizado, aprobación sin activación automática y rechazo.
8. Verificar catálogo: GET admin, edición de comercio, logo, términos, vigencia, orden, destacados y visibilidad. Un alumno no puede leer ni editar el catálogo administrativo.
9. Verificar beneficios: alumno sin vínculo verificado no ve ofertas; miembro con vínculo verificado y vigente sí ve solo beneficios activos; tarjeta vencida o inactiva no ve ofertas.
10. Confirmar que el flujo no altera `profiles.pin`, fotos, badges, asistencias, pagos, créditos, reservas ni PR Kids.

## Criterios de aceptación
- 22 comercios migrados, 15 activos y 7 inactivos según la última inspección del catálogo de staging; validar contra legado antes de producción.
- El administrador puede modificar cada beneficio y ve confirmación solo después de guardarlo.
- El alumno puede solicitar tarjeta solo con perfil completo; solicitud registrada y estado pendiente visible tras respuesta del servidor.
- Aprobar una solicitud no activa una membresía ni cambia el PIN. La vinculación con el legado requiere revisión explícita por documento, teléfono o correo verificado; nunca por nombre.
- Las personas solo presentes en el legado conservan acceso a la web antigua.
- La plataforma principal mantiene todos sus datos y módulos previos sin cambios.

## Publicación
Recién con todas las pruebas en verde: respaldos, migración revisada y autorizada para producción, despliegue de funciones, sincronización de catálogo, reconciliación de miembros verificada, pruebas con cuenta administradora y cuenta alumna y, finalmente, revisión del PR y publicación. Mantener `puntarollerscard.com` accesible hasta paridad comprobada.

**Bloqueo actual:** falta autorización/capacidad de escritura efectiva en Supabase desde este entorno. No hay prueba E2E real hasta resolverlo por un canal autorizado.
