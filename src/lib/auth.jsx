import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'
import { supabase } from './supabase'
import { professores } from '../data/mockData'

const AuthContext = createContext(null)

const STORAGE_KEY = 'pr_user'

function parseJsonArray(value) {
  if (Array.isArray(value)) {
    return value
  }

  if (typeof value !== 'string' || !value.trim()) {
    return []
  }

  try {
    const parsed = JSON.parse(value)

    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function parseStatistics(value) {
  const fallback = {
    eventos: 0,
    insignias: 0,
    notas: 0,
  }

  if (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value)
  ) {
    return {
      ...fallback,
      ...value,
    }
  }

  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value)

      if (
        parsed &&
        typeof parsed === 'object' &&
        !Array.isArray(parsed)
      ) {
        return {
          ...fallback,
          ...parsed,
        }
      }
    } catch {
      return fallback
    }
  }

  return fallback
}

function normalizeRole(role) {
  const normalized = String(role || '')
    .trim()
    .toLowerCase()

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
  const normalized = String(status || 'Activo')
    .trim()
    .toLowerCase()

  if (normalized === 'inactivo') {
    return 'Inactivo'
  }

  if (normalized === 'vencido') {
    return 'Vencido'
  }

  if (normalized === 'bloqueado') {
    return 'Bloqueado'
  }

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
    fechaNacimiento:
      profile.fecha_nacimiento || '',
    miembroDesde:
      profile.miembro_desde || '2026',
    estado,
    accesoHabilitado,
    mensualidadHasta:
      profile.mensualidad_hasta || '',
    verificado: Boolean(profile.verificado),
    foto: profile.foto || '',
    banner: profile.banner || '',
    sobreMi: profile.sobre_mi || '',
    gruposInfo: parseJsonArray(
      profile.grupos_info
    ),
    prcardActiva: Boolean(
      profile.prcard_activa
    ),
    trackingActivo: Boolean(
      profile.tracking_activo
    ),
    origenUsuario:
      profile.origen_usuario || '',
    prcardMemberId:
      profile.prcard_member_id || '',
    ultimoIngreso:
      profile.ultimo_ingreso || '',
    prcard: {
      activa: Boolean(
        profile.prcard_activa
      ),
      link: 'https://puntarollerscard.com/',
    },
    tracking: {
      activo: Boolean(
        profile.tracking_activo
      ),
    },
    estadisticas: parseStatistics(
      profile.estadisticas
    ),
  }
}

function saveLocalUser(userData) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(userData)
  )
}

function clearLocalUser() {
  localStorage.removeItem(STORAGE_KEY)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function restoreSession() {
      const saved = localStorage.getItem(
        STORAGE_KEY
      )

      if (!saved) {
        if (active) {
          setLoading(false)
        }

        return
      }

      let savedUser

      try {
        savedUser = JSON.parse(saved)
      } catch {
        clearLocalUser()

        if (active) {
          setUser(null)
          setLoading(false)
        }

        return
      }

      if (!savedUser?.id) {
        clearLocalUser()

        if (active) {
          setUser(null)
          setLoading(false)
        }

        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', savedUser.id)
        .maybeSingle()

      if (!active) {
        return
      }

      if (error || !data) {
        clearLocalUser()
        setUser(null)
        setLoading(false)
        return
      }

      const refreshedUser =
        normalizeProfile(data)

      saveLocalUser(refreshedUser)
      setUser(refreshedUser)
      setLoading(false)
    }

    restoreSession()

    return () => {
      active = false
    }
  }, [])

  async function login(documento, pin) {
    const cleanDoc = String(
      documento || ''
    ).replace(/\D/g, '')

    const cleanPin = String(pin || '').trim()

    if (!cleanDoc || !cleanPin) {
      return {
        error:
          'Ingresá tu documento y tu PIN.',
      }
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('documento', cleanDoc)
      .eq('pin', cleanPin)
      .maybeSingle()

    if (error) {
      console.error(
        'Error consultando el perfil:',
        error
      )

      return {
        error:
          'No pudimos verificar tus datos. Intentá nuevamente.',
      }
    }

    if (!data) {
      return {
        error:
          'Documento o PIN incorrecto.',
      }
    }

    const loginDate =
      new Date().toISOString()

    const { error: updateError } =
      await supabase
        .from('profiles')
        .update({
          ultimo_ingreso: loginDate,
        })
        .eq('id', data.id)

    if (updateError) {
      console.warn(
        'No se pudo registrar el último ingreso:',
        updateError
      )
    }

    const userData = normalizeProfile({
      ...data,
      ultimo_ingreso: loginDate,
    })

    saveLocalUser(userData)
    setUser(userData)

    return {
      success: true,
      user: userData,
      accessBlocked:
        !userData.accesoHabilitado,
    }
  }

  function logout() {
    clearLocalUser()
    setUser(null)
  }

  function updateUser(updates) {
    setUser((currentUser) => {
      if (!currentUser) {
        return currentUser
      }

      const nextUser = {
        ...currentUser,
        ...updates,
      }

      saveLocalUser(nextUser)

      return nextUser
    })
  }

  async function refreshUser() {
    if (!user?.id) {
      return {
        error: 'No hay una sesión activa.',
      }
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (error || !data) {
      return {
        error:
          'No pudimos actualizar el perfil.',
      }
    }

    const refreshedUser =
      normalizeProfile(data)

    saveLocalUser(refreshedUser)
    setUser(refreshedUser)

    return {
      success: true,
      user: refreshedUser,
    }
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
        isProfessor:
          user?.role === 'profesor',
        hasPrivateAccess:
          Boolean(user?.accesoHabilitado),
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
    throw new Error(
      'useAuth debe utilizarse dentro de AuthProvider'
    )
  }

  return context
}
