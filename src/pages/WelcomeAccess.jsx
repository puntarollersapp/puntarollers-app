import { useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

const steps = ['Bienvenida', 'Tu espacio PR', 'Beneficios', 'Tus datos', 'Tu PIN']

const benefits = [
  { icon: '🎫', title: 'PR Card', text: 'Tu tarjeta personal de alumno con descuentos, promociones y beneficios exclusivos en comercios y lugares adheridos.' },
  { icon: '👤', title: 'Tu perfil PR', text: 'Tu espacio dentro de Punta Rollers para que tu experiencia, información y evolución estén siempre con vos.' },
  { icon: '🏆', title: 'Logros e insignias', text: 'Tu progreso también se vive digitalmente: objetivos, hitos e insignias que vas desbloqueando en el camino.' },
  { icon: '🛼', title: 'Actividad y evolución', text: 'Herramientas para acompañar tu recorrido, tus clases y todo lo que vamos construyendo juntos.' },
  { icon: '✨', title: 'Beneficios PR', text: 'Actividades, novedades y experiencias exclusivas pensadas para quienes forman parte de la escuela.' },
]

function Progress({ step }) {
  return (
    <div className="mx-auto flex w-full max-w-md gap-1.5 px-5 pt-5">
      {steps.map((label, index) => (
        <div key={label} className="flex-1">
          <div className={`h-1.5 rounded-full transition-all duration-500 ${index <= step ? 'bg-red-500' : 'bg-white/10'}`} />
        </div>
      ))}
    </div>
  )
}

function Shell({ step, children }) {
  return (
    <main className="min-h-screen overflow-hidden bg-[#080809] text-white">
      <div className="pointer-events-none fixed inset-0 opacity-70" style={{ background: 'radial-gradient(circle at 18% 0%, rgba(239,68,68,.20), transparent 35%), radial-gradient(circle at 85% 30%, rgba(255,255,255,.08), transparent 28%)' }} />
      <div className="relative mx-auto min-h-screen w-full max-w-xl border-x border-white/[.04] bg-black/10 pb-10">
        <Progress step={step} />
        <div className="px-5 pt-6">{children}</div>
      </div>
    </main>
  )
}

function BackButton({ onClick }) {
  return <button onClick={onClick} className="mb-6 text-sm font-bold text-white/55 transition hover:text-white">← Volver</button>
}

function PrimaryButton({ children, onClick, disabled, type = 'button' }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} className="mt-7 w-full rounded-2xl bg-white px-5 py-4 text-sm font-black uppercase tracking-[.12em] text-black shadow-[0_16px_60px_rgba(255,255,255,.10)] transition active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-40">
      {children}
    </button>
  )
}

