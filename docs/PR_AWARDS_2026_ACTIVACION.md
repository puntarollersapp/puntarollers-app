# PR Awards 2026 — checklist de activación (Beta)
Estado: interfaz conectada a adaptador; base de datos aún no aplicada ni verificada.

## Requisitos antes de habilitar envíos
1. Verificar por separado el proyecto Supabase de destino. No ejecutar SQL sobre producción sin auditoría de esquema y autorización específica.
2. Revisar migración `20261012_pr_awards_schema_draft.sql`: permisos de funciones SECURITY DEFINER, search_path, RLS, límites y manejo de solicitudes públicas.
3. Crear permisos administrativos server-side basados en identidad verificada, nunca en nombre, email o una clave en el navegador.
4. Importar candidatos públicos con IDs estables; incluir estudiantes y equipo (Claudio, Lucía y David), sin inventar IDs ni divulgar fotos no autorizadas.
5. Importar las 16 categorías iniciales; la categoría Leyenda del Asfalto es automática y no acepta votos.
6. Definir el tratamiento de La Dupla del Año (candidato de dos personas) antes de activar su postulación.
7. Probar envíos de postulaciones múltiples y nombres manuales, sin pérdidas parciales silenciosas; implementar operación atómica para lote.
8. Probar propuestas comunitarias y revisión administrativa de las 4 categorías nuevas.
9. Verificar 3 finalistas por categoría, selección y cierre de postulaciones.
10. Probar voto repetido sin login, sin revelar totales. Evitar abuso que afecte la disponibilidad.
11. Verificar cierre exacto en horario de Uruguay y revelación únicamente desde administración.
12. Calcular kilómetros históricos válidos sin duplicados; verificar origen, fechas y perfil Strava. Congelar snapshot al cierre.
13. Ensayar con datos ficticios, borrar pruebas y realizar QA móvil antes de compartir el enlace.

## Riesgos conocidos
- El frontend presenta 16 categorías locales si no hay categorías cargadas, pero el backend no aceptará envíos sin IDs reales.
- El adaptador Supabase requiere la migración y permisos públicos adecuados.
- La fecha del calendario público no bloquea pruebas anticipadas; las banderas de apertura son administrables.
- No publicar el resto de PR NEXT para adelantar esta ruta.
- No exponer la tabla de votos ni de ganadores a anon/authenticated.
