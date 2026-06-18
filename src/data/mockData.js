export const professores = [
  {
    id: 'claudio',
    nombre: 'Profe Claudio',
    rol: 'Administrador general',
    iniciales: 'CF',
    foto: null,
    permisos: 'Control total de PuntaRollers.app',
  },
  {
    id: 'david',
    nombre: 'Profe David',
    rol: 'Profesor',
    iniciales: 'DV',
    foto: null,
    permisos: 'Observaciones, insignias y participaciones',
  },
]

export const mockUser = {
  id: 'alumno-001',
  nombre: 'Claudio',
  apellido: 'Facelli',
  documento: '123',
  pin: '1234',
  email: 'claudio@puntarollers.app',
  ciudad: 'Maldonado / Punta del Este',
  instagram: '@claudinio',
  fechaNacimiento: '1992-08-30',
  miembroDesde: '2026',
  estado: 'Activo',
  destacado: true,
  verificado: true,
  grupos: ['Parada 2 · Adultos', 'Pista cerrada', 'Racing 6K / 12K'],
  foto: null,
  banner: '/banner-prcard.png',
  sobreMi: 'Mi espacio personal dentro de Punta Rollers.',
  prcard: { activa: true, link: 'https://puntarollerscard.com/' },
  tracking: { activo: false, descripcion: 'PR Tracking se activa desde el panel administrador.' },
  estadisticas: { clases: 84, eventos: 12, exp: 7 },
  ultimoIngreso: 'Hoy 03:00',
}

export const alumnos = [
  {
    ...mockUser,
    id: 'alumno-001', nombre: 'Luciana Méndez', documento: '123', ciudad: 'Maldonado', instagram: '@lucia.rollers',
    grupos: ['Parada 2 · Principiantes', 'Pista cerrada'], estado: 'Activo', verificado: true,
    prcard: { activa: true, link: 'https://puntarollerscard.com/' }, tracking: { activo: true }, ultimoIngreso: 'Hoy 02:58',
  },
  {
    ...mockUser,
    id: 'alumno-002', nombre: 'Martín Rovira', documento: '32109847', ciudad: 'Punta del Este', instagram: '@martinroll',
    grupos: ['Racing', 'Parada 2 · Avanzado'], estado: 'Activo', verificado: false,
    prcard: { activa: true, link: 'https://puntarollerscard.com/' }, tracking: { activo: false }, ultimoIngreso: 'Hace 2 días',
    estadisticas: { clases: 31, eventos: 4, exp: 3 },
  },
  {
    ...mockUser,
    id: 'alumno-003', nombre: 'Camila Torres', documento: '51092834', ciudad: 'Maldonado', instagram: '',
    grupos: ['Pista cerrada'], estado: 'Pausado', verificado: false,
    prcard: { activa: false, link: 'https://puntarollerscard.com/' }, tracking: { activo: false }, ultimoIngreso: 'Nunca ingresó',
    estadisticas: { clases: 12, eventos: 2, exp: 1 },
  },
  {
    ...mockUser,
    id: 'alumno-004', nombre: 'Sofía Pereyra', documento: '44872013', ciudad: 'San Carlos', instagram: '@sofiapatina',
    grupos: ['PR Kids referente familiar', 'Pista cerrada'], estado: 'Activo', verificado: true,
    prcard: { activa: true, link: 'https://puntarollerscard.com/' }, tracking: { activo: true }, ultimoIngreso: 'Hace 5 días',
    estadisticas: { clases: 47, eventos: 8, exp: 5 },
  },
  {
    ...mockUser,
    id: 'alumno-005', nombre: 'Lucas Fernández', documento: '39012847', ciudad: 'Maldonado', instagram: '',
    grupos: ['Parada 2 · Principiantes'], estado: 'Inactivo', verificado: false,
    prcard: { activa: false, link: 'https://puntarollerscard.com/' }, tracking: { activo: false }, ultimoIngreso: 'Nunca ingresó',
    estadisticas: { clases: 5, eventos: 0, exp: 0 },
  },
]

