# PR Card — ubicación en el perfil y actualización de datos (aprobado 2026-10-29)

## Ubicación exacta en /app/perfil
Referencia: captura proporcionada por el propietario. Insertar el módulo PR Card **después** del bloque «Tus amigos roller» y sus métricas (amigos / km mes / salidas / logros), y **antes** del encabezado «Tu actividad · En movimiento». No sustituir el módulo de amigos ni tocar sus datos.

## Miembros activos
- Encabezado: «Estos son tus beneficios activos en tu PR Card».
- Tarjeta digital del titular, con información de vigencia validada por backend.
- Carrusel horizontal de emprendimientos, logos, beneficios y ofertas.
- Al tocar una tarjeta: diálogo accesible con comercio, imagen, descripción completa, condiciones, vigencia, contacto y modo de canje.
- La foto personal que prevalece es la del perfil **Punta Rollers**; jamás sobreescribirla con la foto antigua de PR Card.
- No importar insignias, badges, ni el sistema de validación de insignias legado.

## Sin tarjeta
- Banner: «Solicitar mi tarjeta de beneficios».
- Al tocarlo, formulario precargado con datos del perfil: nombre, apellido, documento, email y fecha de nacimiento; permitir completar los faltantes y confirmar.
- Crear solicitud pendiente para panel administrativo; mostrar «Hemos recibido tus datos» **solo tras confirmación del servidor**. Evitar duplicados y no activar la tarjeta automáticamente.
- El administrador revisa/aprueba o rechaza la solicitud. No mostrar PIN ni documentos en registros públicos.

## Invitación a completar perfil
Ubicar **debajo de las redes sociales** y **antes de «Tus amigos roller»**.
Texto sugerido: «¡Tu perfil tiene novedades! Completá tus datos, agregá tus redes sociales y descubrí las nuevas opciones para personalizar tu perfil.»
CTA «Actualizar mi perfil» debe abrir el editor de perfil existente; no crear editor paralelo.
Mostrar únicamente cuando falten campos relevantes (por ejemplo, email, fecha de nacimiento, teléfono, ciudad, o datos de redes opcionales según criterio UX). Las redes sociales deben seguir siendo opcionales: nunca bloquear el perfil por no tener Instagram/TikTok/Facebook.
No modificar foto, banners, insignias, amistades, métricas, reservas, clases ni créditos.

## Implementación
Esta nota registra el alcance y las posiciones visuales aprobadas. No representa por sí misma una implementación desplegada. Trabajar en la rama feature/prcard-unificacion-2026, verificar pruebas y desplegar solo tras revisión.
