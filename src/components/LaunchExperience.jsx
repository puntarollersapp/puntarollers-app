import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PR_LAUNCH, launchTimestamp } from '../lib/launch'

const ONBOARDING_STEPS = [
  {
    icon: '⚡',
    eyebrow: 'BIENVENIDO A TU PUNTA ROLLERS',
    title: 'Todo tu mundo PR, en un solo lugar.',
    text: 'Tu perfil, tus entrenamientos, tus logros y la comunidad ahora viajan con vos.',
  },
  {
    icon: '🛼',
    eyebrow: 'TU ACTIVIDAD',
    title: 'Cada vuelta deja una huella.',
    text: 'Conectá Strava y encontrá tus sesiones, kilómetros y ritmo personal sin mezclarlo con el resto de la comunidad.',
  },
  {
    icon: '📈',
    eyebrow: 'TU EVOLUCIÓN',
    title: 'No miramos solo un número.',
    text: 'Tus tomas, objetivos, clases y entrenamientos construyen una lectura real de tu progreso.',
  },
  {
    icon: '🤝',
    eyebrow: 'TU COMUNIDAD',
    title: 'Rodamos juntos. También acá.',
    text: 'Encontrá compañeros, agregá amigos y usá PR Chat con privacidad entre miembros de Punta Rollers.',
  },
]

const WHATS_NEW_LINKS = [
  { icon: '📈', label: 'Mi evolución', to: '/app/evolucion' },
  { icon: '🛼', label: 'Mi actividad', to: '/app/entrenamiento' },
  { icon: '👥', label: 'Comunidad', to: '/app/comunidad' },
  { icon: '💬', label: 'PR Chat', to: '/app/mensajes' },
  { icon: '⚡', label: 'Mi PR Roller', to: '/app/avatar-premium' },
]

function storageKey(kind, userId) {
  return `${PR_LAUNCH.releaseId}:${kind}:${userId}`
}

function hasSeen(kind, userId) {
  try {
    return localStorage.getItem(storageKey(kind, userId)) === 'done'
  } catch {
    return false
  }
}

function markSeen(kind, userId) {
  try {
    localStorage.setItem(storageKey(kind, userId), 'done')
  } catch {
    // La experiencia puede cerrarse aunque el navegador bloquee localStorage.
  }
}

function initialExperience(user) {
  if (!user?.id || user.role === 'admin' || user.role === 'profesor') return null
  if (Date.now() < launchTimestamp()) return null

  const createdAt = new Date(user.createdAt || '').getTime()
  const newUserCutoff = new Date(PR_LAUNCH.newUserSince).getTime()
  const isNewAccount =
    Number.isFinite(createdAt) &&
    Number.isFinite(newUserCutoff) &&
    createdAt >= newUserCutoff
  const kind = isNewAccount ? 'onboarding' : 'whats-new'

  return hasSeen(kind, user.id) ? null : kind
}

