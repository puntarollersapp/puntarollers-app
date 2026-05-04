import { createClient } from '@supabase/supabase-js'

// 🔧 Variables de entorno (cambiá esto por tus datos reales)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://TU-PROYECTO.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'TU-ANON-KEY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ─── Auth helpers ─────────────────────────────────────────

// Login con documento + PIN
export async function loginConDocumento(documento, pin) {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('documento', documento)
    .single()

  if (error || !data) return { error: 'Usuario no encontrado' }

  // ⚠️ En producción esto debería ser hash (bcrypt)
  if (data.pin !== pin) return { error: 'PIN incorrecto' }

  return { data }
}

// Obtener usuario completo
export async function getUsuario(id) {
  const { data, error } = await supabase
    .from('usuarios')
    .select(`
      *,
      insignias:usuarios_insignias(
        *,
        insignia:insignias(*)
      ),
      experiencias:usuarios_experiencias(
        *,
        experiencia:experiencias(*)
      )
    `)
    .eq('id', id)
    .single()

  return { data, error }
}

// Registrar asistencia desde NFC
export async function registrarAsistenciaNFC(usuarioId, tipo = 'clase') {
  const now = new Date()

  const { data, error } = await supabase
    .from('asistencias')
    .insert({
      usuario_id: usuarioId,
      fecha: now.toISOString().split('T')[0],
      hora: now.toTimeString().split(' ')[0],
      tipo,
      origen_nfc: true,
    })

  return { data, error }
}
