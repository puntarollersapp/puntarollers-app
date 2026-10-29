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
