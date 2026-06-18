export const mockUser = {
  id: '1',
  nombre: 'Luciana Méndez',
  documento: '47839201',
  email: 'luci@email.com',
  instagram: '@lucirollers',
  ciudad: 'Maldonado',
  fecha_nacimiento: '1998-08-30',
  sobre_mi: 'Me gusta patinar en grupo, aprender técnica y sumarme a las rolleadas.',
  foto_url: null,
  banner_url: null,
  miembro_desde: '2022-03-15',
  estado: 'Destacada',
  verificado: true,
  prcard_activa: true,
  prtracking_activo: false,
  grupos: ['Parada 2', 'Racing'],
  horarios: ['Miércoles 20:00 - 21:00', 'Sábado 20:00 - 21:00'],
  objetivo_actual: 'Preparar prueba de 6K',
  clases_asistidas: 84,
  eventos: 12,
  experiencias_desbloqueadas: 7,
  ultimo_ingreso: '2026-06-17T21:43:00',
}

export const profesores = [
  {
    id: 'claudio',
    nombre: 'Profe Claudio',
    rol: 'admin',
    foto_url: null,
    iniciales: 'CF',
  },
  {
    id: 'david',
    nombre: 'Profe David',
    rol: 'entrenador',
    foto_url: null,
    iniciales: 'DV',
  },
]

export const contactosPR = [
  { id: 'claudio', titulo: 'Profe Claudio', tipo: 'WhatsApp', valor: '+598 XX XXX XXX', url: 'https://wa.me/59800000000' },
  { id: 'david', titulo: 'Profe David', tipo: 'WhatsApp', valor: '+598 XX XXX XXX', url: 'https://wa.me/59800000000' },
  { id: 'lucia', titulo: 'Tesorera Lucía', tipo: 'WhatsApp', valor: '+598 XX XXX XXX', url: 'https://wa.me/59800000000' },
  { id: 'grupo', titulo: 'Grupo correspondiente', tipo: 'WhatsApp', valor: 'Grupo asignado por PR', url: 'https://chat.whatsapp.com/' },
]

export const notificaciones = [
  { id: 1, tipo: 'insignia', titulo: 'Nueva insignia obtenida', descripcion: '¡Felicitaciones! Obtuviste la insignia Patinador en Ascenso.', fecha: '2026-06-16', leida: false },
  { id: 2, tipo: 'observacion', titulo: 'Nueva observación', descripcion: 'Profe David dejó una nueva observación en tu perfil.', fecha: '2026-06-15', leida: false },
  { id: 3, tipo: 'participacion', titulo: 'Nueva participación registrada', descripcion: 'Se registró tu participación en Roller Sunset 2026.', fecha: '2026-06-14', leida: true },
  { id: 4, tipo: 'aviso', titulo: 'Aviso PR', descripcion: 'Recordá revisar los horarios y cupos actualizados en la Home.', fecha: '2026-06-12', leida: true },
]

export const observaciones = [
  {
    id: 1,
    usuario_id: '1',
    autor_id: 'claudio',
    titulo: 'Prueba 6K',
    descripcion: 'Tiempo: 14:32. Muy buena evolución. Mantener ritmo parejo y seguir trabajando curvas.',
    tipo: 'Evaluación',
    fecha: '2026-06-14',
    imagen_url: null,
    reaccion: null,
  },
  {
    id: 2,
    usuario_id: '1',
    autor_id: 'david',
    titulo: 'Técnica de curvas',
    descripcion: 'Mejoró estabilidad y postura. Seguir practicando entrada a curva con control.',
    tipo: 'Técnica',
    fecha: '2026-06-10',
    imagen_url: null,
    reaccion: 'recibido',
  },
  {
    id: 3,
    usuario_id: '1',
    autor_id: 'claudio',
    titulo: 'Entrenamiento Racing',
    descripcion: 'Buena actitud durante la serie larga. Próximo objetivo: sostener ritmo en 10K.',
    tipo: 'Entrenamiento',
    fecha: '2026-06-02',
    imagen_url: null,
    reaccion: 'motivo',
  },
]

