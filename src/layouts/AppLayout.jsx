import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import BottomNav from '../components/BottomNav'
import MessagePopup from '../components/MessagePopup'
import InstallPrompt from '../components/InstallPrompt'
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
          Acceso temporalmente inhabilitado
        </p>

        <h1 className="font-display text-3xl text-white mt-2 leading-tight">
          Tu mensualidad está vencida
        </h1>

        <p className="text-white/55 text-sm mt-4 leading-relaxed">
          Hola, {profile?.nombre || 'alumno'}.
          Tu mensualidad del mes figura pendiente.
          Para volver a usar tu perfil PR, Strava,
          PRCard, PR Chip, tomas de tiempo,
          devoluciones, insignias y demás servicios
          privados, necesitás regularizarla.
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
          Una vez que Tesorería registre el pago,
          tu acceso se reactivará automáticamente.
          Si ya pagaste, escribinos para verificarlo.
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
  const [enforcementEnabled, setEnforcementEnabled] = useState(false)
  const [monthlyDue, setMonthlyDue] = useState(null)

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

      const currentPeriod = new Date().toISOString().slice(0, 7) + '-01'
      const [{ data, error }, { data: treasuryConfig }, { data: dueRow }] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, role, nombre, apellido, mensualidad_hasta, acceso_habilitado')
          .eq('id', user.id)
          .maybeSingle(),
        supabase
          .from('pr_tesoreria_config')
          .select('enforcement_enabled')
          .eq('id', 1)
          .maybeSingle(),
        supabase
          .from('pr_mensualidades')
          .select('periodo,monto,vencimiento,estado,gracia_hasta,fecha_pago')
          .eq('alumno_id', user.id)
          .eq('periodo', currentPeriod)
          .maybeSingle(),
      ])
      setEnforcementEnabled(Boolean(treasuryConfig?.enforcement_enabled))
      setMonthlyDue(dueRow || null)

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
    if (!accessProfile) return false

    if (accessProfile.role === 'admin' || accessProfile.role === 'profesor') {
      return false
    }

    const manuallyDisabled = accessProfile.accesoHabilitado === false
    if (manuallyDisabled) return true

    const automaticEnforcement = new Date().getDate() >= 11
    if ((!enforcementEnabled && !automaticEnforcement) || !monthlyDue) return false
    if (['pagado', 'bonificado', 'acuerdo'].includes(monthlyDue.estado)) return false

    const limitDate = parseExpirationDate(monthlyDue.gracia_hasta || monthlyDue.vencimiento)
    if (!limitDate) return false

    return limitDate.getTime() < Date.now()
  }, [accessProfile, enforcementEnabled, monthlyDue])

  async function handleLogout() {
    await logout?.()
    navigate('/')
  }

  function handlePublicHome() {
    navigate('/')
  }

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
            {monthlyDue && monthlyDue.estado === 'pendiente' && (
              <div className="mx-4 mt-3 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[.14em] text-amber-200">Mensualidad PR pendiente</p>
                <p className="mt-1 text-xs text-white/55">Tenés hasta el día 10 para regularizar el mes. Si ya pagaste, Tesorería lo acreditará en tu perfil.</p>
              </div>
            )}
            {children}
          </>
        )}
      </main>

      {!checkingAccess &&
        !accessBlocked && <BottomNav />}

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
