import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import PublicLayout from '../layouts/PublicLayout'
import { supabase } from '../lib/supabase'

const TOMA_SLUG = 'toma-3-2026-09-02'
const TOMA_DATE = '2026-09-02'
const LIVE_REFRESH_MS = 20000

function lower(value) {
  return String(value || '').trim().toLowerCase()
}

function isPublicTraining(activity) {
  return activity && activity.eliminada !== true && activity.es_privada !== true && activity.visible_feed !== false
}

function profileName(profile) {
  return profile?.nombre_completo || profile?.display_name || [profile?.nombre, profile?.apellido].filter(Boolean).join(' ') || 'Integrante PR'
}

function profilePhoto(profile) {
  return profile?.foto_url || profile?.photo_url || profile?.avatar_url || profile?.foto || profile?.avatar || ''
}

function buildProfileMap(profiles) {
  const map = new Map()
  ;(profiles || []).forEach((profile) => {
    if (profile?.id) map.set(String(profile.id), profile)
    if (profile?.auth_user_id) map.set(String(profile.auth_user_id), profile)
  })
  return map
}

function shiftDate(value, amount) {
  const date = new Date(`${value}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + amount)
  return date.toISOString().slice(0, 10)
}

function montevideoToday() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Montevideo', year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short',
  }).formatToParts(new Date()).filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]))
  return { date: `${parts.year}-${parts.month}-${parts.day}`, weekday: parts.weekday, year: Number(parts.year), month: Number(parts.month) }
}

function dateRanges() {
  const now = montevideoToday()
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(now.weekday)
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday
  const currentWeekStart = shiftDate(now.date, mondayOffset)
  const previousWeekStart = shiftDate(currentWeekStart, -7)
  const monthStart = `${now.year}-${String(now.month).padStart(2, '0')}-01`
  const nextMonth = new Date(Date.UTC(now.year, now.month, 1, 12))
  const monthEnd = new Date(nextMonth.getTime() - 86400000).toISOString().slice(0, 10)
  return {
    week: { start: previousWeekStart, end: shiftDate(previousWeekStart, 6) },
    month: { start: monthStart, end: monthEnd },
  }
}

function shortDate(value) {
  return new Intl.DateTimeFormat('es-UY', { day: '2-digit', month: 'short', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`))
}

