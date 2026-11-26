import { useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import './PRWelcomeEditorial.css'

const BLOCKED_PINS = new Set(['0000', '1111', '1234', '4321', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999'])

function Shell({ children }) {
  return (
    <main className="pr-welcome-editorial min-h-screen text-white">
      <div className="pointer-events-none fixed inset-0" style={{ background: 'radial-gradient(circle at 85% 0%, rgba(190,255,55,.16), transparent 28%), radial-gradient(circle at 5% 80%, rgba(190,255,55,.07), transparent 24%)' }} />
      <div className="pr-welcome-inner relative mx-auto min-h-screen w-full max-w-md px-5 py-5 sm:max-w-lg">{children}</div>
    </main>
  )
}

function Brand() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <img src="/logo.png" alt="Punta Rollers" className="h-10 w-10 rounded-xl object-contain" />
        <div><div className="text-[10px] font-black uppercase tracking-[.28em] text-white/40">Punta Rollers</div><div className="text-sm font-black">ACCESO ALUMNOS</div></div>
      </div>
      <div className="rounded-full border border-[#BEFF37]/30 bg-[#BEFF37]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[.16em] text-[#BEFF37]">PR ACCESS</div>
    </div>
  )
}

function PrimaryButton({ children, onClick, disabled }) {
  return <button type="button" onClick={onClick} disabled={disabled} className="pr-welcome-cta w-full rounded-2xl px-5 py-4 text-sm font-black uppercase tracking-[.14em] transition active:scale-[.99] disabled:opacity-35">{children}</button>
}

function Field({ label, value, onChange, placeholder, type = 'text', inputMode, autoComplete, maxLength }) {
  return <label className="block"><span className="mb-2 block text-[10px] font-black uppercase tracking-[.18em] text-white/70">{label}</span><input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} type={type} inputMode={inputMode} autoComplete={autoComplete} maxLength={maxLength} className="w-full rounded-2xl border border-white/10 bg-white/[.045] px-4 py-3.5 text-base font-bold text-white outline-none transition placeholder:text-white/20 focus:border-[#BEFF37]/60 focus:bg-white/[.07]" /></label>
}

