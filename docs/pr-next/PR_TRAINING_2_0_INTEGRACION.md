# PR NEXT — Contrato de integración PR Training 2.0
Fecha: 2026-10-08 · Estado: arquitectura aprobada para desarrollo, **no** para producción.
Fuente: especificación funcional PR Training 2.0 v1.0 entregada por el propietario el 08/10/2026.

## Fronteras y compatibilidad
- Rama exclusiva: `beta/pr-next-work-batch`. Nunca fusionar automáticamente con producción ni con la rama de mantenimiento.
- La beta puede compartir Supabase con producción. No ejecutar SQL, crear buckets, modificar RLS, enviar notificaciones ni escribir registros reales hasta inventario, backup, revisión de permisos, rollback y aprobación explícita.
- Conservar login, perfiles, Tesorería, Strava, PR Pass, RollerMap y rutas legacy. La actualización es aditiva; PR Training no reemplaza la historia de Shifter.
- Las tareas se definen posteriormente en Admin. No hardcodear consignas ni usar datos simulados como progreso real.

## Contrato pedagógico
- Toda cuenta registrada y habilitada accede a PR Training, independientemente de beneficios de otros módulos; una suspensión de cuenta y controles de seguridad siguen aplicando.
- Sin ranking, XP, calificación numérica, competencia ni comparación entre personas.
- Ciclo mensual: todos los deberes visibles desde día 1; sin secuencia ni desbloqueo semanal. Número requerido configurable (8 sugeridos), práctica libre opcional fuera del denominador.
- Porcentaje de participación = tareas requeridas válidamente enviadas / tareas requeridas asignadas para ese ciclo. Enviar ≠ aprobar técnicamente. Reenvíos y correcciones no duplican la tarea ni quitan el check de participación.
- Ciclos cerrados preservan historial y snapshots. Cambios de asignación, variantes y versiones publicadas nunca reescriben silenciosamente el pasado.
- Recorridos internos BASE y CONTINUIDAD, asignados por staff, invisibles como etiqueta comparativa para el alumno. Alta nueva BASE; migración de existentes administrada por PR (nunca inferir de Shifter).
- Condición de equipo taco sí/no/ambas declarable por alumno; no altera porcentaje.

## Modelo propuesto (nombres conceptuales, no tablas creadas)
1. exercise_library: ejercicio reutilizable, demo opcional, seguridad, instrucciones.
2. task_definitions + task_versions: consigna/combos, pasos PRACTICA/EVIDENCIA, variantes por recorrido/equipo, criterios, estado y vigencia. Publicar congela versión.
3. training_cycles: año/mes, fecha, estado y política de entregas.
4. student_path_assignments: recorrido, autor, fecha, motivo, historial.
5. cycle_task_assignments: alumno, tarea versionada, requerida/opcional, snapshot y fecha de asignación.
6. task_drafts + task_submissions + evidence_items: guardado progresivo, intento, medios privados, estado y clave de idempotencia.
7. task_reviews: docente, fecha, resultado, comentario, referencia a intento, control de concurrencia.
8. training_audit_events: trazabilidad de publicación, reasignación, revisión y correcciones.
9. feed_outbox: evento social único por tarea/alumno/ciclo; emitido solo con consentimiento y tras envío aceptado.

Son entidades de diseño. **No afirmar que existen en Supabase** ni inventar columnas actuales. Confirmar esquema real antes de escribir migraciones.

## Máquina de estados
PENDIENTE → BORRADOR/EN_PROGRESO → CUMPLIDO_EN_REVISION → APROBADO
CUMPLIDO_EN_REVISION → CORRECCION_SOLICITADA → REENVIO_EN_REVISION → APROBADO
Una corrección conserva archivos e intentos anteriores; el check de participación permanece. Dos revisores no pueden cerrar estados contradictorios: usar control de versión o transacción atómica.

