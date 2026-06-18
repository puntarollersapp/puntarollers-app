import { createContext, useContext, useState, useEffect } from 'react'
import { mockUser, alumnos, professores } from '../data/mockData'

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

function makeAlumnoId(documento) {
  return `alumno-${String(documento || '').trim()}`
}

function normalizeAlumno(alumno, documentoFallback = '') {
  const documento = String(alumno?.documento || documentoFallback || '').trim()

  return {
    ...mockUser,
    ...alumno,
    id: alumno?.id || makeAlumnoId(documento),
    documento,
    role: 'alumno',
    foto: alumno?.foto || '',
    banner: alumno?.banner || '',
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

    if (cleanDoc === adminUser.documento && cleanPin === adminUser.pin) {
      userData = adminUser
    } else if (cleanDoc === profeUser.documento && cleanPin === profeUser.pin) {
      userData = profeUser
    } else {
      const alumnoEncontrado = alumnos.find(
        a => String(a.documento).trim() === cleanDoc
      )

      if (
        alumnoEncontrado &&
        cleanPin === String(alumnoEncontrado.pin || mockUser.pin || '1234')
      ) {
        userData = normalizeAlumno(alumnoEncontrado, cleanDoc)
      }
    }

    if (!userData) {
      return { error: 'Documento o PIN incorrecto' }
    }

    localStorage.setItem('pr_user', JSON.stringify(userData))
    setUser(userData)

    return { success: true, user: userData }
  }

  const logout = () => {
    localStorage.removeItem('pr_user')
    setUser(null)
  }

  const updateUser = (updates) => {
    const next = { ...user, ...updates }
    localStorage.setItem('pr_user', JSON.stringify(next))
    setUser(next)
    return next
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, updateUser, professores }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)

  if (!ctx) {
    throw new Error('useAuth must be inside AuthProvider')
  }

  return ctx
}
