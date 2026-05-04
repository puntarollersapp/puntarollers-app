import { createContext, useContext, useEffect, useState } from 'react'

// Crear contexto
const AuthContext = createContext()

// Hook
export function useAuth() {
  return useContext(AuthContext)
}

// Provider
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Cargar sesión
  useEffect(() => {
    const storedUser = localStorage.getItem('pr_user')

    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }

    setLoading(false)
  }, [])

  // LOGIN FAKE (FUNCIONA SIEMPRE)
  async function login(documento, pin) {
    if (documento === '123' && pin === '1234') {
      const fakeUser = {
        id: '1',
        nombre: 'Claudio',
        documento: '123',
        estado: 'Activo',
      }

      setUser(fakeUser)
      localStorage.setItem('pr_user', JSON.stringify(fakeUser))

      return { data: fakeUser }
    }

    return { error: 'Datos incorrectos' }
  }

  // Logout
  function logout() {
    setUser(null)
    localStorage.removeItem('pr_user')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
