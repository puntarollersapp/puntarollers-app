import { createContext, useContext, useState, useEffect } from 'react'
import { mockUser, professores } from '../data/mockData'

const AuthContext = createContext(null)

const adminUser = {
  id: 'admin-claudio',
  nombre: 'Claudio',
  apellido: 'Facelli',
  documento: '999',
  role: 'admin',
  profesorId: 'claudio',
  ciudad: 'Punta del Este',
  instagram: '@claudinio',
  email: 'admin@puntarollers.app',
  verificado: true,
}

const profeUser = {
  id: 'profe-david',
  nombre: 'David',
  apellido: 'PR',
  documento: '888',
  role: 'profesor',
  profesorId: 'david',
  ciudad: 'Maldonado',
  instagram: '',
  email: 'david@puntarollers.app',
  verificado: true,
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('pr_user')
    if (saved) {
      try { setUser(JSON.parse(saved)) } catch { localStorage.removeItem('pr_user') }
    }
    setLoading(false)
  }, [])

  const login = async (documento, pin) => {
    const cleanDoc = String(documento || '').trim()
    const cleanPin = String(pin || '').trim()

    let userData = null

    if (cleanDoc === '999' && cleanPin === '4321') {
      userData = adminUser
    } else if (cleanDoc === '888' && cleanPin === '4321') {
      userData = profeUser
    } else if ((cleanDoc === '123' && cleanPin === '1234') || cleanPin === '1234') {
      userData = { ...mockUser, documento: cleanDoc || mockUser.documento, role: 'alumno' }
    }

    if (!userData) return { error: 'Documento o PIN incorrecto' }

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
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, professores }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
