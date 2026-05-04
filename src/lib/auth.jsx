import { createContext, useContext, useEffect, useState } from 'react'
import { loginConDocumento, getUsuario } from './supabase'

// Crear contexto
const AuthContext = createContext()

// Hook para usar auth
export function useAuth() {
  return useContext(AuthContext)
}

// Provider
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // ─── Cargar sesión desde localStorage ───────────────────
  useEffect(() => {
    const storedUser = localStorage.getItem('pr_user')

    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }

    setLoading(false)
  }, [])

  // ─── Login ─────────────────────────────────────────────
  async function login(documento, pin) {
    const { data, error } = await loginConDocumento(documento, pin)

    if (error) return { error }

    setUser(data)
    localStorage.setItem('pr_user', JSON.stringify(data))

    return { data }
  }

  // ─── Logout ────────────────────────────────────────────
  function logout() {
    setUser(null)
    localStorage.removeItem('pr_user')
  }

  // ─── Refrescar usuario ─────────────────────────────────
  async function refreshUser() {
    if (!user) return

    const { data } = await getUsuario(user.id)

    if (data) {
      setUser(data)
      localStorage.setItem('pr_user', JSON.stringify(data))
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
