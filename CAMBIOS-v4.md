# PuntaRollers.app v4 — PR Club Build

Versión trabajada sobre el ZIP real del proyecto.

## Cambios principales

### Perfil Alumno
- Banner superior + foto circular.
- Tick azul de perfil verificado.
- Grupos múltiples del alumno.
- Sección de novedades.
- Acordeones para:
  - Insignias.
  - Eventos en los que participaste.
  - Observaciones de tus entrenadores (Tu evolución).
  - Notificaciones.
  - Contactos PR.
  - Mis Servicios.
  - Configuración.
- Observaciones con foto/nombre del profesor desde el perfil del profesor.
- Reacciones en observaciones: Recibido / Me motivó.
- Insignias obtenidas + próximas por desbloquear.
- PR Card y PR Tracking con estado activo/inactivo.
- Onboarding inicial mobile-first, no superpuesto.

### Mock Data
- Datos ampliados para alumnos, profesores, observaciones, insignias, participaciones, contactos PR y notificaciones.
- Se mantiene compatibilidad con páginas existentes.

### Panel Admin
- Admin rediseñado como centro de control mobile-first.
- Tabs: Inicio, Alumnos, Observaciones, Insignias, Participaciones, Cupos, Config.
- Métricas de actividad: activos 7 días, activos 30 días, nunca ingresaron.
- Listado de alumnos con filtros y buscador.
- Acciones masivas para otorgar insignia, registrar participación, enviar aviso y asignar grupo.
- Perfil administrativo del alumno con pestañas:
  - Información.
  - Observaciones.
  - Insignias.
  - Participaciones.
  - Servicios.
  - Actividad.
- Toggle de PR Card y PR Tracking por alumno.
- Verificación manual desde Admin.
- Reset de PIN.
- Observaciones con imagen opcional.
- Crear insignia personalizada con imagen.
- Registro de participación masiva.
- Cupos manuales conectados a Home.
- Configuración de Contactos PR y Clases Personalizadas.

## Verificación técnica
- Build realizado con `npm run build` correctamente.

## Nota
Esta versión aún usa datos mock/locales. La conexión real con Supabase queda para la siguiente etapa.
