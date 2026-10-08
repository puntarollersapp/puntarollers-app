# Tesorería — auditoría de movimientos repetidos (08/10/2026)

## Hechos verificados mediante consultas de solo lectura
- `pr_registrar_mensualidad` hace UPSERT de `pr_mensualidades` por (alumno_id, periodo) y luego INSERT incondicional en `pr_tesoreria_movimientos`.
- La función ejecuta como SECURITY DEFINER, comprueba `puedo_gestionar_pagos()` y actualiza el perfil del alumno.
- Hay 59 movimientos con `tipo='ingreso'` y `categoria='mensualidad'`; los 59 referencian una mensualidad.
- Se encontró exactamente una mensualidad con más de un movimiento asociado en esa categoría (dos movimientos, $3.000 en conjunto).
- Son dos movimientos de $1.500, fechas 11/09/2026 y 12/09/2026, con métodos «Transferencia Claudio» y «Transferencia Lucía». **No hay prueba de duplicación accidental**: pueden ser dos pagos reales.
- Ningún movimiento fue borrado o alterado durante esta auditoría.

## Riesgo de idempotencia
El RPC puede añadir un movimiento nuevo al repetirse una llamada idéntica, incluso si el UPSERT de mensualidad no crea una nueva fila. Un bloqueo UNIQUE(mensualidad_id) **no es seguro**: eliminaría el soporte para pagos parciales, pagos múltiples o correcciones legítimas.

## Diseño propuesto (NO implementado)
1. Generar un `request_id` UUID por intención de pago en el cliente y mantenerlo al reintentar; no generar uno nuevo en cada retry.
2. Crear una tabla/registro de idempotencia con clave única por `request_id`, usuario y operación, almacenando estado/resultado y hash de parámetros.
3. Ejecutar en una única transacción la autorización, adquisición de la clave, registro del movimiento, UPSERT de mensualidad y actualización del perfil.
4. Si la misma solicitud se reenvía, devolver el resultado previo sin añadir otro movimiento. Si la clave se reutiliza con datos diferentes, rechazar.
5. Conservar múltiples movimientos legítimos por mensualidad; soportar pagos parciales y anulaciones mediante asientos compensatorios, no borrados.
6. Migrar el cliente y RPC en despliegue coordinado y probar dobles clics, timeouts, retries, concurrentes y permisos de Tesorería.
7. No ejecutar conciliación ni deduplicación automática de movimientos históricos.

## Antes de producción
Respaldo restaurable, pruebas con usuarios de diferentes roles y comprobación del conteo y totales de movimientos. Mantener PR NEXT aislado.
