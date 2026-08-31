import { useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

const perks = ['PR CARD', 'BENEFICIOS', 'PROGRESO', 'COMUNIDAD']

function Shell({ children }) {
  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(circle at 85% 0%, rgba(190,255,55,.16), transparent 28%), radial-gradient(circle at 5% 80%, rgba(190,255,55,.07), transparent 24%)',
        }}
      />
      <div className="relative mx-auto min-h-screen w-full max-w-md px-5 py-5 sm:max-w-lg">
        {children}
      </div>
    </main>
  )
}

function Brand() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <img src="/logo.png" alt="Punta Rollers" className="h-10 w-10 rounded-xl object-contain" />
        <div>
          <div className="text-[10px] font-black uppercase tracking-[.28em] text-white/40">Punta Rollers</div>
          <div className="text-sm font-black">MEMBER ACCESS</div>
        </div>
      </div>
      <div className="rounded-full border border-[#BEFF37]/30 bg-[#BEFF37]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[.16em] text-[#BEFF37]">NEW MEMBER</div>
    </div>
  )
}

function PrimaryButton({ children, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-2xl bg-[#BEFF37] px-5 py-4 text-sm font-black uppercase tracking-[.14em] text-black transition active:scale-[.99] disabled:opacity-35"
    >
      {children}
    </button>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text', inputMode, autoComplete, maxLength }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-black uppercase tracking-[.18em] text-white/35">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        maxLength={maxLength}
        className="w-full rounded-2xl border border-white/10 bg-white/[.045] px-4 py-3.5 text-base font-bold text-white outline-none transition placeholder:text-white/20 focus:border-[#BEFF37]/60 focus:bg-white/[.07]"
      />
    </label>
  )
}

export default function WelcomeAccess() {
  const [screen, setScreen] = useState('welcome')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState({
    nombre_completo: '',
    documento: '',
    telefono: '',
    email: '',
    pin: '',
    pin2: '',
  })

  const canSubmit = useMemo(() => {
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())
    return (
      data.nombre_completo.trim().length >= 3 &&
      data.documento.replace(/\D/g, '').length >= 6 &&
      data.telefono.trim().length >= 6 &&
      emailOk &&
      /^\d{4}$/.test(data.pin) &&
      data.pin === data.pin2
    )
  }, [data])

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

    setScreen('done')
  }

  if (screen === 'done') {
    return (
      <Shell>
        <div className="flex min-h-[calc(100vh-40px)] flex-col">
          <Brand />
          <div className="flex flex-1 flex-col justify-center py-10">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#BEFF37] text-3xl font-black text-black">✓</div>
            <div className="text-[11px] font-black uppercase tracking-[.24em] text-[#BEFF37]">ACCESS REQUESTED</div>
            <h1 className="mt-3 text-5xl font-black leading-[.88] tracking-[-.055em]">YOU'RE<br />IN.</h1>
            <p className="mt-5 max-w-sm text-base leading-7 text-white/60">Recibimos tus datos. Tu acceso a <strong className="text-white">PuntaRollers.com</strong> se activa después de tu primera clase.</p>
            <div className="mt-7 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.035] p-4">
              <div className="h-2.5 w-2.5 rounded-full bg-[#BEFF37] shadow-[0_0_20px_rgba(190,255,55,.8)]" />
              <div>
                <div className="text-xs font-black uppercase tracking-[.14em]">STATUS · EN PREPARACIÓN</div>
                <div className="mt-1 text-xs text-white/40">Tiempo estimado: 48–72 h</div>
              </div>
            </div>
          </div>
          <a href="/" className="pb-4 text-center text-xs font-black uppercase tracking-[.16em] text-white/35">Volver a Punta Rollers</a>
        </div>
      </Shell>
    )
  }

  if (screen === 'form') {
    return (
      <Shell>
        <div className="flex min-h-[calc(100vh-40px)] flex-col">
          <Brand />
          <div className="mt-8 flex items-end justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[.22em] text-[#BEFF37]">CREATE YOUR ACCESS</div>
              <h1 className="mt-2 text-4xl font-black leading-none tracking-[-.045em]">Tu acceso PR.</h1>
            </div>
            <button onClick={() => setScreen('welcome')} className="pb-1 text-xs font-bold text-white/35">← volver</button>
          </div>

          <div className="mt-7 space-y-4">
            <Field label="Nombre y apellido" value={data.nombre_completo} onChange={(v) => update('nombre_completo', v)} placeholder="Ana Pérez" autoComplete="name" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Documento" value={data.documento} onChange={(v) => update('documento', v.replace(/\D/g, '').slice(0, 12))} placeholder="Sin puntos" inputMode="numeric" />
              <Field label="WhatsApp" value={data.telefono} onChange={(v) => update('telefono', v)} placeholder="099 123 456" inputMode="tel" autoComplete="tel" />
            </div>
            <Field label="Email" value={data.email} onChange={(v) => update('email', v)} placeholder="tu@email.com" inputMode="email" autoComplete="email" />

            <div className="rounded-3xl border border-[#BEFF37]/20 bg-[#BEFF37]/[.055] p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[.18em] text-[#BEFF37]">TU PIN</div>
                  <div className="mt-1 text-xs text-white/45">4 números para entrar con tu documento.</div>
                </div>
                <div className="text-xl">🔐</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="PIN" value={data.pin} onChange={(v) => update('pin', v.replace(/\D/g, '').slice(0, 4))} placeholder="••••" inputMode="numeric" type="password" maxLength={4} />
                <Field label="Repetir" value={data.pin2} onChange={(v) => update('pin2', v.replace(/\D/g, '').slice(0, 4))} placeholder="••••" inputMode="numeric" type="password" maxLength={4} />
              </div>
            </div>
          </div>

          {data.pin && data.pin2 && data.pin !== data.pin2 && <p className="mt-3 text-xs font-bold text-red-300">Los PIN no coinciden.</p>}
          {error && <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-bold text-red-200">{error}</div>}

          <div className="mt-auto pt-7">
            <p className="mb-4 text-center text-[11px] leading-5 text-white/30">Tu acceso se habilita luego de tu primera clase · 48–72 h</p>
            <PrimaryButton disabled={!canSubmit || sending} onClick={submit}>{sending ? 'CREANDO SOLICITUD…' : 'QUIERO SER PARTE →'}</PrimaryButton>
          </div>
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <div className="flex min-h-[calc(100vh-40px)] flex-col">
        <Brand />

        <div className="flex flex-1 flex-col justify-center py-10">
          <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[.04] px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-[#BEFF37] shadow-[0_0_18px_rgba(190,255,55,.9)]" />
            <span className="text-[10px] font-black uppercase tracking-[.18em] text-white/55">PR MEMBER STATUS · READY</span>
          </div>

          <div className="text-[11px] font-black uppercase tracking-[.28em] text-[#BEFF37]">WELCOME TO PR</div>
          <h1 className="mt-3 text-[58px] font-black leading-[.82] tracking-[-.065em] sm:text-[72px]">THIS IS<br />YOUR CLUB.</h1>
          <p className="mt-6 max-w-sm text-base leading-7 text-white/55">Tu experiencia en Punta Rollers también vive acá.</p>

          <div className="mt-7 flex flex-wrap gap-2">
            {perks.map((perk) => (
              <span key={perk} className="rounded-full border border-white/10 bg-white/[.035] px-3 py-2 text-[10px] font-black tracking-[.14em] text-white/60">{perk}</span>
            ))}
          </div>

          <div className="mt-7 overflow-hidden rounded-[30px] border border-white/10 bg-white/[.035] p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[.2em] text-[#BEFF37]">PR CARD</div>
                <div className="mt-1 text-xl font-black">Tu tarjeta. Tus beneficios.</div>
              </div>
              <div className="text-3xl">⚡</div>
            </div>
            <p className="mt-3 text-sm leading-6 text-white/45">Descuentos y beneficios exclusivos para alumnos PR.</p>
          </div>
        </div>

        <div>
          <PrimaryButton onClick={() => setScreen('form')}>ACTIVAR MI ACCESO →</PrimaryButton>
          <p className="mt-4 text-center text-[10px] font-black uppercase tracking-[.14em] text-white/25">NO ES SOLO PATINAR · ES PERTENECER</p>
        </div>
      </div>
    </Shell>
  )
}