export const insignias = [
  { id: 1, nombre: 'Primer Mes', categoria: 'Inicio', tipo: 'oficial', descripcion: 'Completaste tu primer mes formando parte de Punta Rollers.', desbloqueada: true, fecha: '2022-04-15', otorgada_por_id: 'claudio', imagen_url: null },
  { id: 2, nombre: 'Rodador Frecuente', categoria: 'Constancia', tipo: 'oficial', descripcion: 'Asististe regularmente a clases durante un período destacado.', desbloqueada: true, fecha: '2022-07-20', otorgada_por_id: 'david', imagen_url: null },
  { id: 3, nombre: 'Espíritu PR', categoria: 'Comunidad', tipo: 'oficial', descripcion: 'Representás los valores y la esencia de Punta Rollers.', desbloqueada: true, fecha: '2023-02-01', otorgada_por_id: 'claudio', imagen_url: null },
  { id: 4, nombre: 'Corazón Racing', categoria: 'Racing', tipo: 'oficial', descripcion: 'Demostrás pasión y compromiso con el entrenamiento Racing.', desbloqueada: true, fecha: '2024-04-01', otorgada_por_id: 'claudio', imagen_url: null },
  { id: 5, nombre: 'Patinador en Ascenso', categoria: 'Reconocimiento', tipo: 'oficial', descripcion: 'Evolución destacada durante los últimos períodos.', desbloqueada: true, fecha: '2026-06-16', otorgada_por_id: 'david', imagen_url: null },
  { id: 6, nombre: 'Frenada Destacada', categoria: 'Personalizada', tipo: 'personalizada', descripcion: 'Reconocimiento por demostrar excelente técnica de frenado.', desbloqueada: true, fecha: '2026-05-30', otorgada_por_id: 'claudio', imagen_url: null },
  { id: 7, nombre: 'Inquebrantable', categoria: 'Constancia', tipo: 'oficial', descripcion: 'Demostraste compromiso y constancia sostenida.', desbloqueada: false, fecha: null, otorgada_por_id: null, imagen_url: null },
  { id: 8, nombre: 'Primeros 10K', categoria: 'Racing', tipo: 'oficial', descripcion: 'Primer recorrido de 10 kilómetros completado.', desbloqueada: false, fecha: null, otorgada_por_id: null, imagen_url: null },
  { id: 9, nombre: 'Veterano PR', categoria: 'Constancia', tipo: 'oficial', descripcion: 'Un año formando parte de Punta Rollers.', desbloqueada: false, fecha: null, otorgada_por_id: null, imagen_url: null },
]

export const participaciones = [
  { id: 1, nombre: 'Roller Night 2026', fecha: '2026-02-14', descripcion: 'Participaste en Roller Night 2026 junto a la comunidad Punta Rollers.', imagen_url: null },
  { id: 2, nombre: 'Roller Sunset 2026', fecha: '2026-01-23', descripcion: 'Participaste en Roller Sunset 2026 junto a la comunidad Punta Rollers.', imagen_url: null },
  { id: 3, nombre: 'Travesía Puente de la Barra', fecha: '2025-11-08', descripcion: 'Participaste en la Travesía Puente de la Barra junto a la comunidad Punta Rollers.', imagen_url: null },
  { id: 4, nombre: 'Día del Patinador', fecha: '2025-04-14', descripcion: 'Participaste en el Día del Patinador junto a la comunidad Punta Rollers.', imagen_url: null },
  { id: 5, nombre: 'Rolleada Ramblera', fecha: '2025-02-21', descripcion: 'Participaste en la Rolleada Ramblera junto a la comunidad Punta Rollers.', imagen_url: null },
]

export const horarios = [
  { dia: 'Miércoles', clases: [{ hora: '19:00', nombre: 'Adultos Principiantes', cupos: 8 }, { hora: '20:00', nombre: 'Adultos Intermedio / Avanzado', cupos: 5 }] },
  { dia: 'Sábado', clases: [{ hora: '19:00', nombre: 'PR Kids', cupos: 3 }, { hora: '20:00', nombre: 'Adultos Mixta', cupos: 6 }] },
]

export const actividad = [
  { id: 1, tipo: 'Ingreso', nombre: 'Luciana ingresó a la plataforma', fecha: '2026-06-17', hora: '21:43', origen: 'plataforma' },
  { id: 2, tipo: 'Insignia', nombre: 'Patinador en Ascenso', fecha: '2026-06-16', hora: '18:12', origen: 'admin' },
  { id: 3, tipo: 'Observación', nombre: 'Profe David dejó una observación', fecha: '2026-06-15', hora: '20:10', origen: 'entrenador' },
]

