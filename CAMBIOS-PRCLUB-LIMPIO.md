# PuntaRollers.app — Versión limpia PR Club

Esta versión fue reconstruida sobre la base vieja funcional, evitando el package-lock corrupto y manteniendo un proyecto Vite/React limpio para Vercel.

## Credenciales demo

- Alumno: documento `123` / PIN `1234`
- Admin Claudio: documento `999` / PIN `4321`
- Profe David: documento `888` / PIN `4321`

## Incluye en v1

- Home pública con frase, login arriba, horarios y cupos manuales.
- Perfil del alumno con banner, foto circular, verificado, grupos múltiples, datos editables y PIN editable.
- Acordeones en perfil: insignias, eventos en los que participaste, observaciones, contactos PR y servicios.
- Observaciones de entrenadores con foto/iniciales del profesor, reacciones y estructura para imagen opcional.
- Insignias obtenidas y próximas por desbloquear, sin mostrar todo el catálogo bloqueado.
- Participaciones/eventos como historial personal.
- Contactos PR configurables como sección.
- Estado PR Card y PR Tracking visible en perfil.
- Panel Admin mobile first con dashboard, alumnos, acciones masivas, cupos y configuración.
- Roles: Claudio admin total, David profesor limitado, alumno solo ve su perfil.
- Cupos manuales guardados en localStorage.
- PR Tracking, Pasaporte Kids y Cuponeras explicados como páginas públicas.

## Importante

No incluye `package-lock.json` para evitar el error de Vercel con URLs internas. Vercel instalará dependencias desde `package.json`.
