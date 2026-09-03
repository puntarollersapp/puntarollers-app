import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function AmigosPRCard({ profileId }) {
  const [code, setCode] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let active = true
    async function load() {
      if (!profileId) return
      const { data, error } = await supabase.rpc('ensure_pr_referral_code', { p_profile_id: profileId })
      if (active && !error && data) setCode(String(data))
    }
    load()
    return () => { active = false }
  }, [profileId])

  async function copyCode() {
    if (!code) return
    try { await navigator.clipboard.writeText(code) } catch { return }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <section className="relative overflow-hidden rounded-[26px] border border-emerald-300/20 bg-gradient-to-br from-emerald-500/[.10] via-[#111217] to-orange-400/[.06] p-5 shadow-[0_18px_55px_rgba(16,185,129,.06)]">
      <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[.18em] text-emerald-300/75">🤝 Beneficio de comunidad</p>
            <h2 className="mt-1 font-display text-[27px] leading-none text-white">AMIGOS PR</h2>
            <p className="mt-2 max-w-[310px] text-[11px] leading-5 text-white/45">Invitá a un amigo a Punta Rollers y los dos ganan. Compartile tu código personal para que lo use al inscribirse.</p>
          </div>
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-emerald-300/20 bg-emerald-400/10 text-2xl">🛼</span>
        </div>

        <div className="mt-4 rounded-[20px] border border-white/[.08] bg-black/25 p-4">
          <p className="text-[8px] font-black uppercase tracking-[.16em] text-white/30">Este es tu código de referido</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="min-w-0 flex-1 rounded-2xl border border-emerald-300/20 bg-emerald-400/[.08] px-4 py-3 font-display text-[23px] tracking-[.08em] text-emerald-200">{code || 'CREANDO…'}</div>
            <button type="button" disabled={!code} onClick={copyCode} className="rounded-2xl border border-white/10 bg-white/[.05] px-4 py-3 text-[10px] font-black text-white/70 disabled:opacity-40">{copied ? '✓ Copiado' : 'Copiar'}</button>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <div className="rounded-[18px] border border-orange-300/15 bg-orange-400/[.06] p-3.5">
            <p className="text-[9px] font-black uppercase tracking-wider text-orange-200">Tu amigo gana</p>
            <p className="mt-1 text-sm font-black text-white">10% OFF</p>
            <p className="mt-1 text-[9px] leading-4 text-white/38">Adultos o PR Kids: durante sus primeros 2 meses. Personalizadas: 10% OFF en su primera cuponera.</p>
          </div>
          <div className="rounded-[18px] border border-emerald-300/15 bg-emerald-400/[.06] p-3.5">
            <p className="text-[9px] font-black uppercase tracking-wider text-emerald-200">Vos ganás</p>
            <p className="mt-1 text-sm font-black text-white">10% OFF × 2 meses</p>
            <p className="mt-1 text-[9px] leading-4 text-white/38">Cuando la inscripción y el pago de tu amigo sean confirmados, se activa tu beneficio en las próximas 2 mensualidades.</p>
          </div>
        </div>

        <p className="mt-3 text-[8px] leading-4 text-white/25">El código es personal. El nuevo alumno lo ingresa en su formulario de inscripción. No se acumula con otros códigos promocionales.</p>
      </div>
    </section>
  )
}
