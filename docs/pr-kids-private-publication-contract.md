# PR Kids Club — contrato de publicación privada (BETA, no desplegado)

## Flujo del sábado

1. Profesor autenticado abre el estudio y elige el sábado.
2. Redacta título, resumen, habilidades libres, mensaje y selecciona fotografías.
3. Selecciona explícitamente los perfiles infantiles destinatarios.
4. Cada foto requiere confirmar que **todos los niños identificables** cuentan con autorización aplicable. Sin autorización, no se puede publicar esa foto.
5. Guarda un borrador privado. El servidor registra autor real desde la sesión, nunca desde el formulario.
6. Revisa la vista previa y publica. La publicación queda en el historial cronológico sin borrar sábados anteriores.
7. Los responsables aprobados ven únicamente los bloques destinados a sus hijos. Al abrir el portal ven el sábado más reciente y pueden consultar los anteriores.

## Contrato de API propuesto

Todas las operaciones deben pasar por una Edge Function independiente de producción y comprobar sesión y rol. No aceptar `author_id`, `author_name` ni `published_at` desde el navegador.

- `list-drafts` (profesor/admin): borradores y publicaciones con filtros de fecha.
- `create-draft` (profesor/admin): fecha, título, resumen, habilidades, mensaje, IDs infantiles de audiencia. Devuelve ID del borrador.
- `upload-photo` (profesor/admin): URL firmada de subida para un borrador existente, tamaño máximo 8 MB, JPEG/PNG/WebP. Comprobar permisos, tipo real de archivo y consentimiento.
- `publish` (profesor/admin): validación transaccional de audiencia, permisos, fotos y consentimientos; cambio de estado y registro de auditoría.
- `family-timeline` (responsable aprobado): publicaciones dirigidas a hijos vinculados; orden descendente por fecha; paginación; nunca devuelve archivos de otros niños.
- `media-url` (responsable aprobado): URL temporal para una fotografía autorizada tras validar el acceso al contenido específico.
- `archive` (profesor/admin): oculta una publicación, mantiene auditoría; no elimina los registros históricos.

## Restricciones de seguridad

- Ninguna foto infantil debe usar un bucket público ni URLs permanentes.
- No asumir que una foto grupal puede compartirse con cualquier familia.
- Una sesión de adulto-alumno no implica acceso a PR Kids; debe existir vinculación familiar aprobada.
- Los roles Claudio/David se validan por identidad de sesión y una lista de permisos gestionada en servidor.
- La foto del profesor se obtiene del perfil autorizado; la etiqueta PROFESOR no puede otorgarse desde un campo de texto.
- Los borradores no son visibles para familias.
- La interfaz beta actual **no** tiene almacenamiento persistente ni publicación real. No ejecutar las migraciones contra el Supabase de producción.

## Pruebas obligatorias antes de activar

- Publicación sábado 1 y sábado 2: ambas persisten tras cerrar sesión y volver a entrar.
- Dos hermanos: el responsable ve ambos perfiles y únicamente sus publicaciones autorizadas.
- Dos familias: la familia A nunca ve medios exclusivos de la B.
- Foto sin autorización: rechazar publicación y no entregar URL firmada.
- Profesor no autorizado: rechazar creación, edición, publicación y lectura administrativa.
- Usuario sin sesión: rechazar todos los endpoints privados.
- Cambio de foto o nombre del profesor: preservar atribución auditable.
- Archivo archivado: desaparece del portal familiar sin perder historial administrativo.
- PIN de tutor y aprobación familiar deben estar implementados antes de abrir el portal real.
