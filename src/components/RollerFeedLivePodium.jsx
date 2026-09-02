import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

const PODIUM_SLUG = 'toma-3-2026-09-02'
const REFRESH_MS = 20000

function formatTime(totalSeconds) {
  const seconds = Math.max(0, Math.round(Number(totalSeconds) || 0))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const rest = seconds % 60
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
    : `${minutes}:${String(rest).padStart(2, '0')}`
}

function formatDistance(value) {
  const km = Number(value) || 0
  if (!km) return '—'
  return `${km.toLocaleString('es-UY', { maximumFractionDigits: 2 })}K`
}

function initials(name) {
  return String(name || 'PR')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function PodiumAvatar({ item, size = 'normal' }) {
  const dimensions = size === 'winner' ? 'h-[74px] w-[74px]' : 'h-[62px] w-[62px]'
  return (
    <div className={`relative ${dimensions} overflow-hidden rounded-[22px] border border-white/15 bg-white/[.06] shadow-xl`}>
      {item?.photo ? (
        <img src={item.photo} alt={item.display_name || 'Roller PR'} className="h-full w-full object-cover" />
      ) : (
        <div className="grid h-full w-full place-items-center bg-gradient-to-br from-orange-500/20 to-amber-200/10 font-display text-xl text-orange-200">
          {initials(item?.display_name)}
        </div>
      )}
    </div>
  )
}

function PlaceCard({ item, rank }) {
  const winner = rank === 1
  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'
  const label = rank === 1 ? '1ER PUESTO' : rank === 2 ? '2DO PUESTO' : '3ER PUESTO'

  if (!item) {
    return (
      <div className={`rounded-[24px] border border-dashed border-white/10 bg-white/[.018] p-3 text-center ${winner ? 'min-h-[184px]' : 'min-h-[166px]'}`}>
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-[18px] border border-white/[.07] bg-white/[.025] text-xl opacity-40">{medal}</div>
        <p className="mt-3 text-[8px] font-black uppercase tracking-[.16em] text-white/22">{label}</p>
        <p className="mt-2 text-[10px] leading-4 text-white/25">Esperando una nueva toma…</p>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden rounded-[24px] border p-3 text-center ${winner ? 'border-amber-300/30 bg-gradient-to-b from-amber-300/[.13] via-orange-400/[.07] to-black/15 shadow-[0_20px_50px_rgba(251,191,36,.11)]' : 'border-white/[.08] bg-white/[.025]'}`}>
      {winner && <div className="pointer-events-none absolute -top-12 left-1/2 h-28 w-28 -translate-x-1/2 rounded-full bg-amber-300/15 blur-3xl" />}
      <div className="relative">
        <div className="absolute -right-1 -top-1 text-2xl drop-shadow-lg">{medal}</div>
        <div className="mx-auto w-fit"><PodiumAvatar item={item} size={winner ? 'winner' : 'normal'} /></div>
        <p className={`mt-3 truncate text-xs font-black ${winner ? 'text-amber-100' : 'text-white'}`}>{item.display_name}</p>
        <p className="mt-1 text-[7px] font-black uppercase tracking-[.14em] text-white/25">{label}</p>
        <div className="mt-3 rounded-[16px] border border-white/[.06] bg-black/20 px-2 py-2.5">
          <p className={`font-display text-[22px] leading-none ${winner ? 'text-amber-300' : 'text-orange-300'}`}>{Number(item.speed_kmh || 0).toFixed(1)}</p>
          <p className="mt-1 text-[7px] font-black uppercase tracking-[.12em] text-white/22">KM/H PROMEDIO</p>
        </div>
        <div className="mt-2 flex items-center justify-center gap-1.5 text-[8px] text-white/30">
          <span>{formatDistance(item.distance_km)}</span><span>·</span><span>{formatTime(item.time_seconds)}</span>
        </div>
      </div>
    </div>
  )
}

export default function RollerFeedLivePodium() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)

  useEffect(() => {
    let active = true

    async function load() {
      const { data, error } = await supabase.rpc('get_rollerfeed_live_podium', {
        p_slug: PODIUM_SLUG,
      })
      if (!active) return
      if (!error) {
        setRows(Array.isArray(data) ? data : [])
        setLastUpdated(new Date())
      }
      setLoading(false)
    }

    load()
    const timer = window.setInterval(load, REFRESH_MS)
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)

    return () => {
      active = false
      window.clearInterval(timer)
      window.removeEventListener('focus', onFocus)
    }
  }, [])

  const post = rows[0] || null
  const podium = useMemo(() => {
    const ranked = rows.filter((row) => Number(row.rank) >= 1 && Number(row.rank) <= 3)
    return {
      first: ranked.find((row) => Number(row.rank) === 1) || null,
      second: ranked.find((row) => Number(row.rank) === 2) || null,
      third: ranked.find((row) => Number(row.rank) === 3) || null,
      count: ranked.length,
    }
  }, [rows])

  if (!loading && !post) return null

  return (
    <section className="mx-auto w-full max-w-3xl px-[18px] pt-4">
      <article className="relative overflow-hidden rounded-[34px] border border-amber-300/25 bg-gradient-to-br from-[#311505] via-[#15100d] to-[#07070a] p-5 shadow-[0_30px_100px_rgba(249,115,22,.16)] animate-page-enter">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-orange-500/18 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-amber-300/[.08] blur-3xl" />

        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-red-300/20 bg-red-400/[.10] px-3 py-1.5">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-300" />
                  <span className="text-[8px] font-black uppercase tracking-[.18em] text-red-200">EN VIVO</span>
                </span>
                <span className="rounded-full border border-white/[.08] bg-white/[.035] px-3 py-1.5 text-[8px] font-black uppercase tracking-[.14em] text-white/35">📌 ANCLADO</span>
              </div>

              <p className="mt-4 text-[9px] font-black uppercase tracking-[.22em] text-orange-300">
                {post?.kicker || '⚡ CLASIFICACIÓN EN VIVO'}
              </p>
              <h2 className="mt-2 font-display text-[35px] leading-[.92] text-white">
                {post?.title || 'PODIO · TOMA 3'}
              </h2>
              <p className="mt-2 text-[11px] font-black uppercase tracking-[.08em] text-amber-200/70">
                MIÉRCOLES 2 DE SEPTIEMBRE · 2026
              </p>
            </div>

            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-[22px] border border-amber-300/20 bg-amber-300/[.08] text-3xl shadow-[0_0_35px_rgba(251,191,36,.12)]">🏆</div>
          </div>

          <p className="mt-4 max-w-xl text-xs leading-5 text-white/42">
            {post?.subtitle || 'El podio se actualiza automáticamente a medida que llegan nuevas tomas desde Strava.'}
          </p>

          <div className="mt-5 grid grid-cols-3 items-end gap-2.5">
            <PlaceCard item={podium.second} rank={2} />
            <div className="-translate-y-3"><PlaceCard item={podium.first} rank={1} /></div>
            <PlaceCard item={podium.third} rank={3} />
          </div>

          <div className="mt-3 rounded-[20px] border border-orange-300/10 bg-orange-400/[.045] px-4 py-3">
            <div className="flex items-start gap-3">
              <span className="text-lg">⚡</span>
              <div>
                <p className="text-[10px] font-black text-orange-100/75">
                  {podium.count ? 'Podio provisional · puede cambiar en cualquier momento.' : 'La pista está abierta: esperando las primeras tomas válidas de Strava.'}
                </p>
                <p className="mt-1 text-[9px] leading-4 text-white/30">
                  Ordenado por velocidad promedio de la toma de hoy para poder comparar registros de distintas distancias de forma más justa.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/[.07] pt-4">
            <div>
              <p className="text-[10px] font-black text-white/55">{post?.cta || 'Cada vuelta cuenta. Cada toma nos muestra cuánto estamos creciendo.'}</p>
              <p className="mt-1 text-[8px] text-white/22">{lastUpdated ? `Actualizado ${lastUpdated.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })}` : 'Sincronizando clasificación…'} · Strava + PR Performance</p>
            </div>
            <span className="shrink-0 rounded-full border border-emerald-300/15 bg-emerald-400/[.07] px-2.5 py-1.5 text-[8px] font-black uppercase tracking-[.12em] text-emerald-200">AUTO</span>
          </div>

          <p className="mt-3 text-center text-[8px] font-semibold tracking-[.04em] text-white/18">
            {post?.footer || 'No es solo patinar. Es pertenecer.'}
          </p>
        </div>
      </article>
    </section>
  )
}
