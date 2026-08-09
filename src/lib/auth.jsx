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

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function parseStatistics(value) {
  const fallback = { eventos: 0, insignias: 0, notas: 0 }

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return { ...fallback, ...value }
  }

  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value)

      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return { ...fallback, ...parsed }
      }
    } catch {
      return fallback
    }
  }

  return fallback
}

function normalizeRole(role) {
  const normalized = String(role || '').trim().toLowerCase()

  if (
    normalized === 'admin' ||
    normalized === 'profesor' ||
    normalized === 'alumno'
  ) {
    return normalized
  }

  return 'alumno'
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

  if (typeof profile.acceso_habilitado === 'boolean') {
    return profile.acceso_habilitado
  }

  return status === 'Activo'
}

function normalizeProfile(profile) {
  const role = normalizeRole(profile.role)
  const estado = normalizeStatus(profile.estado)
  const accesoHabilitado = calculateAccess(profile)

  return {
    id: profile.id,
    authUserId: profile.auth_user_id || '',
    authMigrado: Boolean(profile.auth_migrado),
    nombre: profile.nombre || '',
    apellido: profile.apellido || '',
    documento: profile.documento || '',
    role,
    profesorId:
      profile.profesor_id ||
      (role === 'profesor'
        ? profile.id
        : role === 'admin'
          ? profile.id
          : ''),
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
    prcard: {
      activa: Boolean(profile.prcard_activa),
      link: 'https://puntarollerscard.com/',
    },
    tracking: {
      activo: Boolean(profile.tracking_activo),
    },
    estadisticas: parseStatistics(profile.estadisticas),
    pr_avatar:
      profile.pr_avatar &&
      typeof profile.pr_avatar === 'object' &&
      !Array.isArray(profile.pr_avatar)
        ? profile.pr_avatar
        : {},
  }
}

function saveLocalUser(userData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(userData))
}

function clearLocalUser() {
  localStorage.removeItem(STORAGE_KEY)
}

function buildAuthEmail(documento) {
  return `${documento}@usuarios.puntarollers.app`
}

function buildAuthPassword(documento, pin) {
  return `PR-${pin}-${documento}`
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const refreshInProgressRef = useRef(false)

  async function loadProfileByAuthUserId(authUserId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_user_id', authUserId)
      .maybeSingle()

    if (error || !data) {
      return { error: 'No pudimos cargar el perfil vinculado.' }
    }

    return { user: normalizeProfile(data) }
  }

  async function refreshUserSilently() {
    if (refreshInProgressRef.current) {
      return { skipped: true }
    }

    refreshInProgressRef.current = true

    try {
      const {
        data: sessionData,
        error: sessionError,
      } = await supabase.auth.getSession()

      const authUserId = sessionData?.session?.user?.id || ''

      if (sessionError || !authUserId) {
        clearLocalUser()
        setUser(null)

        return { error: 'No hay una sesión segura activa.' }
      }

      const result = await loadProfileByAuthUserId(authUserId)

      if (result.error || !result.user) {
        return {
          error: result.error || 'No pudimos actualizar el perfil.',
        }
      }

      saveLocalUser(result.user)
      setUser(result.user)

      return { success: true, user: result.user }
    } finally {
      refreshInProgressRef.current = false
    }
  }

  useEffect(() => {
    let active = true

    async function restoreSession() {
      const {
        data: sessionData,
        error: sessionError,
      } = await supabase.auth.getSession()

      if (!active) return

      if (sessionError || !sessionData?.session?.user?.id) {
        clearLocalUser()
        setUser(null)
        setLoading(false)
        return
      }

      const result = await loadProfileByAuthUserId(
        sessionData.session.user.id
      )

      if (!active) return

      if (result.error || !result.user) {
        await supabase.auth.signOut()
        clearLocalUser()
        setUser(null)
        setLoading(false)
        return
      }

      saveLocalUser(result.user)
      setUser(result.user)
      setLoading(false)
    }

    restoreSession()

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!active) return

        if (event === 'SIGNED_OUT' || !session?.user?.id) {
          clearLocalUser()
          setUser(null)
          setLoading(false)
          return
        }

        const result = await loadProfileByAuthUserId(session.user.id)

        if (active && result.user) {
          saveLocalUser(result.user)
          setUser(result.user)
          setLoading(false)
        }
      }
    )

    return () => {
      active = false
      authListener?.subscription?.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!user) return undefined

    function refreshWhenVisible() {
      if (document.visibilityState === 'visible') {
        refreshUserSilently()
      }
    }

    function refreshWhenFocused() {
      refreshUserSilently()
    }

    document.addEventListener('visibilitychange', refreshWhenVisible)
    window.addEventListener('focus', refreshWhenFocused)

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshUserSilently()
      }
    }, AUTO_REFRESH_INTERVAL_MS)

    return () => {
      document.removeEventListener('visibilitychange', refreshWhenVisible)
      window.removeEventListener('focus', refreshWhenFocused)
      window.clearInterval(intervalId)
    }
  }, [user?.id])

  async function login(documento, pin) {
    const cleanDoc = String(documento || '').replace(/\D/g, '')
    const cleanPin = String(pin || '').trim()

    if (!cleanDoc || !cleanPin) {
      return { error: 'Ingresá tu documento y tu PIN.' }
    }

    const email = buildAuthEmail(cleanDoc)
    const password = buildAuthPassword(cleanDoc, cleanPin)

    const {
      data: authData,
      error: authError,
    } = await supabase.auth.signInWithPassword({ email, password })

    if (authError || !authData?.user?.id) {
      return { error: 'Documento o PIN incorrecto.' }
    }

    const {
      data: profileData,
      error: profileError,
    } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_user_id', authData.user.id)
      .maybeSingle()

    if (profileError || !profileData) {
      await supabase.auth.signOut()

      return {
        error: 'La cuenta existe, pero no encontramos su perfil vinculado.',
      }
    }

    if (String(profileData.documento || '') !== cleanDoc) {
      await supabase.auth.signOut()

      return {
        error: 'La cuenta segura no coincide con este documento.',
      }
    }

    const loginDate = new Date().toISOString()

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ ultimo_ingreso: loginDate })
      .eq('id', profileData.id)

    if (updateError) {
      console.warn(
        'No se pudo registrar el último ingreso:',
        updateError
      )
    }

    const userData = normalizeProfile({
      ...profileData,
      ultimo_ingreso: loginDate,
    })

    saveLocalUser(userData)
    setUser(userData)

    return {
      success: true,
      user: userData,
      accessBlocked: !userData.accesoHabilitado,
    }
  }

  async function logout() {
    const { data: sessionData } = await supabase.auth.getSession()

    if (sessionData?.session) {
      await supabase.auth.signOut()
    }

    clearLocalUser()
    setUser(null)
  }

  function updateUser(updates) {
    setUser((currentUser) => {
      if (!currentUser) return currentUser

      const nextUser = {
        ...currentUser,
        ...updates,
      }

      saveLocalUser(nextUser)
      return nextUser
    })
  }

  async function refreshUser() {
    const result = await refreshUserSilently()

    if (result?.skipped) {
      return { success: true, user }
    }

    return result
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        updateUser,
        refreshUser,
        isAuthenticated: Boolean(user),
        isAdmin: user?.role === 'admin',
        isProfessor: user?.role === 'profesor',
        hasPrivateAccess: Boolean(user?.accesoHabilitado),
        professores,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth debe utilizarse dentro de AuthProvider')
  }

  return context
}
