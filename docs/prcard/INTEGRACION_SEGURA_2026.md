# Integración PR Card → Punta Rollers — control de seguridad y despliegue

## Hallazgo confirmado (29/10/2026)
El proyecto legado de Supabase PR Card `rdzgdtpaykyrhvqkahzj` mantiene RLS deshabilitado en `public.members` y `public.benefits`. El diagnóstico de Supabase lo clasifica como **crítico**: las tablas pueden quedar accesibles a roles `anon`/`authenticated` si tienen permisos. **No activar RLS sin antes diseñar y probar políticas**, porque la aplicación antigua podría dejar de funcionar.

## Reglas innegociables
- No modificar `public.profiles.pin` de Punta Rollers.
- No copiar PIN ni documentos al catálogo público de beneficios.
- No relacionar titulares por nombre solamente.
- No alterar clases, asistencias, reservas, saldos, mensualidades ni otros módulos.
- Mantener el sitio legado disponible hasta verificar paridad de acceso y funciones.
- No exponer `service_role` ni secretos en el frontend.

## Arquitectura prevista
1. Catálogo de beneficios en el proyecto principal, con campos de visualización no sensibles: ID de origen, comercio, logo, título, descripción, condiciones, vigencia, activo y orden. RLS de lectura restringida a la audiencia autorizada; edición solo por operaciones administrativas verificadas.
2. Tabla de vinculación privada de membresías con IDs de origen y perfil PR. Las correspondencias dudosas quedan pendientes de revisión. No copiar PIN.
3. Proceso de sincronización server-side, autenticado, con auditoría e idempotencia. La página no accede directamente a la base antigua.
4. API o Edge Function autenticada que comprueba la sesión, el perfil y la vigencia antes de devolver los beneficios correspondientes.
5. Pantallas `Mi PR` y `PR Card` reutilizan `PRCardBenefitsCarousel`. Actualmente reciben un arreglo vacío a propósito: no publicar promociones sin verificar datos ni permisos.
6. Gestión de comercios y membresías dentro del administrador principal, preservando la administración antigua hasta validar equivalencia.

## Secuencia de implementación
- [x] Crear componente visual reutilizable de beneficios.
- [x] Insertarlo en Mi PR y PR Card en rama aislada.
- [x] Retirar vencimiento ficticio de enero de 2027.
- [x] Confirmar diagnóstico de seguridad del proyecto legado.
- [ ] Obtener respaldo consistente de ambas bases y comprobar restauración.
- [ ] Auditar la autenticación real y la matriz de permisos del sitio legado.
- [ ] Conciliar registros por documento verificado, con revisión manual de conflictos.
- [ ] Implementar tablas y políticas RLS, primero en staging.
- [ ] Implementar sincronización segura de los 22 beneficios existentes.
- [ ] Conectar catálogo y estado de membresía al frontend, sin recurrir a la base antigua desde el navegador.
- [ ] Migrar panel administrativo y validar operaciones.
- [ ] Pruebas de regresión: acceso, PIN, créditos, clases, reservas, perfiles y datos privados.
- [ ] Publicación gradual con rollback disponible.

## Condiciones para activar RLS en PR Card
Identificar primero todas las rutas de lectura/escritura existentes; determinar si usan Supabase Auth, sesión propia o funciones; crear políticas por rol/propietario; probar consultas de `anon`, alumno y administrador en un entorno aislado; aplicar y comprobar con cuentas reales de prueba. No ejecutar solo `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` sin estas comprobaciones.

## Estado
Documento de implementación, no una migración ejecutada. Ningún cambio a las bases de producción fue realizado por este PR.

## Inventario de paridad obligatoria — 29/10/2026
No dar por finalizada la unificación hasta verificar cada punto:
- **Comercios y promociones:** los 22 registros del origen, logos, categorías, títulos, descripciones, condiciones, instrucciones de canje, vigencias, teléfono, redes, orden, destacados y estados activos/inactivos. La copia staging es una instantánea, **no** sincronización automática.
- **Tarjeta digital:** nombre y documento obtenidos del perfil principal, estado real verificado en backend, vigencia sin fechas inventadas, presentación responsive; la foto del perfil principal tiene prioridad absoluta.
- **Perfil principal:** aviso para completar datos debajo de redes sociales y antes de amigos; PR Card después de estadísticas y antes de actividad; botón de solicitud para no titulares y carrusel/modal para titulares validados.
- **Solicitudes:** precarga desde perfil de nombre, apellido, documento, correo y nacimiento; faltantes editables mediante editor de perfil; recepción confirmada solo después de guardar; una solicitud pendiente por persona; cola administrativa para aprobar/rechazar sin activar automáticamente.
- **Administración:** alta/edición/pausa de comercios y promociones, logos, contacto, orden, estado y vencimientos; búsqueda de solicitudes, revisión de identidad, conciliación de miembros, historial/auditoría y permisos administrativos.
- **Membresías antiguas:** conservar los miembros exclusivos de la web PR Card, sin copiar PINs ni insignias legadas ni reemplazar fotos; conciliación manual para conflictos; no retirar acceso legado antes de verificar paridad.
- **Seguridad:** no cambiar PIN principal, RLS y API cerradas por defecto, no exponer datos personales, pruebas de perfiles activos/inactivos y regresión de clases, pagos, reservas, asistencia, amigos y badges.
- **Publicación:** integrar por etapas y comprobar la versión actual de main antes de merge; no confundir despliegues de vista previa con producción; conservar rollback.

### Estado real
- Implementados en rama de desarrollo: carrusel/modal, posiciones del perfil, aviso de actualización, consulta protegida de beneficios y navegación interna de titulares verificados.
- Preparado, pero sin aplicar: diseño de cola de solicitudes en staging. Las operaciones de escritura de base y función de solicitud fueron bloqueadas por controles de seguridad.
- Pendientes: solicitud real, administración completa, conciliación verificada, sincronización continua, pruebas E2E y publicación en producción.
