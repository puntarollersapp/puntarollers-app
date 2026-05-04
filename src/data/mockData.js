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

export const horarios = [
  { dia: 'Lunes',     clases: [{ hora: '09:00', nombre: 'Adultos Principiantes', cupos: 8 }, { hora: '18:00', nombre: 'PR Kids', cupos: 12 }] },
  { dia: 'Miércoles', clases: [{ hora: '09:00', nombre: 'Adultos Intermedios', cupos: 6 }, { hora: '16:00', nombre: 'PR Kids', cupos: 10 }, { hora: '19:00', nombre: 'Speed Training', cupos: 4 }] },
  { dia: 'Viernes',   clases: [{ hora: '09:00', nombre: 'Adultos Avanzados', cupos: 6 }, { hora: '17:00', nombre: 'PR Kids', cupos: 12 }] },
  { dia: 'Sábado',    clases: [{ hora: '10:00', nombre: 'Clase abierta', cupos: 20 }, { hora: '15:00', nombre: 'Freestyle / Fitness', cupos: 15 }] },
]

export const insignias = [
  { id: 1, nombre: 'Primera Rodada',  emoji: '⭐', descripcion: 'Tu primer clase en PR.',        desbloqueada: true,  fecha: '2022-03-15' },
  { id: 2, nombre: 'Constancia',      emoji: '🔥', descripcion: '30 clases asistidas.',          desbloqueada: true,  fecha: '2022-07-20' },
  { id: 3, nombre: 'Modo Velocidad',  emoji: '⚡', descripcion: 'Primer Speed Training.',        desbloqueada: true,  fecha: '2022-11-05' },
  { id: 4, nombre: 'Veterano',        emoji: '🏅', descripcion: '1 año en el club.',             desbloqueada: true,  fecha: '2023-03-15' },
  { id: 5, nombre: 'PRCard Elite',    emoji: '💳', descripcion: 'Activaste tu PRCard.',          desbloqueada: true,  fecha: '2023-01-10' },
  { id: 6, nombre: 'Evento Especial', emoji: '🎯', descripcion: 'Participaste en un evento PR.', desbloqueada: true,  fecha: '2023-06-18' },
  { id: 7, nombre: 'Crack del Club',  emoji: '👑', descripcion: '80 clases asistidas.',          desbloqueada: true,  fecha: '2024-04-01' },
  { id: 8, nombre: 'Campeón Alianza', emoji: '🏆', descripcion: 'Ganá en Alianza Rollers.',     desbloqueada: false, fecha: null },
  { id: 9, nombre: 'Online Pioneer',  emoji: '🌐', descripcion: 'Primera clase online.',         desbloqueada: false, fecha: null },
  { id: 10, nombre: 'Leyenda PR',     emoji: '✨', descripcion: '200 clases asistidas.',         desbloqueada: false, fecha: null },
]

export const experiencias = [
  { id: 1, nombre: 'Torneo Verano 2023',   categoria: 'Competencia', color: '#C9A84C', desbloqueada: true,  descripcion: 'Participaste en el torneo interno de verano.' },
  { id: 2, nombre: 'Show de Navidad',      categoria: 'Evento',      color: '#1A6B4A', desbloqueada: true,  descripcion: 'Presentación de fin de año en el Parque.' },
  { id: 3, nombre: 'Expedición Punta',     categoria: 'Rodada',      color: '#3b4ab0', desbloqueada: true,  descripcion: 'Rodada grupal por Punta del Este.' },
  { id: 4, nombre: 'Speed Camp 2024',      categoria: 'Formación',   color: '#8B4A9C', desbloqueada: true,  descripcion: 'Campamento de entrenamiento en velocidad.' },
  { id: 5, nombre: 'Alianza Rollers Vol.1',categoria: 'Alianza',     color: '#C9A84C', desbloqueada: false, descripcion: 'Primer evento de la red Alianza Rollers.' },
  { id: 6, nombre: 'Clase con Claudio',    categoria: 'Exclusivo',   color: '#1A6B4A', desbloqueada: false, descripcion: 'Clase personal con el director del club.' },
]

export const actividad = [
  { id: 1, tipo: 'Clase',    nombre: 'Adultos Avanzados', fecha: '2025-04-28', hora: '09:00', origen: 'NFC' },
  { id: 2, tipo: 'Clase',    nombre: 'Speed Training',    fecha: '2025-04-23', hora: '19:00', origen: 'NFC' },
  { id: 3, tipo: 'Evento',   nombre: 'Rodada Grupal',     fecha: '2025-04-20', hora: '10:00', origen: 'manual' },
  { id: 4, tipo: 'Clase',    nombre: 'Adultos Avanzados', fecha: '2025-04-18', hora: '09:00', origen: 'NFC' },
  { id: 5, tipo: 'Insignia', nombre: 'Crack del Club',    fecha: '2025-04-01', hora: '—',     origen: 'sistema' },
]