export const insignias = [
  { id: 'primer-mes', nombre: 'Primer Mes', emoji: '🌙', categoria: 'Primeros pasos', descripcion: 'Completaste tu primer mes formando parte de Punta Rollers.', desbloqueada: true, fecha: '2026-03-15', otorgadaPor: 'claudio', oficial: true },
  { id: 'primer-evento', nombre: 'Primer Evento', emoji: '🎉', categoria: 'Primeros pasos', descripcion: 'Participaste por primera vez en una actividad de la comunidad.', desbloqueada: true, fecha: '2026-03-22', otorgadaPor: 'claudio', oficial: true },
  { id: 'primer-desafio', nombre: 'Primer Desafío', emoji: '🎯', categoria: 'Primeros pasos', descripcion: 'Superaste tu primer desafío dentro de PR.', desbloqueada: true, fecha: '2026-04-02', otorgadaPor: 'david', oficial: true },
  { id: 'rodador-frecuente', nombre: 'Rodador Frecuente', emoji: '🛼', categoria: 'Constancia', descripcion: 'Reconocimiento por asistir regularmente a clases.', desbloqueada: true, fecha: '2026-04-20', otorgadaPor: 'claudio', oficial: true },
  { id: 'inquebrantable', nombre: 'Inquebrantable', emoji: '🔥', categoria: 'Constancia', descripcion: 'Demostraste compromiso y constancia sostenida.', desbloqueada: true, fecha: '2026-05-10', otorgadaPor: 'david', oficial: true },
  { id: 'veterano-pr', nombre: 'Veterano PR', emoji: '🏅', categoria: 'Constancia', descripcion: 'Un año formando parte de la comunidad.', desbloqueada: true, fecha: '2026-05-15', otorgadaPor: 'claudio', oficial: true },
  { id: 'espiritu-pr', nombre: 'Espíritu PR', emoji: '💚', categoria: 'Comunidad', descripcion: 'Representás los valores, la buena energía y la esencia de Punta Rollers.', desbloqueada: true, fecha: '2026-05-30', otorgadaPor: 'claudio', oficial: true, destacada: true },
  { id: 'buen-companero', nombre: 'Buen Compañero', emoji: '🤝', categoria: 'Comunidad', descripcion: 'Reconocimiento por compañerismo y apoyo a otros alumnos.', desbloqueada: true, fecha: '2026-06-01', otorgadaPor: 'david', oficial: true },
  { id: 'primeros-6k', nombre: 'Primeros 6K', emoji: '🏁', categoria: 'Racing', descripcion: 'Completaste tu primer recorrido de 6 kilómetros.', desbloqueada: true, fecha: '2026-06-05', otorgadaPor: 'claudio', oficial: true },
  { id: 'modo-velocidad', nombre: 'Modo Velocidad', emoji: '⚡', categoria: 'Técnica', descripcion: 'Destacado dominio de velocidad.', desbloqueada: true, fecha: '2026-06-09', otorgadaPor: 'david', oficial: true },
  { id: 'patinador-ascenso', nombre: 'Patinador en Ascenso', emoji: '🚀', categoria: 'Reconocimientos', descripcion: 'Evolución destacada durante los últimos períodos.', desbloqueada: true, fecha: '2026-06-12', otorgadaPor: 'claudio', oficial: true },
  { id: 'primeros-10k', nombre: 'Primeros 10K', emoji: '🔒', categoria: 'Próximas', descripcion: 'Completá tu primer recorrido de 10 kilómetros.', desbloqueada: false, fecha: null, oficial: true },
  { id: 'corazon-racing', nombre: 'Corazón Racing', emoji: '🔒', categoria: 'Próximas', descripcion: 'Demostrá pasión y compromiso con el entrenamiento Racing.', desbloqueada: false, fecha: null, oficial: true },
  { id: 'leyenda-pr', nombre: 'Leyenda PR', emoji: '🔒', categoria: 'Próximas', descripcion: 'Años compartiendo el camino junto a la comunidad PR.', desbloqueada: false, fecha: null, oficial: true },
]

