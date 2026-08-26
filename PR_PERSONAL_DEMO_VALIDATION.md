# PR Personal — validación demo controlada

Fecha: 2026-08-25/26  
Entorno: Vercel Preview de `feature/pr-personal-v1-build`  
Producción: sin deploy; reservas globales cerradas

## Evidencia de transición

| Paso | Saldo | Usadas | Reservas demo | Evidencia |
| --- | ---: | ---: | --- | --- |
| Inicial | 4 | 0 | 0 | PR Pass demo y cuatro turnos publicados |
| Cuatro reservas | 4 | 0 | 4 reservadas | El crédito se compromete pero no se descuenta |
| Una realizada | 3 | 1 | 3 reservadas + 1 realizada | Historial `clase_dada`, sello PR visible |
| Otra suspendida | 3 | 1 | 2 reservadas + 1 realizada + 1 suspendida | Crédito preservado; saldo 3 → 3 |

Los cuatro emails administrativos fueron aceptados. El email de alumno quedó
confirmado en la cuarta reserva usando el destinatario verificado del proyecto.

## Aislamiento

- Perfil: `pr_personal_demo_v1`
- Marcador de turnos/reservas: `[DEMO PR PERSONAL]`
- El modo demo solo se habilita para el hostname exacto del preview de la rama.
- La configuración persistida `reservas_habilitadas` permanece en `false`.
- Las tablas relevantes mantienen RLS habilitado.
- La transición administrativa corre como `SECURITY INVOKER` bajo RLS.

## Limpieza

Ejecutar `supabase/demo/pr_personal_demo_cleanup.sql` para quitar únicamente
el perfil, la PR Pass, el historial, las reservas y los turnos demo.