export const servicios = [
  { id: 'kids',      nombre: 'PR Kids',         icono: '🛼', color: '#1A6B4A', descripcion: 'Clases para chicos desde 4 años. Metodología progresiva, segura y divertida.', precio: 'Desde $1.500/mes',      tags: ['4-14 años', 'Progresivo', 'Lúdico'],          destacado: true },
  { id: 'pasaporte', nombre: 'Pasaporte Kids',   icono: '🎫', color: '#3b4ab0', descripcion: 'Pack de 4 clases por mes para los más pequeños, sin compromiso fijo.',          precio: '$1.200 / pack x4',      tags: ['Flexible', 'Sin mensualidad', 'Kids'],        destacado: false },
  { id: 'adultos',   nombre: 'Clases Adultos',   icono: '⚡', color: '#C9A84C', descripcion: 'Principiantes, intermedios y avanzados. Técnica, velocidad y freestyle.',       precio: 'Desde $1.800/mes',      tags: ['Todos los niveles', 'Técnica', 'Speed'],      destacado: true },
  { id: 'personal',  nombre: 'Clase Personal',   icono: '🎯', color: '#8B4A9C', descripcion: 'Entrenamiento 1:1 con Claudio. Progresión acelerada y plan personalizado.',     precio: '$800 por sesión',       tags: ['1:1', 'Personalizado', 'Premium'],            destacado: false },
  { id: 'prcard',    nombre: 'PRCard',            icono: '💳', color: '#C9A84C', descripcion: 'Membresía premium. Beneficios, descuentos, acceso prioritario y tracking.',     precio: 'Incluida con membresía',tags: ['Membresía', 'Beneficios', 'NFC'],             destacado: true },
  { id: 'tracking',  nombre: 'PR Tracking',       icono: '📊', color: '#1A6B4A', descripcion: 'Seguimiento de tu progreso, asistencias e historial de actividad.',            precio: 'Gratis con PRCard',     tags: ['Analytics', 'Historial', 'Digital'],          destacado: false },
  { id: 'alianza',   nombre: 'Alianza Rollers',   icono: '🤝', color: '#B8960C', descripcion: 'Red de escuelas asociadas. Practicá en otros clubes con tu PRCard.',           precio: 'Red en expansión',      tags: ['Red', 'Multi-sede', 'Próximo'],               destacado: false },
  { id: 'online',    nombre: 'Clases Online',     icono: '🌐', color: '#3b4ab0', descripcion: 'Próximamente: clases en vivo y grabadas para practicar desde donde quieras.',  precio: 'Próximamente',          tags: ['Coming soon', 'Live', 'On-demand'],           destacado: false },
]

export const contenido = [
  { id: 1, titulo: 'Torneo Verano 2023',         tipo: 'galeria', categoria: 'Eventos',        url: 'https://drive.google.com', fecha: '2023-02-10' },
  { id: 2, titulo: 'Show de Navidad 2023',        tipo: 'video',   categoria: 'Eventos',        url: 'https://youtube.com',      fecha: '2023-12-20' },
  { id: 3, titulo: 'Speed Training Highlights',   tipo: 'video',   categoria: 'Entrenamiento',  url: 'https://youtube.com',      fecha: '2024-03-15' },
  { id: 4, titulo: 'Rodada Grupal Abril 2024',    tipo: 'galeria', categoria: 'Rodadas',        url: 'https://drive.google.com', fecha: '2024-04-20' },
  { id: 5, titulo: 'PR Kids — Recital 2024',      tipo: 'galeria', categoria: 'PR Kids',        url: 'https://drive.google.com', fecha: '2024-07-05' },
  { id: 6, titulo: 'Speed Camp Detrás de cámara', tipo: 'video',   categoria: 'Entrenamiento',  url: 'https://youtube.com',      fecha: '2024-09-12' },
]

export const productos = [
  { id: 1, nombre: 'Remera PR Classic',    precio: '$1.200', talles: ['XS','S','M','L','XL'],      diseños: ['Negro / Dorado','Blanco / Dorado','Blanco / Verde'],  agotado: false },
  { id: 2, nombre: 'Remera Speed Edition', precio: '$1.400', talles: ['S','M','L','XL'],           diseños: ['Negro / Plateado','Azul marino / Dorado'],            agotado: false },
  { id: 3, nombre: 'Remera PR Kids',       precio: '$900',   talles: ['2','4','6','8','10','12'],  diseños: ['Blanco / Verde','Negro / Dorado'],                    agotado: false },
]

export const adminUsuarios = [
  { id: '1', nombre: 'Luciana Méndez',  documento: '47839201', estado: 'Destacada', prcard: true,  clases: 84, ultimo_acceso: '2025-04-28' },
  { id: '2', nombre: 'Martín Rovira',   documento: '32109847', estado: 'Activo',    prcard: true,  clases: 31, ultimo_acceso: '2025-04-25' },
  { id: '3', nombre: 'Camila Torres',   documento: '51092834', estado: 'Frecuente', prcard: false, clases: 12, ultimo_acceso: '2025-04-10' },
  { id: '4', nombre: 'Sofía Pereyra',   documento: '44872013', estado: 'Activo',    prcard: true,  clases: 47, ultimo_acceso: '2025-04-27' },
  { id: '5', nombre: 'Lucas Fernández', documento: '39012847', estado: 'Inactivo',  prcard: false, clases: 5,  ultimo_acceso: '2025-02-14' },
]

export const mensajesGlobales = [
  { id: 1, titulo: '¡Clase especial el sábado!', contenido: 'Este sábado 10hs habrá una clase abierta especial con sorteo de premios. ¡No te la pierdas!', tipo: 'evento', visible: true, fecha: '2025-04-30' }
]
