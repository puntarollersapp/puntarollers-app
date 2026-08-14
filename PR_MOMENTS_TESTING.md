# PR Moments — guía de prueba previa

## Alcance incluido

- Moments de texto, foto y video con vencimiento de 24 horas.
- Visibilidad: Todos PR, Solo amigos y Solo yo.
- Media privada con URLs firmadas de una hora y límite de 15 MB, usando el backend existente.
- Reacciones exclusivas por usuario y comentarios de texto libre.
- Comentarios separados para RollerFeed, sin modificar las tablas de Strava.
- Borrado propio y moderación para roles `admin` y `profesor`.
- Carrusel de Moments encima del RollerFeed, estados vacíos y errores recuperables.

## Orden seguro para habilitar una prueba

1. Confirmar que `profiles.auth_user_id` esté vinculado para cada cuenta de prueba.
2. Configurar Vercel Preview con las variables públicas de Supabase.
3. Desplegar esta rama como Preview; no promover ni fusionar a `main`.

## Matriz manual recomendada

- Alumno A publica texto, foto y video; Alumno B puede verlos y reaccionar.
- Un Moment `self` solo aparece para su autor.
- Un Moment `friends` solo aparece después de existir una amistad `accepted`.
- Cambiar una reacción reemplaza la anterior; tocar la misma la elimina.
- Comentarios aceptan texto libre, saltos de línea y hasta 1000 caracteres.
- Un alumno no puede editar/eliminar contenido ajeno; admin/profesor sí puede moderarlo.
- Pasadas 24 horas, el Moment y su media dejan de ser legibles por RLS.
- Una actividad sincronizada desde Strava conserva su contenido y admite comentarios por `feed_key`.
- Archivos mayores a 15 MB o tipos no permitidos son rechazados.
- Probar viewport móvil (360 × 800), video vertical y foto horizontal.

## Verificación realizada en esta rama

- Build de producción Vite completado correctamente.
- Revisión estática de rutas, imports y componentes completada.
- `git diff --check` sin errores de whitespace.
- Preview móvil autenticada verificada en Vercel sin errores de consola.
- Publicación real de un Moment de texto confirmada.
- Visor, vencimiento mostrado a 24 h, reacción y comentario confirmados.
- Borrado del comentario y limpieza completa del Moment temporal confirmados.
- Política de lectura de amistades corregida para participantes y moderadores.
- El contenido de prueba dejó cero filas remanentes.

## Pendiente antes de lanzamiento oficial

- Completar la matriz con un segundo alumno, incluida la visibilidad `friends`.
- Probar carga real de foto y video desde un teléfono.
- Mantener la Vercel Preview separada de `main`.
- Opcional: programar limpieza física de archivos expirados; actualmente quedan inaccesibles al vencer, pero no se borran automáticamente del bucket.
- Revisar la advertencia existente de bundle grande y separar rutas en chunks; no bloquea esta prueba.
