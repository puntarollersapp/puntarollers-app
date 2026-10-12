# Usuarios Beta — contrato de aislamiento (rama feature/admin-beta-users)

## Estado
Diseño técnico. **No habilitar altas ni desplegar a producción** hasta cumplir las verificaciones.

## Invariantes
1. Las cuentas beta no deben aparecer en alumnos, Tesorería, cobros, PRCard, rankings, feed ni inscripciones ordinarias.
2. Nunca reutilizar perfiles de alumnos reales como beta.
3. La función existente `gestionar-usuario-auth` no admite el rol beta: normaliza roles desconocidos a alumno. No utilizarla para crear cuentas beta sin cambiar y probar su contrato.
4. `src/lib/auth.jsx` también normaliza roles desconocidos a alumno y calcula `isStudent` con `role === 'alumno'`. Adaptar antes de crear perfiles beta.
5. La tabla `pr_beta_access` es una lista de autorización, **no** una garantía por sí sola de aislamiento de otras tablas o políticas RLS.
6. Las operaciones de alta, revocación y limpieza deben estar protegidas en servidor por autorización administrativa comprobada, no solamente por controles visuales.
7. La contraseña/PIN nunca debe registrarse en logs ni almacenarse en texto claro en nuevas estructuras.

## Implementación propuesta
- Mantener cuentas en Supabase Auth para reutilizar el inicio de sesión existente.
- Introducir identidad beta explícita y verificable por servidor; decidir entre rol beta y tabla separada tras auditar consultas, triggers y RLS.
- Alta exclusiva desde Admin > Usuarios Beta, con validación de documento único, credenciales seguras y rollback de Auth si falla el alta del perfil.
- Inicio de sesión y rutas beta independientes de los permisos de alumno.
- Diseño experimental habilitado solo si existe autorización beta activa y feature flag correspondiente.
- No conceder acceso a recursos de alumnos por defecto.
- Panel de administración: listar, crear, pausar y revocar, con confirmación y trazabilidad.

## Pruebas de aceptación obligatorias
- Usuario normal: Home y funciones idénticas a producción.
- Beta activo: ve únicamente el diseño y funciones experimentales autorizados.
- Beta pausado: pierde acceso beta al refrescar sesión.
- Beta: no figura en listas de alumnos ni genera mensualidad, deuda, bloqueo, PRCard o notificaciones de alumno.
- No admin: no puede crear, listar globalmente ni alterar accesos beta.
- Fallo parcial del alta: no quedan cuentas huérfanas.
- Pruebas en Preview con cuentas ficticias, sin tocar datos reales.
- Revisión de cuota Supabase antes del 4 de noviembre de 2026.
