import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const RACE_DATE = new Date('2026-11-01T08:00:00-03:00')

function savedUser() {
  try {
    return JSON.parse(localStorage.getItem('pr_user') || '{}')
  } catch {
    return {}
  }
}

function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Math.round(Number(totalSeconds) || 0))
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`
}

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString('es-UY', { day: '2-digit', month: 'short', year: 'numeric' })
}

function normalizeDistance(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  if (n >= 5 && n <= 7) return 6
  if (n >= 10.5 && n <= 13.5) return 12
  return Number(n.toFixed(1))
}

function clamp(n, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Number(n) || 0))
}

function bestFor(takes, distance) {
  const rows = takes.filter((x) => normalizeDistance(x.distancia_km) === distance)
  if (!rows.length) return null
  return rows.reduce((best, row) =>
    Number(row.tiempo_segundos) < Number(best.tiempo_segundos) ? row : best
  )
}

function groupTakes(takes) {
  const map = new Map()
  takes.forEach((row) => {
    const number = Number(row.numero_toma) || 0
    if (!map.has(number)) {
      map.set(number, { numero: number, fecha: row.fecha, devolucion: row.devolucion || '', rows: [] })
    }
    const group = map.get(number)
    group.rows.push(row)
    if (!group.devolucion && row.devolucion) group.devolucion = row.devolucion
  })
  return [...map.values()].sort((a, b) => b.numero - a.numero)
}

function Metric({ value, label, accent = false }) {
  return (
    <div className="min-w-0 px-2 py-3 text-center">
      <p className={`font-display text-[27px] leading-none ${accent ? 'text-orange-300' : 'text-white'}`}>
        {value}
      </p>
      <p className="mt-2 text-[8px] font-black uppercase tracking-[.12em] text-white/28">{label}</p>
    </div>
  )
}

function ProgressBar({ value, tone = 'orange' }) {
  const width = `${clamp(value)}%`
  const cls = tone === 'green'
    ? 'from-emerald-500 to-emerald-300'
    : tone === 'violet'
      ? 'from-violet-500 to-fuchsia-300'
      : 'from-orange-600 to-amber-300'
  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-white/[.07]">
      <div className={`h-full rounded-full bg-gradient-to-r ${cls} transition-all duration-700`} style={{ width }} />
    </div>
  )
}

function EmptyLine({ icon, title, text }) {
  return (
    <div className="rounded-[22px] border border-white/[.07] bg-white/[.025] p-4 flex gap-3">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/[.04] text-xl">{icon}</div>
      <div>
        <p className="text-sm font-bold text-white">{title}</p>
        <p className="mt-1 text-[11px] leading-5 text-white/35">{text}</p>
      </div>
    </div>
  )
}

export default function MiEvolucion() {
  const { user } = useAuth()
  const base = { ...savedUser(), ...user }
  const profileId = base.id

  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [profile, setProfile] = useState(null)
  const [performance, setPerformance] = useState(null)
  const [takes, setTakes] = useState([])
  const [goals, setGoals] = useState([])
  const [summary, setSummary] = useState(null)
  const [activities, setActivities] = useState([])
  const [activityItems, setActivityItems] = useState([])
  const [privateLessons, setPrivateLessons] = useState({ cuponera: null, historial: [] })
  const [historyOpen, setHistoryOpen] = useState(false)

  useEffect(() => {
    let alive = true

    async function load() {
      if (!profileId) {
        setMessage('No encontramos tu perfil PR.')
        setLoading(false)
        return
      }

      setLoading(true)

      const [
        p,
        perf,
        takeRows,
        goalRows,
        sum,
        act,
        legacy,
        lessons,
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', profileId).maybeSingle(),
        supabase.from('pr_performance').select('*').eq('alumno_id', profileId).maybeSingle(),
        supabase.from('pr_performance_tomas_calculadas').select('*').eq('alumno_id', profileId)
          .order('numero_toma', { ascending: false }).order('distancia_km', { ascending: true }),
        supabase.from('pr_performance_objetivos').select('*').eq('alumno_id', profileId)
          .eq('eliminado', false).order('creado_en', { ascending: false }),
        supabase.from('pr_activity_summary').select('*').eq('alumno_id', profileId).maybeSingle(),
        supabase.from('pr_activities').select('*').eq('alumno_id', profileId)
          .eq('eliminada', false).order('fecha_inicio', { ascending: false }).limit(500),
        supabase.from('actividad_pr').select('*').eq('alumno_id', profileId)
          .or('eliminado.is.null,eliminado.eq.false').order('fecha', { ascending: false }),
        supabase.rpc('obtener_mis_particulares'),
      ])

      if (!alive) return

      if (!p.error) setProfile(p.data || null)
      if (!perf.error) setPerformance(perf.data || null)
      if (!takeRows.error) setTakes(takeRows.data || [])
      if (!goalRows.error) setGoals(goalRows.data || [])
      if (!sum.error) setSummary(sum.data || null)
      if (!act.error) setActivities(act.data || [])
      if (!legacy.error) setActivityItems(legacy.data || [])
      if (!lessons.error) {
        setPrivateLessons({
          cuponera: lessons.data?.cuponera || null,
          historial: Array.isArray(lessons.data?.historial) ? lessons.data.historial : [],
        })
      }

      const errors = [p, perf, takeRows, goalRows, sum, act, legacy, lessons]
        .map((x) => x?.error?.message)
        .filter(Boolean)

      if (errors.length >= 5) setMessage('No pudimos cargar tus datos de evolución.')
      setLoading(false)
    }

    load()
    return () => { alive = false }
  }, [profileId])

  const data = useMemo(() => {
    const visibleTakes = takes.filter((x) => x?.eliminado !== true)
    const grouped = groupTakes(visibleTakes)
    const best6 = bestFor(visibleTakes, 6)
    const best12 = bestFor(visibleTakes, 12)

    const byDistance = new Map()
    visibleTakes.forEach((row) => {
      const d = normalizeDistance(row.distancia_km)
      if (!d) return
      if (!byDistance.has(d)) byDistance.set(d, [])
      byDistance.get(d).push(row)
    })

    let featured = normalizeDistance(performance?.distancia_destacada)
    if (!featured || !byDistance.has(featured)) {
      featured = [...byDistance.entries()].sort((a, b) => b[1].length - a[1].length)[0]?.[0] || 0
    }

    const featuredRows = (byDistance.get(featured) || []).sort((a, b) =>
      Number(a.numero_toma) - Number(b.numero_toma)
    )
    const first = featuredRows[0] || null
    const latest = featuredRows.at(-1) || null
    const diff = first && latest
      ? Number(first.tiempo_segundos) - Number(latest.tiempo_segundos)
      : 0
    const improvement = first && diff > 0
      ? (diff / Number(first.tiempo_segundos)) * 100
      : 0

    const kmTotal = activities.reduce((sum, x) => sum + (Number(x.distancia_metros) || 0) / 1000, 0)
    const secondsTotal = activities.reduce((sum, x) => sum + (Number(x.tiempo_movimiento_segundos) || 0), 0)
    const badges = activityItems.filter((x) => x.tipo === 'Insignia')
    const notes = activityItems.filter((x) => x.tipo === 'Nota')
    const events = activityItems.filter((x) => x.tipo === 'Evento')
    const lessonHistory = privateLessons.historial.filter((x) => x?.anulado !== true)
    const classesDone = lessonHistory.filter((x) => x?.tipo === 'clase_dada').length

    const maxSpeed = visibleTakes.reduce((m, x) => Math.max(m, Number(x.velocidad_kmh) || 0), 0)
    const axes = {
      velocidad: clamp((maxSpeed / 30) * 100),
      evolucion: clamp(improvement * 8),
      constancia: clamp(((Number(summary?.actividades_mes) || activities.length) / 12) * 100),
      tecnica: clamp((Number(performance?.tecnica) || 0) * 20),
      resistencia: clamp((Number(performance?.resistencia) || 0) * 20),
    }
    const index = Math.round(Object.values(axes).reduce((a, b) => a + b, 0) / 5)

    const days = Math.max(0, Math.ceil((RACE_DATE.getTime() - Date.now()) / 86400000))
    const preparation = clamp(
      (grouped.length * 9) +
      Math.min(25, kmTotal / 8) +
      (classesDone * 2) +
      (badges.length * 2) +
      (goals.filter((x) => x.estado === 'Completado').length * 8)
    )

    return {
      grouped, best6, best12, featured, first, latest, diff, improvement,
      kmTotal, secondsTotal, badges, notes, events, classesDone, axes, index,
      days, preparation,
    }
  }, [takes, performance, activities, activityItems, privateLessons, summary])

  const activeGoals = goals.filter((g) => ['Activo', 'Pausado'].includes(g.estado))
  const name = profile?.nombre || base.nombre || 'Patinador PR'

  return (
    <AppLayout title="Mi evolución">
      <div className="pr-page space-y-4 animate-page-enter pb-8">
        {loading && (
          <div className="rounded-[24px] border border-orange-400/15 bg-orange-400/[.06] p-4 text-sm text-orange-100/70">
            ⚡ Construyendo tu evolución…
          </div>
        )}

        {message && (
          <div className="rounded-[22px] border border-red-400/15 bg-red-500/[.06] p-4 text-sm text-red-100/70">{message}</div>
        )}

        <section className="relative overflow-hidden rounded-[34px] border border-orange-300/20 bg-gradient-to-br from-[#321407] via-[#100d0d] to-[#07070b] shadow-[0_28px_90px_rgba(249,115,22,.13)]">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-orange-500/15 blur-3xl" />
          <div className="relative p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.2em] text-orange-300">⚡ PR Performance</p>
                <h1 className="mt-3 font-display text-[38px] leading-[.94] text-white">
                  Tu historia<br/><span className="text-orange-300">sobre ruedas.</span>
                </h1>
                <p className="mt-3 max-w-[270px] text-xs leading-5 text-white/42">
                  {name}, acá no competís contra los demás. Medimos tu propia evolución.
                </p>
              </div>
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[20px] border border-orange-300/20 bg-orange-400/10 text-2xl">🛼</div>
            </div>

            <div className="mt-6 grid grid-cols-3 divide-x divide-white/[.07] rounded-[24px] border border-white/[.07] bg-black/25">
              <Metric value={activities.length} label="Entrenos" />
              <Metric value={data.kmTotal.toLocaleString('es-UY', { maximumFractionDigits: 1 })} label="Km" accent />
              <Metric value={data.badges.length} label="Insignias" />
            </div>

            <div className="mt-4 flex items-center justify-between rounded-[20px] border border-white/[.06] bg-white/[.025] px-4 py-3">
              <div>
                <p className="text-[8px] font-black uppercase tracking-[.15em] text-white/28">Índice PR personal</p>
                <p className="mt-1 text-xs text-white/40">Velocidad · evolución · constancia · técnica · resistencia</p>
              </div>
              <div className="text-right">
                <span className="font-display text-3xl text-orange-300">{data.index}</span>
                <span className="text-xs text-white/25">/100</span>
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[32px] border border-orange-300/20 bg-gradient-to-br from-orange-500/[.12] via-[#111014] to-black">
          <div className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.18em] text-orange-300">🏁 Objetivo 2026</p>
                <h2 className="mt-2 font-display text-[30px] leading-none text-white">Camino a Shifter Marathon</h2>
                <p className="mt-2 text-xs text-white/38">1 de noviembre de 2026 · tu preparación en un solo lugar.</p>
              </div>
              <div className="rounded-2xl border border-orange-300/20 bg-orange-400/10 px-3 py-2 text-center">
                <p className="font-display text-2xl text-orange-300">{data.days}</p>
                <p className="text-[7px] font-black uppercase tracking-wider text-white/30">días</p>
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-white">Preparación PR</span>
                <span className="text-xs font-black text-orange-300">{Math.round(data.preparation)}%</span>
              </div>
              <ProgressBar value={data.preparation} />
              <p className="mt-2 text-[9px] leading-4 text-white/25">
                Indicador interno construido con tus registros disponibles: entrenamientos, kilómetros, tomas, clases, metas e insignias.
              </p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <div className="rounded-[22px] border border-white/[.07] bg-black/25 p-4">
                <p className="text-[8px] uppercase tracking-wider text-white/25">Mejor 6K</p>
                <p className="mt-2 font-display text-[26px] text-white">{data.best6 ? formatDuration(data.best6.tiempo_segundos) : '—'}</p>
              </div>
              <div className="rounded-[22px] border border-white/[.07] bg-black/25 p-4">
                <p className="text-[8px] uppercase tracking-wider text-white/25">Mejor 12K</p>
                <p className="mt-2 font-display text-[26px] text-white">{data.best12 ? formatDuration(data.best12.tiempo_segundos) : '—'}</p>
              </div>
              <div className="rounded-[22px] border border-white/[.07] bg-black/25 p-4">
                <p className="text-[8px] uppercase tracking-wider text-white/25">Tomas</p>
                <p className="mt-2 font-display text-[26px] text-white">{data.grouped.length}</p>
              </div>
              <div className="rounded-[22px] border border-white/[.07] bg-black/25 p-4">
                <p className="text-[8px] uppercase tracking-wider text-white/25">Clases registradas</p>
                <p className="mt-2 font-display text-[26px] text-white">{data.classesDone}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/[.08] bg-[#0d0d12] p-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[.18em] text-sky-300">📈 Mis marcas</p>
              <h2 className="mt-2 font-display text-[28px] leading-none text-white">Evolución real</h2>
            </div>
            {data.improvement > 0 && (
              <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-[9px] font-black text-emerald-200">
                +{data.improvement.toFixed(1)}%
              </span>
            )}
          </div>

          {data.grouped.length ? (
            <>
              <div className="mt-5 rounded-[24px] border border-white/[.07] bg-white/[.025] p-4">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[8px] uppercase tracking-wider text-white/25">Distancia destacada</p>
                    <p className="mt-1 font-display text-3xl text-orange-300">{data.featured ? `${data.featured}K` : '—'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] uppercase tracking-wider text-white/25">Mejora acumulada</p>
                    <p className="mt-1 font-display text-2xl text-white">{data.diff > 0 ? `−${formatDuration(data.diff)}` : 'En progreso'}</p>
                  </div>
                </div>
                <div className="mt-4"><ProgressBar value={Math.max(8, data.improvement * 7)} tone="green" /></div>
              </div>

              <div className="mt-4 flex items-end gap-2 rounded-[24px] border border-white/[.06] bg-black/25 px-3 pt-5 pb-3 min-h-[150px]">
                {[...data.grouped].reverse().slice(-6).map((take, idx, arr) => {
                  const record = take.rows.find((x) => normalizeDistance(x.distancia_km) === data.featured) || take.rows[0]
                  const seconds = Number(record?.tiempo_segundos) || 0
                  const all = arr.map((g) => {
                    const r = g.rows.find((x) => normalizeDistance(x.distancia_km) === data.featured) || g.rows[0]
                    return Number(r?.tiempo_segundos) || 0
                  }).filter(Boolean)
                  const max = Math.max(...all, 1)
                  const min = Math.min(...all, max)
                  const quality = max === min ? 65 : 35 + ((max - seconds) / (max - min)) * 60
                  return (
                    <div key={take.numero} className="flex flex-1 flex-col items-center gap-2">
                      <div className="flex h-24 w-full items-end rounded-xl bg-white/[.025] p-1">
                        <div className="w-full rounded-lg bg-gradient-to-t from-orange-600 to-amber-300" style={{ height: `${clamp(quality, 20, 100)}%` }} />
                      </div>
                      <span className="text-[8px] font-bold text-white/28">T{take.numero}</span>
                    </div>
                  )
                })}
              </div>

              <button type="button" onClick={() => setHistoryOpen((x) => !x)}
                className="mt-4 w-full rounded-2xl border border-sky-400/20 bg-sky-400/[.08] py-4 text-sm font-bold text-sky-200">
                {historyOpen ? 'Ocultar historial' : `Ver todas mis tomas (${data.grouped.length})`}
              </button>

              {historyOpen && (
                <div className="mt-3 space-y-2 animate-fade-in">
                  {data.grouped.map((take) => (
                    <div key={take.numero} className="rounded-[22px] border border-white/[.07] bg-white/[.025] p-4">
                      <div className="flex justify-between gap-3">
                        <div>
                          <p className="font-bold text-white">Toma {take.numero}</p>
                          <p className="mt-1 text-[9px] text-white/28">{formatDate(take.fecha)}</p>
                        </div>
                        <div className="text-right">
                          {take.rows.map((row) => (
                            <p key={row.id} className="text-xs font-bold text-orange-200">
                              {normalizeDistance(row.distancia_km)}K · {formatDuration(row.tiempo_segundos)}
                            </p>
                          ))}
                        </div>
                      </div>
                      {take.devolucion && <p className="mt-3 border-t border-white/[.06] pt-3 text-xs leading-5 text-white/45">{take.devolucion}</p>}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="mt-4"><EmptyLine icon="⏱️" title="Tu primera marca todavía está por venir" text="Cuando el equipo PR registre una toma de tiempos, esta sección se construye automáticamente." /></div>
          )}
        </section>

        <section className="rounded-[32px] border border-emerald-400/15 bg-gradient-to-br from-emerald-500/[.09] via-[#0b1110] to-black p-5">
          <p className="text-[9px] font-black uppercase tracking-[.18em] text-emerald-300">🎯 Entrenador PR</p>
          <h2 className="mt-2 font-display text-[28px] text-white">Mi próxima meta</h2>
          {activeGoals.length ? (
            <div className="mt-4 space-y-3">
              {activeGoals.slice(0, 2).map((goal) => {
                const target = Number(goal.tiempo_objetivo_segundos) || 0
                const d = normalizeDistance(goal.distancia_km)
                const best = bestFor(takes, d)
                const current = Number(best?.tiempo_segundos) || 0
                const achieved = Boolean(current && target && current <= target)
                const progress = current && target ? clamp((target / current) * 100, 8, 100) : 0
                return (
                  <div key={goal.id} className="rounded-[24px] border border-emerald-300/15 bg-black/25 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-white">{goal.titulo}</p>
                        <p className="mt-1 text-[10px] text-white/32">{d}K · meta {formatDuration(target)}</p>
                      </div>
                      <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2.5 py-1 text-[8px] font-black uppercase text-emerald-200">
                        {achieved ? 'Alcanzada' : goal.estado}
                      </span>
                    </div>
                    {goal.indicacion && <p className="mt-3 text-xs leading-5 text-white/48">{goal.indicacion}</p>}
                    <div className="mt-4"><ProgressBar value={progress} tone="green" /></div>
                    <p className="mt-2 text-[9px] text-white/25">
                      {current ? `Mejor actual: ${formatDuration(current)}` : 'Esperando una toma comparable'}
                    </p>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="mt-4"><EmptyLine icon="🎯" title="Sin meta activa" text="Cuando tu profe defina un objetivo personalizado, lo vas a ver acá." /></div>
          )}
        </section>

        <section className="rounded-[32px] border border-violet-400/15 bg-gradient-to-br from-violet-500/[.09] via-[#100d16] to-black p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[.18em] text-violet-300">📣 Seguimiento</p>
              <h2 className="mt-2 font-display text-[28px] text-white">Lo que ve tu profe</h2>
              <p className="mt-2 text-xs leading-5 text-white/35">Devoluciones, técnica y resistencia forman parte de tu evolución; no de un ranking público.</p>
            </div>
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-violet-400/10 text-xl">📝</div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-[22px] border border-white/[.06] bg-black/25 p-4">
              <p className="text-[8px] uppercase text-white/25">Técnica</p>
              <p className="mt-2 font-display text-3xl text-white">{Number(performance?.tecnica) || '—'}</p>
              <p className="text-[9px] text-white/25">evaluación PR / 5</p>
            </div>
            <div className="rounded-[22px] border border-white/[.06] bg-black/25 p-4">
              <p className="text-[8px] uppercase text-white/25">Resistencia</p>
              <p className="mt-2 font-display text-3xl text-white">{Number(performance?.resistencia) || '—'}</p>
              <p className="text-[9px] text-white/25">evaluación PR / 5</p>
            </div>
          </div>
          {data.notes[0] ? (
            <div className="mt-3 rounded-[22px] border border-violet-300/15 bg-violet-400/[.06] p-4">
              <p className="text-[8px] font-black uppercase tracking-wider text-violet-200">Última devolución</p>
              <p className="mt-2 text-sm leading-6 text-white/60">{data.notes[0].descripcion || data.notes[0].titulo}</p>
              <p className="mt-2 text-[9px] text-white/25">{formatDate(data.notes[0].fecha)}</p>
            </div>
          ) : (
            <div className="mt-3"><EmptyLine icon="📝" title="Todavía sin devolución" text="Las observaciones de tus profesores aparecerán automáticamente." /></div>
          )}
        </section>

        <section className="rounded-[32px] border border-white/[.08] bg-[#0d0d12] p-5">
          <p className="text-[9px] font-black uppercase tracking-[.18em] text-orange-300">🔥 Constancia</p>
          <h2 className="mt-2 font-display text-[28px] text-white">Todo suma.</h2>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-[22px] border border-white/[.06] bg-white/[.025] p-4">
              <p className="font-display text-3xl text-orange-300">{Number(summary?.actividades_semana) || 0}</p>
              <p className="mt-1 text-[9px] uppercase text-white/28">entrenos esta semana</p>
            </div>
            <div className="rounded-[22px] border border-white/[.06] bg-white/[.025] p-4">
              <p className="font-display text-3xl text-white">{Number(summary?.km_mes || 0).toFixed(1)}</p>
              <p className="mt-1 text-[9px] uppercase text-white/28">km este mes</p>
            </div>
            <div className="rounded-[22px] border border-white/[.06] bg-white/[.025] p-4">
              <p className="font-display text-3xl text-white">{data.events.length}</p>
              <p className="mt-1 text-[9px] uppercase text-white/28">eventos PR</p>
            </div>
            <div className="rounded-[22px] border border-white/[.06] bg-white/[.025] p-4">
              <p className="font-display text-3xl text-white">{data.classesDone}</p>
              <p className="mt-1 text-[9px] uppercase text-white/28">clases registradas</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link to="/app/actividad" className="rounded-2xl border border-orange-300/20 bg-orange-400/[.08] py-4 text-center text-xs font-bold text-orange-200">Ver actividad →</Link>
            <Link to="/app/perfil" className="rounded-2xl border border-white/[.08] bg-white/[.035] py-4 text-center text-xs font-bold text-white/65">Volver a perfil</Link>
          </div>
        </section>

        <p className="px-4 text-center text-[9px] leading-4 text-white/20">
          PR Performance compara tu progreso con vos mismo. Tus datos personales y devoluciones permanecen dentro de tu cuenta.
        </p>
      </div>
    </AppLayout>
  )
}