export default function LaunchExperience({ user }) {
  const navigate = useNavigate()
  const [kind, setKind] = useState(() => initialExperience(user))
  const [step, setStep] = useState(0)
  const current = ONBOARDING_STEPS[step]
  const isLastStep = step === ONBOARDING_STEPS.length - 1
  const progress = useMemo(
    () => ((step + 1) / ONBOARDING_STEPS.length) * 100,
    [step]
  )

  useEffect(() => {
    if (!kind) return undefined
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [kind])

  useEffect(() => {
    setKind(initialExperience(user))
    setStep(0)
  }, [user?.id])

  function complete(destination = '') {
    if (kind && user?.id) markSeen(kind, user.id)
    setKind(null)
    if (destination) navigate(destination)
  }

  if (!kind) return null

  if (kind === 'onboarding') {
    return (
      <div className="fixed inset-0 z-[180] overflow-y-auto bg-[#060609]/96 px-4 py-[max(22px,env(safe-area-inset-top))] backdrop-blur-2xl">
        <div className="mx-auto flex min-h-full w-full max-w-[470px] items-center">
          <section className="relative w-full overflow-hidden rounded-[38px] border border-orange-300/15 bg-gradient-to-br from-[#20140e] via-[#101016] to-[#08080c] p-6 shadow-[0_35px_110px_rgba(0,0,0,.72)]">
            <div className="pointer-events-none absolute -right-24 -top-20 h-72 w-72 rounded-full bg-orange-500/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-20 h-60 w-60 rounded-full bg-violet-500/10 blur-3xl" />

            <div className="relative">
              <div className="flex items-center justify-between gap-3">
                <img src="/logo.png" alt="Punta Rollers" className="h-12 w-12 object-contain" />
                <button type="button" onClick={() => complete('/app/dashboard')} className="rounded-full border border-white/10 px-3 py-2 text-[10px] font-bold text-white/38">
                  Saltar
                </button>
              </div>

              <div className="mt-8 grid h-20 w-20 place-items-center rounded-[28px] border border-orange-200/20 bg-orange-400/10 text-4xl shadow-[0_0_40px_rgba(249,115,22,.12)]">
                {current.icon}
              </div>
              <p className="mt-7 text-[9px] font-black uppercase tracking-[.22em] text-orange-300/75">{current.eyebrow}</p>
              <h1 className="mt-2 font-display text-[38px] leading-[.96] text-white">{current.title}</h1>
              <p className="mt-4 min-h-[72px] text-sm leading-6 text-white/45">{current.text}</p>

              <div className="mt-7 h-1.5 overflow-hidden rounded-full bg-white/[.07]">
                <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-200 transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-[.14em] text-white/25">{step + 1} / {ONBOARDING_STEPS.length}</span>
                <div className="flex gap-1.5">
                  {ONBOARDING_STEPS.map((item, index) => <span key={item.eyebrow} className={`h-1.5 rounded-full transition-all ${index === step ? 'w-6 bg-orange-300' : 'w-1.5 bg-white/15'}`} />)}
                </div>
              </div>

              <button
                type="button"
                onClick={() => isLastStep ? complete('/app/dashboard') : setStep((value) => value + 1)}
                className="mt-7 flex min-h-14 w-full items-center justify-between rounded-[20px] bg-gradient-to-r from-orange-500 to-amber-300 px-5 text-sm font-black text-black shadow-[0_16px_40px_rgba(249,115,22,.22)]"
              >
                <span>{isLastStep ? 'Entrar a mi PR' : 'Continuar'}</span>
                <span>→</span>
              </button>
            </div>
          </section>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[180] overflow-y-auto bg-black/75 px-4 py-[max(22px,env(safe-area-inset-top))] backdrop-blur-xl">
      <div className="mx-auto flex min-h-full w-full max-w-[470px] items-center">
        <section className="relative w-full overflow-hidden rounded-[36px] border border-orange-300/18 bg-[#0f0e14] p-6 shadow-[0_35px_100px_rgba(0,0,0,.72)]">
          <div className="pointer-events-none absolute -right-24 -top-28 h-64 w-64 rounded-full bg-orange-500/15 blur-3xl" />
          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.2em] text-orange-300/75">NOVEDADES EN PUNTA ROLLERS</p>
                <h1 className="mt-2 font-display text-[36px] leading-none text-white">Punta Rollers evolucionó. ⚡</h1>
              </div>
              <button type="button" onClick={() => complete()} aria-label="Cerrar novedades" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 text-xl text-white/40">×</button>
            </div>
            <p className="mt-4 text-sm leading-6 text-white/43">Ahora podés seguir tu evolución, encontrar amigos, usar PR Chat, ver tu actividad y mucho más.</p>

            <div className="mt-6 grid grid-cols-2 gap-2.5">
              {WHATS_NEW_LINKS.map((item, index) => (
                <button key={item.to} type="button" onClick={() => complete(item.to)} className={`flex min-h-[88px] items-center gap-3 rounded-[22px] border border-white/[.07] bg-white/[.035] p-3 text-left active:scale-[.98] ${index === WHATS_NEW_LINKS.length - 1 ? 'col-span-2' : ''}`}>
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-orange-400/[.09] text-xl">{item.icon}</span>
                  <span className="text-xs font-black text-white/78">{item.label}</span>
                </button>
              ))}
            </div>

            <button type="button" onClick={() => complete('/app/dashboard')} className="mt-5 flex min-h-14 w-full items-center justify-between rounded-[20px] bg-gradient-to-r from-orange-500 to-amber-300 px-5 text-sm font-black text-black">
              <span>Descubrir ahora</span><span>→</span>
            </button>
            <p className="mt-3 text-center text-[9px] text-white/24">Este aviso aparece una sola vez.</p>
          </div>
        </section>
      </div>
    </div>
  )
}
