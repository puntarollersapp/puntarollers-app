import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'

function ProgressBar({ value, max }) {
  const percent = Math.max(0, Math.min(100, (Number(value || 0) / max) * 100))
  return (
    <div className="relative mt-3 h-3 overflow-hidden rounded-full border border-white/[.07] bg-black/35">
      <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-lime-300 to-amber-300 transition-all duration-700" style={{ width: `${percent}%` }} />
    </div>
  )
}

function RewardPill({ unlocked, children }) {
  return (
    <span className={`rounded-full border px-2.5 py-1 text-[8px] font-black uppercase tracking-[.1em] ${unlocked ? 'border-emerald-300/30 bg-emerald-400/15 text-emerald-200' : 'border-white/[.08] bg-white/[.035] text-white/32'}`}>
      {unlocked ? '✓ ' : '🔒 '}{children}
    </span>
  )
}

export default function AmigosPRCard({ profileId }) {
  const [code, setCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [progress, setProgress] = useState({
    confirmed_total: 0,
    confirmed_last_12m: 0,
    reward_50_status: null,
    reward_free_status: null,
  })

  useEffect(() => {
    let active = true
    async function load() {
      if (!profileId) return
      const [codeResult, progressResult] = await Promise.all([
        supabase.rpc('ensure_pr_referral_code', { p_profile_id: profileId }),
        supabase.rpc('pr_referral_progress', { p_profile_id: profileId }),
      ])
      if (!active) return
      if (!codeResult.error && codeResult.data) setCode(String(codeResult.data))
      if (!progressResult.error && Array.isArray(progressResult.data) && progressResult.data[0]) {
        setProgress(progressResult.data[0])
      }
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

  const total = Number(progress.confirmed_total) || 0
  const last12 = Number(progress.confirmed_last_12m) || 0
  const firstGoalValue = Math.min(total, 5)
  const secondGoalValue = Math.min(last12, 10)
  const firstUnlocked = total >= 5 || Boolean(progress.reward_50_status)
  const secondUnlocked = last12 >= 10 || Boolean(progress.reward_free_status)

  const headline = useMemo(() => {
    if (secondUnlocked) return '👑 ¡Desbloqueaste 1 mes gratis!'
    if (firstUnlocked) return `🔥 Vas ${secondGoalValue}/10 · próximo premio: 1 mes gratis`
    return `🤝 Vas ${firstGoalValue}/5 · próximo premio: 50% OFF`
  }, [firstUnlocked, secondUnlocked, firstGoalValue, secondGoalValue])

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

        <div className="mt-4 rounded-[22px] border border-emerald-300/15 bg-gradient-to-r from-emerald-400/[.07] via-white/[.025] to-amber-300/[.06] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[8px] font-black uppercase tracking-[.16em] text-white/32">Tu progreso Amigos PR</p>
              <p className="mt-1 text-[13px] font-black text-white">{headline}</p>
            </div>
            <span className="text-2xl">🎯</span>
          </div>

          {!firstUnlocked ? (
            <>
              <ProgressBar value={firstGoalValue} max={5} />
              <div className="mt-2 flex items-center justify-between text-[8px] font-bold text-white/35">
                <span>{firstGoalValue} amigos confirmados</span>
                <span>{Math.max(0, 5 - firstGoalValue)} para el 50%</span>
              </div>
            </>
          ) : (
            <>
              <ProgressBar value={secondGoalValue} max={10} />
              <div className="mt-2 flex items-center justify-between text-[8px] font-bold text-white/35">
                <span>{secondGoalValue}/10 en los últimos 12 meses</span>
                <span>{secondUnlocked ? 'Meta completa 👑' : `${Math.max(0, 10 - secondGoalValue)} para mes gratis`}</span>
              </div>
            </>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <RewardPill unlocked={firstUnlocked}>5 amigos · 50% OFF 1 mes</RewardPill>
            <RewardPill unlocked={secondUnlocked}>10 amigos · 1 mes gratis</RewardPill>
          </div>

          {(firstUnlocked || secondUnlocked) && (
            <div className="mt-3 rounded-2xl border border-emerald-300/15 bg-emerald-400/[.07] px-3.5 py-3">
              <p className="text-[9px] font-black text-emerald-100">🏆 Beneficio desbloqueado</p>
              <p className="mt-1 text-[8px] leading-4 text-white/40">Administración lo verá automáticamente para aplicarlo en la mensualidad correspondiente. Si hay más de un beneficio, siempre se usa primero el de mayor valor.</p>
            </div>
          )}
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
            <p className="mt-1 text-[9px] leading-4 text-white/38">Cada amigo confirmado activa tu beneficio normal. Además, 5 amigos desbloquean 50% por un mes y 10 confirmados dentro de 12 meses desbloquean un mes gratis.</p>
          </div>
        </div>

        <p className="mt-3 text-[8px] leading-4 text-white/25">Solo cuentan referidos con inscripción y pago confirmados. El código es personal y no se acumula con otros códigos promocionales.</p>
      </div>
    </section>
  )
}
