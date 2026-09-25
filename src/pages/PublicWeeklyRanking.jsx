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
  const monthStart = `${now.year}-${String(now.month).padStart(2, '0')}-01`
  const previousMonthEndDate = new Date(Date.UTC(now.year, now.month - 1, 0, 12))
  const previousMonthStartDate = new Date(Date.UTC(previousMonthEndDate.getUTCFullYear(), previousMonthEndDate.getUTCMonth(), 1, 12))
  const previousMonthStart = previousMonthStartDate.toISOString().slice(0, 10)
  const previousMonthEnd = previousMonthEndDate.toISOString().slice(0, 10)
  return {
    week: { start: currentWeekStart, end: now.date },
    month: { start: monthStart, end: now.date },
    previousMonth: { start: previousMonthStart, end: previousMonthEnd },
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
  }).sort((a, b) => b.km - a.km || b.sessions - a.sessions || a.name.localeCompare(b.name))
}

function initials(name) {
  return String(name || 'PR').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'PR'
}

function PodiumAvatar({ row, size = 'lg' }) {
  const dimension = size === 'xl' ? 'h-24 w-24' : 'h-20 w-20'
  if (row?.photo) return <img src={row.photo} alt={row.name} className={`${dimension} rounded-full border-4 border-black/70 object-cover shadow-[0_15px_45px_rgba(0,0,0,.35)]`} />
  return <div className={`${dimension} grid place-items-center rounded-full border-4 border-black/70 bg-gradient-to-br from-amber-400/35 via-violet-500/15 to-white/10 text-xl font-black`}>{initials(row?.name)}</div>
}