function longDate(value) {
  return new Intl.DateTimeFormat('es-UY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`))
}

function insideRange(value, range) {
  const stamp = new Date(value).getTime()
  if (!Number.isFinite(stamp)) return false
  const start = new Date(`${range.start}T00:00:00-03:00`).getTime()
  const end = new Date(`${range.end}T23:59:59-03:00`).getTime()
  return stamp >= start && stamp <= end
}

function makeRanking(rows, profiles, range) {
  const grouped = new Map()
  ;(rows || []).filter(isPublicTraining).filter((row) => lower(row.fuente || 'strava') === 'strava').filter((row) => insideRange(row.fecha_inicio, range)).forEach((row) => {
    const id = String(row.alumno_id || '')
    if (!id) return
    const km = Math.max(0, Number(row.distancia_metros) || 0) / 1000
    if (!km) return
    const current = grouped.get(id) || { alumnoId: id, km: 0, sessions: 0 }
    current.km += km
    current.sessions += 1
    grouped.set(id, current)
  })
  return [...grouped.values()].map((entry) => {
    const profile = profiles.get(entry.alumnoId) || {}
    return { ...entry, name: profileName(profile), photo: profilePhoto(profile) }
  }).sort((a, b) => b.km - a.km || b.sessions - a.sessions || a.name.localeCompare(b.name)).slice(0, 3)
}

function initials(name) {
  return String(name || 'PR').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'PR'
}

function PodiumAvatar({ row, size = 'lg' }) {
  const dimension = size === 'xl' ? 'h-24 w-24' : 'h-20 w-20'
  if (row?.photo) return <img src={row.photo} alt={row.name} className={`${dimension} rounded-full border-4 border-black/70 object-cover shadow-[0_15px_45px_rgba(0,0,0,.35)]`} />
  return <div className={`${dimension} grid place-items-center rounded-full border-4 border-black/70 bg-gradient-to-br from-amber-400/35 via-violet-500/15 to-white/10 text-xl font-black`}>{initials(row?.name)}</div>
}

function KmPodium({ ranking, period }) {
  if (!ranking.length) return null
  const first = ranking[0]
  const second = ranking[1]
  const third = ranking[2]
  const card = (row, order) => row ? (
    <div key={row.alumnoId} className={`flex min-w-0 flex-col items-center ${order === 1 ? '-mt-4' : 'mt-5'}`}>
      <div className="relative">
        {order === 1 && <div className="absolute -inset-7 rounded-full bg-amber-300/20 blur-2xl" />}
        <PodiumAvatar row={row} size={order === 1 ? 'xl' : 'lg'} />
        <span className={`absolute -bottom-2 left-1/2 grid -translate-x-1/2 place-items-center rounded-full border-2 border-[#08090c] font-black ${order === 1 ? 'h-9 w-9 bg-amber-300 text-black' : order === 2 ? 'h-8 w-8 bg-slate-200 text-black' : 'h-8 w-8 bg-orange-700 text-white'}`}>{order}</span>
      </div>
      <p className="mt-5 max-w-[115px] truncate text-center text-sm font-black">{row.name}</p>
      <p className={`mt-1 text-xl font-black ${order === 1 ? 'text-amber-300' : 'text-white'}`}>{row.km.toLocaleString('es-UY', { maximumFractionDigits: 1 })} km</p>
      <p className="mt-1 text-[9px] uppercase tracking-[.13em] text-white/30">{row.sessions} entreno{row.sessions === 1 ? '' : 's'}</p>
      <div className={`mt-3 flex w-full items-start justify-center rounded-t-[18px] border border-white/10 bg-gradient-to-b pt-3 text-2xl ${order === 1 ? 'h-28 from-amber-400/20 to-white/[.03]' : order === 2 ? 'h-20 from-slate-300/10 to-white/[.02]' : 'h-16 from-orange-700/15 to-white/[.02]'}`}>{order === 1 ? '👑' : order === 2 ? '🥈' : '🥉'}</div>
    </div>
  ) : <div key={`empty-${order}`} className="min-w-0 flex-1" />
  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[.18em] text-amber-300">TOP 3 · {period === 'week' ? 'SEMANA ANTERIOR' : 'MES COMPLETO'}</p>
          <h2 className="mt-1 text-2xl font-black">El podio PR</h2>
        </div>
        <span className="rounded-full border border-emerald-400/15 bg-emerald-400/[.07] px-3 py-1 text-[9px] font-black text-emerald-300">STRAVA</span>
      </div>
      <div className="grid grid-cols-3 items-end gap-2">{card(second, 2)}{card(first, 1)}{card(third, 3)}</div>
    </div>
  )
}

