import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { supabase } from './supabase'
import { professores } from '../data/mockData'

const AuthContext = createContext(null)

const STORAGE_KEY = 'pr_user'
const AUTO_REFRESH_INTERVAL_MS = 5 * 60 * 1000

function parseJsonArray(value) {
  if (Array.isArray(value)) return value
  if (typeof value !== 'string' || !value.trim()) return []
  try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : [] } catch { return [] }
}

function parseStatistics(value) {
  const fallback = { eventos: 0, insignias: 0, notas: 0 }
  if (value && typeof value === 'object' && !Array.isArray(value)) return { ...fallback, ...value }
  if (typeof value === 'string' && value.trim()) {
    try { const parsed = JSON.parse(value); if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return { ...fallback, ...parsed } } catch { return fallback }
  }
  return fallback
}

function normalizeRole(role) {
  const normalized = String(role || '').trim().toLowerCase()
  return ['admin','profesor','alumno'].includes(normalized) ? normalized : 'alumno'
}

function normalizeStatus(status) {
  const normalized = String(status || 'Activo').trim().toLowerCase()
  if (normalized === 'inactivo') return 'Inactivo'
  if (normalized === 'vencido') return 'Vencido'
  if (normalized === 'bloqueado') return 'Bloqueado'
  return 'Activo'
}

function calculateAccess(profile) {
  const status = normalizeStatus(profile.estado)
  if (typeof profile.acceso_habilitado === 'boolean') return profile.acceso_habilitado
  return status === 'Activo'
}

function normalizeProfile(profile) {
  const role = normalizeRole(profile.role)
  const estado = normalizeStatus(profile.estado)
  const accesoHabilitado = calculateAccess(profile)
  const esProfesor = Boolean(profile.es_profesor) || role === 'profesor' || role === 'admin'
  const participaComoAlumno = Boolean(profile.participa_como_alumno) || role === 'alumno'
  const exentoMensualidad = Boolean(profile.exento_mensualidad) || role === 'admin' || role === 'profesor'

  return {
    id: profile.id,
    authUserId: profile.auth_user_id || '',
    authMigrado: Boolean(profile.auth_migrado),
    nombre: profile.nombre || '',
    apellido: profile.apellido || '',
    documento: profile.documento || '',
    role,
    esProfesor,
    participaComoAlumno,
    exentoMensualidad,
    esTesoreria: Boolean(profile.es_tesoreria),
    profesorId: profile.profesor_id || (esProfesor ? profile.id : ''),
    ciudad: profile.ciudad || '',
    instagram: profile.instagram || '',
    email: profile.email || '',
    fechaNacimiento: profile.fecha_nacimiento || '',
    miembroDesde: profile.miembro_desde || '2026',
    estado,
    accesoHabilitado,
    mensualidadHasta: profile.mensualidad_hasta || '',
    verificado: Boolean(profile.verificado),
    foto: profile.foto || '',
    banner: profile.banner || '',
    sobreMi: profile.sobre_mi || '',
    gruposInfo: parseJsonArray(profile.grupos_info),
    prcardActiva: Boolean(profile.prcard_activa),
    trackingActivo: Boolean(profile.tracking_activo),
    origenUsuario: profile.origen_usuario || '',
    prcardMemberId: profile.prcard_member_id || '',
    ultimoIngreso: profile.ultimo_ingreso || '',
    createdAt: profile.created_at || '',
    prcard: { activa: Boolean(profile.prcard_activa), link: 'https://puntarollerscard.com/' },
    tracking: { activo: Boolean(profile.tracking_activo) },
    estadisticas: parseStatistics(profile.estadisticas),
    pr_avatar: profile.pr_avatar && typeof profile.pr_avatar === 'object' && !Array.isArray(profile.pr_avatar) ? profile.pr_avatar : {},
  }
}

