# PR Training 2.0 — contrato de persistencia propuesto

**Estado: diseño, no migración.** La beta Git comparte Supabase con producción. Este documento no autoriza ejecutar SQL.

## Compatibilidad
Mantener intactas las tablas existentes `pr_training_tasks`, `pr_training_task_results`, `pr_training_enrollments`, `pr_training_public_checks` y sus datos históricos. No reetiquetar resultados de Shifter como Training 2.0.

## Entidades nuevas (nombres provisionales)
1. `pr_training_v2_cycles`: mes AAAA-MM único, fechas, estado borrador/publicado/cerrado, configuración de fecha límite y extensiones.
2. `pr_training_v2_library`: ejercicio reutilizable y autoría; versiones publicadas inmutables.
3. `pr_training_v2_task_versions`: consigna pública, objetivo, pasos, variantes BASE/CONTINUIDAD, condición de taco, tipo de evidencia, autor y número de versión.
4. `pr_training_v2_assignments`: ciclo, perfil, versión de tarea, recorrido asignado, requerido/opcional, estado y fecha límite individual; índice único de asignación.
5. `pr_training_v2_submissions`: intentos inmutables, número de intento, autor, momento y metadatos de evidencia. No guardar URLs públicas.
6. `pr_training_v2_reviews`: cada devolución de Claudio o David como registro independiente, autor, decisión, comentario privado, fecha y referencia a intento.
7. `pr_training_v2_staff_scope`: asignación explícita profesor-alumno o profesor-grupo, con vigencia y auditoría.
8. `pr_training_v2_audit`: actor, acción, objeto, antes/después cuando corresponda, momento y razón.
9. `pr_training_v2_feed_outbox`: evento de finalización idempotente, consentimiento comprobado, estado de entrega; sin evidencia ni evaluación técnica.

## Reglas transaccionales
- El servidor verifica `auth.uid()`, estado de acceso y alcance docente en cada operación; no confiar en roles enviados por el navegador.
- Un alumno solo puede enviar a sus asignaciones habilitadas. El servidor crea un intento nuevo y cambia estado de forma atómica.
- Un profesor autorizado puede revisar un intento específico. El comentario se añade; nunca sobrescribe comentarios previos.
- Aplicar control de concurrencia por versión o transición condicional: una revisión obsoleta no puede pisar otra.
- Una entrega válida cuenta para participación de inmediato; pedir corrección no la resta. La aprobación técnica se registra por separado.
- Las prácticas opcionales no forman parte del denominador. Congelar instantánea al cerrar el mes.
- Publicación al feed solo tras primera entrega válida y consentimiento vigente; índice único por asignación y evento, sin duplicados al reenviar.
- El ingreso tardío no reduce automáticamente las tareas del mes.

## Evidencia y Storage
Crear bucket **privado** exclusivo, con prefijos por perfil/asignación/intento. Verificar propiedad y alcance docente desde backend, MIME, tamaño, cuota, retención y antivirus si procede. Servir con URLs firmadas de corta vida; no usar los buckets públicos existentes.

## Plan de ejecución seguro
1. Completar auditoría de funciones, vistas, policies y consumidores existentes.
2. Revisar con el director la propuesta y decisiones abiertas: menores, retención, límites de archivo, lesiones y plazos.
3. Crear entorno Supabase aislado con costo aprobado, o preparar ventana y respaldo verificable para la base compartida.
4. Probar migraciones, RLS negativas, reversión y concurrencia en entorno aislado.
5. Solicitar autorización específica antes de aplicar cambios a la base compartida.
6. Activar por fases con feature flag y pruebas con cuentas de roles distintos.

## Verificación pendiente
Las funciones actuales `mi_profile_id()` y `soy_staff()` no implementan alcance por alumno. Hay buckets públicos que no deben usarse para evidencias privadas. Las vistas SECURITY DEFINER de Training requieren revisión adicional.