function PrizeVisual({ campaign, level, totalKm }) {
  const target = Number(campaign?.[`prize_${level}_target_km`] || 0)
  const title = campaign?.[`prize_${level}_title`] || ''
  const detail = campaign?.[`prize_${level}_detail`] || ''
  const image = campaign?.[`prize_${level}_image_url`] || ''
  const unlocked = totalKm >= target
  const previousTarget = level === 1 ? 0 : Number(campaign?.[`prize_${level - 1}_target_km`] || 0)
  const revealed = level === 1 || totalKm >= previousTarget
  const icon = level === 1 ? '🍫' : level === 2 ? '🍷' : '🎟️'
  const left = Math.max(0, target - totalKm)
  return (
    <div className={`relative overflow-hidden rounded-[24px] border p-4 transition ${unlocked ? 'border-emerald-300/30 bg-emerald-400/[.08]' : revealed ? 'border-orange-300/20 bg-white/[.035]' : 'border-white/[.07] bg-black/25'}`}>
      {!revealed && <div className="absolute inset-0 z-10 bg-black/58 backdrop-blur-[2px]" />}
      <div className="relative z-20 flex items-start gap-3">
        <div className={`grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-[18px] border text-2xl ${unlocked ? 'border-emerald-300/30 bg-emerald-300/15' : 'border-white/10 bg-black/30'}`}>
          {image ? <img src={image} alt={title} className="h-full w-full object-cover" /> : icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[9px] font-black uppercase tracking-[.16em] text-white/35">NIVEL 0{level} · {target.toLocaleString('es-UY')} KM</p>
            <span className={`rounded-full px-2 py-1 text-[8px] font-black ${unlocked ? 'bg-emerald-300 text-black' : revealed ? 'bg-orange-400/15 text-orange-200' : 'bg-white/8 text-white/35'}`}>{unlocked ? 'UNLOCKED ✓' : revealed ? `${left.toLocaleString('es-UY',{maximumFractionDigits:1})} KM LEFT` : 'BLOQUEADO'}</span>
          </div>
          <h3 className="mt-1 text-base font-black">{revealed ? title : level === 3 ? 'PREMIO MÁXIMO' : 'PRÓXIMO PREMIO'}</h3>
          <p className="mt-1 text-[10px] leading-4 text-white/38">{revealed ? detail : 'Desbloqueá el nivel anterior para revelarlo.'}</p>
        </div>
      </div>
    </div>
  )
}

function PRUnlock({ campaign, activities, profiles }) {
  if (!campaign) return null
  const range = { start: campaign.starts_on, end: campaign.ends_on }
  const campaignRanking = makeRanking(activities, profiles, range)
  const totalKm = campaignRanking.reduce((sum, row) => sum + row.km, 0)
  const maxTarget = Number(campaign.prize_3_target_km || 1)
  const pct = Math.min(100, Math.round((totalKm / maxTarget) * 100))
  const targets = [1,2,3].map((level) => Number(campaign[`prize_${level}_target_km`] || 0))
  const unlockedLevel = totalKm >= targets[2] ? 3 : totalKm >= targets[1] ? 2 : totalKm >= targets[0] ? 1 : 0
  const nextTarget = targets[Math.min(unlockedLevel, 2)]
  const nextLeft = unlockedLevel >= 3 ? 0 : Math.max(0, nextTarget - totalKm)
  const activePrizeLevel = unlockedLevel
  const activePrizeTitle = activePrizeLevel ? campaign[`prize_${activePrizeLevel}_title`] : null
  const activePrizeDetail = activePrizeLevel ? campaign[`prize_${activePrizeLevel}_detail`] : null
  const activePrizeIcon = activePrizeLevel === 1 ? '🍫' : activePrizeLevel === 2 ? '🍷🍷' : activePrizeLevel === 3 ? '🎟️🎟️' : '🔒'
  const leader = campaignRanking[0]
  const today = montevideoToday().date
  const finished = today > campaign.ends_on
  return (
    <section className="relative overflow-hidden rounded-[34px] border border-fuchsia-300/20 bg-[radial-gradient(circle_at_90%_0%,rgba(236,72,153,.24),transparent_35%),radial-gradient(circle_at_5%_95%,rgba(124,58,237,.25),transparent_40%),linear-gradient(145deg,#171018,#09090d_65%)] p-5 shadow-[0_30px_90px_rgba(0,0,0,.38)]">
      <div className="absolute -right-14 -top-16 h-48 w-48 rounded-full border border-orange-300/15" />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[.22em] text-fuchsia-300">PR UNLOCK · MISIÓN DEL MES</p>
            <h2 className="mt-1 text-[31px] font-black leading-none">Todos desbloqueamos.<br/><span className="text-orange-400">Uno se lo lleva.</span></h2>
          </div>
          <span className={`rounded-full border px-3 py-1.5 text-[8px] font-black uppercase tracking-wider ${finished ? 'border-white/10 bg-white/5 text-white/40' : 'border-emerald-300/20 bg-emerald-400/[.08] text-emerald-300'}`}>{finished ? 'CERRADA' : '● EN VIVO'}</span>
        </div>
        <p className="mt-4 text-xs leading-5 text-white/48">Cada kilómetro de patinaje inline suma dos veces: a tu posición personal y al objetivo colectivo. El grupo desbloquea el premio; al cierre de la misión, el <b className="text-white">#1 del ranking de este desafío</b> se lleva el premio de mayor nivel alcanzado.</p>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-[9px] font-black uppercase tracking-[.12em]">
          <span className="rounded-full border border-orange-300/15 bg-orange-400/[.07] px-3 py-2 text-orange-200">{shortDate(campaign.starts_on)} → {shortDate(campaign.ends_on)}</span>
          <span className="rounded-full border border-white/8 bg-white/[.035] px-3 py-2 text-white/45">PREMIO EVOLUTIVO · NO ACUMULATIVO</span>
        </div>
        <div className={`mt-5 overflow-hidden rounded-[28px] border p-4 ${activePrizeLevel ? 'border-amber-300/25 bg-[radial-gradient(circle_at_90%_10%,rgba(251,191,36,.18),transparent_34%),linear-gradient(135deg,rgba(249,115,22,.12),rgba(124,58,237,.10))]' : 'border-white/10 bg-white/[.035]'}`}>
          <p className="text-[9px] font-black uppercase tracking-[.18em] text-amber-300">{activePrizeLevel >= 3 ? '🏆 PREMIO MÁXIMO DESBLOQUEADO' : activePrizeLevel ? '🏆 PREMIO ACTUAL EN JUEGO' : '🔒 TODAVÍA NO HAY PREMIO DESBLOQUEADO'}</p>
          <div className="mt-3 flex items-center gap-4">
            <div className={`grid h-20 w-20 shrink-0 place-items-center rounded-[24px] border text-4xl ${activePrizeLevel ? 'border-amber-300/25 bg-amber-300/10 shadow-[0_0_35px_rgba(251,191,36,.10)]' : 'border-white/10 bg-black/25'}`}>{activePrizeIcon}</div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-black">{activePrizeLevel ? activePrizeTitle : `Faltan ${Math.max(0,targets[0]-totalKm).toLocaleString('es-UY',{maximumFractionDigits:1})} km para activar el Nivel 1`}</h3>
              <p className="mt-1 text-[10px] leading-4 text-white/40">{activePrizeLevel ? activePrizeDetail : 'Cuando el grupo llegue al primer checkpoint, el premio empieza a estar oficialmente en juego.'}</p>
            </div>
          </div>
          {leader && <div className="mt-4 flex items-center gap-3 rounded-[20px] border border-white/[.08] bg-black/25 p-3">
            <PodiumAvatar row={leader} />
            <div className="min-w-0 flex-1">
              <p className="text-[8px] font-black uppercase tracking-[.16em] text-white/28">{activePrizeLevel ? 'SI LA MISIÓN CERRARA HOY' : 'LÍDER ACTUAL DE LA MISIÓN'}</p>
              <p className="mt-1 truncate text-sm font-black">{leader.name}</p>
              <p className="mt-1 text-[10px] text-white/38">{leader.km.toLocaleString('es-UY',{maximumFractionDigits:1})} km {activePrizeLevel ? `· se llevaría ${activePrizeTitle}` : '· sigue liderando mientras el grupo busca el primer unlock'}</p>
            </div>
          </div>}
        </div>

        <div className="mt-6 rounded-[26px] border border-white/10 bg-black/30 p-4">
          <div className="flex items-end justify-between gap-4">
            <div><p className="text-[9px] font-black uppercase tracking-[.16em] text-white/30">KM GRUPALES</p><p className="mt-1 text-4xl font-black">{totalKm.toLocaleString('es-UY',{maximumFractionDigits:1})}<span className="text-lg text-white/30"> / {maxTarget.toLocaleString('es-UY')} km</span></p></div>
            <div className="text-right"><p className="text-2xl font-black text-fuchsia-300">{pct}%</p><p className="text-[8px] uppercase tracking-wider text-white/25">hacia nivel 03</p></div>
          </div>
          <div className="relative mt-5 pb-7">
            <div className="relative h-5 overflow-hidden rounded-full border border-white/10 bg-white/[.06] p-1">
              <div className="h-full rounded-full bg-gradient-to-r from-orange-400 via-fuchsia-400 to-violet-400 shadow-[0_0_24px_rgba(236,72,153,.45)] transition-all" style={{width:`${pct}%`}} />
            </div>
            {[1,2,3].map((level)=>{const target=targets[level-1],pos=Math.min(100,(target/maxTarget)*100),unlocked=totalKm>=target;return <div key={level} className="absolute top-[-4px] -translate-x-1/2 text-center" style={{left:`${pos}%`}}><div className={`mx-auto grid h-7 w-7 place-items-center rounded-full border-2 border-[#111016] text-[9px] font-black ${unlocked?'bg-emerald-300 text-black':'bg-white/15 text-white/60'}`}>{unlocked?'✓':level}</div><p className="mt-1 whitespace-nowrap text-[7px] font-black text-white/35">{target.toLocaleString('es-UY')} KM</p></div>})}
            <span className="absolute left-0 top-7 text-[7px] font-black text-white/25">0 KM</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-[18px] border border-white/[.07] bg-white/[.025] p-3"><p className="text-[8px] font-black uppercase text-white/25">PRÓXIMO UNLOCK</p><p className="mt-1 text-lg font-black text-orange-300">{unlockedLevel >= 3 ? 'TODO DESBLOQUEADO' : `${nextLeft.toLocaleString('es-UY',{maximumFractionDigits:1})} km`}</p><p className="text-[9px] text-white/28">{unlockedLevel >= 3 ? 'Misión máxima alcanzada' : 'faltan para el próximo premio'}</p></div>
            <div className="rounded-[18px] border border-white/[.07] bg-white/[.025] p-3"><p className="text-[8px] font-black uppercase text-white/25">LÍDER DEL DESAFÍO</p>{leader ? <><p className="mt-1 truncate text-sm font-black">{leader.name}</p><p className="text-[9px] text-fuchsia-200/70">{leader.km.toLocaleString('es-UY',{maximumFractionDigits:1})} km · {leader.sessions} entrenos</p></> : <p className="mt-1 text-sm font-black text-white/35">Tabla abierta</p>}</div>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          <PrizeVisual campaign={campaign} level={1} totalKm={totalKm} />
          <PrizeVisual campaign={campaign} level={2} totalKm={totalKm} />
          <PrizeVisual campaign={campaign} level={3} totalKm={totalKm} />
        </div>
        <div className="mt-4 rounded-[22px] border border-violet-300/15 bg-violet-400/[.06] p-4">
          <p className="text-[9px] font-black uppercase tracking-[.16em] text-violet-200">CÓMO FUNCIONA</p>
          <div className="mt-2 space-y-2 text-[10px] leading-5 text-white/48">
            <p><b className="text-white">1.</b> Patinás y sincronizás Strava como siempre. No tenés que cargar nada extra.</p>
            <p><b className="text-white">2.</b> Tus km suman a tu ranking personal y, al mismo tiempo, al contador grupal PR UNLOCK.</p>
            <p><b className="text-white">3.</b> Cuando el grupo alcanza un checkpoint, el premio evoluciona al siguiente nivel.</p>
            <p><b className="text-white">4.</b> El {shortDate(campaign.ends_on)}, el #1 del ranking de esta misión obtiene el premio de mayor nivel desbloqueado.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

function KmPodium({ ranking, period, statuses }) {
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
      {statuses?.[String(row.alumnoId)] ? <p className="mt-2 max-w-[125px] break-words rounded-xl border border-white/[.07] bg-black/25 px-2 py-2 text-center text-[9px] font-bold leading-3 text-white/60">“{statuses[String(row.alumnoId)]}”</p> : null}
      <div className={`mt-3 flex w-full items-start justify-center rounded-t-[18px] border border-white/10 bg-gradient-to-b pt-3 text-2xl ${order === 1 ? 'h-28 from-amber-400/20 to-white/[.03]' : order === 2 ? 'h-20 from-slate-300/10 to-white/[.02]' : 'h-16 from-orange-700/15 to-white/[.02]'}`}>{order === 1 ? '👑' : order === 2 ? '🥈' : '🥉'}</div>
    </div>
  ) : <div key={`empty-${order}`} className="min-w-0 flex-1" />
  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[.18em] text-amber-300">TOP 3 · {period === 'week' ? 'ESTA SEMANA' : 'ESTE MES'}</p>
          <h2 className="mt-1 text-2xl font-black">El podio PR</h2>
        </div>
        <span className="rounded-full border border-emerald-400/15 bg-emerald-400/[.07] px-3 py-1 text-[9px] font-black text-emerald-300">STRAVA</span>
      </div>
      <div className="grid grid-cols-3 items-end gap-2">{card(second, 2)}{card(first, 1)}{card(third, 3)}</div>
    </div>
  )
}

export default function PublicWeeklyRanking() {
  const ranges = useMemo(() => dateRanges(), [])
  const [params, setParams] = useSearchParams()
  const requested = params.get('period')
  const initialPeriod = requested === 'week' ? 'week' : 'month'
  const [period, setPeriod] = useState(initialPeriod)
  const [loading, setLoading] = useState(true)
  const [activities, setActivities] = useState([])
  const [profiles, setProfiles] = useState(new Map())
  const [message, setMessage] = useState('')
  const [statuses, setStatuses] = useState({})
  const [unlockCampaign, setUnlockCampaign] = useState(null)
  function changePeriod(next) {
    setPeriod(next)
    setParams({ period: next })
  }

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setMessage('')
      try {
        const [profilesResponse, activitiesResponse, statusesResponse, unlockResponse] = await Promise.all([
          supabase.from('profiles_public').select('*').limit(500),
          supabase.from('pr_inline_skate_activities').select('*').eq('eliminada', false).order('fecha_inicio', { ascending: false }).limit(1000),
          supabase.from('pr_ranking_statuses').select('alumno_id,status_text,updated_at'),
          supabase.from('pr_unlock_campaigns').select('*').eq('active', true).order('starts_on', { ascending: false }).limit(1).maybeSingle(),
        ])
        if (!active) return
        if (activitiesResponse.error) throw activitiesResponse.error
        setActivities(activitiesResponse.data || [])
        setStatuses(Object.fromEntries((statusesResponse.data || []).map((row) => [String(row.alumno_id), row.status_text || ''])))
        setProfiles(buildProfileMap(profilesResponse.data || []))
        setUnlockCampaign(unlockResponse.data || null)
      } catch (_) {
        if (active) setMessage('No pudimos cargar el ranking en este momento.')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [])

  const ranking = useMemo(() => {
    return makeRanking(activities, profiles, period === 'week' ? ranges.week : ranges.month)
  }, [activities, profiles, period, ranges])

  const previousMonthRanking = useMemo(
    () => makeRanking(activities, profiles, ranges.previousMonth),
    [activities, profiles, ranges]
  )

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
                <p className="mt-4 max-w-md text-sm leading-6 text-white/45">Kilómetros de patinaje inline de la comunidad PR, actualizados desde Strava. Mirá quién viene sumando más esta semana y este mes.</p>
              </div>
              <Link to="/rollerfeed" className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[.04]">←</Link>
            </div>
            <div className="relative mt-6 grid grid-cols-2 gap-2 rounded-[20px] border border-white/10 bg-black/25 p-1.5">
              <button onClick={() => changePeriod('week')} className={`rounded-2xl px-2 py-3 text-[10px] font-black transition ${period === 'week' ? 'bg-gradient-to-r from-amber-300 to-orange-400 text-black' : 'text-white/45'}`}>ESTA SEMANA</button>
              <button onClick={() => changePeriod('month')} className={`rounded-2xl px-2 py-3 text-[10px] font-black transition ${period === 'month' ? 'bg-gradient-to-r from-violet-400 to-fuchsia-400 text-black' : 'text-white/45'}`}>ESTE MES</button>
            </div>
            <div className="relative mt-4 inline-flex rounded-full border border-white/10 bg-black/25 px-3 py-2 text-[10px] font-black uppercase tracking-[.10em] text-white/45">{rangeLabel}</div>
          </section>

          <PRUnlock campaign={unlockCampaign} activities={activities} profiles={profiles} />

          <section className="rounded-[30px] border border-white/[.08] bg-[#0b0c10] p-5 shadow-[0_24px_70px_rgba(0,0,0,.28)]">
            {loading ? (
              <div className="grid grid-cols-3 gap-3">{[0, 1, 2].map((i) => <div key={i} className="h-72 animate-pulse rounded-[24px] bg-white/[.04]" />)}</div>
            ) : message ? (
              <div className="rounded-[22px] border border-amber-400/15 bg-amber-400/[.06] p-5 text-sm text-amber-100/70">{message}</div>
            ) : ranking.length ? (
              <KmPodium ranking={ranking} period={period} statuses={statuses} />
            ) : (
              <div className="rounded-[24px] border border-white/[.08] bg-white/[.025] p-7 text-center text-sm text-white/40">Todavía no hay kilómetros de patinaje inline suficientes para armar este podio.</div>
            )}
          </section>

          <section className="rounded-[24px] border border-white/[.07] bg-white/[.025] p-5">
            <div className="flex items-center justify-between gap-3">
              <div><p className="text-[9px] font-black uppercase tracking-[.18em] text-orange-300">CLASIFICACIÓN COMPLETA</p><h3 className="mt-1 text-xl font-black">Todos los km inline</h3></div>
              <span className="rounded-full border border-orange-400/15 bg-orange-400/[.07] px-3 py-1 text-[9px] font-black text-orange-300">{ranking.length} rollers</span>
            </div>
            <div className="mt-4 space-y-2">
              {ranking.map((row, index) => (
                <div key={row.alumnoId} className="flex items-center gap-3 rounded-[18px] border border-white/[.06] bg-black/20 p-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[.05] text-sm font-black text-white/55">{index + 1}</div>
                  {row.photo ? <img src={row.photo} alt={row.name} className="h-10 w-10 rounded-full object-cover" /> : <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-orange-400/25 to-violet-500/20 text-xs font-black">{initials(row.name)}</div>}
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{row.name}</p><p className="mt-0.5 text-[9px] uppercase tracking-[.11em] text-white/30">{row.sessions} entreno{row.sessions === 1 ? '' : 's'}</p>{statuses[String(row.alumnoId)] ? <p className="mt-1 break-words text-[10px] font-semibold leading-4 text-violet-200/70">“{statuses[String(row.alumnoId)]}”</p> : null}</div>
                  <p className="shrink-0 text-base font-black text-amber-300">{row.km.toLocaleString('es-UY', { maximumFractionDigits: 1 })} km</p>
                </div>
              ))}
            </div>
            <p className="mt-5 text-[10px] leading-5 text-white/30">Se recalcula con las actividades públicas de Strava sincronizadas en Punta Rollers. La semana corre de lunes hasta hoy y el mes desde el día 1 hasta hoy.</p>
          </section>
          {previousMonthRanking.length > 0 && (
            <section className="relative overflow-hidden rounded-[24px] border border-violet-300/15 bg-[radial-gradient(circle_at_100%_0%,rgba(139,92,246,.16),transparent_42%),rgba(255,255,255,.025)] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[.18em] text-violet-300">CIERRE MENSUAL · ARCHIVO PR</p>
                  <h3 className="mt-1 text-xl font-black">El mes pasado quedó así.</h3>
                  <p className="mt-2 text-[10px] leading-5 text-white/32">{shortDate(ranges.previousMonth.start)} → {shortDate(ranges.previousMonth.end)}</p>
                </div>
                <span className="text-2xl">🏁</span>
              </div>

              <div className="mt-4 space-y-2">
                {previousMonthRanking.slice(0, 3).map((row, index) => (
                  <div key={row.alumnoId} className="flex items-center gap-3 rounded-[18px] border border-white/[.06] bg-black/20 p-3">
                    <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-black ${index === 0 ? 'bg-amber-300 text-black' : index === 1 ? 'bg-slate-200 text-black' : 'bg-orange-700 text-white'}`}>{index + 1}</div>
                    {row.photo ? <img src={row.photo} alt={row.name} className="h-10 w-10 rounded-full object-cover" /> : <div className="grid h-10 w-10 place-items-center rounded-full bg-white/[.05] text-xs font-black">{initials(row.name)}</div>}
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{row.name}</p><p className="mt-0.5 text-[9px] uppercase tracking-[.1em] text-white/28">{row.sessions} entreno{row.sessions === 1 ? '' : 's'}</p></div>
                    <p className="shrink-0 text-sm font-black text-violet-200">{row.km.toLocaleString('es-UY', { maximumFractionDigits: 1 })} km</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[9px] leading-4 text-white/24">El cierre se calcula sobre las actividades públicas de Strava del mes calendario ya finalizado.</p>
            </section>
          )}
        </div>
      </main>
    </PublicLayout>
  )
}
