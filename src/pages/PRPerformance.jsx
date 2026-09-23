import { useEffect, useMemo, useState } from 'react'
import AppLayout from '../layouts/AppLayout'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

const DAY = 86400000

function fmtKm(value) {
  return Number(value || 0).toLocaleString('es-UY', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
}

function fmtDuration(seconds) {
  const total = Math.max(0, Number(seconds) || 0)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  return hours ? hours + 'h ' + String(minutes).padStart(2, '0') + 'm' : minutes + ' min'
}

function fmtDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('es-UY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Montevideo',
  }).format(new Date(value))
}

function speedKmh(ms) {
  return (Number(ms) || 0) * 3.6
}

function profileName(profile) {
  return [profile?.nombre, profile?.apellido].filter(Boolean).join(' ') || 'Alumno PR'
}

function groupNames(profile) {
  const info = Array.isArray(profile?.grupos_info) ? profile.grupos_info : []
  return info.map((item) => String(item?.titulo || item?.nombre || '').trim()).filter(Boolean)
}

function periodStart(period) {
  const now = Date.now()
  if (period === '7d') return new Date(now - 7 * DAY)
  if (period === '30d') return new Date(now - 30 * DAY)
  if (period === '90d') return new Date(now - 90 * DAY)
  if (period === '180d') return new Date(now - 180 * DAY)
  if (period === '365d') return new Date(now - 365 * DAY)
  return new Date('2020-01-01T00:00:00Z')
}

function csvEscape(value) {
  const text = String(value ?? '')
  const quote =
    text.includes(',') ||
    text.includes('"') ||
    text.includes(String.fromCharCode(10)) ||
    text.includes(String.fromCharCode(13))
  return quote ? '"' + text.replaceAll('"', '""') + '"' : text
}

function downloadCsv(filename, rows) {
  const content = rows.map((row) => row.map(csvEscape).join(',')).join(String.fromCharCode(10))
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function Metric({ label, value, sub }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/[.035] p-4">
      <p className="text-[9px] font-black uppercase tracking-[.18em] text-white/30">{label}</p>
      <p className="mt-2 text-2xl font-black tracking-[-.03em]">{value}</p>
      {sub ? <p className="mt-1 text-[10px] text-white/35">{sub}</p> : null}
    </div>
  )
}

function activityMetrics(rows) {
  const km = rows.reduce((sum, row) => sum + (Number(row.distancia_metros) || 0) / 1000, 0)
  const seconds = rows.reduce((sum, row) => sum + (Number(row.tiempo_movimiento_segundos) || 0), 0)
  const elevation = rows.reduce((sum, row) => sum + (Number(row.desnivel_metros) || 0), 0)
  const speedRows = rows.filter((row) => Number(row.velocidad_media_ms) > 0)
  const heartRows = rows.filter((row) => Number(row.frecuencia_cardiaca_media) > 0)
  const avgSpeed = speedRows.length
    ? speedRows.reduce((sum, row) => sum + speedKmh(row.velocidad_media_ms), 0) / speedRows.length
    : 0
  const maxSpeed = Math.max(0, ...rows.map((row) => speedKmh(row.velocidad_maxima_ms)))
  const avgHeart = heartRows.length
    ? heartRows.reduce((sum, row) => sum + Number(row.frecuencia_cardiaca_media), 0) / heartRows.length
    : 0
  return { km, seconds, elevation, avgSpeed, maxSpeed, avgHeart, sessions: rows.length }
}