function formatTime(totalSeconds) {
  const seconds = Math.max(0, Math.round(Number(totalSeconds) || 0))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const rest = seconds % 60
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}` : `${minutes}:${String(rest).padStart(2, '0')}`
}

function TrialPodium({ rows, loading }) {
  const ranked = (rows || []).filter((row) => Number(row.rank) >= 1 && Number(row.rank) <= 3)
  const byRank = (rank) => ranked.find((row) => Number(row.rank) === rank) || null
  const card = (row, rank) => {
    const winner = rank === 1
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'
    if (!row) return (
      <div className={`rounded-[24px] border border-dashed border-white/10 bg-white/[.018] p-3 text-center ${winner ? 'min-h-[205px]' : 'min-h-[185px]'}`}>
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-white/[.04] text-2xl opacity-40">{medal}</div>
        <p className="mt-4 text-[10px] font-black uppercase tracking-[.13em] text-white/25">Esperando toma…</p>
      </div>
    )
    const name = row.display_name || 'Roller PR'
    return (
      <div className={`relative flex min-w-0 flex-col items-center rounded-[24px] border p-3 text-center ${winner ? 'border-amber-300/30 bg-gradient-to-b from-amber-300/[.13] to-white/[.025]' : 'border-white/[.08] bg-white/[.025]'}`}>
        {winner && <div className="absolute -inset-5 rounded-full bg-amber-300/10 blur-2xl" />}
        <div className="relative">
          {row.photo ? <img src={row.photo} alt={name} className={`${winner ? 'h-24 w-24' : 'h-20 w-20'} rounded-full border-4 border-black/70 object-cover`} /> : <div className={`${winner ? 'h-24 w-24' : 'h-20 w-20'} grid place-items-center rounded-full border-4 border-black/70 bg-gradient-to-br from-amber-400/25 to-violet-500/15 text-xl font-black`}>{initials(name)}</div>}
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-2xl">{medal}</span>
        </div>
        <p className="relative mt-5 max-w-[115px] truncate text-sm font-black">{name}</p>
        <p className={`relative mt-2 text-xl font-black ${winner ? 'text-amber-300' : 'text-orange-300'}`}>{Number(row.speed_kmh || 0).toFixed(1)} km/h</p>
        <p className="relative mt-1 text-[9px] text-white/35">{Number(row.distance_km || 0).toLocaleString('es-UY', { maximumFractionDigits: 2 })} km · {formatTime(row.time_seconds)}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[.18em] text-orange-300">RANKING TOMA DE TIEMPO 3</p>
          <h2 className="mt-1 text-2xl font-black">Toma de Tiempo 3</h2>
          <p className="mt-2 text-[11px] font-bold capitalize text-white/45">{longDate(TOMA_DATE)}</p>
        </div>
        <span className="rounded-full border border-emerald-400/15 bg-emerald-400/[.07] px-3 py-1 text-[9px] font-black text-emerald-300">EN VIVO</span>
      </div>
      {loading && !ranked.length ? (
        <div className="grid grid-cols-3 gap-3">{[0, 1, 2].map((i) => <div key={i} className="h-56 animate-pulse rounded-[24px] bg-white/[.04]" />)}</div>
      ) : (
        <div className="grid grid-cols-3 items-end gap-2">{card(byRank(2), 2)}<div className="-translate-y-3">{card(byRank(1), 1)}</div>{card(byRank(3), 3)}</div>
      )}
      <p className="mt-4 text-center text-[10px] leading-5 text-white/30">Podio provisional. Se actualiza cada 20 segundos a medida que entran nuevas tomas registradas desde Strava.</p>
    </div>
  )
}

export default function PublicWeeklyRanking() {
  const ranges = useMemo(() => dateRanges(), [])
  const [params, setParams] = useSearchParams()
  const requested = params.get('period')
  const initialPeriod = requested === 'week' || requested === 'month' ? requested : 'toma'
  const [period, setPeriod] = useState(initialPeriod)
  const [loading, setLoading] = useState(true)
  const [activities, setActivities] = useState([])
  const [profiles, setProfiles] = useState(new Map())
  const [message, setMessage] = useState('')
  const [trialRows, setTrialRows] = useState([])
  const [trialLoading, setTrialLoading] = useState(true)

  function changePeriod(next) {
    setPeriod(next)
    setParams(next === 'toma' ? {} : { period: next })
  }

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setMessage('')
      try {
        const [profilesResponse, activitiesResponse] = await Promise.all([
          supabase.from('profiles_feed').select('*').limit(500),
          supabase.from('pr_activities').select('*').eq('eliminada', false).order('fecha_inicio', { ascending: false }).limit(1000),
        ])
        if (!active) return
        if (activitiesResponse.error) throw activitiesResponse.error
        setActivities(activitiesResponse.data || [])
        setProfiles(buildProfileMap(profilesResponse.data || []))
      } catch (_) {
        if (active) setMessage('No pudimos cargar el ranking en este momento.')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    async function loadTrial() {
      const { data, error } = await supabase.rpc('get_rollerfeed_live_podium', { p_slug: TOMA_SLUG })
      if (!active) return
      if (!error) setTrialRows(Array.isArray(data) ? data : [])
      setTrialLoading(false)
    }
    loadTrial()
    const timer = window.setInterval(loadTrial, LIVE_REFRESH_MS)
    return () => { active = false; window.clearInterval(timer) }
  }, [])

  const ranking = useMemo(() => {
    if (period === 'toma') return []
    return makeRanking(activities, profiles, period === 'week' ? ranges.week : ranges.month)
  }, [activities, profiles, period, ranges])

  const activeRange = period === 'week' ? ranges.week : ranges.month
  const rangeLabel = period === 'toma' ? longDate(TOMA_DATE) : `${shortDate(activeRange.start)} → ${shortDate(activeRange.end)}`

  return (
    <PublicLayout>
      <main className="min-h-screen bg-[#050508] px-4 pb-16 pt-5 text-white">
        <div className="mx-auto w-full max-w-2xl space-y-5">
          <section className="relative overflow-hidden rounded-[32px] border border-amber-300/20 bg-[radial-gradient(circle_at_85%_0%,rgba(124,58,237,.22),transparent_42%),linear-gradient(135deg,#2b1803,#0d0b0f_48%,#0b0713)] p-6 shadow-[0_30px_90px_rgba(0,0,0,.42)]">
            <div className="absolute -left-24 top-8 h-64 w-64 rounded-full border border-red-500/20" />
            <div className="absolute -left-20 top-12 h-56 w-56 rounded-full border border-red-500/15" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.22em] text-amber-300">🏆 PUNTA ROLLERS · STRAVA</p>
                <h1 className="mt-3 text-[40px] font-black leading-[.94] tracking-[-.04em]">Top Ranking<br/><span className="text-orange-400">PR.</span></h1>
                <p className="mt-4 max-w-md text-sm leading-6 text-white/45">Toma de Tiempo, semana anterior y mes completo. Cada ranking mantiene su período claramente separado.</p>
              </div>
              <Link to="/rollerfeed" className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[.04]">←</Link>
            </div>
            <div className="relative mt-6 grid grid-cols-3 gap-2 rounded-[20px] border border-white/10 bg-black/25 p-1.5">
              <button onClick={() => changePeriod('toma')} className={`rounded-2xl px-2 py-3 text-[10px] font-black transition ${period === 'toma' ? 'bg-gradient-to-r from-orange-400 to-amber-300 text-black' : 'text-white/45'}`}>TOMA 3</button>
              <button onClick={() => changePeriod('week')} className={`rounded-2xl px-2 py-3 text-[10px] font-black transition ${period === 'week' ? 'bg-gradient-to-r from-amber-300 to-orange-400 text-black' : 'text-white/45'}`}>SEM. ANTERIOR</button>
              <button onClick={() => changePeriod('month')} className={`rounded-2xl px-2 py-3 text-[10px] font-black transition ${period === 'month' ? 'bg-gradient-to-r from-violet-400 to-fuchsia-400 text-black' : 'text-white/45'}`}>MES COMPLETO</button>
            </div>
            <div className="relative mt-4 inline-flex rounded-full border border-white/10 bg-black/25 px-3 py-2 text-[10px] font-black uppercase tracking-[.10em] text-white/45">{rangeLabel}</div>
          </section>

          <section className="rounded-[30px] border border-white/[.08] bg-[#0b0c10] p-5 shadow-[0_24px_70px_rgba(0,0,0,.28)]">
            {period === 'toma' ? (
              <TrialPodium rows={trialRows} loading={trialLoading} />
            ) : loading ? (
              <div className="grid grid-cols-3 gap-3">{[0, 1, 2].map((i) => <div key={i} className="h-72 animate-pulse rounded-[24px] bg-white/[.04]" />)}</div>
            ) : message ? (
              <div className="rounded-[22px] border border-amber-400/15 bg-amber-400/[.06] p-5 text-sm text-amber-100/70">{message}</div>
            ) : ranking.length ? (
              <KmPodium ranking={ranking} period={period} />
            ) : (
              <div className="rounded-[24px] border border-white/[.08] bg-white/[.025] p-7 text-center text-sm text-white/40">Todavía no hay kilómetros públicos suficientes para armar este podio.</div>
            )}
          </section>

          <section className="rounded-[24px] border border-white/[.07] bg-white/[.025] p-5 text-xs leading-6 text-white/40">
            <strong className="text-white/60">Toma de Tiempo 3:</strong> miércoles 2 de septiembre de 2026, clasificación provisional en vivo. <strong className="text-white/60">Semana anterior:</strong> último lunes a domingo ya finalizado. <strong className="text-white/60">Mes completo:</strong> del día 1 al último día del mes. Los rankings de kilómetros contabilizan entrenamientos públicos de Strava visibles en RollerFeed.
          </section>
        </div>
      </main>
    </PublicLayout>
  )
}