export default function WelcomeAccess() {
  const [step, setStep] = useState(0)
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState({ nombre_completo: '', documento: '', telefono: '', email: '', pin: '', pin2: '' })

  const canContinueData = useMemo(() => data.nombre_completo.trim().length >= 3 && data.documento.replace(/\D/g, '').length >= 6 && data.telefono.trim().length >= 6 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()), [data])
  const canSubmit = /^\d{4}$/.test(data.pin) && data.pin === data.pin2

  const update = (key, value) => setData((current) => ({ ...current, [key]: value }))

  async function submit() {
    if (!canSubmit || sending) return
    setSending(true)
    setError('')
    const { data: result, error: invokeError } = await supabase.functions.invoke('pr-access-request', {
      body: {
        nombre_completo: data.nombre_completo.trim(),
        documento: data.documento.replace(/\D/g, ''),
        telefono: data.telefono.trim(),
        email: data.email.trim().toLowerCase(),
        pin: data.pin,
      },
    })
    setSending(false)
    if (invokeError || result?.error) {
      setError(result?.error || 'No pudimos enviar tu solicitud. Probá nuevamente.')
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <Shell step={4}>
        <div className="flex min-h-[82vh] flex-col items-center justify-center text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-green-400/30 bg-green-400/10 text-4xl">✓</div>
          <div className="mb-3 text-xs font-black uppercase tracking-[.28em] text-red-400">Solicitud recibida</div>
          <h1 className="text-4xl font-black leading-[.95] tracking-[-.04em] sm:text-5xl">Ya estás un paso<br />más cerca de PR.</h1>
          <p className="mt-6 max-w-md text-base leading-7 text-white/65">Recibimos tus datos y vamos a preparar tu perfil personal. La creación puede demorar entre <strong className="text-white">48 y 72 horas</strong> y tu acceso se habilitará una vez realizada tu primera clase.</p>
          <div className="mt-8 w-full rounded-3xl border border-white/10 bg-white/[.04] p-5 text-left">
            <div className="text-xs font-black uppercase tracking-[.16em] text-white/40">Lo próximo</div>
            <p className="mt-2 text-sm leading-6 text-white/75">Después de tu primera clase vas a poder entrar con tu documento y el PIN que acabás de elegir. En tu primer ingreso vas a completar el resto de tu perfil y empezar a descubrir todo PuntaRollers.app.</p>
          </div>
          <a href="/" className="mt-8 text-sm font-black text-white/60 underline decoration-white/20 underline-offset-4">Volver a Punta Rollers</a>
        </div>
      </Shell>
    )
  }

  return (
    <Shell step={step}>
      {step === 0 && (
        <div className="flex min-h-[84vh] flex-col justify-between pb-5">
          <div>
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Punta Rollers" className="h-14 w-14 rounded-2xl object-contain" />
              <div><div className="text-[11px] font-black uppercase tracking-[.25em] text-white/40">Punta Rollers</div><div className="text-sm font-bold text-white/80">Tu experiencia empieza acá</div></div>
            </div>
            <div className="mt-16 text-xs font-black uppercase tracking-[.28em] text-red-400">Bienvenido/a</div>
            <h1 className="mt-3 text-5xl font-black leading-[.90] tracking-[-.055em] sm:text-6xl">Estás a un paso<br />de ser parte.</h1>
            <p className="mt-6 max-w-md text-lg leading-8 text-white/64">Antes de tu primera clase queremos preparar algo más que tu inscripción: <strong className="text-white">tu lugar dentro de Punta Rollers.</strong></p>
          </div>
          <div><div className="rounded-3xl border border-red-400/20 bg-red-500/[.07] p-5"><div className="text-sm font-black">No es solo patinar. Es pertenecer.</div><p className="mt-2 text-sm leading-6 text-white/55">Completá este recorrido y nosotros dejamos listo tu acceso personal.</p></div><PrimaryButton onClick={() => setStep(1)}>Empezar →</PrimaryButton></div>
        </div>
      )}

      {step === 1 && (
        <div className="pb-6">
          <BackButton onClick={() => setStep(0)} />
          <div className="text-xs font-black uppercase tracking-[.25em] text-red-400">Tu espacio digital</div>
          <h1 className="mt-3 text-4xl font-black leading-none tracking-[-.04em]">¿Qué es<br />PuntaRollers.app?</h1>
          <p className="mt-5 text-base leading-7 text-white/65">Mucho más que una web. Es la <strong className="text-white">plataforma exclusiva para alumnos</strong> donde tu experiencia PR continúa también fuera de la pista.</p>
          <div className="mt-8 overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[.08] to-white/[.02] p-6">
            <div className="flex items-center justify-between"><div><div className="text-xs font-black uppercase tracking-[.18em] text-white/35">PuntaRollers.app</div><div className="mt-2 text-2xl font-black">Tu PR. En un solo lugar.</div></div><div className="text-4xl">📱</div></div>
            <div className="mt-6 grid grid-cols-2 gap-3 text-sm font-bold text-white/75"><div className="rounded-2xl bg-black/30 p-4">Tu perfil</div><div className="rounded-2xl bg-black/30 p-4">Tu actividad</div><div className="rounded-2xl bg-black/30 p-4">Tu evolución</div><div className="rounded-2xl bg-black/30 p-4">Tu comunidad</div></div>
          </div>
          <p className="mt-6 text-sm leading-6 text-white/45">Y vamos a seguir sumando herramientas, experiencias y funciones para que ser alumno de Punta Rollers tenga cada vez más valor.</p>
          <PrimaryButton onClick={() => setStep(2)}>Descubrir mis beneficios</PrimaryButton>
        </div>
      )}

      {step === 2 && (
        <div className="pb-6">
          <BackButton onClick={() => setStep(1)} />
          <div className="text-xs font-black uppercase tracking-[.25em] text-red-400">Ser parte tiene beneficios</div>
          <h1 className="mt-3 text-4xl font-black leading-none tracking-[-.04em]">Todo esto también<br />es Punta Rollers.</h1>
          <div className="mt-7 space-y-3">{benefits.map((item) => <div key={item.title} className="rounded-3xl border border-white/10 bg-white/[.035] p-5"><div className="flex gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/[.07] text-xl">{item.icon}</div><div><div className="font-black">{item.title}</div><p className="mt-1 text-sm leading-6 text-white/55">{item.text}</p></div></div></div>)}</div>
          <div className="mt-4 overflow-hidden rounded-3xl border border-red-400/25 bg-gradient-to-br from-red-500/15 to-white/[.025] p-6"><div className="text-xs font-black uppercase tracking-[.22em] text-red-300">PR CARD</div><div className="mt-2 text-2xl font-black">Tu tarjeta. Tus beneficios.</div><p className="mt-2 text-sm leading-6 text-white/60">Te identifica como miembro de la escuela y te permitirá acceder a descuentos, promociones y beneficios exclusivos en comercios y lugares adheridos. <strong className="text-white">Y esto recién empieza.</strong></p></div>
          <PrimaryButton onClick={() => setStep(3)}>Preparar mi acceso</PrimaryButton>
        </div>
      )}

      {step === 3 && (
        <div className="pb-6">
          <BackButton onClick={() => setStep(2)} />
          <div className="text-xs font-black uppercase tracking-[.25em] text-red-400">Paso 1 de 2</div>
          <h1 className="mt-3 text-4xl font-black leading-none tracking-[-.04em]">Primero,<br />tus datos.</h1>
          <p className="mt-4 text-sm leading-6 text-white/55">Usaremos esta información únicamente para identificarte y preparar tu perfil de alumno.</p>
          <div className="mt-7 space-y-4">
            <Field label="Nombre y apellido" value={data.nombre_completo} onChange={(v) => update('nombre_completo', v)} placeholder="Ej. Ana Pérez" autoComplete="name" />
            <Field label="Documento" value={data.documento} onChange={(v) => update('documento', v.replace(/\D/g, '').slice(0, 12))} placeholder="Sin puntos ni guiones" inputMode="numeric" />
            <Field label="WhatsApp" value={data.telefono} onChange={(v) => update('telefono', v)} placeholder="Ej. 099 123 456" inputMode="tel" autoComplete="tel" />
            <Field label="Email" value={data.email} onChange={(v) => update('email', v)} placeholder="tu@email.com" inputMode="email" autoComplete="email" />
          </div>
          <PrimaryButton disabled={!canContinueData} onClick={() => setStep(4)}>Crear mi PIN →</PrimaryButton>
        </div>
      )}

      {step === 4 && (
        <div className="pb-6">
          <BackButton onClick={() => setStep(3)} />
          <div className="text-xs font-black uppercase tracking-[.25em] text-red-400">Paso 2 de 2</div>
          <h1 className="mt-3 text-4xl font-black leading-none tracking-[-.04em]">Elegí tu<br />PIN personal.</h1>
          <p className="mt-4 text-sm leading-6 text-white/55">Este PIN de 4 números será parte de tu acceso a PuntaRollers.app junto con tu documento.</p>
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/[.035] p-5"><div className="text-xs font-black uppercase tracking-[.16em] text-white/35">Tu acceso PR</div><div className="mt-3 flex items-center justify-between rounded-2xl bg-black/35 p-4"><div><div className="text-xs text-white/35">Documento</div><div className="mt-1 font-black tracking-wider">{data.documento || '—'}</div></div><div className="text-2xl">🔐</div></div></div>
          <div className="mt-5 space-y-4"><Field label="PIN de 4 números" value={data.pin} onChange={(v) => update('pin', v.replace(/\D/g, '').slice(0, 4))} placeholder="••••" inputMode="numeric" type="password" maxLength={4} /><Field label="Repetí tu PIN" value={data.pin2} onChange={(v) => update('pin2', v.replace(/\D/g, '').slice(0, 4))} placeholder="••••" inputMode="numeric" type="password" maxLength={4} /></div>
          {data.pin && data.pin2 && data.pin !== data.pin2 && <p className="mt-3 text-sm font-bold text-red-400">Los PIN no coinciden.</p>}
          {error && <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-bold text-red-200">{error}</div>}
          <div className="mt-5 rounded-2xl border border-white/8 bg-white/[.025] p-4 text-xs leading-5 text-white/40">Al confirmar, comenzaremos a preparar tu usuario. Puede demorar entre <strong className="text-white/65">48 y 72 horas</strong> y se habilitará luego de tu primera clase.</div>
          <PrimaryButton disabled={!canSubmit || sending} onClick={submit}>{sending ? 'Preparando solicitud…' : 'Confirmar y ser parte ✓'}</PrimaryButton>
        </div>
      )}
    </Shell>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text', inputMode, autoComplete, maxLength }) {
  return <label className="block"><span className="mb-2 block text-xs font-black uppercase tracking-[.14em] text-white/45">{label}</span><input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} type={type} inputMode={inputMode} autoComplete={autoComplete} maxLength={maxLength} className="w-full rounded-2xl border border-white/10 bg-white/[.045] px-4 py-4 text-base font-bold text-white outline-none transition placeholder:text-white/20 focus:border-red-400/50 focus:bg-white/[.065]" /></label>
}
