# PR Card — cierre operativo seguro (staging → producción)

Actualizado: 2026-10-29. **No confundir código en rama con funcionalidad publicada.**

## Estado comprobado
- Rama: `feature/prcard-unificacion-2026`; PR de revisión #79. No fusionar antes de pruebas.
- Staging: `nvrapvbbenyojkjgxfkj`. `prcard_benefits` tiene **22 registros** y RLS habilitado; `prcard_membership_links` está vacía.
- Staging: `prcard_requests` **creada** el 2026-10-29 mediante migración `prcard_requests_private_staging_20261029`; cero solicitudes en comprobación posterior.
- Staging: las tres funciones están **ACTIVE** con JWT requerido: `prcard-benefits` v2, `prcard-requests` v1 y `prcard-admin-benefits` v1.
- Las operaciones autorizadas de migración y despliegue en staging **se completaron**. Producción permanece intacta.
- El catálogo está preparado, pero ningún perfil de staging tiene un vínculo PR Card verificado; la API de beneficios debe denegar el acceso en ese caso.

## Orden de activación — solo en staging
1. Revisar que `public.profiles` tenga `id`, `auth_user_id`, `role`, `nombre`, `apellido`, `documento`, `email`, `fecha_nacimiento`, `prcard_activa`. Si algún campo difiere, adaptar la función antes de desplegar.
2. **HECHO EN STAGING:** migración de `prcard_requests`; RLS activado y comprobado. La consulta de privilegios de `anon` y `authenticated` sobre las tres tablas PR Card devolvió cero concesiones.
3. **HECHO EN STAGING:** desplegada `prcard-requests` v1 con JWT requerido.
4. **HECHO EN STAGING:** desplegada `prcard-admin-benefits` v1 con JWT requerido.
5. **HECHO EN STAGING:** actualizada `prcard-benefits` v2 con JWT requerido. **PENDIENTE:** probar CORS y peticiones reales desde navegador autenticado.
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

**Estado actual:** backend y esquema en staging instalados; falta prueba E2E autenticada. El entorno de ejecución local no pudo establecer conexión HTTP externa a las funciones, por lo que no se atribuye una prueba de endpoint exitosa. Faltan vinculación segura de miembros, revisión de identidad, validación de frontend y autorización final antes de producción.
