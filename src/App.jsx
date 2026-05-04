import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './lib/auth'
import LoadingScreen from './components/LoadingScreen'

// Pages
import Home from './pages/Home'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import PRCardPage from './pages/PRCard'
import ActivityPage from './pages/Activity'
import ServicesPage from './pages/Services'
import ContentPage from './pages/Content'
import StorePage from './pages/Store'
import Admin from './pages/Admin'
import Alianza from './pages/Alianza'
import Cuponeras from './pages/Cuponeras'
import PasaporteKids from './pages/PasaporteKids'
import Uniformes from './pages/Uniformes'
import Tracking from './pages/Tracking'
import Terminos from './pages/Terminos'

// Guards
function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return null
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />

  return children
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return null
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />

  return children
}

// Routes
function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/alianza" element={<Alianza />} />
      <Route path="/cuponeras" element={<Cuponeras />} />
      <Route path="/pasaporte-kids" element={<PasaporteKids />} />
      <Route path="/uniformes" element={<Uniformes />} />
      <Route path="/tracking" element={<Tracking />} />
      <Route path="/terminos" element={<Terminos />} />

      <Route path="/app/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/app/perfil" element={<PrivateRoute><Profile /></PrivateRoute>} />
      <Route path="/app/prcard" element={<PrivateRoute><PRCardPage /></PrivateRoute>} />
      <Route path="/app/actividad" element={<PrivateRoute><ActivityPage /></PrivateRoute>} />
      <Route path="/app/servicios" element={<PrivateRoute><ServicesPage /></PrivateRoute>} />
      <Route path="/app/contenido" element={<PrivateRoute><ContentPage /></PrivateRoute>} />
      <Route path="/app/tienda" element={<PrivateRoute><StorePage /></PrivateRoute>} />

      <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />

      <Route path="/app" element={<Navigate to="/app/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

// ROOT
export default function App() {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const alreadyLoaded = sessionStorage.getItem("app_loaded")

    if (alreadyLoaded) {
      setLoaded(true)
    }
  }, [])

  return (
    <AuthProvider>

      {!loaded && (
        <LoadingScreen
          onDone={() => {
            sessionStorage.setItem("app_loaded", "true")
            setLoaded(true)
          }}
        />
      )}

      {loaded && <AppRoutes />}

    </AuthProvider>
  )
}
