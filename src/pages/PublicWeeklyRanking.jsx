import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PublicLayout from '../layouts/PublicLayout'
import { supabase } from '../lib/supabase'

function lower(value) {
  return String(value || '').trim().toLowerCase()
}

function isPublicTraining(activity) {
  if (!activity) return false
  return (
    activity.eliminada !== true &&
    activity.es_privada !== true &&
    activity.privada !== true &&
    activity.privado !== true &&
    activity.visible_feed !== false
  )
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

function shiftDate(value, amount) {
  const d = new Date(`${value}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + amount)
  return d.toISOString().slice(0, 10)
}

function montevideoWeek() {
  const now = new Date()
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Montevideo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
    })
      .formatToParts(now)
      .filter((p) => p.type !== 'literal')
      .map((p) => [p.type, p.value])
  )
  const today = `${parts.year}-${parts.month}-${parts.day}`
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday)
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday
  const start = shiftDate(today, mondayOffset)
  return { start, end: shiftDate(start, 6) }
}

function shortDate(value) {
  return new Intl.DateTimeFormat('es-UY', {
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(`${value}T12:00:00Z`))
}

export default function PublicWeeklyRanking() {
  const week = useMemo(() => montevideoWeek(), [])
  const [loading, setLoading] = useState(true)
  const [ranking, setRanking] = useState([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setMessage('')
      try {
        const [profilesResponse, activitiesResponse] = await Promise.all([
          supabase.from('profiles_feed').select('*').limit(500),
          supabase
            .from('pr_activities')
            .select('*')
            .eq('eliminada', false)
            .gte('fecha_inicio', `${week.start}T00:00:00-03:00`)
            .lte('fecha_inicio', `${week.end}T23:59:59-03:00`)
            .order('fecha_inicio', { ascending: false })
            .limit(500),
        ])

        if (!active) return
        if (activitiesResponse.error) throw activitiesResponse.error

        const profiles = buildProfileMap(profilesResponse.data || [])
        const grouped = new Map()

        ;(activitiesResponse.data || [])
          .filter(isPublicTraining)
          .filter((row) => lower(row.fuente || 'strava') === 'strava')
          .forEach((row) => {
            const id = String(row.alumno_id || '')
            if (!id) return
            const distance = Math.max(0, Number(row.distancia_metros) || 0) / 1000
            if (!distance) return
            const current = grouped.get(id) || { alumnoId: id, km: 0, sessions: 0 }
            current.km += distance
            current.sessions += 1
            grouped.set(id, current)
          })

        const rows = [...grouped.values()]
          .map((entry) => {
            const profile = profiles.get(entry.alumnoId) || {}
            return {
              ...entry,
              name: profileName(profile),
              photo: profilePhoto(profile),
            }
          })
          .sort((a, b) => b.km - a.km || b.sessions - a.sessions || a.name.localeCompare(b.name))
          .slice(0, 3)

        setRanking(rows)
      } catch (error) {
        if (!active) return
        setMessage('No pudimos cargar el ranking semanal en este momento.')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => { active = false }
  }, [week.start, week.end])

  const medals = ['🥇', '🥈', '🥉']

  return (
    <PublicLayout>
      <main className="min-h-screen bg-[#050508] px-4 pb-14 pt-5 text-white">
        <div className="mx-auto w-full max-w-2xl space-y-5">
          <section className="relative overflow-hidden rounded-[32px] border border-orange-400/20 bg-gradient-to-br from-[#2b1307] via-[#0d0b0b] to-[#050507] p-6 shadow-[0_30px_90px_rgba(249,115,22,.12)]">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-orange-500/15 blur-3xl" />
            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[.22em] text-orange-300">🏆 PR · STRAVA</p>
                  <h1 className="mt-3 text-[38px] font-black leading-[.95] tracking-[-.04em]">Ranking<br/><span className="text-orange-400">de la semana.</span></h1>
                </div>
                <Link to="/rollerfeed" className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[.04]">←</Link>
              </div>
              <p className="mt-4 max-w-md text-sm leading-6 text-white/45">Kilómetros públicos sincronizados desde Strava. Se reinicia cada lunes y se actualiza solo.</p>
              <div className="mt-5 inline-flex rounded-full border border-white/10 bg-black/25 px-3 py-2 text-[10px] font-black uppercase tracking-[.14em] text-white/45">{shortDate(week.start)} → {shortDate(week.end)}</div>
            </div>
          </section>

          <section className="rounded-[30px] border border-white/[.08] bg-[#0b0c10] p-4 sm:p-5">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.18em] text-orange-300">TOP 3</p>
                <h2 className="mt-1 text-2xl font-black">Los que más rodaron</h2>
              </div>
              <span className="rounded-full border border-emerald-400/15 bg-emerald-400/[.07] px-3 py-1 text-[9px] font-black text-emerald-300">EN VIVO</span>
            </div>

            {loading ? (
              <div className="space-y-3">{[0,1,2].map((i) => <div key={i} className="h-24 animate-pulse rounded-[22px] bg-white/[.04]" />)}</div>
            ) : message ? (
              <div className="rounded-[22px] border border-amber-400/15 bg-amber-400/[.06] p-5 text-sm text-amber-100/70">{message}</div>
            ) : ranking.length ? (
              <div className="space-y-3">
                {ranking.map((row, index) => (
                  <article key={row.alumnoId} className={`relative overflow-hidden rounded-[24px] border p-4 ${index === 0 ? 'border-amber-300/25 bg-amber-400/[.07]' : 'border-white/[.08] bg-white/[.025]'}`}>
                    {index === 0 && <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-amber-300/10 blur-2xl" />}
                    <div className="relative flex items-center gap-3">
                      <div className="text-3xl">{medals[index]}</div>
                      {row.photo ? <img src={row.photo} alt="" className="h-12 w-12 rounded-full border border-white/10 object-cover" /> : <div className="grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-white/[.05] text-lg">🛼</div>}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-white">{row.name}</p>
                        <p className="mt-1 text-[10px] text-white/30">{row.sessions} entreno{row.sessions === 1 ? '' : 's'} esta semana</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-orange-300">{row.km.toLocaleString('es-UY', { maximumFractionDigits: 1 })}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/25">KM</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-[24px] border border-white/[.08] bg-white/[.025] p-7 text-center"><p className="text-3xl">🛼</p><p className="mt-3 font-black">Todavía no hay kilómetros públicos esta semana.</p><p className="mt-2 text-xs leading-5 text-white/35">En cuanto entren actividades de Strava compartidas con RollerFeed, el podio aparece automáticamente.</p></div>
            )}
          </section>

          <div className="rounded-[22px] border border-white/[.07] bg-white/[.025] p-4 text-[10px] leading-5 text-white/32">Solo se contabilizan entrenamientos de Strava visibles públicamente en RollerFeed. Las métricas privadas, tiempos oficiales PR y datos de contacto nunca aparecen en este ranking.</div>
        </div>
      </main>
    </PublicLayout>
  )
}
