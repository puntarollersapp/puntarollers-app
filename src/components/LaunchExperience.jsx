import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PR_LAUNCH, launchTimestamp } from '../lib/launch'

const ONBOARDING_STEPS = [
  {
    icon: '⚡',
    eyebrow: 'BIENVENIDO A TU PUNTA ROLLERS',
    title: 'Todo tu mundo PR viaja con vos.',
    text: 'Tu perfil, tus entrenamientos, tu evolución y la comunidad viven ahora en un mismo lugar.',
    detail: 'Entrá desde el celular, la computadora o instalá Punta Rollers como app.',
    accent: 'from-orange-500/25 to-amber-300/5',
  },
  {
    icon: '🛼',
    eyebrow: 'MI ACTIVIDAD',
    title: 'Cada vuelta construye tu historia.',
    text: 'Conectá Strava para sumar sesiones y kilómetros. En Mi Actividad también vas a encontrar Performance, tus objetivos y las últimas tomas de tu evolución.',
    detail: 'RollerFeed muestra la comunidad; Mi Actividad guarda tu recorrido personal.',
    accent: 'from-orange-500/20 to-rose-500/5',
  },
  {
    icon: '📈',
    eyebrow: 'TU PERFIL PR',
    title: 'Tu progreso también se puede compartir.',
    text: 'Tu placa Story se actualiza con tus datos, objetivos e insignias. Podés descargarla o compartirla y, si querés, crear tu PR Roller sin perder tu foto ni tu portada.',
    detail: 'Cuanta más actividad registres, más completa será tu historia.',
    accent: 'from-violet-500/18 to-orange-400/8',
  },
  {
    icon: '🤝',
    eyebrow: 'COMUNIDAD, AMIGOS Y PR CHAT',
    title: 'Rodamos juntos. También acá.',
    text: 'Encontrá compañeros, enviá solicitudes y conversá con tus amigos por PR Chat. Fotos, audios y mensajes quedan dentro de tu comunidad privada.',
    detail: 'RollerFeed es la pista común; Amigos y Chat son tus vínculos personales.',
    accent: 'from-cyan-500/14 to-violet-500/8',
  },
  {
    icon: '🏅',
    eyebrow: 'RECONOCIMIENTOS PR',
    title: 'Cada logro cuenta una parte de tu historia.',
    text: 'Tus insignias reconocen constancia, evolución y momentos especiales. En Perfil también vas a encontrar instalación, ayuda, contacto y el canal para contarnos si algo no se ve bien.',
    detail: 'Ya está todo listo. La próxima vuelta empieza ahora.',
    accent: 'from-amber-400/22 to-orange-500/7',
  },
]

function storageKey(userId) {
  return `${PR_LAUNCH.releaseId}:onboarding:${userId}`
}

function hasSeen(userId) {
  try {
    return localStorage.getItem(storageKey(userId)) === 'done'
  } catch {
    return false
  }
}

function markSeen(userId) {
  try {
    localStorage.setItem(storageKey(userId), 'done')
  } catch {
    // La experiencia puede cerrarse aunque el navegador bloquee localStorage.
  }
}

function shouldShow(user) {
  if (!user?.id || user.role === 'admin' || user.role === 'profesor') return false
  if (Date.now() < launchTimestamp()) return false
  return !hasSeen(user.id)
}

export default function LaunchExperience({ user }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(() => shouldShow(user))
  const [step, setStep] = useState(0)
  const current = ONBOARDING_STEPS[step]
  const isLastStep = step === ONBOARDING_STEPS.length - 1
  const firstName = String(user?.nombre || '').trim().split(' ')[0]
  const progress = useMemo(
    () => ((step + 1) / ONBOARDING_STEPS.length) * 100,
    [step]
  )

  useEffect(() => {
    if (!open) return undefined
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  useEffect(() => {
    setOpen(shouldShow(user))
    setStep(0)
  }, [user?.id])

  function complete() {
    if (user?.id) markSeen(user.id)
    setOpen(false)
    navigate('/app/dashboard')
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[180] overflow-y-auto bg-[#050508]/96 px-4 py-[max(18px,env(safe-area-inset-top))] backdrop-blur-2xl">
      <div className="mx-auto flex min-h-full w-full max-w-[470px] items-center">
        <section className="relative w-full overflow-hidden rounded-[38px] border border-orange-300/15 bg-gradient-to-br from-[#20140e] via-[#101016] to-[#08080c] p-6 shadow-[0_35px_110px_rgba(0,0,0,.72)]">
          <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${current.accent} transition-all duration-500`} />
          <div className="pointer-events-none absolute -right-24 -top-20 h-72 w-72 rounded-full bg-orange-500/12 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-20 h-60 w-60 rounded-full bg-violet-500/10 blur-3xl" />

          <div className="relative">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Punta Rollers" className="h-12 w-12 object-contain" />
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[.18em] text-white/30">Tu primera vuelta</p>
                  <p className="mt-1 text-xs font-black text-white/75">{firstName ? `Hola, ${firstName}` : 'Punta Rollers'}</p>
                </div>
              </div>
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-[9px] font-black text-white/35">
                {step + 1} / {ONBOARDING_STEPS.length}
              </span>
            </div>

            <div key={current.eyebrow} className="animate-fade-in">
              <div className="mt-7 grid h-20 w-20 place-items-center rounded-[28px] border border-orange-200/20 bg-orange-400/10 text-4xl shadow-[0_0_40px_rgba(249,115,22,.12)]">
                {current.icon}
              </div>
              <p className="mt-6 text-[9px] font-black uppercase tracking-[.22em] text-orange-300/75">{current.eyebrow}</p>
              <h1 className="mt-2 font-display text-[36px] leading-[.98] text-white">{current.title}</h1>
              <p className="mt-4 min-h-[92px] text-sm leading-6 text-white/52">{current.text}</p>
              <div className="mt-4 rounded-[20px] border border-white/[.07] bg-black/20 px-4 py-3">
                <p className="text-[11px] leading-5 text-white/38">⚡ {current.detail}</p>
              </div>
            </div>

            <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/[.07]">
              <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-200 transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-3 flex items-center justify-center gap-1.5">
              {ONBOARDING_STEPS.map((item, index) => (
                <button
                  key={item.eyebrow}
                  type="button"
                  aria-label={`Ir al paso ${index + 1}`}
                  onClick={() => setStep(index)}
                  className={`h-1.5 rounded-full transition-all ${index === step ? 'w-7 bg-orange-300' : index < step ? 'w-3 bg-orange-400/35' : 'w-1.5 bg-white/15'}`}
                />
              ))}
            </div>

            <div className="mt-6 grid grid-cols-[auto_1fr] gap-2.5">
              <button
                type="button"
                disabled={step === 0}
                onClick={() => setStep((value) => Math.max(0, value - 1))}
                className="grid min-h-14 w-14 place-items-center rounded-[20px] border border-white/10 bg-white/[.035] text-lg text-white/55 disabled:opacity-25"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => isLastStep ? complete() : setStep((value) => value + 1)}
                className="flex min-h-14 items-center justify-between rounded-[20px] bg-gradient-to-r from-orange-500 to-amber-300 px-5 text-sm font-black text-black shadow-[0_16px_40px_rgba(249,115,22,.22)]"
              >
                <span>{isLastStep ? 'Entrar a mi PR' : 'Continuar'}</span>
                <span>→</span>
              </button>
            </div>
            <p className="mt-3 text-center text-[9px] text-white/24">Este recorrido se muestra una sola vez en este dispositivo.</p>
          </div>
        </section>
      </div>
    </div>
  )
}