export const observaciones = [
  {
    id: 'obs-001', alumnoId: 'alumno-001', profesorId: 'claudio', tipo: 'Evaluación', fecha: '2026-06-14', titulo: 'Prueba 6K',
    descripcion: 'Buen ritmo general. Tiempo registrado: 14:32. Seguir trabajando curvas amplias y respiración en el último tramo.',
    imagen: null, reacciones: ['recibido', 'motivo'],
  },
  {
    id: 'obs-002', alumnoId: 'alumno-001', profesorId: 'david', tipo: 'Técnica', fecha: '2026-06-10', titulo: 'Dominio de curvas',
    descripcion: 'Mejoró la entrada a curva. Mantener hombros relajados y mirada hacia la salida.', imagen: null, reacciones: ['recibido'],
  },
  {
    id: 'obs-003', alumnoId: 'alumno-002', profesorId: 'david', tipo: 'Entrenamiento', fecha: '2026-06-08', titulo: 'Resistencia Racing',
    descripcion: 'Trabajo sólido en bloques de 12 minutos. Puede empezar progresión a 10K.', imagen: null, reacciones: [],
  },
]

export const participaciones = [
  { id: 'part-001', alumnoId: 'alumno-001', nombre: 'Roller Night 2026', tipo: 'Evento', fecha: '2026-01-30', descripcion: 'Participaste en Roller Night 2026 junto a la comunidad Punta Rollers.', imagen: null },
  { id: 'part-002', alumnoId: 'alumno-001', nombre: 'Roller Sunset 2026', tipo: 'Evento', fecha: '2026-01-23', descripcion: 'Participaste en Roller Sunset 2026 junto a la comunidad Punta Rollers.', imagen: null },
  { id: 'part-003', alumnoId: 'alumno-001', nombre: 'Día del Patinador', tipo: 'Evento', fecha: '2026-04-14', descripcion: 'Participaste en Día del Patinador junto a la comunidad Punta Rollers.', imagen: null },
  { id: 'part-004', alumnoId: 'alumno-001', nombre: 'Travesía Puente de la Barra', tipo: 'Desafío', fecha: '2026-05-18', descripcion: 'Participaste en la Travesía Puente de la Barra junto a la comunidad Punta Rollers.', imagen: null },
]

export const notificaciones = [
  { id: 'not-001', tipo: 'insignia', titulo: 'Nueva insignia obtenida', descripcion: 'Obtuviste Patinador en Ascenso. Otorgada por Profe Claudio.', fecha: 'Hace 1 día', leida: false },
  { id: 'not-002', tipo: 'observacion', titulo: 'Nueva observación', descripcion: 'Profe David dejó una observación sobre dominio de curvas.', fecha: 'Hace 3 días', leida: false },
  { id: 'not-003', tipo: 'participacion', titulo: 'Nueva participación', descripcion: 'Se agregó Travesía Puente de la Barra a tu historial.', fecha: 'Hace 1 semana', leida: true },
]

export const contactosPR = [
  { id: 'claudio', nombre: 'Profe Claudio', detalle: 'Dirección y coordinación general', valor: 'WhatsApp PR', link: 'https://wa.me/59800000000' },
  { id: 'david', nombre: 'Profe David', detalle: 'Entrenamientos y observaciones', valor: 'WhatsApp David', link: 'https://wa.me/59800000000' },
  { id: 'lucia', nombre: 'Tesorera Lucía', detalle: 'Mensualidades, pagos y cuponeras', valor: 'WhatsApp Lucía', link: 'https://wa.me/59800000000' },
  { id: 'grupo', nombre: 'Grupo correspondiente', detalle: 'Link configurable desde administración', valor: 'Grupo de WhatsApp', link: 'https://chat.whatsapp.com/' },
]

export const avisos = [
  { id: 'aviso-001', titulo: 'Bienvenido a Punta Rollers', descripcion: 'Esta plataforma es tu espacio PR: insignias, observaciones, participaciones y evolución.', destino: 'Todos', fecha: '2026-06-18' },
]

export const eventosDisponibles = [
  'Roller Night 2026', 'Roller Sunset 2026', 'Travesía Puente de la Barra', 'Día del Patinador', 'Rolleada Ramblera', 'Masa Crítica', 'Pare de Sufrir, Salga a Patinar'
]

export const actividad = [
  { id: 1, tipo: 'Ingreso', nombre: 'Luciana ingresó a la plataforma', fecha: '2026-06-18', hora: '03:00', origen: 'Plataforma' },
  { id: 2, tipo: 'Observación', nombre: 'Profe Claudio dejó una observación', fecha: '2026-06-14', hora: '19:00', origen: 'Admin' },
  { id: 3, tipo: 'Insignia', nombre: 'Patinador en Ascenso', fecha: '2026-06-12', hora: '20:10', origen: 'Admin' },
  { id: 4, tipo: 'Participación', nombre: 'Travesía Puente de la Barra', fecha: '2026-05-18', hora: '10:00', origen: 'Admin' },
]

