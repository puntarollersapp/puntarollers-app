import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AuthProvider, useAuth } from './lib/auth'
import LoadingScreen from './components/LoadingScreen'
import StudentLaunchGate from './components/StudentLaunchGate'

import Home from './pages/Home'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import MusicPage from './pages/Music'
import PRCardPage from './pages/PRCard'
import ActivityPage from './pages/Activity'
import MyActivity from './pages/MyActivity'
import ServicesPage from './pages/Services'
import ContentPage from './pages/Content'
import StorePage from './pages/Store'
import Admin from './pages/Admin'
import Alianza from './pages/Alianza'
import Cuponeras from './pages/Cuponeras'
import Personalizadas from './pages/Personalizadas'
import AdminPersonalizadasBulk from './pages/AdminPersonalizadasBulk'
import PasaporteKids from './pages/PasaporteKids'
import Uniformes from './pages/Uniformes'
import Tracking from './pages/Tracking'
import Terminos from './pages/Terminos'
import StravaCallback from './pages/StravaCallback'
import CommunityPage from './pages/Community'
import MessagesPage from './pages/Messages'
import PublicRollerFeed from './pages/PublicRollerFeed'
import PublicWeeklyRanking from './pages/PublicWeeklyRanking'
import MiEvolucion from './pages/MiEvolucion'
import AvatarPremiumPreview from './pages/AvatarPremiumPreview'
import Insignias from './pages/Insignias'
import Inscripciones2026 from './pages/Inscripciones2026'
import AdminInscripciones2026 from './pages/AdminInscripciones2026'
import PRKidsInscripciones2026 from './pages/PRKidsInscripciones2026'
import ClinicaMiguelSept2026 from './pages/ClinicaMiguelSept2026'
import PRMoments from './pages/PRMoments'
import WelcomeAccess from './pages/WelcomeAccess'
import AdminAccessRequests from './pages/AdminAccessRequests'

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [pathname])

  return null
}

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return null
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />

  return <StudentLaunchGate user={user}>{children}</StudentLaunchGate>
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return null
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (!['admin', 'profesor'].includes(user.role)) return <Navigate to="/app/perfil" replace />

  return <StudentLaunchGate user={user}>{children}</StudentLaunchGate>
}

function FullAdminRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return null
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (user.role !== 'admin') return <Navigate to="/admin" replace />

  return <StudentLaunchGate user={user}>{children}</StudentLaunchGate>
}

function AdminInlineShortcuts() {
  const [mount, setMount] = useState(null)

  useEffect(() => {
    const container = document.querySelector('.animate-page-enter')
    if (!container) return undefined

    const host = document.createElement('div')
    host.setAttribute('data-admin-inline-shortcuts', 'true')

    const quickNav = Array.from(container.children).find((element) => {
      const text = element?.textContent || ''
      return element.tagName === 'SECTION' && text.includes('Inicio') && (text.includes('Usuarios') || text.includes('Alumnos'))
    })

    if (quickNav) container.insertBefore(host, quickNav)
    else container.appendChild(host)

    setMount(host)

    return () => host.remove()
  }, [])

  if (!mount) return null

  return createPortal(
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <a
        href="/admin/nuevos-accesos"
        className="group rounded-3xl border border-sky-300/20 bg-gradient-to-br from-sky-400/[0.10] to-white/[0.025] p-4 shadow-[0_18px_45px_rgba(0,0,0,.28)] transition active:scale-[.99]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-300/15 bg-sky-300/10 text-xl">🔐</div>
          <span className="text-sky-200/45 text-lg">→</span>
        </div>
        <p className="mt-4 text-[10px] font-black uppercase tracking-[.18em] text-sky-200/55">Alumnos nuevos</p>
        <h3 className="mt-1 text-lg font-black text-white">Nuevos accesos</h3>
        <p className="mt-1 text-xs leading-5 text-white/35">Importar registros y crear perfiles.</p>
      </a>

      <a
        href="/admin/personalizadas"
        className="group rounded-3xl border border-red-300/20 bg-gradient-to-br from-red-400/[0.10] to-white/[0.025] p-4 shadow-[0_18px_45px_rgba(0,0,0,.28)] transition active:scale-[.99]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-red-300/15 bg-red-300/10 text-xl">🎟️</div>
          <span className="text-red-200/45 text-lg">→</span>
        </div>
        <p className="mt-4 text-[10px] font-black uppercase tracking-[.18em] text-red-200/55">Clases</p>
        <h3 className="mt-1 text-lg font-black text-white">Personalizadas</h3>
        <p className="mt-1 text-xs leading-5 text-white/35">Gestionar alumnos, cupos y reservas.</p>
      </a>

      <a
        href="/admin/inscripciones-2026"
        className="group rounded-3xl border border-orange-300/20 bg-gradient-to-br from-orange-400/[0.10] to-white/[0.025] p-4 shadow-[0_18px_45px_rgba(0,0,0,.28)] transition active:scale-[.99]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-orange-300/15 bg-orange-300/10 text-xl">🛼</div>
          <span className="text-orange-200/45 text-lg">→</span>
        </div>
        <p className="mt-4 text-[10px] font-black uppercase tracking-[.18em] text-orange-200/55">Formularios</p>
        <h3 className="mt-1 text-lg font-black text-white">Inscripciones</h3>
        <p className="mt-1 text-xs leading-5 text-white/35">Ver y administrar inscripciones recibidas.</p>
      </a>
    </section>,
    mount
  )
}

