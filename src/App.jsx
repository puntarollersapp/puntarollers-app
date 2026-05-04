import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { AuthProvider, useAuth } from './lib/auth'
import LoadingScreen from './components/LoadingScreen'

// Layout
import PublicLayout from './layouts/PublicLayout'

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

// ─── Auth Guard ─────────────────────────
function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return null

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return null

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

// ─── Routes ─────────────────────────
function AppRoutes() {
  return (
    <Routes>

      {/* PUBLIC */}
      <Route path="/" element={
        <PublicLayout>
          <Home />
        </PublicLayout>
      } />

      <Route path="/login" element={<Login />} />

      {/* PRIVATE */}
      <Route path="/app/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/app/perfil" element={<PrivateRoute><Profile /></PrivateRoute>} />
      <Route path="/app/prcard" element={<PrivateRoute><PRCardPage /></PrivateRoute>} />
      <Route path="/app/actividad" element={<PrivateRoute><ActivityPage /></PrivateRoute>} />
      <Route path="/app/servicios" element={<PrivateRoute><ServicesPage /></PrivateRoute>} />
      <Route path="/app/contenido" element={<PrivateRoute><ContentPage /></PrivateRoute>} />
      <Route path="/app/tienda" element={<PrivateRoute><StorePage /></PrivateRoute>} />

      {/* ADMIN */}
      <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />

      {/* REDIRECT */}
      <Route path="/app" element={<Navigate to="/app/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  )
}

// ─── APP ROOT ─────────────────────────
export default function App() {
  const [loaded, setLoaded] = useState(false)

  return (
    <AuthProvider>

      {!loaded && (
        <LoadingScreen onDone={() => setLoaded(true)} />
      )}

      <div className={`transition-opacity duration-500 ${
        loaded ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}>
        <AppRoutes />
      </div>

    </AuthProvider>
  )
}