export default function WelcomeAccess() {
  const [screen, setScreen] = useState('welcome')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState({ nombre_completo: '', documento: '', telefono: '', email: '', pin: '', pin2: '' })

  const validation = useMemo(() => {
    const nombre = data.nombre_completo.trim()
    const documento = data.documento.replace(/\D/g, '')
    const telefono = data.telefono.trim()
    const email = data.email.trim()
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    const hasAll = nombre && documento && telefono && email && data.pin && data.pin2

    let message = ''
    if (nombre && nombre.split(/\s+/).length < 2) message = 'Ingresá tu nombre y apellido.'
    else if (documento && (documento.length < 6 || documento.length > 12)) message = 'Revisá el documento. Debe tener entre 6 y 12 números.'
    else if (telefono && telefono.length < 6) message = 'Ingresá un número de WhatsApp válido.'
    else if (email && !emailOk) message = 'Revisá el email ingresado.'
    else if (data.pin && data.pin.length < 4) message = 'El PIN debe tener 4 números.'
    else if (data.pin.length === 4 && BLOCKED_PINS.has(data.pin)) message = 'Ese PIN es demasiado fácil. Elegí otro de 4 números.'
    else if (data.pin && data.pin2 && data.pin !== data.pin2) message = 'Los PIN no coinciden.'

    return { canSubmit: Boolean(hasAll) && !message && emailOk && /^\d{4}$/.test(data.pin), message }
  }, [data])

  const update = (key, value) => {
    setError('')
    setData((current) => ({ ...current, [key]: value }))
  }

  async function submit() {
    if (!validation.canSubmit || sending) return
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
      let serverMessage = result?.error || ''
      try {
        const response = invokeError?.context
        if (response && typeof response.clone === 'function') {
          const payload = await response.clone().json()
          serverMessage = payload?.error || serverMessage
        }
      } catch {
        // Si Supabase no permite leer el cuerpo del error, usamos el mensaje genérico de respaldo.
      }
      setError(serverMessage || 'No pudimos completar el registro. Revisá los datos e intentá nuevamente.')
      return
    }

    setScreen('done')
  }

  if (screen === 'done') {
    return <Shell><div className="flex min-h-[calc(100vh-40px)] flex-col"><Brand /><div className="flex flex-1 flex-col justify-center py-10"><div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#BEFF37] text-3xl font-black text-black">✓</div><div className="text-[11px] font-black uppercase tracking-[.24em] text-[#BEFF37]">SOLICITUD RECIBIDA</div><h1 className="mt-3 text-5xl font-black leading-[.88] tracking-[-.055em]">SOLICITUD<br />ENVIADA.</h1><p className="mt-5 max-w-sm text-base leading-7 text-white/60">Recibimos tus datos. Ahora vamos a preparar tu usuario personal de Punta Rollers.</p><div className="mt-7 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.035] p-4"><div className="h-2.5 w-2.5 rounded-full bg-[#BEFF37] shadow-[0_0_20px_rgba(190,255,55,.8)]" /><div><div className="text-xs font-black uppercase tracking-[.14em]">ESTADO · EN PREPARACIÓN</div><div className="mt-1 text-xs text-white/40">Se habilita luego de tu primera clase · 48–72 h</div></div></div></div><a href="/" className="pb-4 text-center text-xs font-black uppercase tracking-[.16em] text-white/35">Volver a Punta Rollers</a></div></Shell>
  }

  if (screen === 'form') {
    return <Shell><div className="flex min-h-[calc(100vh-40px)] flex-col"><Brand /><div className="mt-8 flex items-end justify-between"><div><div className="text-[10px] font-black uppercase tracking-[.22em] text-[#BEFF37]">TU CUENTA DE ALUMNO</div><h1 className="mt-2 text-4xl font-black leading-none tracking-[-.045em]">Solicitá tu acceso.</h1></div><button onClick={() => setScreen('welcome')} className="pb-1 text-xs font-bold text-white/35">← volver</button></div><p className="mt-3 text-sm leading-6 text-white/45">Estos datos nos permiten crear tu perfil personal dentro de Punta Rollers.</p><div className="mt-6 space-y-4"><Field label="Nombre y apellido" value={data.nombre_completo} onChange={(v) => update('nombre_completo', v)} placeholder="Ana Pérez" autoComplete="name" /><div className="grid grid-cols-2 gap-3"><Field label="Documento" value={data.documento} onChange={(v) => update('documento', v.replace(/\D/g, '').slice(0, 12))} placeholder="Sin puntos" inputMode="numeric" /><Field label="WhatsApp" value={data.telefono} onChange={(v) => update('telefono', v)} placeholder="099 123 456" inputMode="tel" autoComplete="tel" /></div><Field label="Email" value={data.email} onChange={(v) => update('email', v)} placeholder="tu@email.com" inputMode="email" autoComplete="email" /><div className="rounded-3xl border border-[#BEFF37]/20 bg-[#BEFF37]/[.055] p-4"><div className="mb-3 flex items-center justify-between"><div><div className="text-[10px] font-black uppercase tracking-[.18em] text-[#BEFF37]">ELEGÍ TU PIN</div><div className="mt-1 text-xs text-white/45">Son 4 números. Después vas a entrar con tu documento + este PIN.</div></div><div className="text-xl">🔐</div></div><div className="grid grid-cols-2 gap-3"><Field label="PIN" value={data.pin} onChange={(v) => update('pin', v.replace(/\D/g, '').slice(0, 4))} placeholder="••••" inputMode="numeric" type="password" maxLength={4} /><Field label="Repetir" value={data.pin2} onChange={(v) => update('pin2', v.replace(/\D/g, '').slice(0, 4))} placeholder="••••" inputMode="numeric" type="password" maxLength={4} /></div></div></div>{validation.message && <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-400/[.07] p-4 text-sm font-bold text-amber-100">{validation.message}</div>}{error && <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-bold text-red-200">{error}</div>}<div className="mt-auto pt-7"><p className="mb-4 text-center text-[11px] leading-5 text-white/30">Nosotros preparamos tu usuario y lo habilitamos después de tu primera clase · 48–72 h</p><PrimaryButton disabled={!validation.canSubmit || sending} onClick={submit}>{sending ? 'ENVIANDO…' : 'SOLICITAR MI PERFIL →'}</PrimaryButton></div></div></Shell>
  }

  return <Shell><div className="pr-welcome-home"><Brand/><section className="pr-welcome-hero"><div className="pr-welcome-orbit" aria-hidden="true"/><div className="pr-welcome-sun" aria-hidden="true"/><div className="pr-welcome-watermark" aria-hidden="true">PR</div><div className="pr-welcome-hero-content"><p className="pr-welcome-kicker">PUNTA ROLLERS / DIGITAL EXPERIENCE</p><h1>Tu lugar.<br/>Tu perfil.<br/><em>Tu comunidad.</em></h1><p>Estás a un paso de tener tu propio espacio digital en Punta Rollers. Solicitá tu acceso y empezá a vivir toda la experiencia PR.</p></div></section><div className="pr-welcome-section"><p className="pr-welcome-kicker">01 / TU ECOSISTEMA</p><h2>Todo lo que te espera.</h2><div className="pr-welcome-benefits">{[['01','Tu perfil','Tu espacio personal dentro de PR.'],['02','Tu evolución','Deberes, progreso e insignias.'],['03','Tu comunidad','Novedades, actividades y experiencias.'],['04','Tus beneficios','Ventajas y posibilidad de acceder a PR Card según los requisitos.']].map(([number,title,body])=><article key={number}><span>{number}</span><b>{title}</b><small>{body}</small></article>)}</div></div><section className="pr-welcome-how"><p className="pr-welcome-kicker">02 / ASÍ FUNCIONA</p><div><b>1</b><span>Completá tus datos y elegí un PIN.</span></div><div><b>2</b><span>El equipo PR prepara tu perfil personal.</span></div><div><b>3</b><span>Activamos tu acceso después de tu primera clase · 48–72 h.</span></div></section><PrimaryButton onClick={()=>setScreen('form')}>SOLICITAR MI PERFIL →</PrimaryButton><p className="pr-welcome-foot">NO ES SOLO PATINAR · ES PERTENECER</p></div></Shell>
}