export const servicios = [
  { id: 'prcard', nombre: 'PR Card', icono: '🎫', color: '#C9A84C', descripcion: 'Tarjeta digital de beneficios exclusiva para alumnos.', precio: 'Servicio PR', tags: ['Beneficios', 'Alumnos', 'Digital'], destacado: true },
  { id: 'tracking', nombre: 'PR Tracking', icono: '🛡️', color: '#1A6B4A', descripcion: 'Protegé e identificá tu equipamiento mediante NFC.', precio: 'Servicio PR', tags: ['NFC', 'Seguridad', 'Equipos'], destacado: true },
  { id: 'rollermap', nombre: 'RollerMap', icono: '🗺️', color: '#3b4ab0', descripcion: 'Descubrí lugares para patinar y moverte sobre ruedas.', precio: 'Mapa PR', tags: ['Mapa', 'Comunidad', 'Rutas'], destacado: false },
  { id: 'pasaporte', nombre: 'Pasaporte Kids', icono: '📖', color: '#3b4ab0', descripcion: 'Aprender jugando sobre ruedas con sellos, stickers y premios.', precio: 'PR Kids', tags: ['Kids', 'Sellos', 'Motivación'], destacado: true },
  { id: 'cuponeras', nombre: 'Cuponeras', icono: '🎟️', color: '#C9A84C', descripcion: 'Flexibilidad para venir a clases sin perder clases abonadas.', precio: 'Vigencia 2 meses', tags: ['Flexible', 'Clases', 'Familias'], destacado: false },
  { id: 'personal', nombre: 'Clases Personalizadas', icono: '👨‍🏫', color: '#8B4A9C', descripcion: 'Clases 1:1 adaptadas a tus objetivos. Configurable desde Admin.', precio: 'Próximamente / Link activo', tags: ['1 hora', 'Personalizado', 'Técnica'], destacado: false },
]

export const contenido = [
  { id: 1, titulo: 'Roller Sunset 2026', tipo: 'galeria', categoria: 'Eventos', url: 'https://drive.google.com', fecha: '2026-01-23' },
  { id: 2, titulo: 'Roller Night 2026', tipo: 'video', categoria: 'Eventos', url: 'https://youtube.com', fecha: '2026-02-14' },
  { id: 3, titulo: 'PR Kids — Pasaporte', tipo: 'galeria', categoria: 'PR Kids', url: 'https://drive.google.com', fecha: '2026-05-01' },
]

export const productos = [
  { id: 1, nombre: 'Remera PR Classic', precio: '$1.200', talles: ['XS','S','M','L','XL'], diseños: ['Negro / Dorado','Blanco / Dorado','Blanco / Verde'], agotado: false },
  { id: 2, nombre: 'Remera Speed Edition', precio: '$1.400', talles: ['S','M','L','XL'], diseños: ['Negro / Plateado','Azul marino / Dorado'], agotado: false },
  { id: 3, nombre: 'Remera PR Kids', precio: '$900', talles: ['2','4','6','8','10','12'], diseños: ['Blanco / Verde','Negro / Dorado'], agotado: false },
]

export const adminUsuarios = [
  { id: '1', nombre: 'Luciana Méndez', documento: '47839201', email: 'luci@email.com', grupos: ['Parada 2', 'Racing'], estado: 'Activa', miembro: 'Destacada', verificado: true, prcard: true, tracking: false, ultimo_acceso: '2026-06-17T21:43:00', foto_url: null, banner_url: null, pin: '1234' },
  { id: '2', nombre: 'Martín Rovira', documento: '32109847', email: 'martin@email.com', grupos: ['Pista Cerrada'], estado: 'Activo', miembro: 'Frecuente', verificado: true, prcard: true, tracking: true, ultimo_acceso: '2026-06-15T18:10:00', foto_url: null, banner_url: null, pin: '4821' },
  { id: '3', nombre: 'Camila Torres', documento: '51092834', email: 'camila@email.com', grupos: ['Principiante'], estado: 'Activo', miembro: 'Nuevo', verificado: false, prcard: false, tracking: false, ultimo_acceso: null, foto_url: null, banner_url: null, pin: '9021' },
  { id: '4', nombre: 'Sofía Pereyra', documento: '44872013', email: 'sofia@email.com', grupos: ['Intermedio'], estado: 'Pausado', miembro: 'Activo', verificado: false, prcard: true, tracking: false, ultimo_acceso: '2026-06-01T19:40:00', foto_url: null, banner_url: null, pin: '3301' },
  { id: '5', nombre: 'Lucas Fernández', documento: '39012847', email: 'lucas@email.com', grupos: ['Racing'], estado: 'Inactivo', miembro: 'Activo', verificado: false, prcard: false, tracking: false, ultimo_acceso: null, foto_url: null, banner_url: null, pin: '1188' },
]

export const mensajesGlobales = [
  { id: 1, titulo: '¡Bienvenida a tu espacio PR!', contenido: 'Acá vas a encontrar tus observaciones, insignias, participaciones y novedades.', tipo: 'onboarding', visible: true, fecha: '2026-06-01' },
]
