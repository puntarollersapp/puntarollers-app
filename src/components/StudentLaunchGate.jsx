import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import LaunchExperience from './LaunchExperience'
import { PR_LAUNCH, hasLaunchBypass } from '../lib/launch'

export const STUDENT_LAUNCH_GATE = {
  enabled: true,
  opensAt: PR_LAUNCH.opensAt,
  timezoneLabel: PR_LAUNCH.timezoneLabel,
  bypassRoles: PR_LAUNCH.bypassRoles,
}

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

function remainingTime(target, now) {
  const total = Math.max(0, target - now)

  return {
    total,
    days: Math.floor(total / DAY),
    hours: Math.floor((total % DAY) / HOUR),
    minutes: Math.floor((total % HOUR) / MINUTE),
    seconds: Math.floor((total % MINUTE) / SECOND),
  }
}

function twoDigits(value) {
  return String(value).padStart(2, '0')
}

export default function StudentLaunchGate({ user, children }) {
  const target = useMemo(
    () => new Date(STUDENT_LAUNCH_GATE.opensAt).getTime(),
    []
  )
  const [now, setNow] = useState(() => Date.now())

  const hasBypass = hasLaunchBypass(user)
  const validTarget = Number.isFinite(target)
  const locked =
    STUDENT_LAUNCH_GATE.enabled &&
    Boolean(user?.id) &&
    !hasBypass &&
    validTarget &&
    now < target

  useEffect(() => {
    if (!locked) return undefined

    const timer = window.setInterval(() => {
      setNow(Date.now())
    }, SECOND)

    return () => window.clearInterval(timer)
  }, [locked])

  if (!locked) {
    return (
      <>
        {children}
        <LaunchExperience user={user} />
      </>
    )
  }

  return (
    <LaunchCountdown
      now={now}
      target={target}
      name={user?.nombre}
    />
  )
}

function LaunchCountdown({ now, target, name }) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const remaining = remainingTime(target, now)
  const units = [
    ['DÍAS', remaining.days],
    ['HORAS', remaining.hours],
    ['MIN', remaining.minutes],
    ['SEG', remaining.seconds],
  ]

  async function handleLogout() {
    await logout?.()
    navigate('/', { replace: true })
  }

  return (
    <div className="pr-launch-screen" role="main">
      <div className="pr-launch-grid" aria-hidden="true" />
      <div className="pr-launch-glow pr-launch-glow-one" aria-hidden="true" />
      <div className="pr-launch-glow pr-launch-glow-two" aria-hidden="true" />

      <svg
        viewBox="0 0 500 900"
        className="pr-launch-bolt"
        aria-hidden="true"
      >
        <path d="M310 20 117 450h142l-80 430 226-508H264Z" />
      </svg>

      <div className="pr-launch-particles" aria-hidden="true">
        {Array.from({ length: 14 }, (_, index) => (
          <span
            key={index}
            style={{
              '--particle-left': `${(index * 37 + 11) % 100}%`,
              '--particle-duration': `${5 + index * 0.36}s`,
              '--particle-delay': `${index * -0.43}s`,
            }}
          />
        ))}
      </div>

      <main className="pr-launch-content">
        <div className="pr-launch-logo-wrap">
          <div className="pr-launch-logo-ring" aria-hidden="true" />
          <img
            src="/logo.png"
            alt="Punta Rollers"
            className="pr-launch-logo"
          />
        </div>

        <div className="pr-launch-kicker">
          <span className="pr-launch-kicker-dot" />
          Acceso anticipado PR
        </div>

        <p className="pr-launch-greeting">
          {name ? `Hola, ${name}.` : 'Hola, roller.'}
        </p>

        <h1 className="pr-launch-title">
          Algo grande
          <span>está por empezar.</span>
        </h1>

        <p className="pr-launch-copy">
          Lanzamiento oficial de la plataforma
          <strong> hoy a las 18:00.</strong>
        </p>

        <section
          className="pr-launch-counter"
          aria-label="Cuenta regresiva para el lanzamiento"
          aria-live="polite"
        >
          {units.map(([label, value]) => (
            <div key={label} className="pr-launch-counter-unit">
              <span>{twoDigits(value)}</span>
              <small>{label}</small>
            </div>
          ))}
        </section>

        <div className="pr-launch-date">
          <span>10</span>
          <i />
          <span>08</span>
          <i />
          <span>2026</span>
          <b>18:00 · {STUDENT_LAUNCH_GATE.timezoneLabel}</b>
        </div>

        <p className="pr-launch-safe">
          Tu cuenta, tu progreso y tus datos están seguros.
          <br />A las 18:00 se desbloquea todo automáticamente.
        </p>

        <button
          type="button"
          onClick={handleLogout}
          className="pr-launch-logout"
        >
          Cerrar sesión
        </button>
      </main>
    </div>
  )
}