function saveLocalUser(userData) { localStorage.setItem(STORAGE_KEY, JSON.stringify(userData)) }
function clearLocalUser() { localStorage.removeItem(STORAGE_KEY) }
function buildAuthEmail(documento) { return `${documento}@usuarios.puntarollers.app` }

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const refreshInFlightRef = useRef(null)

  async function refreshUserSilently() {
    if (refreshInFlightRef.current) return refreshInFlightRef.current
    const task = (async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      const authUser = sessionData?.session?.user
      if (!authUser) return { skipped: true }
      const { data: profileData, error } = await supabase.from('profiles').select('*').eq('auth_user_id', authUser.id).maybeSingle()
      if (error || !profileData) return { error: error?.message || 'Perfil no encontrado.' }
      const userData = normalizeProfile(profileData)
      saveLocalUser(userData)
      setUser(userData)
      return { success: true, user: userData }
    })()
    refreshInFlightRef.current = task
    try { return await task } finally { refreshInFlightRef.current = null }
  }

  useEffect(() => {
    let active = true
    async function bootstrap() {
      try {
        const { data } = await supabase.auth.getSession()
        if (data?.session?.user) {
          const result = await refreshUserSilently()
          if (!active) return
          if (!result?.success) {
            const saved = localStorage.getItem(STORAGE_KEY)
            if (saved) setUser(JSON.parse(saved))
          }
        } else {
          const saved = localStorage.getItem(STORAGE_KEY)
          if (saved) setUser(JSON.parse(saved))
        }
      } catch { clearLocalUser(); if (active) setUser(null) }
      finally { if (active) setLoading(false) }
    }
    bootstrap()
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') { clearLocalUser(); setUser(null) }
      if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') refreshUserSilently()
    })
    const interval = window.setInterval(() => refreshUserSilently(), AUTO_REFRESH_INTERVAL_MS)
    return () => { active = false; listener?.subscription?.unsubscribe(); window.clearInterval(interval) }
  }, [])

  async function login(documento, pin) {
    const cleanDoc = String(documento || '').replace(/\D/g, '')
    const cleanPin = String(pin || '').trim()
    if (!cleanDoc || !cleanPin) return { error: 'Ingresá documento y PIN.' }

    let authData
    const authResult = await supabase.auth.signInWithPassword({ email: buildAuthEmail(cleanDoc), password: cleanPin })
    authData = authResult.data
    if (authResult.error || !authData?.user) return { error: 'Documento o PIN incorrecto.' }

    const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').eq('auth_user_id', authData.user.id).maybeSingle()
    if (profileError || !profileData) { await supabase.auth.signOut(); return { error: 'La cuenta existe, pero no encontramos su perfil vinculado.' } }
    if (String(profileData.documento || '') !== cleanDoc) { await supabase.auth.signOut(); return { error: 'La cuenta segura no coincide con este documento.' } }

    const loginDate = new Date().toISOString()
    const { error: updateError } = await supabase.from('profiles').update({ ultimo_ingreso: loginDate }).eq('id', profileData.id)
    if (updateError) console.warn('No se pudo registrar el último ingreso:', updateError)

    const userData = normalizeProfile({ ...profileData, ultimo_ingreso: loginDate })
    saveLocalUser(userData); setUser(userData)
    return { success: true, user: userData, accessBlocked: !userData.accesoHabilitado }
  }

  async function logout() {
    const { data: sessionData } = await supabase.auth.getSession()
    if (sessionData?.session) await supabase.auth.signOut()
    clearLocalUser(); setUser(null)
  }

  function updateUser(updates) {
    setUser((currentUser) => {
      if (!currentUser) return currentUser
      const nextUser = { ...currentUser, ...updates }
      saveLocalUser(nextUser)
      return nextUser
    })
  }

  async function refreshUser() {
    const result = await refreshUserSilently()
    if (result?.skipped) return { success: true, user }
    return result
  }

  const isProfessor = Boolean(user?.esProfesor) || user?.role === 'profesor' || user?.role === 'admin'
  const isStudent = Boolean(user?.participaComoAlumno) || user?.role === 'alumno'

  return (
    <AuthContext.Provider value={{
      user, loading, login, logout, updateUser, refreshUser,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'admin',
      isProfessor,
      isStudent,
      isTreasury: Boolean(user?.esTesoreria) || user?.role === 'admin',
      isPaymentExempt: Boolean(user?.exentoMensualidad) || user?.role === 'admin' || user?.role === 'profesor',
      hasPrivateAccess: Boolean(user?.accesoHabilitado),
      professores,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe utilizarse dentro de AuthProvider')
  return context
}