## Privacidad y RollerFeed
- Evidencias, videos, comentarios técnicos, recorridos y variantes: solo propietario y docentes autorizados. Bucket privado, URLs firmadas de duración limitada, validación de MIME/tamaño y retención explícita.
- Feed: solo evento social mínimo «completó [nombre público]», después de envío aceptado, con consentimiento; nunca evidencia, corrección, recorrido ni aprobación. Deduplicar por alumno/tarea/ciclo.
- Menores: privacidad por defecto; no publicar progreso individual o grupal sin consentimiento adecuado.
- Página grupal: participantes que optaron por compartir, orden alfabético/rotativo, nunca por porcentaje.

## Integración con módulos existentes
- `src/pages/TareasNext.jsx`: hoy es UI de estado vacío y previsualizaciones, no motor de entregas. Conservar estilo deportivo premium, elevar legibilidad de textos de 6–9px, integrar ciclo, biblioteca y progreso real solo tras backend.
- `src/pages/AdminTareasNext.jsx`: `TaskPlanningStudio` actual es un borrador local de una consigna plana. No tiene pasos, variantes, versiones, publicaciones ni asignaciones; evolucionar a constructor por etapas, sin asumir que guardar local equivale a publicar.
- `src/components/tasks/PRTaskModerationPreview`: previsualización sin moderación persistente; no habilitar botones hasta permisos/RLS.
- `src/pages/Activity.jsx`: RollerFeed existente tiene tipos y filtros; crear un adaptador de evento social de Training, no escribir directamente desde el cliente ni filtrar evidencias en el navegador.
- Strava: asociar actividades autorizadas por usuario/tarea; contemplar webhook ausente, reconciliación y alternativa supervisada. No alterar la conexión vigente.
- Mi PR, Evolución y PR Pulse: consumir vistas agregadas autorizadas, distinguir «sin datos» de cero; no exponer feedback técnico.

## Orden de implementación y criterios de salida
**Bloque 0 — Inventario, sin escrituras:** verificar esquema real, RLS, roles, Storage, Strava, feed y flujos actuales; mapa de permisos, contratos y regresión.
**Bloque 1 — Modelo aislado:** migraciones idempotentes en entorno separado, RLS y pruebas de aislamiento; backup/rollback documentados.
**Bloque 2 — Constructor:** biblioteca, pasos, variantes BASE/CONTINUIDAD, taco, borrador, preview, versionado, publicación programada.
**Bloque 3 — Alumno:** ciclos, asignaciones, borrador progresivo, evidencia, envío idempotente, estados y progreso sin ranking.
**Bloque 4 — Docente:** bandeja, revisión, corrección, reenvío, concurrencia, auditoría, control de grupos.
**Bloque 5 — Integraciones:** RollerFeed con consentimiento y outbox idempotente; Mi PR, PR Pulse, Strava, media privados.
**Bloque 6 — QA y activación:** aislamiento alumnos/docentes, menores, permisos directos API, archivos grandes, cortes de red, cambios de recorrido, cierre mensual, revisión simultánea, regresión de producción, feature flag por cohortes.

## Decisiones abiertas: mantener configurables
- Prórrogas, entregas tardías, pausa por lesión, cuenta suspendida.
- Retención y eliminación de evidencias; tamaño/duración máximos de medios.
- Visibilidad social/grupal de menores y consentimiento.
- Catálogo, videos demostrativos y número final de tareas.

## Otros compromisos de PR NEXT (NO cancelar)
Dashboard NEXT; Mi PR/PR ID; PR Check y asistencia; Evolución; RollerFeed; Comunidad y encuestas; PR Voice; PR Awards 2026 y votaciones; Wrapped 2026; Mi Historia/Shifter archivo; PR Pulse (identidad menta/verde petróleo propuesta); panel HOY/Ficha 360/roles docentes; RollerMap; diseño responsive y activos gráficos oficiales. PR Training es un subsistema integrado, no un reemplazo del resto.

## Riesgos de coordinación
- Chat de mantenimiento modifica rama independiente y puede tocar el sistema vigente. Integrar correcciones necesarias mediante cherry-pick/revisión controlada; nunca merge automático.
- **No confiar en aislamiento Git para aislar Supabase**. Cualquier SQL sobre instancia compartida afecta producción.
- Estado actual de implementación no implica QA de navegador, tests de roles ni disponibilidad de assets oficiales.
