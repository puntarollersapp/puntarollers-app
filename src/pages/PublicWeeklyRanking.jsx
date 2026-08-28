import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
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

function Podium({ ranking, period }) {
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
        <div><p className="text-[9px] font-black uppercase tracking-[.18em] text-amber-300">TOP 3 · {period === 'week' ? 'SEMANA' : 'MES'}</p><h2 className="mt-1 text-2xl font-black">El podio PR</h2></div>
        <span className="rounded-full border border-emerald-400/15 bg-emerald-400/[.07] px-3 py-1 text-[9px] font-black text-emerald-300">EN VIVO</span>
      </div>
      <div className="grid grid-cols-3 items-end gap-2">{card(second, 2)}{card(first, 1)}{card(third, 3)}</div>
    </div>
  )
}

function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath()
  ctx.roundRect(x, y, width, height, radius)
  ctx.fill()
}

async function downloadRankingCard(ranking, period, rangeLabel) {
  if (!ranking.length) return
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1350
  const ctx = canvas.getContext('2d')
  const week = period === 'week'
  const grad = ctx.createLinearGradient(0, 0, 1080, 1350)
  grad.addColorStop(0, '#251701')
  grad.addColorStop(.34, '#09090e')
  grad.addColorStop(.72, '#10091d')
  grad.addColorStop(1, '#030305')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 1080, 1350)

  const glow = ctx.createRadialGradient(790, 170, 0, 790, 170, 430)
  glow.addColorStop(0, 'rgba(124,58,237,.24)')
  glow.addColorStop(1, 'rgba(124,58,237,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, 1080, 700)

  ctx.strokeStyle = 'rgba(250,204,21,.38)'
  ctx.lineWidth = 3
  ctx.strokeRect(44, 44, 992, 1262)
  ctx.strokeStyle = 'rgba(239,68,68,.45)'
  ctx.lineWidth = 5
  ;[0, 1, 2].forEach((i) => {
    ctx.beginPath(); ctx.arc(-20, 280, 185 + i * 28, -.85, .95); ctx.stroke()
  })

  ctx.fillStyle = '#facc15'
  ctx.font = '900 28px Arial'
  ctx.fillText('PUNTA ROLLERS · TOP RANKING', 84, 112)
  ctx.fillStyle = '#ffffff'
  ctx.font = '900 76px Arial'
  ctx.fillText('KILÓMETROS', 84, 215)
  ctx.fillStyle = '#fb923c'
  ctx.fillText(week ? 'DE LA SEMANA' : 'DEL MES', 84, 296)
  ctx.fillStyle = 'rgba(255,255,255,.44)'
  ctx.font = '700 25px Arial'
  ctx.fillText(`STRAVA · ${rangeLabel.toUpperCase()}`, 84, 352)

  ctx.textAlign = 'right'
  ctx.fillStyle = 'rgba(250,204,21,.10)'
  ctx.font = '900 180px Arial'
  ctx.fillText('PR', 1000, 250)
  ctx.textAlign = 'left'

  const y = [560, 760, 960]
  const placeColors = ['#facc15', '#d1d5db', '#c2672d']
  ranking.forEach((row, index) => {
    ctx.fillStyle = index === 0 ? 'rgba(250,204,21,.12)' : 'rgba(255,255,255,.055)'
    roundedRect(ctx, 84, y[index] - 105, 912, 165, 34)
    ctx.fillStyle = placeColors[index]
    ctx.font = '900 66px Arial'
    ctx.fillText(`#${index + 1}`, 118, y[index] + 5)
    ctx.fillStyle = '#fff'
    ctx.font = '900 38px Arial'
    ctx.fillText(row.name.slice(0, 27), 245, y[index] - 28)
    ctx.fillStyle = 'rgba(255,255,255,.42)'
    ctx.font = '700 23px Arial'
    ctx.fillText(`${row.sessions} entrenamiento${row.sessions === 1 ? '' : 's'} registrado${row.sessions === 1 ? '' : 's'}`, 245, y[index] + 17)
    ctx.textAlign = 'right'
    ctx.fillStyle = index === 0 ? '#facc15' : '#fb923c'
    ctx.font = '900 47px Arial'
    ctx.fillText(`${row.km.toLocaleString('es-UY', { maximumFractionDigits: 1 })} KM`, 950, y[index])
    ctx.textAlign = 'left'
  })

  ctx.fillStyle = '#facc15'
  roundedRect(ctx, 84, 1100, 430, 54, 27)
  ctx.fillStyle = '#08080b'
  ctx.font = '900 21px Arial'
  ctx.fillText('🏆 PODIO OFICIAL PR · STRAVA', 108, 1135)
  ctx.fillStyle = 'rgba(255,255,255,.84)'
  ctx.font = '900 28px Arial'
  ctx.fillText('NO ES SOLO PATINAR. ES PERTENECER.', 84, 1210)
  ctx.fillStyle = 'rgba(255,255,255,.34)'
  ctx.font = '700 21px Arial'
  ctx.fillText('PUNTA ROLLERS · puntarollers.com', 84, 1260)

  const link = document.createElement('a')
  link.download = `punta-rollers-top-ranking-${week ? 'semana' : 'mes'}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

export default function PublicWeeklyRanking() {
  const ranges = useMemo(() => dateRanges(), [])
  const [params, setParams] = useSearchParams()
  const initialPeriod = params.get('period') === 'month' ? 'month' : 'week'
  const [period, setPeriod] = useState(initialPeriod)
  const [loading, setLoading] = useState(true)
  const [activities, setActivities] = useState([])
  const [profiles, setProfiles] = useState(new Map())
  const [message, setMessage] = useState('')

  function changePeriod(next) {
    setPeriod(next)
    setParams(next === 'month' ? { period: 'month' } : {})
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

  const ranking = useMemo(() => makeRanking(activities, profiles, period === 'week' ? ranges.week : ranges.month), [activities, profiles, period, ranges])
  const activeRange = period === 'week' ? ranges.week : ranges.month
  const rangeLabel = `${shortDate(activeRange.start)} → ${shortDate(activeRange.end)}`

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
                <p className="mt-4 max-w-md text-sm leading-6 text-white/45">Kilómetros, constancia y comunidad. El podio se actualiza automáticamente con las actividades públicas de Strava.</p>
              </div>
              <Link to="/rollerfeed" className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[.04]">←</Link>
            </div>
            <div className="relative mt-6 grid grid-cols-2 gap-2 rounded-[20px] border border-white/10 bg-black/25 p-1.5">
              <button onClick={() => changePeriod('week')} className={`rounded-2xl px-4 py-3 text-xs font-black transition ${period === 'week' ? 'bg-gradient-to-r from-amber-300 to-orange-400 text-black shadow-[0_8px_25px_rgba(251,191,36,.16)]' : 'text-white/45'}`}>SEMANA</button>
              <button onClick={() => changePeriod('month')} className={`rounded-2xl px-4 py-3 text-xs font-black transition ${period === 'month' ? 'bg-gradient-to-r from-violet-400 to-fuchsia-400 text-black shadow-[0_8px_25px_rgba(168,85,247,.16)]' : 'text-white/45'}`}>MES</button>
            </div>
            <div className="relative mt-4 inline-flex rounded-full border border-white/10 bg-black/25 px-3 py-2 text-[10px] font-black uppercase tracking-[.14em] text-white/45">{rangeLabel}</div>
          </section>

          <section className="rounded-[30px] border border-white/[.08] bg-[#0b0c10] p-5 shadow-[0_24px_70px_rgba(0,0,0,.28)]">
            {loading ? (
              <div className="grid grid-cols-3 gap-3">{[0, 1, 2].map((i) => <div key={i} className="h-72 animate-pulse rounded-[24px] bg-white/[.04]" />)}</div>
            ) : message ? (
              <div className="rounded-[22px] border border-amber-400/15 bg-amber-400/[.06] p-5 text-sm text-amber-100/70">{message}</div>
            ) : ranking.length ? (
              <Podium ranking={ranking} period={period} />
            ) : (
              <div className="rounded-[24px] border border-white/[.08] bg-white/[.025] p-7 text-center text-sm text-white/40">Todavía no hay kilómetros públicos suficientes para armar este podio.</div>
            )}
          </section>

          <section className="relative overflow-hidden rounded-[28px] border border-violet-300/15 bg-gradient-to-r from-violet-500/[.10] via-white/[.025] to-amber-400/[.08] p-5">
            <div className="absolute -right-10 -top-16 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />
            <div className="relative">
              <p className="text-[9px] font-black uppercase tracking-[.18em] text-violet-200">COMPARTÍ EL PODIO</p>
              <h3 className="mt-2 text-xl font-black">Tu ranking merece presumirse.</h3>
              <p className="mt-2 text-xs leading-5 text-white/40">Generá una placa oficial Punta Rollers lista para historias, WhatsApp o redes.</p>
              <button disabled={!ranking.length} onClick={() => downloadRankingCard(ranking, period, rangeLabel)} className="mt-4 w-full rounded-2xl bg-gradient-to-r from-amber-300 via-orange-400 to-violet-400 px-4 py-4 text-xs font-black text-black shadow-[0_12px_35px_rgba(251,146,60,.14)] disabled:opacity-40">DESCARGAR TARJETA · {period === 'week' ? 'SEMANA' : 'MES'} ↓</button>
            </div>
          </section>

          <section className="rounded-[24px] border border-white/[.07] bg-white/[.025] p-5 text-xs leading-6 text-white/40">
            Solo se contabilizan entrenamientos públicos de Strava visibles en RollerFeed. Semana: lunes a domingo. Mes: del día 1 al último día. Ambos rankings cambian solos con cada período y con cada actividad sincronizada.
          </section>
        </div>
      </main>
    </PublicLayout>
  )
}
