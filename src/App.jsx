import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from './lib/auth'
import LoadingScreen from './components/LoadingScreen'

import Home from './pages/Home'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import MusicPage from './pages/Music'
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
import StravaCallback from './pages/StravaCallback'
import CommunityPage from './pages/Community'

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto',
    })

    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [pathname])

  return null
}

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return null

  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    )
  }

  return children
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return null

  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    )
  }

  if (!['admin', 'profesor'].includes(user.role)) {
    return <Navigate to="/app/perfil" replace />
  }

  return children
}

function AppRoutes() {
  return (
    <>
      <ScrollToTop />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

        <Route path="/alianza" element={<Alianza />} />
        <Route path="/cuponeras" element={<Cuponeras />} />
        <Route
          path="/pasaporte-kids"
          element={<PasaporteKids />}
        />
        <Route path="/uniformes" element={<Uniformes />} />
        <Route path="/tracking" element={<Tracking />} />
        <Route path="/terminos" element={<Terminos />} />

        <Route
          path="/app/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/app/perfil"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />

        <Route
          path="/app/entrenamiento"
          element={
            <PrivateRoute>
              <Profile mode="training" />
            </PrivateRoute>
          }
        />

        <Route
          path="/app/insignias"
          element={
            <PrivateRoute>
              <Profile mode="badges" />
            </PrivateRoute>
          }
        />

        <Route
          path="/app/musica"
          element={
            <PrivateRoute>
              <MusicPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/app/strava/callback"
          element={
            <PrivateRoute>
              <StravaCallback />
            </PrivateRoute>
          }
        />

        <Route
          path="/app/prcard"
          element={
            <PrivateRoute>
              <PRCardPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/app/tracking"
          element={
            <PrivateRoute>
              <Tracking />
            </PrivateRoute>
          }
        />

        <Route
          path="/app/actividad"
          element={
            <PrivateRoute>
              <ActivityPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/app/servicios"
          element={
            <PrivateRoute>
              <ServicesPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/app/contenido"
          element={
            <PrivateRoute>
              <ContentPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/app/tienda"
          element={
            <PrivateRoute>
              <StorePage />
            </PrivateRoute>
          }
        />


        <Route
          path="/app/comunidad"
          element={
            <PrivateRoute>
              <CommunityPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          }
        />

        <Route
          path="/app"
          element={<Navigate to="/app/perfil" replace />}
        />

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </>
  )
}

export default function App() {
  const [loaded, setLoaded] = useState(false)

  return (
    <AuthProvider>
      {!loaded && (
        <LoadingScreen onDone={() => setLoaded(true)} />
      )}

      <div
        className={`transition-opacity duration-500 ${
          loaded
            ? 'opacity-100'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        <AppRoutes />
      </div>
    </AuthProvider>
  )
}
