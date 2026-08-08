import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

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

export default function MyActivity() {
  const { user } = useAuth()
  const base = { ...savedUser(), ...user }
  const profileId = base.id

  const [rows, setRows] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true

    async function load() {
      const [activity, sum] = await Promise.all([
        supabase.from('pr_activities')
          .select('*')
          .eq('alumno_id', profileId)
          .eq('eliminada', false)
          .order('fecha_inicio', { ascending: false })
          .limit(250),
        supabase.from('pr_activity_summary')
          .select('*')
          .eq('alumno_id', profileId)
          .maybeSingle(),
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
    const totalKm = rows.reduce((sum, row) => sum + km(row.distancia_metros), 0)
    const totalSeconds = rows.reduce((sum, row) => sum + (Number(row.tiempo_movimiento_segundos) || 0), 0)
    const now = Date.now()
    const last7 = rows.filter((row) => now - new Date(row.fecha_inicio).getTime() <= 7 * 86400000)
    const last30 = rows.filter((row) => now - new Date(row.fecha_inicio).getTime() <= 30 * 86400000)
    return {
      totalKm,
      totalSeconds,
      last7,
      last30,
      weekKm: last7.reduce((sum, row) => sum + km(row.distancia_metros), 0),
      monthKm: last30.reduce((sum, row) => sum + km(row.distancia_metros), 0),
    }
  }, [rows])

  return (
    <AppLayout title="Mi actividad">
      <div className="pr-page space-y-4 animate-page-enter pb-9">
        <section className="relative overflow-hidden rounded-[32px] border border-red-400/18 bg-gradient-to-br from-[#2a0b0e] via-[#100c10] to-[#07070a] p-5">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-red-500/12 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-400 shadow-[0_0_12px_rgba(248,113,113,.8)]"/>
              <p className="text-[9px] font-black uppercase tracking-[.18em] text-red-300">Solo tu entrenamiento</p>
            </div>
            <h1 className="mt-3 font-display text-[36px] leading-[.94] text-white">Tu actividad.<br/><span className="text-red-300">Tu progreso.</span></h1>
            <p className="mt-3 max-w-[290px] text-xs leading-5 text-white/40">
              Acá vive tu historial deportivo personal. Comunidad es gente; RollerFeed es compartir. Actividad sos vos entrenando.
            </p>

            <div className="mt-5 grid grid-cols-3 divide-x divide-white/[.07] rounded-[24px] border border-white/[.07] bg-black/25">
              <Metric value={rows.length} label="Sesiones"/>
              <Metric value={stats.totalKm.toLocaleString('es-UY', { maximumFractionDigits: 1 })} label="Km" accent/>
              <Metric value={duration(stats.totalSeconds)} label="Tiempo"/>
            </div>
          </div>
        </section>

        <section className="rounded-[29px] border border-white/[.08] bg-[#0d0d12] p-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[8px] font-black uppercase tracking-[.16em] text-red-300">Últimos 30 días</p>
              <h2 className="mt-1 font-display text-[27px] text-white">Ritmo reciente</h2>
            </div>
            <span className="rounded-full border border-red-300/15 bg-red-400/[.07] px-3 py-1 text-[9px] font-black text-red-200">{stats.last30.length} sesiones</span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <StatCard title="Esta semana" value={`${stats.weekKm.toFixed(1)} km`} detail={`${stats.last7.length} entrenos`}/>
            <StatCard title="Este mes" value={`${stats.monthKm.toFixed(1)} km`} detail={`${stats.last30.length} entrenos`}/>
          </div>

          <div className="mt-4 rounded-[22px] border border-white/[.06] bg-black/20 p-4">
            <p className="text-[8px] uppercase tracking-[.13em] text-white/25">Fuente de datos</p>
            <p className="mt-2 text-sm font-bold text-white">Strava + registros PR</p>
            <p className="mt-1 text-[10px] leading-5 text-white/34">
              Las sesiones sincronizadas conservan distancia, tiempo, velocidad y fecha. Esta pantalla no muestra amigos, solicitudes ni publicaciones.
            </p>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-[8px] font-black uppercase tracking-[.16em] text-white/25">Historial</p>
              <h2 className="mt-1 font-display text-[27px] text-white">Últimas sesiones</h2>
            </div>
            <Link to="/app/evolucion" className="text-[9px] font-black text-orange-300">Mi evolución →</Link>
          </div>

          <div className="space-y-2">
            {loading ? (
              [0,1,2].map((i) => <div key={i} className="h-24 animate-pulse rounded-[22px] bg-white/[.04]"/>)
            ) : rows.length ? rows.slice(0, 15).map((row) => (
              <article key={row.id} className="rounded-[22px] border border-white/[.07] bg-white/[.025] p-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[16px] border border-red-300/12 bg-red-400/[.07] text-red-300">
                    <ActivityIcon/>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-white">{row.nombre || row.tipo || 'Entrenamiento'}</p>
                        <p className="mt-1 text-[9px] text-white/27">{dateLabel(row.fecha_inicio)} · {timeLabel(row.fecha_inicio)} · {row.fuente === 'strava' ? 'Strava' : 'PR'}</p>
                      </div>
                      <p className="shrink-0 font-display text-[20px] text-red-300">{km(row.distancia_metros).toFixed(1)} km</p>
                    </div>

                    <div className="mt-3 flex gap-4 border-t border-white/[.05] pt-2 text-[9px] text-white/34">
                      <span>{duration(row.tiempo_movimiento_segundos)}</span>
                      {Number(row.velocidad_promedio_kmh) > 0 && <span>{Number(row.velocidad_promedio_kmh).toFixed(1)} km/h prom.</span>}
                    </div>
                  </div>
                </div>
              </article>
            )) : (
              <div className="rounded-[25px] border border-white/[.08] bg-white/[.025] p-6 text-center">
                <p className="text-3xl">🛼</p>
                <p className="mt-3 font-bold text-white">Todavía no hay sesiones</p>
                <p className="mt-1 text-xs text-white/30">Cuando sincronices o registres actividad, aparecerá acá.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </AppLayout>
  )
}

function Metric({ value, label, accent = false }) {
  return <div className="min-w-0 px-2 py-4 text-center">
    <p className={`truncate font-display text-[24px] leading-none ${accent ? 'text-red-300' : 'text-white'}`}>{value}</p>
    <p className="mt-2 text-[7px] font-black uppercase tracking-[.12em] text-white/25">{label}</p>
  </div>
}

function StatCard({ title, value, detail }) {
  return <div className="rounded-[21px] border border-white/[.06] bg-white/[.025] p-4">
    <p className="text-[8px] font-black uppercase tracking-[.12em] text-white/25">{title}</p>
    <p className="mt-2 font-display text-[27px] text-white">{value}</p>
    <p className="mt-1 text-[9px] text-white/28">{detail}</p>
  </div>
}

function ActivityIcon() {
  return <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 18V8"/><path d="M9 18v-5"/><path d="M14 18V5"/><path d="M19 18v-8"/><path d="m4 8 5 5 5-8 5 5"/>
  </svg>
}
