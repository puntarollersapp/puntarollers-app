# PR Awards 2026 — puesta en marcha controlada

## Orden obligatorio
1. Verificar el identificador del proyecto Supabase de Beta y confirmar que no apunta a producción.
2. Revisar roles reales de `profiles`: `FullAdminRoute` permite `role === 'admin'`; la función SQL propuesta debe coincidir con ese criterio.
3. Auditar, adaptar y aplicar en staging los borradores SQL: esquema, permisos administrativos, lotes atómicos, integridad de finalistas y categorías iniciales.
4. Verificar desde sesión anónima que SOLO sean visibles categorías activas, candidatos autorizados y finalistas; ni votos, ni propuestas, ni nominaciones, ni ganadores.
5. Verificar desde sesión administrativa que el RPC `pr_awards_is_admin` responde true únicamente a un administrador real.
6. Importar directorio con consentimiento explícito. Equipo (Claudio, Lucía y David) participa en las mismas categorías que los alumnos; no asumir consentimiento por rol.
7. Resolver Dupla del Año: los finalistas necesitan ser parejas reales, no un candidato individual.
8. Mantener `nomination_open=false` y `voting_open=false` hasta completar pruebas. Nunca activar flags en producción durante QA.
9. Ensayar nominación de múltiples candidatos con un fallo inducido y confirmar que se revierte el lote entero.
10. Probar moderación de propuestas, asignación de finalistas y voto público repetido. Confirmar que resultados siguen privados.
11. Verificar ranking histórico Strava con kilometraje validado y congelación al cierre.
12. Integrar `public/pr-awards-trophy.webp` desde el PNG oficial del usuario. El componente ya lo espera en esa ruta; hasta subir el archivo usa emblema alternativo.
13. Inspeccionar despliegue Vercel READY y QA móvil antes de dar por concluido.

## Estado
- Ruta pública, centro de control y animaciones: código guardado en rama Beta.
- Imagen original optimizada en espacio de trabajo; pendiente subida binaria al repositorio.
- Migraciones SQL: borradores NO aplicados ni probados.
- Operaciones reales: no verificadas.
- Publicación de otras funcionalidades PR NEXT: NO autorizada.
