import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import BottomNav from '../components/BottomNav'
import MessagePopup from '../components/MessagePopup'
import InstallPrompt from '../components/InstallPrompt'
import RollerFeedLivePodium from '../components/RollerFeedLivePodium'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const LUCIA_WHATSAPP = '59899220929'

function parseExpirationDate(value) {
  if (!value) {
    return null
  }

  const normalizedDate = String(value).slice(0, 10)

  const date = new Date(
    `${normalizedDate}T23:59:59`
  )

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date
}

function formatExpirationDate(value) {
  const date = parseExpirationDate(value)

  if (!date) {
    return 'Sin fecha registrada'
  }

  return date.toLocaleDateString('es-UY', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function buildWhatsAppLink(profile) {
  const fullName =
    `${profile?.nombre || ''} ${
      profile?.apellido || ''
    }`.trim() || 'alumno/a'

  const message = [
    `Hola Lucía, soy ${fullName}.`,
    'Quisiera regularizar mi mensualidad de Punta Rollers.',
  ].join(' ')

  return `https://wa.me/${LUCIA_WHATSAPP}?text=${encodeURIComponent(
    message
  )}`
}

function AccessBlocked({
  profile,
  onLogout,
  onPublicHome,
}) {
  const whatsappLink =
    buildWhatsAppLink(profile)

  return (
    <div className="min-h-[calc(100vh-72px)] px-4 py-8 flex items-center justify-center">
      <section className="w-full max-w-md rounded-[32px] border border-red-400/20 bg-gradient-to-br from-red-500/10 via-white/[0.035] to-white/[0.02] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.5)]">
        <div className="w-16 h-16 rounded-[22px] bg-red-400/10 border border-red-400/20 grid place-items-center text-3xl">
          🔒
        </div>

        <p className="section-label mt-6">
          Acceso temporalmente pausado
        </p>

        <h1 className="font-display text-3xl text-white mt-2 leading-tight">
          Tu mensualidad está vencida
        </h1>

        <p className="text-white/55 text-sm mt-4 leading-relaxed">
          Hola, {profile?.nombre || 'alumno'}.
          Para volver a ingresar a tu perfil,
          actividad, PRCard y demás servicios
          privados, necesitás regularizar tu
          mensualidad.
        </p>

        <div className="rounded-2xl bg-black/25 border border-white/[0.06] p-4 mt-5">
          <p className="text-white/30 text-[10px] uppercase tracking-[0.16em]">
            Vigencia anterior
          </p>

          <p className="text-white font-semibold mt-1">
            Venció el{' '}
            {formatExpirationDate(
              profile?.mensualidadHasta
            )}
          </p>
        </div>

        <p className="text-white/35 text-xs mt-4 leading-relaxed">
          Una vez que el pago sea registrado por
          Administración, tu acceso se reactivará
          automáticamente.
        </p>

        <a
          href={whatsappLink}
          target="_blank"
          rel="noreferrer"
          className="btn-gold w-full mt-6 flex items-center justify-center text-center"
        >
          Regularizar por WhatsApp
        </a>

        <button
          type="button"
          onClick={onPublicHome}
          className="w-full mt-3 rounded-2xl border border-white/10 bg-white/[0.035] py-4 text-white text-sm font-semibold"
        >
          Ir a la página pública
        </button>

        <button
          type="button"
          onClick={onLogout}
          className="w-full mt-3 py-3 text-white/40 text-xs"
        >
          Cerrar sesión
        </button>
      </section>
    </div>
  )
}

export default function AppLayout({
  children,
  title,
  showBack = false,
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, updateUser } =
    useAuth()

  const [accessProfile, setAccessProfile] =
    useState(user || null)

  const [checkingAccess, setCheckingAccess] =
    useState(Boolean(user?.id))

  const [dmUnread, setDmUnread] = useState(0)
  const [dmToast, setDmToast] = useState(null)
  const dmSeenRef = useState(() => ({ total: null }))[0]

  useEffect(() => {
    let active = true

    async function checkAccess() {
      if (!user?.id) {
        if (active) {
          setAccessProfile(user || null)
          setCheckingAccess(false)
        }

        return
      }

      setCheckingAccess(true)

      const { data, error } = await supabase
        .from('profiles')
        .select(
          'id, role, nombre, apellido, mensualidad_hasta, acceso_habilitado'
        )
        .eq('id', user.id)
        .maybeSingle()

      if (!active) {
        return
      }

      if (error || !data) {
        setAccessProfile(user)
        setCheckingAccess(false)
        return
      }

      const updatedProfile = {
        ...user,
        role: data.role || user.role,
        nombre:
          data.nombre || user.nombre,
        apellido:
          data.apellido ||
          user.apellido ||
          '',
        mensualidadHasta:
          data.mensualidad_hasta || '',
        accesoHabilitado:
          typeof data.acceso_habilitado ===
          'boolean'
            ? data.acceso_habilitado
            : true,
      }

      setAccessProfile(updatedProfile)

      try {
        localStorage.setItem(
          'pr_user',
          JSON.stringify(updatedProfile)
        )
      } catch {
        // El bloqueo sigue funcionando aunque
        // localStorage no esté disponible.
      }

      updateUser?.(updatedProfile)
      setCheckingAccess(false)
    }

    checkAccess()

    return () => {
      active = false
    }
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) return undefined
    let active = true

    async function checkDirectMessages() {
      const { data, error } = await supabase.rpc('pr_dm_inbox')
      if (!active || error || !Array.isArray(data)) return
      const total = data.reduce((sum, item) => sum + Number(item.unread_count || 0), 0)
      const previous = dmSeenRef.total
      setDmUnread(total)

      if (previous !== null && total > previous && !location.pathname.startsWith('/app/mensajes')) {
        const newest = data.find((item) => Number(item.unread_count || 0) > 0)
        if (newest) {
          setDmToast({
            id: newest.id,
            name: [newest.other_profile?.nombre, newest.other_profile?.apellido].filter(Boolean).join(' ') || 'PR Chat',
            text: newest.last_message || 'Nuevo mensaje',
          })
          window.setTimeout(() => setDmToast(null), 6000)

          if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && document.visibilityState !== 'visible') {
            try {
              const notification = new Notification(`💬 ${newest.other_profile?.nombre || 'PR Chat'}`, { body: newest.last_message || 'Tenés un mensaje nuevo' })
              notification.onclick = () => { window.focus(); navigate(`/app/mensajes?chat=${newest.id}`); notification.close() }
            } catch { /* aviso visual sigue funcionando */ }
          }
        }
      }
      dmSeenRef.total = total
    }

    checkDirectMessages()
    const timer = window.setInterval(checkDirectMessages, 5000)
    return () => { active = false; window.clearInterval(timer) }
  }, [user?.id, location.pathname])

  const accessBlocked = useMemo(() => {
    if (!accessProfile) {
      return false
    }

    if (
      accessProfile.role === 'admin' ||
      accessProfile.role === 'profesor'
    ) {
      return false
    }

    if (
      accessProfile.role !== 'alumno'
    ) {
      return false
    }

    const expirationDate =
      parseExpirationDate(
        accessProfile.mensualidadHasta
      )

    /*
     * Los alumnos que todavía no tienen una
     * fecha cargada permanecen habilitados.
     * Esto evita bloquear a todos los perfiles
     * importados antes de registrar sus pagos.
     */
    if (!expirationDate) {
      return false
    }

    const expired =
      expirationDate.getTime() <
      Date.now()

    const manuallyDisabled =
      accessProfile.accesoHabilitado ===
      false

    return expired || manuallyDisabled
  }, [accessProfile])

  async function handleLogout() {
    await logout?.()
    navigate('/')
  }

  function handlePublicHome() {
    navigate('/')
  }

  const showPrPersonalShortcut =
    !checkingAccess &&
    !accessBlocked &&
    accessProfile?.role === 'admin' &&
    location.pathname === '/admin'

  const showRollerFeedPodium =
    !checkingAccess &&
    !accessBlocked &&
    location.pathname === '/app/actividad'

  return (
    <div className="app-shell pb-24">
      <Header
        title={title}
        showBack={
          accessBlocked ? false : showBack
        }
        onBack={() => navigate(-1)}
      />

      <main>
        {checkingAccess ? (
          <div className="min-h-[60vh] grid place-items-center px-4">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-pr-gold/10 border border-pr-gold/20 grid place-items-center">
                <span className="text-pr-gold">
                  PR
                </span>
              </div>

              <p className="text-white/40 text-sm mt-4">
                Verificando acceso…
              </p>
            </div>
          </div>
        ) : accessBlocked ? (
          <AccessBlocked
            profile={accessProfile}
            onLogout={handleLogout}
            onPublicHome={handlePublicHome}
          />
        ) : (
          <>
            {showRollerFeedPodium && <RollerFeedLivePodium />}
            {children}
          </>
        )}
      </main>

      {!checkingAccess &&
        !accessBlocked && <BottomNav />}

      {showPrPersonalShortcut && (
        <button
          type="button"
          onClick={() => navigate('/admin/personalizadas')}
          className="fixed bottom-[88px] left-4 z-[72] rounded-[20px] border border-red-300/20 bg-[#191012]/95 px-4 py-3 text-left shadow-[0_18px_55px_rgba(0,0,0,.55)] backdrop-blur-xl transition active:scale-[0.98]"
          aria-label="Abrir PR Personal"
        >
          <p className="text-[9px] font-black uppercase tracking-[.2em] text-red-300">ADMIN</p>
          <p className="mt-0.5 text-sm font-black text-white">PR Personal</p>
          <p className="mt-0.5 text-[10px] text-white/40">Agenda · reservas · alumnos</p>
        </button>
      )}

      {dmToast && (
        <button
          type="button"
          onClick={() => { navigate(`/app/mensajes?chat=${dmToast.id}`); setDmToast(null) }}
          className="fixed left-1/2 top-[82px] z-[90] w-[calc(100%-28px)] max-w-[480px] -translate-x-1/2 rounded-[22px] border border-orange-300/20 bg-[#141117]/95 p-3.5 text-left shadow-[0_20px_70px_rgba(0,0,0,.55)] backdrop-blur-xl animate-page-enter"
        >
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[16px] bg-orange-500 text-xl">💬</div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2"><p className="truncate text-xs font-black text-white">{dmToast.name}</p><span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[8px] font-black text-white">NUEVO</span></div>
              <p className="mt-1 truncate text-[10px] text-white/42">{dmToast.text}</p>
            </div>
            <span className="text-orange-300">→</span>
          </div>
        </button>
      )}

      {dmUnread > 0 && !location.pathname.startsWith('/app/mensajes') && (
        <button
          type="button"
          onClick={() => navigate('/app/mensajes')}
          aria-label={`${dmUnread} mensajes sin leer`}
          className="fixed bottom-[88px] right-4 z-[70] grid h-12 min-w-12 place-items-center rounded-full border-2 border-[#09090e] bg-orange-500 px-3 text-xs font-black text-black shadow-xl"
        >
          💬 <span className="ml-1">{dmUnread > 99 ? '99+' : dmUnread}</span>
        </button>
      )}

      <MessagePopup />
      <InstallPrompt />
    </div>
  )
}