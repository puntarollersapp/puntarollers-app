import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function RequiredEmailGate({ children }) {
  const { user, updateUser, refreshUser, logout } = useAuth()
  const [email, setEmail] = useState(user?.email || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  if (!user || String(user.email || '').trim()) {
    return children
  }

  async function saveEmail(e) {
    e.preventDefault()
    const clean = String(email || '').trim().toLowerCase()

    if (!EMAIL_RE.test(clean) || clean.length > 254) {
      setError('Ingresá un email válido para continuar.')
      return
    }

    setSaving(true)
    setError('')

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ email: clean, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    if (updateError) {
      setSaving(false)
      setError('No pudimos guardar el email. Probá nuevamente.')
      return
    }

    updateUser({ email: clean })
    await refreshUser?.()
    setSaving(false)
  }

  return (
    <>
      {children}
      <div className="fixed inset-0 z-[9999] grid place-items-center bg-black/85 p-4 backdrop-blur-xl">
        <form onSubmit={saveEmail} className="w-full max-w-md overflow-hidden rounded-[32px] border border-orange-400/20 bg-[#0d0d0d] shadow-[0_30px_100px_rgba(0,0,0,.7)]">
          <div className="bg-gradient-to-br from-orange-500/20 via-[#16100c] to-[#0d0d0d] p-6 sm:p-7">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black tracking-[.22em] text-orange-300">PUNTA ROLLERS</p>
                <p className="mt-1 text-xs font-bold text-white/35">ACTUALIZÁ TU PERFIL</p>
              </div>
              <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[.04] text-xl">✉️</div>
            </div>

            <h2 className="text-3xl font-black tracking-tight text-white">Necesitamos tu email.</h2>
            <p className="mt-3 text-sm leading-6 text-white/55">
              Para seguir usando tu espacio PR necesitamos tener un correo válido asociado a tu perfil.
              Lo vamos a usar para avisos importantes, pagos, reservas y comunicaciones de Punta Rollers.
            </p>

            <label className="mt-6 block">
              <span className="text-[10px] font-black tracking-[.14em] text-white/35">EMAIL</span>
              <input
                autoFocus
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tuemail@ejemplo.com"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-4 text-base font-semibold text-white outline-none placeholder:text-white/20 focus:border-orange-400/50"
              />
            </label>

            {error && <p className="mt-3 text-sm font-bold text-red-300">{error}</p>}

            <button
              type="submit"
              disabled={saving}
              className="mt-5 w-full rounded-2xl bg-orange-500 py-4 font-black text-black transition active:scale-[.99] disabled:opacity-60"
            >
              {saving ? 'GUARDANDO…' : 'GUARDAR Y CONTINUAR'}
            </button>

            <p className="mt-4 text-center text-[11px] leading-5 text-white/30">
              Este dato queda asociado únicamente a tu cuenta PR.
            </p>
          </div>

          <div className="border-t border-white/8 px-6 py-4 text-center">
            <button type="button" onClick={logout} className="text-xs font-bold text-white/30 underline underline-offset-4">
              Cerrar sesión
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
