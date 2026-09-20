import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

const REFRESH_MS = 60000

function lower(value) {
  return String(value || '').trim().toLowerCase()
}

function initials(name) {
  return String(name || 'PR')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'PR'
}

function profileName(profile) {
  return (
    profile?.nombre_completo ||
    profile?.display_name ||
    [profile?.nombre, profile?.apellido].filter(Boolean).join(' ') ||
    'Integrante PR'
  )
}

function profilePhoto(profile) {
  return (
    profile?.foto_url ||
    profile?.photo_url ||
    profile?.avatar_url ||
    profile?.foto ||
    profile?.avatar ||
    ''
  )
}

function buildProfileMap(profiles) {
  const map = new Map()
  ;(profiles || []).forEach((profile) => {
    if (profile?.id) map.set(String(profile.id), profile)
    if (profile?.auth_user_id) map.set(String(profile.auth_user_id), profile)
  })
  return map
}

function montevideoToday() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Montevideo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
    })
      .formatToParts(new Date())
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value])
  )

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    weekday: parts.weekday,
    year: Number(parts.year),
    month: Number(parts.month),
  }
}

function shiftDate(value, amount) {
  const date = new Date(`${value}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + amount)
  return date.toISOString().slice(0, 10)
}

function ranges() {
  const now = montevideoToday()
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(now.weekday)
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday
  return {
    week: { start: shiftDate(now.date, mondayOffset), end: now.date },
    month: {
      start: `${now.year}-${String(now.month).padStart(2, '0')}-01`,
      end: now.date,
    },
  }
}

function insideRange(value, range) {
  const stamp = new Date(value).getTime()
  if (!Number.isFinite(stamp)) return false
  const start = new Date(`${range.start}T00:00:00-03:00`).getTime()
  const end = new Date(`${range.end}T23:59:59-03:00`).getTime()
  return stamp >= start && stamp <= end
}

function validActivity(activity) {
  return (
    activity &&
    activity.eliminada !== true &&
    activity.es_privada !== true &&
    activity.visible_feed !== false &&
    lower(activity.fuente || 'strava') === 'strava'
  )
}

function makeRanking(rows, profiles, range) {
  const grouped = new Map()

  ;(rows || [])
    .filter(validActivity)
    .filter((row) => insideRange(row.fecha_inicio, range))
    .forEach((row) => {
      const id = String(row.alumno_id || '')
      const km = Math.max(0, Number(row.distancia_metros) || 0) / 1000
      if (!id || !km) return
      const current = grouped.get(id) || { id, km: 0, sessions: 0 }
      current.km += km
      current.sessions += 1
      grouped.set(id, current)
    })

  return [...grouped.values()]
    .map((entry) => {
      const profile = profiles.get(entry.id) || {}
      return {
        ...entry,
        name: profileName(profile),
        photo: profilePhoto(profile),
      }
    })
    .sort((a, b) => b.km - a.km || b.sessions - a.sessions || a.name.localeCompare(b.name))
}

function findFeedList() {
  const candidates = [...document.querySelectorAll('div.space-y-4')]
  return candidates.find((node) => node.querySelector('article, section, [class*="rounded-"]')) || null
}

function Avatar({ row, first = false }) {
  const size = first ? 'h-16 w-16' : 'h-14 w-14'
  if (row?.photo) {
    return <img src={row.photo} alt={row.name} className={`${size} rounded-full border-2 border-white/15 object-cover`} />
  }
  return (
    <div className={`${size} grid place-items-center rounded-full border-2 border-white/10 bg-gradient-to-br from-orange-400/25 to-violet-500/20 text-sm font-black`}>
      {initials(row?.name)}
    </div>
  )
}

function Place({ row, rank, status }) {
  if (!row) return <div className="min-w-0" />
  const first = rank === 1
  return (
    <div className={`flex min-w-0 flex-col items-center rounded-[20px] border px-2 pb-3 pt-4 text-center ${first ? '-translate-y-2 border-amber-300/25 bg-gradient-to-b from-amber-300/[.14] to-white/[.02]' : 'border-white/[.07] bg-white/[.025]'}`}>
      <div className="relative">
        {first && <div className="absolute -inset-5 rounded-full bg-amber-300/12 blur-2xl" />}
        <div className="relative"><Avatar row={row} first={first} /></div>
        <span className={`absolute -bottom-2 left-1/2 grid -translate-x-1/2 place-items-center rounded-full border-2 border-[#0b0c10] font-black ${rank === 1 ? 'h-7 w-7 bg-amber-300 text-black' : rank === 2 ? 'h-6 w-6 bg-slate-200 text-black' : 'h-6 w-6 bg-orange-700 text-white'}`}>
          {rank}
        </span>
      </div>
      <p className="mt-4 w-full truncate text-[11px] font-black">{row.name.split(' ')[0]}</p>
      <p className={`mt-1 text-base font-black ${first ? 'text-amber-300' : 'text-white'}`}>
        {row.km.toLocaleString('es-UY', { maximumFractionDigits: 1 })} km
      </p>
      <p className="mt-1 text-[8px] uppercase tracking-[.1em] text-white/25">
        {row.sessions} entreno{row.sessions === 1 ? '' : 's'}
      </p>
      {status ? <p className="mt-2 w-full break-words rounded-xl border border-white/[.07] bg-black/25 px-2 py-2 text-[9px] font-bold leading-3 text-white/60">“{status}”</p> : null}
    </div>
  )
}

export default function RollerFeedPinnedPodium() {
  const { user } = useAuth()
  const [host, setHost] = useState(null)
  const [period, setPeriod] = useState('month')
  const [rankings, setRankings] = useState({ week: [], month: [] })
  const [lastUpdated, setLastUpdated] = useState(null)
  const [statuses, setStatuses] = useState({})
  const [statusDraft, setStatusDraft] = useState('')
  const [savingStatus, setSavingStatus] = useState(false)

  useEffect(() => {
    const node = document.createElement('div')
    node.setAttribute('data-pr-pinned-ranking', 'true')
    setHost(node)

    function placeHost() {
      const feedList = findFeedList()
      if (!feedList) return
      if (feedList.firstChild !== node) feedList.insertBefore(node, feedList.firstChild)
    }

    placeHost()
    const observer = new MutationObserver(placeHost)
    observer.observe(document.body, { childList: true, subtree: true })
    const timer = window.setInterval(placeHost, 1200)

    return () => {
      observer.disconnect()
      window.clearInterval(timer)
      node.remove()
    }
  }, [])

  useEffect(() => {
    let active = true

    async function load() {
      const [profilesResponse, activitiesResponse, statusesResponse] = await Promise.all([
        supabase.from('profiles_feed').select('*').limit(500),
        supabase
          .from('pr_activities')
          .select('*')
          .eq('eliminada', false)
          .order('fecha_inicio', { ascending: false })
          .limit(1000),
        supabase.from('pr_ranking_statuses').select('alumno_id,status_text,updated_at'),
      ])

      if (!active || activitiesResponse.error) return

      const profiles = buildProfileMap(profilesResponse.data || [])
      const currentRanges = ranges()
      const activities = activitiesResponse.data || []

      setStatuses(Object.fromEntries((statusesResponse.data || []).map((row) => [String(row.alumno_id), row.status_text || ''])))
      setRankings({
        week: makeRanking(activities, profiles, currentRanges.week),
        month: makeRanking(activities, profiles, currentRanges.month),
      })
      setLastUpdated(new Date())
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

  async function saveStatus() {
    const profileId = String(user?.id || '')
    if (!profileId || savingStatus) return
    const clean = statusDraft.trim().slice(0, 80)
    setSavingStatus(true)
    const { error } = await supabase
      .from('pr_ranking_statuses')
      .upsert({ alumno_id: profileId, status_text: clean, updated_at: new Date().toISOString() }, { onConflict: 'alumno_id' })
    if (!error) setStatuses((current) => ({ ...current, [profileId]: clean }))
    setSavingStatus(false)
  }

  const ranking = rankings[period] || []
  const myProfileId = String(user?.id || '')
  const myRank = ranking.findIndex((row) => String(row.id) === myProfileId) + 1
  const canPostStatus = myRank > 0

  useEffect(() => {
    if (myProfileId) setStatusDraft(statuses[myProfileId] || '')
  }, [myProfileId, statuses])

  const stats = useMemo(() => {
    const totalKm = ranking.reduce((sum, row) => sum + row.km, 0)
    const fourth = ranking[3] || null
    const third = ranking[2] || null
    return {
      totalKm,
      fourth,
      gap: fourth && third ? Math.max(0, third.km - fourth.km) : null,
    }
  }, [ranking])

  if (!host) return null

  return createPortal(
    <div className="pb-1 pt-1">
      <article className="relative overflow-hidden rounded-[30px] border border-amber-300/25 bg-[radial-gradient(circle_at_80%_0%,rgba(124,58,237,.22),transparent_40%),linear-gradient(135deg,#2a1802,#0c0d12_48%,#0e0715)] p-5 shadow-[0_24px_80px_rgba(0,0,0,.42)]">
        <div className="pointer-events-none absolute -left-16 top-20 h-44 w-44 rounded-full border border-orange-500/10" />

        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-orange-300/20 bg-orange-400/[.10] px-3 py-1 text-[8px] font-black uppercase tracking-[.16em] text-orange-100">
              📌 DESTACADO
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/15 bg-emerald-400/[.08] px-3 py-1 text-[8px] font-black uppercase tracking-[.16em] text-emerald-200">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" /> EN VIVO
            </span>
          </div>

          <p className="mt-4 text-[9px] font-black uppercase tracking-[.20em] text-amber-300">🏆 PR KM CHALLENGE · STRAVA</p>
          <div className="mt-1 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-[32px] leading-none text-white">TOP RANKING PR.</h2>
              <p className="mt-2 text-[10px] font-black uppercase tracking-[.08em] text-white/35">
                Cada kilómetro público suma
              </p>
            </div>
            <span className="text-3xl">⚡</span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 rounded-[18px] border border-white/[.08] bg-black/25 p-1.5">
            <button
              type="button"
              onClick={() => setPeriod('week')}
              className={`rounded-[14px] px-3 py-3 text-[9px] font-black transition ${period === 'week' ? 'bg-gradient-to-r from-amber-300 to-orange-400 text-black' : 'text-white/40'}`}
            >
              ESTA SEMANA
            </button>
            <button
              type="button"
              onClick={() => setPeriod('month')}
              className={`rounded-[14px] px-3 py-3 text-[9px] font-black transition ${period === 'month' ? 'bg-gradient-to-r from-violet-400 to-fuchsia-400 text-black' : 'text-white/40'}`}
            >
              ESTE MES
            </button>
          </div>

          {ranking.length ? (
            <>
              <div className="mt-6 grid grid-cols-3 items-end gap-2">
                <Place row={ranking[1]} rank={2} status={statuses[String(ranking[1]?.id)]} />
                <Place row={ranking[0]} rank={1} status={statuses[String(ranking[0]?.id)]} />
                <Place row={ranking[2]} rank={3} status={statuses[String(ranking[2]?.id)]} />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-[18px] border border-white/[.07] bg-black/20 p-3">
                  <p className="text-[8px] font-black uppercase tracking-[.14em] text-white/25">KM EN JUEGO</p>
                  <p className="mt-1 text-lg font-black text-orange-300">
                    {stats.totalKm.toLocaleString('es-UY', { maximumFractionDigits: 1 })} km
                  </p>
                  <p className="mt-1 text-[9px] text-white/28">{ranking.length} rollers sumando</p>
                </div>

                <div className="rounded-[18px] border border-white/[.07] bg-black/20 p-3">
                  <p className="text-[8px] font-black uppercase tracking-[.14em] text-white/25">
                    {stats.fourth ? '#4 ACECHA EL PODIO' : 'TABLA ABIERTA'}
                  </p>
                  <p className="mt-1 truncate text-sm font-black">
                    {stats.fourth ? stats.fourth.name.split(' ')[0] : 'Tu próxima salida suma'}
                  </p>
                  <p className="mt-1 text-[9px] text-white/28">
                    {stats.fourth && stats.gap !== null
                      ? `a ${stats.gap.toLocaleString('es-UY', { maximumFractionDigits: 1 })} km del #3`
                      : 'Cada kilómetro cuenta'}
                  </p>
                </div>
              </div>


              {canPostStatus && (
                <div className="mt-4 rounded-[18px] border border-violet-300/15 bg-violet-400/[.06] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-[.14em] text-violet-200">TU ESTADO EN EL RANKING</p>
                      <p className="mt-1 text-[9px] text-white/30">Estás #{myRank}. Dejá tu mensaje para la tabla.</p>
                    </div>
                    <span className="text-lg">💬</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <input
                      value={statusDraft}
                      onChange={(event) => setStatusDraft(event.target.value.slice(0, 80))}
                      onKeyDown={(event) => { if (event.key === 'Enter') saveStatus() }}
                      placeholder="Ej: En sus caras, bitches 😎"
                      maxLength={80}
                      className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white outline-none placeholder:text-white/20 focus:border-violet-300/35"
                    />
                    <button
                      type="button"
                      onClick={saveStatus}
                      disabled={savingStatus}
                      className="rounded-xl bg-violet-300 px-3 text-[9px] font-black text-black disabled:opacity-50"
                    >
                      {savingStatus ? '...' : 'PUBLICAR'}
                    </button>
                  </div>
                  <p className="mt-2 text-right text-[8px] text-white/20">{statusDraft.length}/80</p>
                </div>
              )}

              <Link
                to={`/ranking-semanal?period=${period}`}
                className="mt-4 flex min-h-12 items-center justify-between rounded-[16px] bg-gradient-to-r from-amber-300 via-orange-400 to-orange-500 px-4 text-xs font-black text-black shadow-[0_12px_34px_rgba(249,115,22,.16)]"
              >
                <span>VER CLASIFICACIÓN COMPLETA</span>
                <span className="text-lg">→</span>
              </Link>
            </>
          ) : (
            <div className="mt-5 rounded-[20px] border border-white/[.07] bg-white/[.025] p-5 text-center text-xs text-white/35">
              Todavía no hay kilómetros públicos cargados para este período.
            </div>
          )}

          <p className="mt-3 text-center text-[8px] text-white/20">
            {lastUpdated
              ? `Actualizado ${lastUpdated.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })} · Strava`
              : 'Actualizando ranking…'}
          </p>
        </div>
      </article>
    </div>,
    host
  )
}
