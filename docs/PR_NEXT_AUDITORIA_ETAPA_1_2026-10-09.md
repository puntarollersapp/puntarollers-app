# PR NEXT — auditoría de aislamiento, autenticación e integraciones (09/10/2026)

## Verificaciones realizadas
- Repositorio de trabajo: rama `pr-next-reconstruccion-desde-original-2026`, sin publicar en `main`.
- Supabase de producción: `ycgxnzeaihuwlwfwalom` (solo lectura en esta auditoría).
- Supabase beta aislada: `azheisnfaedjqcuhiylo`.
- 111 tablas de producción representadas con sus columnas en beta; beta cuenta con 112 tablas, incluida `pr_inline_skate_activities` adicional.
- 111 tablas con clave primaria detectada en beta; `pr_inline_skate_activities` requiere confirmar si corresponde a producción y definir su clave.
- Todas las tablas de beta tienen RLS habilitado, pero **no se han reconstruido todas las políticas, índices, valores por defecto, claves foráneas ni funciones**.
- No se importaron registros a beta. No se debe afirmar que los perfiles, pagos o credenciales están disponibles.
- `src/lib/supabase.js` impide conectar esta rama a un Supabase distinto de la beta.

## Inventario de integraciones sensibles en el código original
Inspección de 154 archivos JS/JSX de la copia fuente local, con 22 referencias a 11 funciones Edge:
- `strava-auth`: autorización, callback y sincronización Strava.
- `gestionar-usuario-auth`: altas y gestión de cuentas.
- `pr-tesoreria-montos`, `pr-tesoreria-alumnos`, `pr-tesoreria-recordatorios`: importes, alumnos y recordatorios.
- `pr-emails-admin`: correos administrativos.
- `pr-access-admin`, `pr-access-request`: solicitudes de acceso.
- `pr-personal-public`: reservas personalizadas.
- `mercadopago-create-order`: órdenes de pago.
- `notificar-transferencia-inscripcion`: avisos de transferencias.
- `notificar-clinica-oct-2026`: avisos de clínica.

Se identificaron aproximadamente 95 llamadas a métodos de escritura `insert/update/upsert/delete` en la fuente revisada. El recuento es textual, no una auditoría de todos los caminos de ejecución.

## Bloqueadores de cierre de Etapa 1
1. Restaurar y verificar 130 claves foráneas, restricciones de unicidad, checks, índices, defaults, vistas, políticas RLS, funciones, triggers y permisos aplicables.
2. Auditar y recrear solamente integraciones Edge seguras en beta; **no copiar secretos productivos** ni disparar correos/pagos reales.
3. Definir importación de datos con privacidad: documentos, PIN, tokens Strava, pagos, menores, fotos y accesos no deben exponerse a visitantes de beta.
4. Sustituir la sesión de supervisión **temporal, local y no autenticada** por un usuario real de Supabase Auth beta. La sesión actual solo permite recorrido visual y nunca debe utilizarse como autorización de backend.
5. Probar operaciones de lectura y escritura con permisos diferenciados y confirmar ausencia de tráfico a producción.
6. Verificar compilación, rutas y navegación móvil, incluido logout y estado de sesión, y realizar pruebas de regresión.
7. No pasar a producción sin respaldo restaurable, migraciones no destructivas y aprobación expresa del responsable.

## Política de despliegue
- No alterar producción.
- No publicar PR NEXT en el dominio público principal.
- No considerar la Etapa 1 finalizada hasta completar los bloqueadores.
- No habilitar cuentas administrativas simuladas ni acceso a datos privados con un bypass de interfaz.

## Actualización verificada — reconstrucción estructural
- 111 tablas y 16 vistas en ambas bases; se corrigió `pr_inline_skate_activities`, que era vista en producción y había quedado como tabla en beta.
- 417 restricciones exactamente iguales según `pg_get_constraintdef`: 111 PK, 130 FK, 40 UNIQUE y 136 CHECK.
- 243 índices con definiciones idénticas según `pg_indexes`.
- 452 defaults de columnas idénticos según `pg_get_expr`.
- Se restauraron seis funciones auxiliares de identidad/permisos: `community_current_profile_id`, `is_pr_staff`, `mi_profile_id`, `mi_role`, `pr_current_profile_id` y `soy_admin`.
- Auditoría de 152 funciones SQL originales: tres contienen referencias explícitas al proyecto Supabase productivo y llamadas `net.http_`: `notify_new_clinica_sept_2026`, `notify_new_pr_inscripcion` y `pr_run_strava_background_sync`. **No copiar esas funciones sin sustituir endpoints y secretos y bloquear efectos externos.**
- El asesor de seguridad de Supabase confirmó 112 tablas con RLS sin políticas durante la auditoría; tras corregir la vista hay 111 tablas. No se han habilitado políticas de acceso para datos privados.
- El control de fuente detectó una URL fija del Supabase original en `src/components/community/CommunityPhoto.jsx`; se reemplazó por validación del host de beta y el build de esta rama exige ahora preflight de aislamiento.
- **Etapa 1 sigue abierta**: faltan 200 políticas RLS originales (requieren adaptación, no copia ciega), 35 triggers, funciones de negocio seguras, Auth real beta, datos de prueba y pruebas integrales. La sesión de supervisión local no es autenticación de backend.
