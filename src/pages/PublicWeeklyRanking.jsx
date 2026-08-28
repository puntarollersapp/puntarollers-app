import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PublicLayout from '../layouts/PublicLayout'
import { supabase } from '../lib/supabase'

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
  const d = new Date(`${value}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + amount)
  return d.toISOString().slice(0, 10)
}

function montevideoToday() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Montevideo', year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short',
  }).formatToParts(new Date()).filter((p) => p.type !== 'literal').map((p) => [p.type, p.value]))
  return { date: `${parts.year}-${parts.month}-${parts.day}`, weekday: parts.weekday, year: Number(parts.year), month: Number(parts.month) }
}

function dateRanges() {
  const now = montevideoToday()
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(now.weekday)
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday
  const weekStart = shiftDate(now.date, mondayOffset)
  const monthStart = `${now.year}-${String(now.month).padStart(2, '0')}-01`
  const nextMonth = new Date(Date.UTC(now.year, now.month, 1, 12))
  const monthEnd = new Date(nextMonth.getTime() - 86400000).toISOString().slice(0, 10)
  return { week: { start: weekStart, end: shiftDate(weekStart, 6) }, month: { start: monthStart, end: monthEnd } }
}

function shortDate(value) {
  return new Intl.DateTimeFormat('es-UY', { day: '2-digit', month: 'short', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`))
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
  ;(rows || [])
    .filter(isPublicTraining)
    .filter((row) => lower(row.fuente || 'strava') === 'strava')
    .filter((row) => insideRange(row.fecha_inicio, range))
    .forEach((row) => {
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
  return <div className={`${dimension} grid place-items-center rounded-full border-4 border-black/70 bg-gradient-to-br from-orange-400/40 to-white/10 text-xl font-black`}>{initials(row?.name)}</div>
}

function Podium({ ranking, period }) {
  if (!ranking.length) return null
  const first = ranking[0]
  const second = ranking[1]
  const third = ranking[2]
  const card = (row, index, order) => row ? (
    <div key={row.alumnoId} className={`flex min-w-0 flex-col items-center ${order === 1 ? '-mt-4' : 'mt-5'}`}>
      <div className="relative">
        {order === 1 && <div className="absolute -inset-5 rounded-full bg-amber-300/15 blur-2xl" />}
        <PodiumAvatar row={row} size={order === 1 ? 'xl' : 'lg'} />
        <span className={`absolute -bottom-2 left-1/2 grid -translate-x-1/2 place-items-center rounded-full border-2 border-[#08090c] font-black ${order === 1 ? 'h-9 w-9 bg-amber-300 text-black' : order === 2 ? 'h-8 w-8 bg-slate-200 text-black' : 'h-8 w-8 bg-orange-700 text-white'}`}>{order}</span>
      </div>
      <p className="mt-5 max-w-[115px] truncate text-center text-sm font-black">{row.name}</p>
      <p className={`mt-1 text-xl font-black ${order === 1 ? 'text-amber-300' : 'text-white'}`}>{row.km.toLocaleString('es-UY', { maximumFractionDigits: 1 })} km</p>
      <p className="mt-1 text-[9px] uppercase tracking-[.13em] text-white/30">{row.sessions} entreno{row.sessions === 1 ? '' : 's'}</p>
      <div className={`mt-3 w-full rounded-t-[18px] border border-white/10 bg-gradient-to-b ${order === 1 ? 'h-28 from-amber-400/20 to-white/[.03]' : order === 2 ? 'h-20 from-slate-300/10 to-white/[.02]' : 'h-16 from-orange-700/15 to-white/[.02]'} flex items-start justify-center pt-3 text-2xl`}>{order === 1 ? '👑' : order === 2 ? '🥈' : '🥉'}</div>
    </div>
  ) : <div key={`empty-${order}`} className="min-w-0 flex-1" />

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div><p className="text-[9px] font-black uppercase tracking-[.18em] text-orange-300">TOP 3 · {period === 'week' ? 'SEMANA' : 'MES'}</p><h2 className="mt-1 text-2xl font-black">El podio PR</h2></div>
        <span className="rounded-full border border-emerald-400/15 bg-emerald-400/[.07] px-3 py-1 text-[9px] font-black text-emerald-300">EN VIVO</span>
      </div>
      <div className="grid grid-cols-3 items-end gap-2">{card(second, 1, 2)}{card(first, 0, 1)}{card(third, 2, 3)}</div>
    </div>
  )
}

