import { createContext, useContext, useState, useEffect } from 'react'
import { mockUser } from '../data/mockData'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('pr_user')
    if (saved) {
      try { setUser(JSON.parse(saved)) } catch {}
    }
    setLoading(false)
  }, [])

  const login = async (documento, pin) => {
    if (pin === '1234' || documento === mockUser.documento) {
      const userData = { ...mockUser, documento }
      localStorage.setItem('pr_user', JSON.stringify(userData))
      setUser(userData)
      return { success: true }
    }
    return { error: 'Documento o PIN incorrecto' }
  }

  const logout = () => {
    localStorage.removeItem('pr_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