function AppRoutes() {
  return (
    <>
      <ScrollToTop />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/rollerfeed" element={<PublicRollerFeed />} />
        <Route path="/ranking-semanal" element={<PublicWeeklyRanking />} />
        <Route path="/inscripciones-2026" element={<Inscripciones2026 />} />
        <Route path="/inscripciones-kids-2026" element={<PRKidsInscripciones2026 />} />
        <Route path="/clinica-miguel-septiembre" element={<ClinicaMiguelSept2026 />} />
        <Route path="/personalizadas" element={<Personalizadas />} />
        <Route path="/bienvenido" element={<WelcomeAccess />} />
        <Route path="/soy-nuevo" element={<Navigate to="/bienvenido" replace />} />

        <Route path="/alianza" element={<Alianza />} />
        <Route path="/cuponeras" element={<Cuponeras />} />
        <Route path="/pasaporte-kids" element={<PasaporteKids />} />
        <Route path="/uniformes" element={<Uniformes />} />
        <Route path="/tracking" element={<Tracking />} />
        <Route path="/terminos" element={<Terminos />} />

        <Route path="/app/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/app/perfil" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/app/avatar" element={<PrivateRoute><Navigate to="/app/avatar-premium" replace /></PrivateRoute>} />
        <Route path="/app/avatar-premium" element={<PrivateRoute><AvatarPremiumPreview /></PrivateRoute>} />
        <Route path="/app/evolucion" element={<PrivateRoute><MiEvolucion /></PrivateRoute>} />
        <Route path="/app/entrenamiento" element={<PrivateRoute><MyActivity /></PrivateRoute>} />
        <Route path="/app/insignias" element={<PrivateRoute><Insignias /></PrivateRoute>} />
        <Route path="/app/musica" element={<PrivateRoute><MusicPage /></PrivateRoute>} />
        <Route path="/app/strava/callback" element={<PrivateRoute><StravaCallback /></PrivateRoute>} />
        <Route path="/app/prcard" element={<PrivateRoute><PRCardPage /></PrivateRoute>} />
        <Route path="/app/tracking" element={<PrivateRoute><Tracking /></PrivateRoute>} />
        <Route path="/app/moments" element={<PrivateRoute><PRMoments /></PrivateRoute>} />
        <Route path="/app/actividad" element={<PrivateRoute><ActivityPage /></PrivateRoute>} />
        <Route path="/app/servicios" element={<PrivateRoute><ServicesPage /></PrivateRoute>} />
        <Route path="/app/contenido" element={<PrivateRoute><ContentPage /></PrivateRoute>} />
        <Route path="/app/tienda" element={<PrivateRoute><StorePage /></PrivateRoute>} />
        <Route path="/app/comunidad" element={<PrivateRoute><CommunityPage /></PrivateRoute>} />
        <Route path="/app/mensajes" element={<PrivateRoute><MessagesPage /></PrivateRoute>} />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <>
                <Admin />
                <AdminInlineShortcuts />
              </>
            </AdminRoute>
          }
        />

        <Route path="/admin/inscripciones-2026" element={<FullAdminRoute><AdminInscripciones2026 /></FullAdminRoute>} />
        <Route path="/admin/personalizadas" element={<FullAdminRoute><AdminPersonalizadasBulk /></FullAdminRoute>} />
        <Route path="/admin/nuevos-accesos" element={<FullAdminRoute><AdminAccessRequests /></FullAdminRoute>} />

        <Route path="/app" element={<Navigate to="/app/perfil" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  const [loaded, setLoaded] = useState(false)

  return (
    <AuthProvider>
      {!loaded && <LoadingScreen onDone={() => setLoaded(true)} />}
      <div className={`transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <AppRoutes />
      </div>
    </AuthProvider>
  )
}