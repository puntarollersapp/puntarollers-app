import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from './supabase'
import { professores } from '../data/mockData'

const AuthContext = createContext(null)

const adminUser = {
  id: 'admin-claudio',
  nombre: 'Claudio',
  apellido: 'Facelli',
  documento: '48036677',
  pin: '1043',
  role: 'admin',
  profesorId: 'claudio',
  ciudad: 'Punta del Este',
  instagram: '@claudinio',
  email: 'admin@puntarollers.app',
  verificado: true,
  foto: '',
  banner: '',
}

const profeUser = {
  id: 'profe-david',
  nombre: 'David',
  apellido: 'PR',
  documento: '56301733',
  pin: '02211',
  role: 'profesor',
  profesorId: 'david',
  ciudad: 'Maldonado',
  instagram: '',
  email: 'david@puntarollers.app',
  verificado: true,
  foto: '',
  banner: '',
}

function normalizeProfile(profile) {
  return {
    id: profile.id,
    nombre: profile.nombre || '',
    apellido: profile.apellido || '',
    documento: profile.documento || '',
    pin: profile.pin || '',
    role: profile.role || 'alumno',
    ciudad: profile.ciudad || '',
    instagram: profile.instagram || '',
    email: profile.email || '',
    fechaNacimiento: profile.fecha_nacimiento || '',
    miembroDesde: profile.miembro_desde || '2026',
    estado: profile.estado || 'Activo',
    verificado: Boolean(profile.verificado),
    foto: profile.foto || '',
    banner: profile.banner || '',
    sobreMi: profile.sobre_mi || '',
    gruposInfo: Array.isArray(profile.grupos_info)
      ? profile.grupos_info
      : [],
    prcardActiva: Boolean(profile.prcard_activa),
    trackingActivo: Boolean(profile.tracking_activo),
    prcard: {
      activa: Boolean(profile.prcard_activa),
      link: 'https://puntarollerscard.com/',
    },
    tracking: {
      activo: Boolean(profile.tracking_activo),
    },
    estadisticas: profile.estadisticas || {
      eventos: 0,
      insignias: 0,
      notas: 0,
    },
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('pr_user')

    if (saved) {
      try {
        setUser(JSON.parse(saved))
      } catch {
        localStorage.removeItem('pr_user')
      }
    }

    setLoading(false)
  }, [])

  const login = async (documento, pin) => {
    const cleanDoc = String(documento || '').trim()
    const cleanPin = String(pin || '').trim()

    let userData = null

    if (
      cleanDoc === adminUser.documento &&
      cleanPin === adminUser.pin
    ) {
      userData = adminUser
    } else if (
      cleanDoc === profeUser.documento &&
      cleanPin === profeUser.pin
    ) {
      userData = profeUser
    } else {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('documento', cleanDoc)
        .eq('pin', cleanPin)
        .maybeSingle()

      if (!error && data) {
        userData = normalizeProfile(data)
      }
    }

    if (!userData) {
      return {
        error: 'Documento o PIN incorrecto',
      }
    }

    localStorage.setItem(
      'pr_user',
      JSON.stringify(userData)
    )

    setUser(userData)

    return {
      success: true,
      user: userData,
    }
  }

  const logout = () => {
    localStorage.removeItem('pr_user')
    setUser(null)
  }

  const updateUser = (updates) => {
    const next = {
      ...user,
      ...updates,
    }

    localStorage.setItem(
      'pr_user',
      JSON.stringify(next)
    )

    setUser(next)

    return next
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        updateUser,
        professores,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)

  if (!ctx) {
    throw new Error(
      'useAuth must be inside AuthProvider'
    )
  }

  return ctx
}
