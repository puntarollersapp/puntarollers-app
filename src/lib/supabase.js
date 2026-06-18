import { mockUser } from '../data/mockData'

// ─── LOGIN MOCK ─────────────────────────────────────────
export async function loginConDocumento(documento, pin) {
  if (
    documento === mockUser.documento &&
    pin === '1234'
  ) {
    return { data: mockUser }
  }

  return { error: 'Documento o PIN incorrecto' }
}

// ─── GET USUARIO ─────────────────────────────────────────
export async function getUsuario(id) {
  return { data: mockUser }
}

// ─── NFC MOCK ───────────────────────────────────────────
export async function registrarAsistenciaNFC(usuarioId, tipo = 'clase') {
  return { data: true }
}
