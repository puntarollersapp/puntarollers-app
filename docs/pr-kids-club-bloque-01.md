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
- [ ] Persistir verificaciones administrativas con auditoría y autor responsable.
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