async function downloadRankingCard(ranking, periodLabel, rangeLabel) {
  if (!ranking.length) return
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1350
  const ctx = canvas.getContext('2d')
  const grad = ctx.createLinearGradient(0, 0, 1080, 1350)
  grad.addColorStop(0, '#250d06'); grad.addColorStop(.42, '#09090d'); grad.addColorStop(1, '#030305')
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 1080, 1350)
  ctx.strokeStyle = 'rgba(251,146,60,.4)'; ctx.lineWidth = 3; ctx.strokeRect(44, 44, 992, 1262)
  ctx.fillStyle = '#fb923c'; ctx.font = '800 32px Arial'; ctx.fillText('🏆 PUNTA ROLLERS · STRAVA', 84, 120)
  ctx.fillStyle = '#fff'; ctx.font = '900 78px Arial'; ctx.fillText('RANKING', 84, 225)
  ctx.fillStyle = '#fb923c'; ctx.fillText(periodLabel.toUpperCase(), 84, 310)
  ctx.fillStyle = 'rgba(255,255,255,.48)'; ctx.font = '700 28px Arial'; ctx.fillText(rangeLabel.toUpperCase(), 84, 370)
  const y = [560, 760, 950]
  const medals = ['🥇', '🥈', '🥉']
  ranking.forEach((row, index) => {
    ctx.fillStyle = index === 0 ? 'rgba(251,191,36,.11)' : 'rgba(255,255,255,.055)'
    ctx.beginPath(); ctx.roundRect(84, y[index] - 95, 912, 155, 34); ctx.fill()
    ctx.fillStyle = '#fff'; ctx.font = '700 52px Arial'; ctx.fillText(medals[index], 118, y[index])
    ctx.font = '900 38px Arial'; ctx.fillText(row.name.slice(0, 28), 215, y[index] - 18)
    ctx.fillStyle = 'rgba(255,255,255,.42)'; ctx.font = '700 24px Arial'; ctx.fillText(`${row.sessions} entreno${row.sessions === 1 ? '' : 's'}`, 215, y[index] + 28)
    ctx.textAlign = 'right'; ctx.fillStyle = index === 0 ? '#fcd34d' : '#fb923c'; ctx.font = '900 48px Arial'; ctx.fillText(`${row.km.toLocaleString('es-UY', { maximumFractionDigits: 1 })} KM`, 950, y[index]); ctx.textAlign = 'left'
  })
  ctx.fillStyle = 'rgba(255,255,255,.78)'; ctx.font = '900 28px Arial'; ctx.fillText('NO ES SOLO PATINAR. ES PERTENECER.', 84, 1190)
  ctx.fillStyle = 'rgba(255,255,255,.32)'; ctx.font = '700 22px Arial'; ctx.fillText('puntarollers.com', 84, 1242)
  const link = document.createElement('a')
  link.download = `ranking-pr-${periodLabel.toLowerCase()}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

export default function PublicWeeklyRanking() {
  const ranges = useMemo(() => dateRanges(), [])
  const [period, setPeriod] = useState('week')
  const [loading, setLoading] = useState(true)
  const [activities, setActivities] = useState([])
  const [profiles, setProfiles] = useState(new Map())
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true); setMessage('')
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
      } finally { if (active) setLoading(false) }
    }
    load(); return () => { active = false }
  }, [])

  const ranking = useMemo(() => makeRanking(activities, profiles, period === 'week' ? ranges.week : ranges.month), [activities, profiles, period, ranges])
  const activeRange = period === 'week' ? ranges.week : ranges.month
  const rangeLabel = `${shortDate(activeRange.start)} → ${shortDate(activeRange.end)}`

  return (
    <PublicLayout>
      <main className="min-h-screen bg-[#050508] px-4 pb-16 pt-5 text-white">
        <div className="mx-auto w-full max-w-2xl space-y-5">
          <section className="relative overflow-hidden rounded-[32px] border border-orange-400/20 bg-gradient-to-br from-[#2b1307] via-[#0d0b0b] to-[#050507] p-6 shadow-[0_30px_90px_rgba(249,115,22,.12)]">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-orange-500/15 blur-3xl" />
            <div className="relative flex items-start justify-between gap-4">
              <div><p className="text-[10px] font-black uppercase tracking-[.22em] text-orange-300">🏆 PR · STRAVA</p><h1 className="mt-3 text-[40px] font-black leading-[.94] tracking-[-.04em]">Ranking<br/><span className="text-orange-400">PR.</span></h1><p className="mt-4 max-w-md text-sm leading-6 text-white/45">Kilómetros públicos sincronizados desde Strava. Competencia sana, constancia y comunidad.</p></div>
              <Link to="/rollerfeed" className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[.04]">←</Link>
            </div>
            <div className="relative mt-6 grid grid-cols-2 gap-2 rounded-[20px] border border-white/10 bg-black/25 p-1.5">
              <button onClick={() => setPeriod('week')} className={`rounded-2xl px-4 py-3 text-xs font-black transition ${period === 'week' ? 'bg-orange-500 text-black' : 'text-white/45'}`}>SEMANA</button>
              <button onClick={() => setPeriod('month')} className={`rounded-2xl px-4 py-3 text-xs font-black transition ${period === 'month' ? 'bg-orange-500 text-black' : 'text-white/45'}`}>MES</button>
            </div>
            <div className="relative mt-4 inline-flex rounded-full border border-white/10 bg-black/25 px-3 py-2 text-[10px] font-black uppercase tracking-[.14em] text-white/45">{rangeLabel}</div>
          </section>

          <section className="rounded-[30px] border border-white/[.08] bg-[#0b0c10] p-5">
            {loading ? <div className="grid grid-cols-3 gap-3">{[0,1,2].map((i) => <div key={i} className="h-72 animate-pulse rounded-[24px] bg-white/[.04]" />)}</div> : message ? <div className="rounded-[22px] border border-amber-400/15 bg-amber-400/[.06] p-5 text-sm text-amber-100/70">{message}</div> : ranking.length ? <Podium ranking={ranking} period={period} /> : <div className="rounded-[24px] border border-white/[.08] bg-white/[.025] p-7 text-center"><p className="text-4xl">🛼</p><p className="mt-3 font-black">Todavía no hay kilómetros públicos en este período.</p></div>}
          </section>

          <button disabled={!ranking.length} onClick={() => downloadRankingCard(ranking, period === 'week' ? 'Semanal' : 'Mensual', rangeLabel)} className="flex w-full items-center justify-between rounded-[24px] border border-orange-300/25 bg-gradient-to-r from-orange-500/15 to-amber-300/[.06] px-5 py-4 text-left disabled:opacity-40">
            <div><p className="text-sm font-black">📲 Descargar tarjeta del ranking</p><p className="mt-1 text-[10px] text-white/35">Lista para compartir en historias, grupos o redes.</p></div><span className="text-xl">↓</span>
          </button>

          <div className="rounded-[22px] border border-white/[.07] bg-white/[.025] p-4 text-[10px] leading-5 text-white/32">Solo se contabilizan entrenamientos de Strava visibles públicamente en RollerFeed. Datos de contacto, métricas privadas y tiempos oficiales PR no aparecen acá.</div>
        </div>
      </main>
    </PublicLayout>
  )
}
