# PR Kids Club — Bloque 1: aceptación funcional

Estado: EN DESARROLLO. Rama: feature/pr-kids-family-beta-20261008.
No marcar como terminado hasta ejecutar pruebas reales de extremo a extremo.

## Solicitud familiar
- [x] Formulario de adulto responsable y múltiples hijos.
- [x] Envío a Edge Function protegida.
- [x] Distinguir solicitud nueva de solicitud pendiente existente.
- [x] Reconocer sesión de alumno adulto y conservar su documento.
- [ ] Validación servidor: si existe JWT de adulto, obtener documento desde profiles, no confiar en el documento del cuerpo.
- [ ] Verificar identidad del tutor no alumno y posesión de correo o teléfono.
- [ ] Permitir corregir solicitud pendiente y añadir hermanos con revisión administrativa.
- [ ] Validación de nombres, email, documento y límite de solicitudes; test automatizados.

## Administración
- [x] Bandeja de solicitudes, filtro, búsqueda y detalle.
- [x] Rechazo restringido a rol admin en Edge Function.
- [x] Endpoint de detalle admin, versión 3 de pr-kids-family-access.
- [x] Implementar y versionar algoritmo orientativo de coincidencias de nombres (sin conectar aún a Tesorería).
- [x] Conectar búsqueda de perfiles PR (solo orientativa) a la bandeja beta, sin habilitar vinculación.
- [ ] Mostrar coincidencias de todos los registros de Tesorería con nombres normalizados y prefijos Kid/PR Kid.
- [ ] Resolver cada hijo con perfil de Tesorería existente o crear uno nuevo.
- [x] Mostrar checklist temporal de 5 verificaciones administrativas en la revisión beta (no persistente, no habilita acceso).
- [x] Crear tabla protegida y endpoints admin para guardar verificaciones con fecha y autor.
- [x] Conectar botón de guardado de revisión y observaciones en la bandeja beta.
- [x] Recuperar última revisión al abrir una solicitud y mostrar comprobaciones pendientes según servidor.
- [ ] Validar en navegador el guardado, lectura e historial de verificaciones.
- [ ] Aprobar transaccionalmente, con auditoría y protección contra reintentos.
- [ ] Rechazo/suspensión/reactivación con motivo y permisos.
- [ ] Prueba de cuenta admin, profesor, alumno y visitante.

## Login
- [x] El login adulto admite destino de retorno /kids?registro=1.
- [ ] Crear credenciales seguras para tutores no alumnos; NO inventar rol alumno.
- [ ] Asegurar que tutores solo accedan a /kids/familia.
- [ ] Recuperación de acceso y verificación de email.
- [ ] Mostrar hijos solo con vínculo aprobado.

## Datos y privacidad
- [x] Tablas protegidas para tutores, niños y vínculos.
- [ ] Comprobar reglas RLS y políticas de lectura aprobadas.
- [ ] Nunca mostrar fotos, documentos o datos de otros niños.
- [ ] No actualizar nombres ni pagos de Tesorería por coincidencia probable.
- [ ] Mantener histórico y trazabilidad de vinculaciones.

## Criterio para marcar el bloque al 100 %
Un padre alumno y un padre no alumno completan la solicitud; Admin comprueba el vínculo y la coincidencia de Tesorería; aprueba; el tutor recibe credenciales válidas y entra a los perfiles correctos, sin acceso a otros niños ni a funciones adultas indebidas. Repetir con dos hermanos, rechazo, suspensión y solicitudes duplicadas. Compilación y pruebas de integración obligatorias.

## Registro de cambios
- 2026-10-08: rama beta creada, bandeja administrativa ampliada, validación de nombre corregida, estado de solicitud duplicada diferenciado, endpoint administrativo request-detail desplegado. No se aprobaron familias reales.

- 2026-10-08 (continuación): agregado `src/lib/prKidsTreasuryMatching.js` con normalización de prefijos y ranking orientativo, más 7 pruebas unitarias escritas. Sin consultas reales a Tesorería, sin vinculación ni aprobación. Pruebas pendientes de ejecución.

- 2026-10-08: consulta admin de candidatos desplegada (v4; v5 republicada sin cambio de lógica), botón integrado a la bandeja beta y estado de carga añadido. La fuente consultada es `profiles` (máximo 1000 filas), NO el universo de Tesorería; por tanto no hay conciliación completa. Sin pruebas E2E ejecutadas.

