// ─── Mock User ───────────────────────────────────────────
export const mockUser = {
  id: '1',
  nombre: 'Claudio',
  documento: '123',
  email: 'claudio@email.com',
  foto_url: null,
  frase_personal: 'Cada clase suma. Cada rodada queda.',
  miembro_desde: '2024-01-01',
  estado: 'Activo',
  prcard_activa: true,
  clases_asistidas: 0,
  eventos: 0,
  experiencias_desbloqueadas: 0,
}

// ─── HORARIOS REALES (ACTUALIZADO) ───────────────────────
export const horarios = [
  {
    dia: 'Miércoles',
    clases: [
      {
        hora: '19:00 - 20:00',
        nombre: 'Adultos Principiantes',
        cupos: 10,
        lugar: 'Parada 2 (aire libre)',
      },
      {
        hora: '20:00 - 21:00',
        nombre: 'Adultos Intermedio / Avanzado',
        cupos: 10,
        lugar: 'Parada 2 (aire libre)',
      },
    ],
  },
  {
    dia: 'Sábado',
    clases: [
      {
        hora: '19:00 - 20:00',
        nombre: 'PR Kids',
        cupos: 12,
        lugar: 'Pista cerrada',
      },
      {
        hora: '20:00 - 21:00',
        nombre: 'Clase mixta (todos los niveles)',
        cupos: 12,
        lugar: 'Pista cerrada',
      },
    ],
  },
]

// ─── Insignias (vacío por ahora) ─────────────────────────
export const insignias = []

// ─── Experiencias (vacío por ahora) ──────────────────────
export const experiencias = []

// ─── Actividad (vacío por ahora) ─────────────────────────
export const actividad = []

// ─── Servicios (SIMPLIFICADO) ────────────────────────────
export const servicios = [
  {
    id: 'kids',
    nombre: 'PR Kids',
    descripcion: 'Clases para niños desde 4 años',
  },
  {
    id: 'adultos',
    nombre: 'Adultos',
    descripcion: 'Todos los niveles',
  },
]

// ─── Contenido ───────────────────────────────────────────
export const contenido = []

// ─── Tienda ─────────────────────────────────────────────
export const productos = []

// ─── Admin ──────────────────────────────────────────────
export const adminUsuarios = [
  {
    id: '1',
    nombre: 'Claudio',
    documento: '123',
    estado: 'Activo',
    prcard: true,
    clases: 0,
  },
]

// ─── Mensajes ───────────────────────────────────────────
export const mensajesGlobales = [
  {
    id: 1,
    titulo: 'Clase esta semana',
    contenido: 'Miércoles y sábado con horarios actualizados. ¡Te esperamos!',
    visible: true,
  }
]