export const servicios = [
  { id: 'prcard', nombre: 'PR Card', icono: '💳', color: '#C9A84C', descripcion: 'Tarjeta de beneficios para alumnos PR. Acceso a descuentos, comercios adheridos y pertenencia al club.', precio: 'Plataforma externa', tags: ['Beneficios', 'Comercios', 'PR'], destacado: true, link: 'https://puntarollerscard.com/' },
  { id: 'tracking', nombre: 'PR Tracking', icono: '🏷️', color: '#1A6B4A', descripcion: 'Sistema NFC para comprobar legitimidad de equipamiento, identificar dueños y facilitar recuperación de artículos perdidos.', precio: 'Servicio PR', tags: ['NFC', 'Seguridad', 'Equipamiento'], destacado: true, link: '/tracking' },
  { id: 'pasaporte', nombre: 'Pasaporte Kids', icono: '🧒', color: '#3b4ab0', descripcion: 'Pasaporte físico para niños con sellos, actividades, stickers motivacionales y recompensas por asistencia.', precio: 'Para PR Kids', tags: ['Kids', 'Sellos', 'Motivación'], destacado: true, link: '/pasaporte-kids' },
  { id: 'cuponeras', nombre: 'Cuponeras', icono: '🎟️', color: '#8B4A9C', descripcion: 'Opción flexible para quienes no pueden asistir todos los meses de forma fija. Vigencia de dos meses.', precio: 'Flexible', tags: ['Flexibilidad', '2 meses'], destacado: false, link: '/cuponeras' },
  { id: 'personal', nombre: 'Clases personalizadas', icono: '🎯', color: '#C9A84C', descripcion: 'Clase individual de una hora con profesor. El enlace se activa desde administración cuando estén disponibles.', precio: 'Próximamente', tags: ['1 hora', 'Profesor', 'A demanda'], destacado: false, link: '#' },
  { id: 'alianza', nombre: 'Alianza Rollers', icono: '🤝', color: '#B8960C', descripcion: 'Comunidad externa aliada de rollers. Mantiene su propio grupo y comunicación.', precio: 'Comunidad', tags: ['Externa', 'WhatsApp'], destacado: false, link: '/alianza' },
]

export const contenido = [
  { id: 1, titulo: 'Galería de clases', tipo: 'galeria', categoria: 'Clases', url: 'https://drive.google.com', fecha: '2026-06-01' },
  { id: 2, titulo: 'Rolleadas PR', tipo: 'galeria', categoria: 'Eventos', url: 'https://drive.google.com', fecha: '2026-06-01' },
  { id: 3, titulo: 'Contenido PR', tipo: 'video', categoria: 'Videos', url: 'https://youtube.com', fecha: '2026-06-01' },
]

export const productos = [
  { id: 1, nombre: 'Remera PR Classic', precio: '$1.200', talles: ['XS','S','M','L','XL'], diseños: ['Negro / Dorado','Blanco / Dorado'], agotado: false },
  { id: 2, nombre: 'Remera Speed Edition', precio: '$1.400', talles: ['S','M','L','XL'], diseños: ['Negro / Plateado','Azul marino / Dorado'], agotado: false },
  { id: 3, nombre: 'Remera PR Kids', precio: '$900', talles: ['2','4','6','8','10','12'], diseños: ['Blanco / Verde','Negro / Dorado'], agotado: false },
]

export const adminUsuarios = alumnos.map((alumno) => ({
  id: alumno.id,
  nombre: alumno.nombre,
  documento: alumno.documento,
  estado: alumno.estado,
  prcard: alumno.prcard?.activa,
  tracking: alumno.tracking?.activo,
  verificado: alumno.verificado,
  clases: alumno.estadisticas?.clases || 0,
  ultimo_acceso: alumno.ultimoIngreso,
  grupos: alumno.grupos,
}))

export const mensajesGlobales = [
  { id: 1, titulo: '¡Tu espacio PR ya está activo!', contenido: 'Acá vas a ver insignias, observaciones, participaciones y contactos de Punta Rollers.', tipo: 'plataforma', visible: true, fecha: '2026-06-18' }
]
