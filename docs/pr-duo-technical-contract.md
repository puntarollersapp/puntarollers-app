# PR DUO · contrato técnico de implementación (laboratorio, no activado)

## Estado comprobado
La base actual tiene profiles, pr_strava_connections, pr_activities, pr_training_v2_cycles, pr_training_v2_assignments, pr_training_v2_assignment_duties, pr_training_v2_submissions y pr_training_v2_progression. La estructura v2 tiene slots por asignación, pero no hay todavía entidades propias de invitación y misión compartida. No alterar el legado Shifter ni activar noviembre anticipadamente.

## Reglas del producto
- DUO es cooperación: no ordenar por ritmo, velocidad, llegada ni tiempo.
- Una misión conjunta requiere dos alumnos elegibles, consentimiento explícito del invitado y participación efectiva de ambos.
- Una misión aprobada genera exactamente una acreditación por participante para su deber correspondiente; nunca dos por el mismo deber del mismo ciclo.
- No acreditar al invitar, aceptar o sincronizar Strava: solo al aprobar el profesor.
- Cada participante puede revocar su aceptación antes del envío. Cambios posteriores pasan a revisión.
- Los avanzados son los actuales perfiles de Shifter; resolver la migración mediante correspondencia real entre pr_training_enrollments y pr_training_v2_progression. No deducir por texto de nombre.
- Carga avanzada propuesta: diez deberes por ciclo, pendiente de confirmar reglas de selección y capacidad de slots (el prototipo actual asume seis).
- El porcentaje de PR Performance debe ser aprobados / total asignado por alumno. No dividir siempre entre seis cuando haya niveles con diez.
- No mostrar al resto evidencia, rutas privadas, detalles de ejercicios, ni estados de revisión.

## Datos necesarios (modelo propuesto, aún NO migrado)
1. duo_missions: id uuid, cycle_id, duty_id, creator_profile_id, invited_profile_id, status (invited/accepted/submitted/approved/rejected/cancelled), expires_at, created_at, updated_at.
2. duo_participants: mission_id, profile_id, assignment_duty_id, accepted_at, unique(mission_id,profile_id).
3. duo_evidence: mission_id, profile_id, pr_activity_id, submitted_at, optional evidence metadata. Guardar referencia de actividad, nunca tokens Strava.
4. duo_reviews: mission_id, reviewer_profile_id, decision, note, reviewed_at, idempotency key. La aprobación debe ser transaccional, autorizada solo para Claudio/David según roles existentes.

## Strava y validación
- Los dos registros deben corresponder a los dos profile_id vinculados por pr_strava_connections.
- Verificar distancia individual mínima y ventana temporal coincidente. Comparación espacial solo si Strava concede los datos necesarios; nunca inferir que la coincidencia temporal demuestra recorrido compartido.
- Los códigos de misión identifican la tarea, NO constituyen prueba ni credencial.
- No premiar velocidad. Revisión manual para divergencias de GPS o evidencia incompleta.
- Idempotencia por mission_id + participant_id + assignment_duty_id y auditoría de cambios.

## Seguridad
- RLS para invitaciones y evidencias: solo participantes y revisores autorizados.
- Elegibilidad de menores y privacidad de fotos deben respetar controles actuales; no publicar automáticamente en RollerFeed.
- Realtime solo para estados y porcentajes permitidos, no datos de actividad privados.
- Preparar pruebas de invitación doble, cancelación, reenvío, sincronización repetida de Strava, corrección de aprobación, perfil sin Strava, dos dispositivos y cambios de nivel.
- No ejecutar migraciones, cambiar políticas RLS ni crear invitaciones reales sin validación integral.

## Visual
- Pantalla PR DUO con fotografías de ambos perfiles, aceptación explícita, misión, estado y cierre «No se trata de llegar primero. Se trata de llegar juntos».
- PR Performance siempre visible, sin botón desplegable, y denominador por nivel (6 o 10, sujeto a definición final).
