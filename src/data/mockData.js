// ─── Mock User ───────────────────────────────────────────
export const mockUser = {
  id: '1',
  nombre: 'Luciana Méndez',
  documento: '47839201',
  email: 'luci@email.com',
  foto_url: null,
  frase_personal: 'Cada clase suma. Cada rodada queda.',
  miembro_desde: '2022-03-15',
  estado: 'Destacada',
  prcard_activa: true,
  clases_asistidas: 84,
  eventos: 12,
  experiencias_desbloqueadas: 7,
}

// ─── Horarios ────────────────────────────────────────────
export const horarios = [
  { dia: 'Lunes', clases: [
    { hora: '09:00', nombre: 'Adultos Principiantes', cupos: 8 },
    { hora: '18:00', nombre: 'PR Kids', cupos: 12 },
  ]},
  { dia: 'Miércoles', clases: [
    { hora: '09:00', nombre: 'Adultos Intermedios', cupos: 6 },
    { hora: '16:00', nombre: 'PR Kids', cupos: 10 },
    { hora: '19:00', nombre: 'Speed Training', cupos: 4 },
  ]},
  { dia: 'Viernes', clases: [
    { hora: '09:00', nombre: 'Adultos Avanzados', cupos: 6 },
    { hora: '17:00', nombre: 'PR Kids', cupos: 12 },
  ]},
  { dia: 'Sábado', clases: [
    { hora: '10:00', nombre: 'Clase abierta', cupos: 20 },
    { hora: '15:00', nombre: 'Freestyle / Fitness', cupos: 15 },
  ]},
]

// ─── Insignias ───────────────────────────────────────────
export const insignias = [
  { id: 1, nombre: 'Primera Rodada', emoji: '⭐', descripcion: 'Tu primer clase en PR.', desbloqueada: true, fecha: '2022-03-15' },
  { id: 2, nombre: 'Constancia', emoji: '🔥', descripcion: '30 clases asistidas.', desbloqueada: true, fecha: '2022-07-20' },
  { id: 3, nombre: 'Modo Velocidad', emoji: '⚡', descripcion: 'Primer Speed Training.', desbloqueada: true, fecha: '2022-11-05' },
  { id: 4, nombre: 'Veterano', emoji: '🏅', descripcion: '1 año en el club.', desbloqueada: true, fecha: '2023-03-15' },
  { id: 5, nombre: 'PRCard Elite', emoji: '💳', descripcion: 'Activaste tu PRCard.', desbloqueada: true, fecha: '2023-01-10' },
  { id: 6, nombre: 'Evento Especial', emoji: '🎯', descripcion: 'Participaste en un evento PR.', desbloqueada: true, fecha: '2023-06-18' },
  { id: 7, nombre: 'Crack del Club', emoji: '👑', descripcion: '80 clases asistidas.', desbloqueada: true, fecha: '2024-04-01' },
  { id: 8, nombre: 'Campeón Alianza', emoji: '🏆', descripcion: 'Ganá en Alianza Rollers.', desbloqueada: false, fecha: null },
  { id: 9, nombre: 'Online Pioneer', emoji: '🌐', descripcion: 'Primera clase online.', desbloqueada: false, fecha: null },
  { id: 10, nombre: 'Leyenda PR', emoji: '✨', descripcion: '200 clases asistidas.', desbloqueada: false, fecha: null },
]

// ─── Experiencias ────────────────────────────────────────
export const experiencias = [
  { id: 1, nombre: 'Torneo Verano 2023', categoria: 'Competencia', color: '#C9A84C', desbloqueada: true },
  { id: 2, nombre: 'Show de Navidad', categoria: 'Evento', color: '#1A6B4A', desbloqueada: true },
  { id: 3, nombre: 'Expedición Punta', categoria: 'Rodada', color: '#3b4ab0', desbloqueada: true },
  { id: 4, nombre: 'Speed Camp 2024', categoria: 'Formación', color: '#8B4A9C', desbloqueada: true },
  { id: 5, nombre: 'Alianza Rollers Vol.1', categoria: 'Alianza', color: '#C9A84C', desbloqueada: false },
  { id: 6, nombre: 'Clase con Claudio', categoria: 'Exclusivo', color: '#1A6B4A', desbloqueada: false },
]

// ─── Actividad ───────────────────────────────────────────
export const actividad = [
  { id: 1, tipo: 'Clase', nombre: 'Adultos Avanzados', fecha: '2025-04-28', hora: '09:00', origen: 'NFC' },
  { id: 2, tipo: 'Clase', nombre: 'Speed Training', fecha: '2025-04-23', hora: '19:00', origen: 'NFC' },
  { id: 3, tipo: 'Evento', nombre: 'Rodada Grupal', fecha: '2025-04-20', hora: '10:00', origen: 'manual' },
  { id: 4, tipo: 'Clase', nombre: 'Adultos Avanzados', fecha: '2025-04-18', hora: '09:00', origen: 'NFC' },
  { id: 5, tipo: 'Insignia', nombre: 'Crack del Club', fecha: '2025-04-01', hora: '—', origen: 'sistema' },
]

// ─── Servicios ───────────────────────────────────────────
export const servicios = [
  { id: 'kids', nombre: 'PR Kids', icono: '🛼', color: '#1A6B4A', precio: 'Desde $1.500/mes', destacado: true },
  { id: 'adultos', nombre: 'Clases Adultos', icono: '⚡', color: '#C9A84C', precio: 'Desde $1.800/mes', destacado: true },
  { id: 'personal', nombre: 'Clase Personal', icono: '🎯', color: '#8B4A9C', precio: '$800 por sesión', destacado: false },
]

// ─── Tienda ─────────────────────────────────────────────
export const productos = [
  { id: 1, nombre: 'Remera PR Classic', precio: '$1.200', talles: ['S','M','L'], agotado: false },
  { id: 2, nombre: 'Remera Speed Edition', precio: '$1.400', talles: ['M','L','XL'], agotado: false },
]

// ─── Admin ──────────────────────────────────────────────
export const adminUsuarios = [
  { id: '1', nombre: 'Luciana Méndez', estado: 'Destacada', clases: 84 },
  { id: '2', nombre: 'Martín Rovira', estado: 'Activo', clases: 31 },
]

// ─── Mensajes ───────────────────────────────────────────
export const mensajesGlobales = [
  {
    id: 1,
    titulo: 'Clase especial',
    contenido: 'Este sábado hay clase abierta con premios.',
    visible: true,
  }
]

// ─── Contenido / Galería ─────────────────────────────────
export const contenido = [
  {
    id: 1,
    titulo: 'Torneo Verano 2023',
    tipo: 'galeria',
    categoria: 'Eventos',
    url: 'https://drive.google.com',
    fecha: '2023-02-10'
  },
  {
    id: 2,
    titulo: 'Show de Navidad 2023',
    tipo: 'video',
    categoria: 'Eventos',
    url: 'https://youtube.com',
    fecha: '2023-12-20'
  },
  {
    id: 3,
    titulo: 'Speed Training Highlights',
    tipo: 'video',
    categoria: 'Entrenamiento',
    url: 'https://youtube.com',
    fecha: '2024-03-15'
  },
  {
    id: 4,
    titulo: 'Rodada Grupal Abril 2024',
    tipo: 'galeria',
    categoria: 'Rodadas',
    url: 'https://drive.google.com',
    fecha: '2024-04-20'
  },
  {
    id: 5,
    titulo: 'PR Kids Recital 2024',
    tipo: 'galeria',
    categoria: 'PR Kids',
    url: 'https://drive.google.com',
    fecha: '2024-07-05'
  }
]
