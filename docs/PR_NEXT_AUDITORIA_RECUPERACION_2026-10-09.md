# PR NEXT — Auditoría de recuperación (09/10/2026)

## Alcance y regla de seguridad
Rama de supervisión: `pr-next-beta-supervision-2026`. **No editar `main`, Tesorería productiva ni Supabase compartido.** El usuario de beta es una identidad ficticia: jamás consultarle datos privados de alumnos, mensualidades, fotos o Strava.

## Hallazgos comprobados en el código
| Área | Fuente original existente | Beta actual | Estado real |
|---|---|---|---|
| Perfil | `src/pages/Profile2026.jsx` + `src/components/profile/Profile2026Summary.jsx` + `ProfileShowcase.jsx` | `ProfileNext.jsx` | **No integrada**: original carga perfil, actividades Strava, fotos de Moments, insignias, amigos, grupos, eventos, mensualidad y Mi Setup; beta presenta marcadores de supervisión |
| Mi Rendimiento | `src/pages/MiEvolucion.jsx` (36 KB) | `EvolutionNext.jsx` | **No integrada**: cinco secciones visuales sin estadísticas reales |
| Tareas | `PRTraining` y sistema existente | `TareasNext.jsx` | **Prototipo local**: PR SPIN y tareas sin asignación/validación backend |
| Comunidad | Notificaciones, mensajes y RollerFeed originales | `CommunityNext.jsx`, `RollerFeedNext.jsx` | **Prototipo**, sin lecturas reales ni escrituras |
| Acceso beta | `src/lib/auth.jsx` | `BetaSafeStart.jsx` | **Verificado visualmente por usuario**: inicio aislado carga en Android |
| Navegación | `Header.jsx`, `BottomNav.jsx` | bifurcación por preview | Duplicación superior corregida en beta; pendiente revisión móvil |
| PR Awards | Historial y assets oficiales aportados | `AwardsNext.jsx` | Diseño parcial, no integración de logo oficial ni votación real |
| Mi PR | Herramientas originales | `MyPRNext.jsx` | Accesos de maqueta; QR y módulos aún no integrados |

## Decisiones técnicas
1. **No llamar consultas de `Profile2026` desde la cuenta beta ficticia.** Primero implementar un adaptador de datos autorizado, sujeto a RLS y aislamiento.
2. Reutilizar `Profile2026Summary` y `ProfileShowcase` cuando exista una identidad autenticada real y autorizada; no duplicar su lógica ni su historial.
3. Para supervisión sin datos, mostrar expresamente 'vista sin datos' y nunca cifras o fotografías inventadas.
4. Recuperar logo y assets oficiales antes de aprobar diseño; no sustituir por estrellas/emoji definitivos.
5. Cada integración debe pasar prueba de render móvil, navegación, privacidad, escritura y regresión.
6. El despliegue `READY` **no** equivale a prueba funcional.
7. No abrir la beta a alumnos hasta auditoría de seguridad y aprobación expresa.

## Próximo bloque de implementación
- Adaptador de perfil de solo lectura con identidad y permisos reales, aislado de producción.
- Componentes visuales reales del Perfil sin suprimir históricos ni funciones.
- Recuperación de las cinco secciones de Rendimiento con estados vacíos honestos.
- Tareas 2.0: catálogo, elegibilidad, asignación persistente y revisión docente en backend aislado.