- 2026-10-08: checklist temporal de identidad, vínculo, niño, Tesorería y contacto integrado en la bandeja beta. Se pierde al recargar; no debe interpretarse como verificación formal ni aprobación.

- 2026-10-08: migración `pr_kids_family_review_audit_20261008` aplicada, Edge Function v6 con `review-save` y `review-history` restringidos a admin, UI beta con guardado de comprobaciones y notas. Pendiente prueba E2E y presentación completa del historial.

- 2026-10-08: Edge Function v7 incorpora `review-readiness` (solo consulta admin, `approval_enabled:false`); panel beta recupera última revisión y muestra si faltan checks. No es verificación documental ni aprobación efectiva. Falta test E2E.

- 2026-10-08: Edge Function v10 busca candidatos en perfiles por páginas de 500 hasta 10.000, sin conciliación automática. GitHub Actions: no se encontraron ejecuciones para el commit que creó el workflow; pruebas CI aún sin confirmar. Falta identificar fuente financiera completa de Tesorería.

### 2026-10-08 · Seguridad de aprobación y prevalidación
- [x] RPC transaccional endurecida: última revisión completa, perfil obligatorio y único por niño, rechaza vínculos infantiles existentes y tutores previamente vinculados; no habilita acceso.
- [x] Edge Function v13: `approval-validate` admin-only, sin escrituras, detecta duplicados, perfiles inexistentes y conflictos familiares.
- [x] Panel beta: selección explícita por niño y botón para validar vínculos contra el servidor, sin botón de aprobación.
- [ ] Ejecutar pruebas CI, revisión de compilación y pruebas reales con datos ficticios antes de exponer aprobación.
- [ ] Diseñar y validar credenciales seguras de tutores no alumnos y acceso por sesión a perfiles infantiles.

### 2026-10-08 · Aprobación auditada y lectura familiar privada
- [x] Auditoría separada `pr_kids_family_approval_audit` con unicidad por solicitud, responsable, admin y selección de perfiles.
- [x] RPC de aprobación transaccional actualizada y limitada a `service_role`, aún NO expuesta en API/UI.
- [x] Restricción de unicidad de `pr_kids_guardians.auth_user_id` y nuevos índices para conciliación.
- [x] Edge Function v14: `family-home` comprueba JWT y tutor activo vinculado a `auth_user_id`, devuelve solo hijos con vínculo aprobado, sin datos de pagos ni de otros niños.
- [x] Vista beta `/kids` muestra perfiles familiares si la API devuelve familia activa; si no, conserva inscripción.
- [ ] Aprobar con seguridad y habilitar cuenta real del tutor: credenciales/OTP, verificación de correo, vinculación de `auth_user_id` y activación explícita.
- [ ] Ejecutar pruebas unitarias, integración de RLS, sesión familiar y compilación de rama beta.

### 2026-10-08 · Conciliación y caducidad de verificaciones
- [x] Edge v15: mensualidad más reciente consultada por cada candidato (sin límite compartido de 300 mensualidades).
- [x] Permisos RPC comprobados en catálogo PostgreSQL: únicamente `postgres` y `service_role` pueden ejecutar `pr_kids_approve_family`.
- [x] Panel beta invalida la validación previa si se guardan nuevos checks o se vuelve a consultar Tesorería; reinicia selecciones al refrescar candidatos.
- [x] Edge v16: falla de forma cerrada si no puede verificar si ya existe un tutor.
- [ ] Pruebas E2E y compilación; acceso de tutores sin perfil de alumno, verificación de email y activación siguen pendientes.

### 2026-10-08 · Cobertura adicional de regresión
- [x] Seis nuevos casos de registro familiar (adulto ausente, lista vacía, hermanos repetidos, vínculo inválido, documento y teléfono cortos).
- [x] Tres nuevos casos de matching de Tesorería (nombre de pila distinto, límite de seis sugerencias y ausencia de mutación de datos).
- [ ] GitHub Actions no reporta ejecuciones para el último commit; pruebas y compilación no verificadas.
- [ ] Activación de tutores no alumnos sigue deshabilitada hasta validar prueba de posesión de email, identidad y vínculo administrativo.
