import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const { user, logout, updateUser } =
    useAuth()

  const [accessProfile, setAccessProfile] =
    useState(user || null)

  const [checkingAccess, setCheckingAccess] =
    useState(Boolean(user?.id))

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
          children
        )}
      </main>

      {!checkingAccess &&
        !accessBlocked && <BottomNav />}

      <MessagePopup />
      <InstallPrompt />
    </div>
  )
}
