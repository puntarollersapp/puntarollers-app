# PR NEXT — Base original y bloqueo de despliegue

## Verificación del punto de partida
- Rama: `pr-next-reconstruccion-desde-original-2026`.
- Creada directamente desde `main`; comparación inicial: **0 archivos diferentes, 0 commits de diferencia**.
- La rama beta anterior `pr-next-beta-supervision-2026` se mantiene separada, no es base de implementación.
- No se ha desplegado esta rama.

## Riesgo crítico detectado antes de publicar
En la base original, `src/lib/supabase.js` instancia `createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)` sin una barrera por entorno. El `src/lib/auth.jsx` original utiliza ese cliente y perfiles reales. Si se despliega esta rama en un proyecto que herede las variables de producción, **la copia podría acceder al mismo Supabase**. Una rama Git independiente **NO** aísla la base de datos ni los permisos.

### Puerta obligatoria para una beta real
1. Crear proyecto de preview separado de producción, sin alias ni dominios públicos de alumnos.
2. Configurar URL y clave **solo de un Supabase de prueba**; nunca copiar secretos de producción al preview.
3. Restaurar esquema y datos anonimizados/autorizados en la instancia aislada, o trabajar con estados vacíos verificables.
4. Verificar reglas RLS, Storage, autenticación, funciones Edge, cron, webhooks, correos y rutas de pagos. No habilitar efectos secundarios externos en preview.
5. Comprobar que la URL de Supabase de la beta es distinta a producción antes de cualquier compilación/despliegue público.
6. Conservar las rutas, perfiles, historial y funcionalidades originales y actualizar por diffs mínimos.
7. No habilitar despliegue automático ni publicar esta rama antes de superar las comprobaciones anteriores y contar con autorización.

## Bloques de recuperación
- **Bloque 0 (en curso):** inventario de conexiones, aislamiento, dependencias y rutas de producción.
- **Bloque 1:** réplica original navegable contra datos de prueba aislados.
- **Bloque 2:** cambios de navegación y Perfil preservando componentes originales.
- **Bloque 3:** Rendimiento y Tareas 2.0; pruebas de persistencia/roles.
- **Bloque 4:** Comunidad, Mi PR, RollerFeed, Awards y administración.
- **Bloque 5:** auditoría integral de regresión, privacidad y aprobación explícita de lanzamiento.

## Condición de no regresión
El avance se mide por pruebas de rutas y funcionalidades originales preservadas, no por pantallas de maqueta ni porcentajes visuales.
