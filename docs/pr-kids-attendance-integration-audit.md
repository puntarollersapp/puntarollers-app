# PR Kids Club — integración real (auditoría técnica de la beta)

Fecha de inspección: 2026-10-09. Se inspeccionó únicamente el esquema de Supabase; **no se alteraron datos ni funciones de producción**.

## Hallazgo principal: premios ya existentes

En el proyecto Supabase actual YA existen:
- `public.pr_kids_rewards`: `nombre`, `descripcion`, `sellos`, `stock_total`, `stock_reservado`, `stock_entregado`, `foto_url`, `nivel`, `activo`, `limite_temporada`.
- `public.pr_kids_redemptions`: `reward_id`, datos del responsable y del niño, `status`, `stamps_used`, `validated_by`, `validated_at`, `delivered_at`.
- `public.pr_kids_redemption_photos`: fotos de los canjes.
- Consulta agrupada de estados de canjes: sin registros al inspeccionar. **No permite deducir estados válidos de canje**.

**Decisión:** no duplicar el catálogo ni el registro de canjes. La migración beta de asistencia se corrigió para reutilizar esas tablas. Antes de descontar sellos, acordar y validar los estados que representan un canje confirmado, cancelado y entregado. Nunca asumir que todo pedido consume sellos.

## Identidad familiar existente

- `pr_kids_guardians`: `auth_user_id`, `estado`, `adult_profile_id`, `documento`.
- `pr_kids_children`: `nombre_confirmado`, `treasury_profile_id`.
- `pr_kids_guardian_children`: `guardian_id`, `child_id`, `approved_at`, `approved_by`.

El acceso familiar debe verificar la sesión autenticada, un responsable activo y una relación aprobada con cada niño. No se debe resolver por coincidencia de nombre ni por documento introducido desde el navegador.

## Escáner de asistencia: todavía NO identificado

La tabla `pr_track_scans` existe, pero sus campos `item_id`, `scanned_at` y `scan_key` NO demuestran que registre asistencias de PR Kids. Puede corresponder a otro módulo de PR Track. No conectarla sin rastrear el código real del lector y el evento confirmado.

Antes de integrar: identificar endpoint, evento estable, ID de alumno, idempotencia, anulaciones, zona horaria de Uruguay y cómo diferenciar un escaneo de asistencia de otro uso del QR.

## Contrato de pasaporte

- Un check-in confirmado y único = un sello; el mismo evento procesado dos veces = un solo sello.
- Corrección de asistencia = anulación auditada; no borrar silenciosamente.
- Sellos disponibles = asistencias válidas - sellos consumidos por canjes confirmados, con saldo nunca negativo.
- La aplicación debe detectar inconsistencias (más sellos canjeados que ganados), no ocultarlas.
- No mostrar números de asistencias reales hasta que el backend verifique el origen.
- Los umbrales y existencias de premios vienen del catálogo existente, no de un número fijo inventado en el frontend.
- Para canjear, validar saldo y stock en una única transacción en servidor.

## Trabajo ya creado en beta

- `src/lib/prKidsPassport.js`: deduplicación y saldo sobre datos previamente autorizados, normalización del catálogo real.
- `tests/prKidsPassport.test.js`: regresión de duplicados, anulaciones, saldo y stock.
- `npm run test:kids`: ejecuta pruebas de publicaciones y pasaporte.
- `supabase/migrations/20261009150000_pr_kids_attendance_rewards_beta_design.sql`: diseño de libro de asistencias con RLS cerrada; **no aplicado**.

## Condiciones de salida del bloque

1. Escáner identificado y probado sin escribir en producción.
2. Mapping estable del niño de Tesorería al perfil PR Kids.
3. Guardado idempotente en entorno aislado.
4. Pruebas de canje, devolución, doble clic, dos operadores y stock.
5. Acceso familiar aprobado y comprobado.
6. Auditoría de privacidad antes de publicar.

**No considerar operativo el pasaporte hasta cumplir las seis condiciones.**
