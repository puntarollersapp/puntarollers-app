import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { MiEvolucionContent } from './MiEvolucion'

function savedUser() {
  try { return JSON.parse(localStorage.getItem('pr_user') || '{}') } catch { return {} }
}

function km(meters) {
  return (Number(meters) || 0) / 1000
}

function duration(seconds) {
  const total = Math.max(0, Math.round(Number(seconds) || 0))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  return h ? `${h}h ${m}m` : `${m} min`
}

function dateLabel(value) {
  if (!value) return ''
  const d = new Date(value)
  return d.toLocaleDateString('es-UY', { day: '2-digit', month: 'short' })
}

function timeLabel(value) {
  if (!value) return ''
  const d = new Date(value)
  return d.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })
}

function pctChange(current, previous) {
  if (previous <= 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

function mondayKey(value) {
  const d = new Date(value)
  const utc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const day = utc.getUTCDay() || 7
  utc.setUTCDate(utc.getUTCDate() - day + 1)
  return utc.toISOString().slice(0, 10)
}

function weeklyStreak(rows) {
  const weeks = [...new Set(rows.filter((r) => r.fecha_inicio).map((r) => mondayKey(r.fecha_inicio)))].sort().reverse()
  if (!weeks.length) return 0
  let streak = 1
  let cursor = new Date(`${weeks[0]}T00:00:00Z`)
  for (let i = 1; i < weeks.length; i += 1) {
    const expected = new Date(cursor)
    expected.setUTCDate(expected.getUTCDate() - 7)
    if (weeks[i] !== expected.toISOString().slice(0, 10)) break
    streak += 1
    cursor = expected
  }
  return streak
}

export default function MyActivity() {
  const location = useLocation()
  const { user } = useAuth()
  const base = { ...savedUser(), ...user }
  const profileId = base.id

  const [rows, setRows] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [historyOpen, setHistoryOpen] = useState(false)

  useEffect(() => {
    if (location.hash !== '#evolucion-deportiva') return undefined
    const timer = window.setTimeout(() => {
      document.getElementById('evolucion-deportiva')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 250)
    return () => window.clearTimeout(timer)
  }, [location.hash])

  useEffect(() => {
    let alive = true
    async function load() {
      const [activity, sum] = await Promise.all([
        supabase.from('pr_activities').select('*').eq('alumno_id', profileId).eq('eliminada', false).order('fecha_inicio', { ascending: false }).limit(250),
        supabase.from('pr_activity_summary').select('*').eq('alumno_id', profileId).maybeSingle(),
      ])
      if (!alive) return
      if (!activity.error) setRows(activity.data || [])
      if (!sum.error) setSummary(sum.data || null)
      setLoading(false)
    }
    if (profileId) load()
    return () => { alive = false }
  }, [profileId])

  const stats = useMemo(() => {
    const stravaRows = rows.filter((row) => row.fuente === 'strava')
    const totalKm = rows.reduce((sum, row) => sum + km(row.distancia_metros), 0)
    const totalSeconds = rows.reduce((sum, row) => sum + (Number(row.tiempo_movimiento_segundos) || 0), 0)
    const now = Date.now()
    const day = 86400000
    const recent = (fromDays, toDays = 0) => stravaRows.filter((row) => {
      const age = now - new Date(row.fecha_inicio).getTime()
      return age >= toDays * day && age < fromDays * day
    })
    const this7 = recent(7)
    const prev7 = recent(14, 7)
    const last30 = recent(30)
    const prev30 = recent(60, 30)
    const weekKm = this7.reduce((sum, row) => sum + km(row.distancia_metros), 0)
    const prevWeekKm = prev7.reduce((sum, row) => sum + km(row.distancia_metros), 0)
    const monthKm = last30.reduce((sum, row) => sum + km(row.distancia_metros), 0)
    const prevMonthKm = prev30.reduce((sum, row) => sum + km(row.distancia_metros), 0)
    const longest = stravaRows.reduce((best, row) => !best || km(row.distancia_metros) > km(best.distancia_metros) ? row : best, null)
    const fastest = stravaRows.reduce((best, row) => Number(row.velocidad_promedio_kmh) > Number(best?.velocidad_promedio_kmh || 0) ? row : best, null)
    const streak = weeklyStreak(stravaRows)
    const weekDelta = pctChange(weekKm, prevWeekKm)
    const monthDelta = pctChange(monthKm, prevMonthKm)

    const insights = []
    if (this7.length && prev7.length) {
      if (weekDelta >= 8) insights.push({ icon: '↗', title: 'Tu volumen está subiendo', text: `Esta semana llevás ${weekKm.toFixed(1)} km, ${Math.round(weekDelta)}% más que la anterior.` })
      else if (weekDelta <= -8) insights.push({ icon: '↘', title: 'Semana más liviana', text: `Llevás ${weekKm.toFixed(1)} km, ${Math.abs(Math.round(weekDelta))}% menos que la semana anterior.` })
      else insights.push({ icon: '≈', title: 'Ritmo estable', text: `Tu volumen semanal se mantiene muy parecido al de la semana anterior.` })
    } else if (this7.length) {
      insights.push({ icon: '⚡', title: 'Semana en movimiento', text: `Ya sumaste ${weekKm.toFixed(1)} km en ${this7.length} entrenamiento${this7.length === 1 ? '' : 's'}.` })
    }
    if (streak >= 2) insights.push({ icon: '🔥', title: `${streak} semanas seguidas entrenando`, text: 'Tu constancia ya está formando una racha. Seguí así.' })
    if (longest) insights.push({ icon: '🏁', title: 'Tu sesión más larga', text: `${km(longest.distancia_metros).toFixed(1)} km · ${dateLabel(longest.fecha_inicio)}.` })
    if (fastest && Number(fastest.velocidad_promedio_kmh) > 0) insights.push({ icon: '⚡', title: 'Mejor promedio registrado', text: `${Number(fastest.velocidad_promedio_kmh).toFixed(1)} km/h en ${dateLabel(fastest.fecha_inicio)}.` })

    return { totalKm, totalSeconds, this7, last30, weekKm, monthKm, prevWeekKm, prevMonthKm, weekDelta, monthDelta, streak, longest, fastest, insights: insights.slice(0, 4) }
  }, [rows])

  return (
    <AppLayout title="Mi actividad">
      <div className="pr-page space-y-4 animate-page-enter pb-9">
        <section className="relative overflow-hidden rounded-[32px] border border-red-400/18 bg-gradient-to-br from-[#2a0b0e] via-[#100c10] to-[#07070a] p-5">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-red-500/12 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-red-400 shadow-[0_0_12px_rgba(248,113,113,.8)]"/><p className="text-[9px] font-black uppercase tracking-[.18em] text-red-300">Solo tu entrenamiento</p></div>
            <h1 className="mt-3 font-display text-[36px] leading-[.94] text-white">Tu actividad.<br/><span className="text-red-300">Tu progreso.</span></h1>
            <p className="mt-3 max-w-[290px] text-xs leading-5 text-white/40">Acá vive tu historial deportivo personal. Comunidad es gente; RollerFeed es compartir. Actividad sos vos entrenando.</p>
            <div className="mt-5 grid grid-cols-3 divide-x divide-white/[.07] rounded-[24px] border border-white/[.07] bg-black/25">
              <Metric value={rows.length} label="Sesiones"/>
              <Metric value={stats.totalKm.toLocaleString('es-UY', { maximumFractionDigits: 1 })} label="Km" accent/>
              <Metric value={duration(stats.totalSeconds)} label="Tiempo"/>
            </div>
          </div>
        </section>

        <section className="rounded-[29px] border border-white/[.08] bg-[#0d0d12] p-4">
          <div className="flex items-end justify-between gap-3"><div><p className="text-[8px] font-black uppercase tracking-[.16em] text-red-300">Últimos 30 días</p><h2 className="mt-1 font-display text-[27px] text-white">Ritmo reciente</h2></div><span className="rounded-full border border-red-300/15 bg-red-400/[.07] px-3 py-1 text-[9px] font-black text-red-200">{stats.last30.length} sesiones</span></div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <StatCard title="Esta semana" value={`${stats.weekKm.toFixed(1)} km`} detail={`${stats.this7.length} entrenos${stats.prevWeekKm > 0 ? ` · ${stats.weekDelta >= 0 ? '+' : ''}${Math.round(stats.weekDelta)}%` : ''}`}/>
            <StatCard title="Este mes" value={`${stats.monthKm.toFixed(1)} km`} detail={`${stats.last30.length} entrenos${stats.prevMonthKm > 0 ? ` · ${stats.monthDelta >= 0 ? '+' : ''}${Math.round(stats.monthDelta)}%` : ''}`}/>
          </div>
          <div className="mt-4 rounded-[22px] border border-white/[.06] bg-black/20 p-4"><p className="text-[8px] uppercase tracking-[.13em] text-white/25">Fuente de datos</p><p className="mt-2 text-sm font-bold text-white">Strava + registros PR</p><p className="mt-1 text-[10px] leading-5 text-white/34">Las sesiones sincronizadas conservan distancia, tiempo, velocidad y fecha. Las tomas PR siguen siendo tus marcas oficiales.</p></div>
        </section>

        {stats.insights.length > 0 && <section className="rounded-[30px] border border-emerald-300/15 bg-gradient-to-br from-emerald-400/[.07] via-white/[.02] to-cyan-400/[.04] p-4">
          <div className="flex items-start justify-between gap-3"><div><p className="text-[8px] font-black uppercase tracking-[.18em] text-emerald-300">PR PULSE · ACTUALIZADO SOLO</p><h2 className="mt-1 font-display text-[29px] leading-none text-white">Tu semana te está diciendo algo.</h2></div><span className="rounded-full border border-emerald-300/15 bg-emerald-400/[.07] px-3 py-1 text-[9px] font-black text-emerald-200">LIVE</span></div>
          <div className="mt-4 grid gap-2">{stats.insights.map((item) => <article key={item.title} className="rounded-[22px] border border-white/[.07] bg-black/20 p-4"><div className="flex gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-emerald-300/12 bg-emerald-400/[.07] text-lg">{item.icon}</div><div><p className="text-sm font-black text-white">{item.title}</p><p className="mt-1 text-[10px] leading-5 text-white/38">{item.text}</p></div></div></article>)}</div>
          <p className="mt-3 text-[9px] leading-4 text-white/25">Se recalcula automáticamente con cada nueva actividad sincronizada desde Strava.</p>
        </section>}

        <section id="evolucion-deportiva" className="scroll-mt-24 rounded-[30px] border border-orange-300/15 bg-gradient-to-br from-orange-400/[.07] via-white/[.025] to-violet-400/[.05] p-4"><p className="text-[8px] font-black uppercase tracking-[.18em] text-orange-300">TU CENTRO DE EVOLUCIÓN</p><h2 className="mt-1 font-display text-[29px] leading-none text-white">Actividad, performance y objetivos.</h2><p className="mt-2 text-[10px] leading-5 text-white/36">Tu recorrido deportivo completo vive ahora acá y se organiza solo a medida que llegan nuevas sesiones, tomas, metas y devoluciones.</p></section>

        <MiEvolucionContent embedded />

        <section id="historial-actividad" className="scroll-mt-24">
          <div className="mb-3 flex items-end justify-between gap-3"><div><p className="text-[8px] font-black uppercase tracking-[.16em] text-white/25">Historial</p><h2 className="mt-1 font-display text-[27px] text-white">Últimas sesiones</h2></div><span className="text-[9px] font-black text-orange-300">Strava + PR</span></div>
          <div className="space-y-2">
            {loading ? [0,1,2].map((i) => <div key={i} className="h-24 animate-pulse rounded-[22px] bg-white/[.04]"/>) : rows.length ? (historyOpen ? rows : rows.slice(0, 3)).map((row) => (
              <article key={row.id} className="rounded-[22px] border border-white/[.07] bg-white/[.025] p-4"><div className="flex items-start gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-[16px] border border-red-300/12 bg-red-400/[.07] text-red-300"><ActivityIcon/></div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-black text-white">{row.nombre || row.tipo || 'Entrenamiento'}</p><p className="mt-1 text-[9px] text-white/27">{dateLabel(row.fecha_inicio)} · {timeLabel(row.fecha_inicio)} · {row.fuente === 'strava' ? 'Strava' : 'PR'}</p></div><p className="shrink-0 font-display text-[20px] text-red-300">{km(row.distancia_metros).toFixed(1)} km</p></div><div className="mt-3 flex gap-4 border-t border-white/[.05] pt-2 text-[9px] text-white/34"><span>{duration(row.tiempo_movimiento_segundos)}</span>{Number(row.velocidad_promedio_kmh) > 0 && <span>{Number(row.velocidad_promedio_kmh).toFixed(1)} km/h prom.</span>}</div></div></div></article>
            )) : <div className="rounded-[25px] border border-white/[.08] bg-white/[.025] p-6 text-center"><p className="text-3xl">🛼</p><p className="mt-3 font-bold text-white">La próxima vuelta puede ser la primera de tu historial.</p><p className="mt-1 text-xs leading-5 text-white/30">Conectá Strava desde tu perfil o salí a rodar: cuando llegue la primera sesión, este espacio cobra vida.</p><Link to="/app/perfil" className="mt-4 inline-flex min-h-11 items-center rounded-2xl border border-red-300/15 bg-red-400/[.08] px-4 text-[10px] font-black text-red-200">Revisar conexión Strava →</Link></div>}
            {!loading && rows.length > 3 && <button type="button" onClick={() => setHistoryOpen((value) => !value)} className="min-h-12 w-full rounded-[20px] border border-red-300/15 bg-red-400/[.07] px-4 text-[10px] font-black text-red-200 active:scale-[.99]">{historyOpen ? 'Mostrar solamente las últimas 3 ↑' : `Ver ${rows.length - 3} sesiones más ↓`}</button>}
          </div>
        </section>
      </div>
    </AppLayout>
  )
}

function Metric({ value, label, accent = false }) {
  return <div className="min-w-0 px-2 py-4 text-center"><p className={`truncate font-display text-[24px] leading-none ${accent ? 'text-red-300' : 'text-white'}`}>{value}</p><p className="mt-2 text-[7px] font-black uppercase tracking-[.12em] text-white/25">{label}</p></div>
}

function StatCard({ title, value, detail }) {
  return <div className="rounded-[21px] border border-white/[.06] bg-white/[.025] p-4"><p className="text-[8px] font-black uppercase tracking-[.12em] text-white/25">{title}</p><p className="mt-2 font-display text-[27px] text-white">{value}</p><p className="mt-1 text-[9px] text-white/28">{detail}</p></div>
}

function ActivityIcon() {
  return <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 18V8"/><path d="M9 18v-5"/><path d="M14 18V5"/><path d="M19 18v-8"/><path d="m4 8 5 5 5-8 5 5"/></svg>
}
