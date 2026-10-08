# PR Training 2.0 — auditoría de compatibilidad de Supabase
Fecha: 2026-10-08. **Solo lectura.** Proyecto inspeccionado: `ycgxnzeaihuwlwfwalom`.

## Hallazgos verificados
- No hay ramas de desarrollo de Supabase en este proyecto. La rama Git beta no aísla la base de datos.
- Tablas existentes: `pr_training_enrollments` (28 filas), `pr_training_tasks` (12), `pr_training_task_results` (64), `pr_training_feed_publications` (58), `pr_training_public_checks` (64). Estas cifras son instantáneas del inventario, no métricas de producto.
- `pr_training_task_results` incluye `profile_id`, `task_id`, `status`, `evidence` JSONB y fechas; no aparecen entidades separadas para intentos, revisiones por profesor o versiones inmutables de consignas.
- `pr_training_tasks` contiene `event_slug`, `category`, `rule_type`, `target_value`, `instructions` JSONB. El esquema actual está orientado al entrenamiento previo y debe preservarse.
- RLS: resultados SELECT para dueño o `soy_staff()`, escrituras ALL para `soy_staff()`. Las tareas son legibles por autenticados con `SELECT true`, y editables por staff. Inscripciones propias o staff. `pr_training_public_checks` permite SELECT a todos los autenticados (`true`).
- El linter de Supabase señaló las vistas `pr_training_progress_public` y `pr_training_completed_feed` como SECURITY DEFINER. Debe revisarse su definición, exposición y datos devueltos antes de reutilizarlas. RLS sin políticas en `pr_training_feed_publications` puede ser intencional si solo opera un backend privilegiado: verificar.
- No se ejecutó ninguna migración, actualización, borrado ni inserción.

## Decisiones técnicas para PR NEXT
1. No reutilizar `pr_training_task_results` para almacenar revisiones múltiples sin un diseño de migración y conservación histórica.
2. Diseñar entidades nuevas versionadas para ciclos, asignaciones, envíos/intentonas, evidencias privadas, revisiones y auditoría, con coexistencia con el esquema anterior.
3. Antes de migrar: backup verificable, plan de reversión, permisos de staff por rol y asignación, políticas RLS de dueño/profesor, pruebas de denegación cruzada, políticas de Storage y URLs firmadas.
4. RollerFeed recibe solo un evento público idempotente con consentimiento; nunca evidencia, comentarios ni recorrido interno.
5. Las estadísticas de progreso deben distinguir tarea entregada de aprobación técnica y conservar instantáneas al cerrar ciclos.
6. No escribir en la base compartida sin autorización específica para la migración y un procedimiento de despliegue seguro.

## Pendientes de auditoría
- Definición SQL y permisos efectivos de las vistas SECURITY DEFINER.
- Implementación y seguridad de `mi_profile_id()` y `soy_staff()`.
- Policies de `storage.objects` y buckets privados existentes.
- Flujos reales de Edge Functions y código que consumen tablas anteriores.
- Pruebas ejecutadas con cuentas de alumno, profesor y admin en entorno aislado.

Este documento registra hallazgos, **no certifica que el sistema sea seguro ni autoriza cambios de producción**.