export default function PRPerformance() {
  const { user } = useAuth()
  const [profiles, setProfiles] = useState([])
  const [activities, setActivities] = useState([])
  const [tasks, setTasks] = useState([])
  const [results, setResults] = useState([])
  const [notes, setNotes] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [group, setGroup] = useState('ALL')
  const [period, setPeriod] = useState('30d')
  const [query, setQuery] = useState('')
  const [note, setNote] = useState('')
  const [visibility, setVisibility] = useState('staff')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [printScope, setPrintScope] = useState('')

  async function load() {
    setLoading(true)
    setMessage('')

    const [profileResult, activityResult, taskResult, resultResult, noteResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('id,nombre,apellido,foto,role,participa_como_alumno,grupos_info,estado')
        .order('nombre'),
      supabase
        .from('pr_inline_skate_activities')
        .select('id,alumno_id,nombre,fecha_inicio,distancia_metros,tiempo_movimiento_segundos,tiempo_total_segundos,desnivel_metros,velocidad_media_ms,velocidad_maxima_ms,frecuencia_cardiaca_media,frecuencia_cardiaca_maxima,es_privada')
        .order('fecha_inicio', { ascending: false })
        .limit(5000),
      supabase.from('pr_training_tasks').select('*').eq('active', true).order('sort_order'),
      supabase.from('pr_training_task_results').select('*').order('updated_at', { ascending: false }).limit(5000),
      supabase.from('pr_performance_notes').select('*').order('created_at', { ascending: false }).limit(1000),
    ])

    const error =
      profileResult.error ||
      activityResult.error ||
      taskResult.error ||
      resultResult.error ||
      noteResult.error

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    const students = (profileResult.data || []).filter(
      (profile) => profile.role === 'alumno' || profile.participa_como_alumno === true
    )

    setProfiles(students)
    setActivities(activityResult.data || [])
    setTasks(taskResult.data || [])
    setResults(resultResult.data || [])
    setNotes(noteResult.data || [])

    if (!selectedId && students[0]?.id) setSelectedId(students[0].id)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    const done = () => setPrintScope('')
    window.addEventListener('afterprint', done)
    return () => window.removeEventListener('afterprint', done)
  }, [])

  const allGroups = useMemo(
    () => [...new Set(profiles.flatMap(groupNames))].sort((a, b) => a.localeCompare(b, 'es')),
    [profiles]
  )

  const visibleProfiles = useMemo(() => {
    const clean = query.trim().toLowerCase()
    return profiles.filter((profile) => {
      const matchesGroup = group === 'ALL' || groupNames(profile).includes(group)
      const matchesText = !clean || profileName(profile).toLowerCase().includes(clean)
      return matchesGroup && matchesText
    })
  }, [profiles, group, query])

  const selected =
    profiles.find((profile) => profile.id === selectedId) ||
    visibleProfiles[0] ||
    profiles[0]

  const start = useMemo(() => periodStart(period), [period])

  const selectedActivities = useMemo(
    () =>
      activities.filter(
        (activity) =>
          activity.alumno_id === selected?.id &&
          new Date(activity.fecha_inicio) >= start
      ),
    [activities, selected?.id, start]
  )

  const visibleIds = useMemo(
    () => new Set(visibleProfiles.map((profile) => profile.id)),
    [visibleProfiles]
  )

  const groupActivities = useMemo(
    () =>
      activities.filter(
        (activity) =>
          visibleIds.has(activity.alumno_id) &&
          new Date(activity.fecha_inicio) >= start
      ),
    [activities, visibleIds, start]
  )

  const selectedMetrics = useMemo(
    () => activityMetrics(selectedActivities),
    [selectedActivities]
  )

  const groupMetrics = useMemo(
    () => activityMetrics(groupActivities),
    [groupActivities]
  )

  const studentResults = results.filter((result) => result.profile_id === selected?.id)
  const studentNotes = notes.filter((item) => item.profile_id === selected?.id)
  const completedTasks = studentResults.filter((result) => result.status === 'completed').length

  const groupRows = useMemo(
    () =>
      visibleProfiles.map((profile) => {
        const rows = groupActivities.filter((activity) => activity.alumno_id === profile.id)
        const metrics = activityMetrics(rows)
        const completed = results.filter(
          (result) => result.profile_id === profile.id && result.status === 'completed'
        ).length
        return { profile, metrics, completed }
      }),
    [visibleProfiles, groupActivities, results]
  )

  async function saveNote() {
    if (!note.trim() || !selected?.id) return
    const { error } = await supabase.from('pr_performance_notes').insert({
      profile_id: selected.id,
      body: note.trim(),
      visibility,
      created_by: user?.id || null,
    })

    if (error) {
      setMessage(error.message)
      return
    }

    setNote('')
    await load()
  }

  function exportStudentCsv() {
    const rows = [
      ['Alumno', 'Fecha', 'Actividad', 'KM', 'Movimiento seg', 'Total seg', 'Vel media km/h', 'Vel max km/h', 'Desnivel +m', 'FC media', 'FC max', 'Privada'],
    ]

    selectedActivities.forEach((activity) => {
      rows.push([
        profileName(selected),
        fmtDate(activity.fecha_inicio),
        activity.es_privada ? 'Actividad privada' : activity.nombre || '',
        ((Number(activity.distancia_metros) || 0) / 1000).toFixed(2),
        activity.tiempo_movimiento_segundos || 0,
        activity.tiempo_total_segundos || 0,
        speedKmh(activity.velocidad_media_ms).toFixed(2),
        speedKmh(activity.velocidad_maxima_ms).toFixed(2),
        activity.desnivel_metros || 0,
        activity.frecuencia_cardiaca_media || '',
        activity.frecuencia_cardiaca_maxima || '',
        activity.es_privada ? 'Sí' : 'No',
      ])
    })

    downloadCsv('PR-Performance-' + profileName(selected).replaceAll(' ', '-') + '.csv', rows)
  }

  function exportGroupCsv() {
    const rows = [['Alumno', 'KM', 'Sesiones', 'Tiempo seg', 'Deberes completados', 'Deberes total']]

    groupRows.forEach((row) => {
      rows.push([
        profileName(row.profile),
        row.metrics.km.toFixed(2),
        row.metrics.sessions,
        row.metrics.seconds,
        row.completed,
        tasks.length,
      ])
    })

    downloadCsv('PR-Performance-Equipo.csv', rows)
  }

  function print(scope) {
    setPrintScope(scope)
    window.setTimeout(() => window.print(), 120)
  }

  return (
    <AppLayout>
      <style>{'@media print {.no-print{display:none!important}.print-only{display:block!important}body{background:white!important}.pr-print{color:#111!important;background:white!important;padding:24px!important}.pr-print *{box-shadow:none!important}}'}</style>

      <main className="min-h-screen bg-[#050508] px-4 pb-24 pt-5 text-white">
        <div className="mx-auto max-w-6xl space-y-5">
          <section className="no-print rounded-[34px] border border-orange-300/20 bg-[radial-gradient(circle_at_90%_0%,rgba(124,58,237,.24),transparent_38%),linear-gradient(135deg,#2c1702,#0b0c10_50%,#0c0715)] p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.24em] text-orange-300">
                  PR PERFORMANCE · CENTRO DE RENDIMIENTO
                </p>
                <h1 className="mt-2 text-4xl font-black tracking-[-.045em]">
                  Expediente deportivo PR.
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">
                  Inline Skate + deberes + lectura técnica. Un único lugar para seguir evolución individual y del equipo.
                </p>
              </div>
              <a
                href="/admin"
                className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-xs font-black text-white/55"
              >
                ← PR Control
              </a>
            </div>

            <div className="mt-6 grid gap-2 sm:grid-cols-4">
              <select
                value={group}
                onChange={(event) => setGroup(event.target.value)}
                className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm"
              >
                <option value="ALL">Todos los grupos</option>
                {allGroups.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>

              <select
                value={period}
                onChange={(event) => setPeriod(event.target.value)}
                className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm"
              >
                <option value="7d">7 días</option>
                <option value="30d">30 días</option>
                <option value="90d">90 días</option>
                <option value="180d">6 meses</option>
                <option value="365d">1 año</option>
                <option value="all">Todo</option>
              </select>

              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar alumno…"
                className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm outline-none"
              />

              <div className="grid grid-cols-2 gap-2">
                <button onClick={exportStudentCsv} className="rounded-2xl border border-white/10 bg-white/[.05] px-2 py-3 text-[10px] font-black">
                  CSV ALUMNO
                </button>
                <button onClick={() => print('student')} className="rounded-2xl bg-orange-300 px-2 py-3 text-[10px] font-black text-black">
                  PDF ALUMNO
                </button>
              </div>
            </div>

            <div className="mt-2 flex justify-end gap-2">
              <button onClick={exportGroupCsv} className="rounded-2xl border border-violet-300/20 bg-violet-400/[.08] px-4 py-2.5 text-[10px] font-black text-violet-200">
                CSV EQUIPO
              </button>
              <button onClick={() => print('group')} className="rounded-2xl border border-violet-300/20 bg-violet-300 px-4 py-2.5 text-[10px] font-black text-black">
                PDF EQUIPO
              </button>
            </div>
          </section>

          {message ? (
            <div className="no-print rounded-2xl border border-red-300/20 bg-red-400/[.07] p-4 text-sm">
              {message}
            </div>
          ) : null}

          <section className="print-only pr-print hidden">
            {printScope === 'student' && selected ? (
              <div>
                <p className="text-sm font-black">PUNTA ROLLERS · PR PERFORMANCE</p>
                <h1 className="mt-2 text-4xl font-black">{profileName(selected)}</h1>
                <p className="mt-1 text-sm">Período: {period}</p>
                <div className="mt-6 grid grid-cols-4 gap-3">
                  <Metric label="KM" value={fmtKm(selectedMetrics.km)} />
                  <Metric label="Sesiones" value={selectedMetrics.sessions} />
                  <Metric label="Tiempo" value={fmtDuration(selectedMetrics.seconds)} />
                  <Metric label="Desnivel +" value={Math.round(selectedMetrics.elevation) + ' m'} />
                </div>
                <h2 className="mt-8 text-2xl font-black">Actividades Inline Skate</h2>
                <div className="mt-3 space-y-2">
                  {selectedActivities.map((activity) => (
                    <div key={activity.id} className="grid grid-cols-5 border-b border-black/10 py-2 text-xs">
                      <span>{fmtDate(activity.fecha_inicio)}</span>
                      <span>{activity.es_privada ? 'Actividad privada' : activity.nombre || 'Inline Skate'}</span>
                      <span>{fmtKm((Number(activity.distancia_metros) || 0) / 1000)} km</span>
                      <span>{fmtDuration(activity.tiempo_movimiento_segundos)}</span>
                      <span>{speedKmh(activity.velocidad_media_ms).toFixed(1)} km/h</span>
                    </div>
                  ))}
                </div>
                <h2 className="mt-8 text-2xl font-black">Deberes PR</h2>
                <p className="mt-2">{completedTasks}/{tasks.length} completados</p>
                <h2 className="mt-8 text-2xl font-black">Observaciones compartibles</h2>
                {studentNotes.filter((item) => item.visibility !== 'staff').map((item) => (
                  <p key={item.id} className="mt-2 text-sm">{item.body}</p>
                ))}
                <p className="mt-10 text-xs text-black/50">
                  Datos: Strava + Punta Rollers. Las actividades privadas aportan métricas sin exponer recorrido ni ubicación.
                </p>
              </div>
            ) : null}

            {printScope === 'group' ? (
              <div>
                <p className="text-sm font-black">PUNTA ROLLERS · PR PERFORMANCE</p>
                <h1 className="mt-2 text-4xl font-black">Informe de equipo</h1>
                <p className="mt-1 text-sm">{group === 'ALL' ? 'Todos los grupos' : group} · {period}</p>
                <div className="mt-6 grid grid-cols-4 gap-3">
                  <Metric label="Alumnos" value={visibleProfiles.length} />
                  <Metric label="KM" value={fmtKm(groupMetrics.km)} />
                  <Metric label="Sesiones" value={groupMetrics.sessions} />
                  <Metric label="Tiempo" value={fmtDuration(groupMetrics.seconds)} />
                </div>
                <div className="mt-8">
                  {groupRows.map((row) => (
                    <div key={row.profile.id} className="grid grid-cols-5 border-b border-black/10 py-2 text-xs">
                      <span className="font-black">{profileName(row.profile)}</span>
                      <span>{fmtKm(row.metrics.km)} km</span>
                      <span>{row.metrics.sessions} sesiones</span>
                      <span>{fmtDuration(row.metrics.seconds)}</span>
                      <span>{row.completed}/{tasks.length} deberes</span>
                    </div>
                  ))}
                </div>
                <p className="mt-10 text-xs text-black/50">
                  Datos: Strava + Punta Rollers. Las actividades privadas solo aportan valores agregados.
                </p>
              </div>
            ) : null}
          </section>

          <div className="no-print grid gap-5 lg:grid-cols-[280px_1fr]">
            <aside className="rounded-[28px] border border-white/10 bg-white/[.025] p-3 lg:sticky lg:top-4 lg:self-start">
              <p className="px-2 pb-3 text-[9px] font-black uppercase tracking-[.18em] text-white/30">
                ALUMNOS · {visibleProfiles.length}
              </p>
              <div className="max-h-[70vh] space-y-1 overflow-auto">
                {visibleProfiles.map((profile) => {
                  const rows = activities.filter(
                    (activity) =>
                      activity.alumno_id === profile.id &&
                      new Date(activity.fecha_inicio) >= start
                  )
                  const metrics = activityMetrics(rows)
                  return (
                    <button
                      key={profile.id}
                      onClick={() => setSelectedId(profile.id)}
                      className={
                        'flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left ' +
                        (selected?.id === profile.id
                          ? 'bg-orange-300 text-black'
                          : 'hover:bg-white/[.04]')
                      }
                    >
                      {profile.foto ? (
                        <img src={profile.foto} alt="" className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-xs font-black">
                          {profileName(profile).slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-xs font-black">{profileName(profile)}</p>
                        <p className="mt-1 text-[10px] opacity-50">
                          {fmtKm(metrics.km)} km · {metrics.sessions} sesiones
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </aside>

            <section className="space-y-5">
              {loading ? (
                <div className="rounded-[28px] border border-white/10 bg-white/[.03] p-8 text-sm text-white/40">
                  Cargando PR Performance…
                </div>
              ) : selected ? (
                <>
                  <article className="rounded-[30px] border border-white/10 bg-white/[.03] p-5">
                    <div className="flex items-center gap-4">
                      {selected.foto ? (
                        <img src={selected.foto} alt="" className="h-20 w-20 rounded-full object-cover" />
                      ) : (
                        <div className="grid h-20 w-20 place-items-center rounded-full bg-orange-300 text-xl font-black text-black">
                          {profileName(selected).slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[.18em] text-orange-300">
                          EXPEDIENTE DEPORTIVO
                        </p>
                        <h2 className="mt-1 text-3xl font-black">{profileName(selected)}</h2>
                        <p className="mt-1 text-xs text-white/35">
                          {groupNames(selected).join(' · ') || 'Punta Rollers'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                      <Metric label="Kilómetros" value={fmtKm(selectedMetrics.km)} sub={selectedMetrics.sessions + ' sesiones'} />
                      <Metric label="Tiempo" value={fmtDuration(selectedMetrics.seconds)} />
                      <Metric label="Vel. media" value={selectedMetrics.avgSpeed.toFixed(1) + ' km/h'} sub={'Máx. ' + selectedMetrics.maxSpeed.toFixed(1) + ' km/h'} />
                      <Metric label="Desnivel +" value={Math.round(selectedMetrics.elevation) + ' m'} sub={selectedMetrics.avgHeart ? 'FC media ' + Math.round(selectedMetrics.avgHeart) + ' ppm' : 'Sin FC suficiente'} />
                    </div>
                  </article>

                  <div className="grid gap-5 xl:grid-cols-2">
                    <article className="rounded-[28px] border border-white/10 bg-white/[.025] p-5">
                      <p className="text-[9px] font-black uppercase tracking-[.18em] text-emerald-300">DEBERES PR</p>
                      <h3 className="mt-1 text-xl font-black">{completedTasks}/{tasks.length} completados</h3>
                      <div className="mt-4 space-y-2">
                        {tasks.map((task) => {
                          const result = studentResults.find((item) => item.task_id === task.id)
                          const done = result?.status === 'completed'
                          return (
                            <div key={task.id} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-black">{task.title}</p>
                                <span className={done ? 'rounded-full bg-emerald-400/15 px-2 py-1 text-[9px] font-black text-emerald-300' : 'rounded-full bg-white/[.06] px-2 py-1 text-[9px] font-black text-white/35'}>
                                  {done ? 'COMPLETADO' : (result?.status || 'PENDIENTE').toUpperCase()}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </article>

                    <article className="rounded-[28px] border border-white/10 bg-white/[.025] p-5">
                      <p className="text-[9px] font-black uppercase tracking-[.18em] text-sky-300">LECTURA DEL ENTRENADOR</p>
                      <h3 className="mt-1 text-xl font-black">Notas técnicas</h3>
                      <textarea
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        placeholder="Técnica, resistencia, postura, objetivo…"
                        className="mt-4 min-h-28 w-full rounded-2xl border border-white/10 bg-black/25 p-4 text-sm outline-none"
                      />
                      <div className="mt-2 flex gap-2">
                        <select
                          value={visibility}
                          onChange={(event) => setVisibility(event.target.value)}
                          className="flex-1 rounded-2xl border border-white/10 bg-black/35 px-3 py-3 text-xs"
                        >
                          <option value="staff">Solo staff</option>
                          <option value="coach_share">Compartible con entrenador</option>
                          <option value="student">Visible para alumno</option>
                        </select>
                        <button onClick={saveNote} className="rounded-2xl bg-sky-300 px-4 py-3 text-xs font-black text-black">
                          Guardar
                        </button>
                      </div>
                      <div className="mt-4 space-y-2">
                        {studentNotes.map((item) => (
                          <div key={item.id} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                            <p className="text-sm leading-5 text-white/70">{item.body}</p>
                            <p className="mt-2 text-[9px] uppercase tracking-[.12em] text-white/25">
                              {fmtDate(item.created_at)} · {item.visibility === 'staff' ? 'Solo staff' : item.visibility === 'coach_share' ? 'Compartible' : 'Alumno'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </article>
                  </div>

                  <article className="rounded-[28px] border border-white/10 bg-white/[.025] p-5">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[.18em] text-orange-300">SESIONES INLINE SKATE</p>
                        <h3 className="mt-1 text-xl font-black">Historial técnico</h3>
                      </div>
                      <p className="text-xs text-white/30">{selectedActivities.length} sesiones</p>
                    </div>

                    <div className="mt-4 space-y-2">
                      {selectedActivities.slice(0, 80).map((activity) => (
                        <details key={activity.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                          <summary className="cursor-pointer list-none">
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <p className="text-sm font-black">
                                  {activity.es_privada ? 'Actividad privada' : activity.nombre || 'Inline Skate'}
                                </p>
                                <p className="mt-1 text-[10px] text-white/30">
                                  {fmtDate(activity.fecha_inicio)} · {fmtDuration(activity.tiempo_movimiento_segundos)}
                                </p>
                              </div>
                              <p className="text-lg font-black text-orange-300">
                                {fmtKm((Number(activity.distancia_metros) || 0) / 1000)} km
                              </p>
                            </div>
                          </summary>

                          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/10 pt-4 sm:grid-cols-4">
                            <Metric label="Vel. media" value={speedKmh(activity.velocidad_media_ms).toFixed(1) + ' km/h'} />
                            <Metric label="Vel. máxima" value={speedKmh(activity.velocidad_maxima_ms).toFixed(1) + ' km/h'} />
                            <Metric label="Desnivel +" value={Math.round(Number(activity.desnivel_metros) || 0) + ' m'} />
                            <Metric label="FC" value={activity.frecuencia_cardiaca_media ? Math.round(activity.frecuencia_cardiaca_media) + ' ppm' : '—'} sub={activity.frecuencia_cardiaca_maxima ? 'Máx. ' + Math.round(activity.frecuencia_cardiaca_maxima) : null} />
                          </div>

                          {activity.es_privada ? (
                            <p className="mt-3 rounded-xl border border-amber-300/15 bg-amber-300/[.06] p-3 text-[10px] text-amber-100/60">
                              Privada en Strava: suma a las métricas, pero no se exportan recorrido ni ubicación.
                            </p>
                          ) : null}
                        </details>
                      ))}
                    </div>
                  </article>
                </>
              ) : null}
            </section>
          </div>
        </div>
      </main>
    </AppLayout>
  )
}
