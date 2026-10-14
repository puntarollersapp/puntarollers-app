import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import ProfileAvatar from '../components/ProfileAvatar'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { buildShifterFinalReport } from '../lib/shifterFinalReport'

const RACE_DATE = new Date('2026-11-01T08:00:00-03:00')
function timeUntilRace() { return Math.max(0, Math.floor((RACE_DATE.getTime() - Date.now()) / 1000)) }
function ProgressComparison({ report }) {
  const rows = report.rows
  const values = rows.map(row => Number(row.seconds))
  const min = Math.min(...values), max = Math.max(...values)
  const width = 320, height = 150, padX = 22, padY = 26
  const points = rows.map((row, i) => ({
    x: rows.length === 1 ? width / 2 : padX + i * (width - 2 * padX) / (rows.length - 1),
    y: padY + ((Number(row.seconds) - min) / (max - min || 1)) * (height - 2 * padY),
  }))
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const difference = rows.length > 1 ? rows[0].seconds - rows[rows.length - 1].seconds : null
  return <div className="mt-5 space-y-4">
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-2xl border border-violet-300/20 bg-violet-400/[.07] p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-violet-200/75">Primera toma</p><p className="mt-2 text-2xl font-black tabular-nums">{rows[0].formattedTime}</p></div>
      <div className="rounded-2xl border border-orange-300/25 bg-orange-400/[.08] p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-orange-200/75">Última toma</p><p className="mt-2 text-2xl font-black tabular-nums">{rows[rows.length - 1].formattedTime}</p></div>
    </div>
    {difference !== null && <div className="rounded-xl border border-emerald-300/20 bg-emerald-400/[.06] px-4 py-3 text-sm text-emerald-100">{difference > 0 ? `Ganaste ${Math.round(difference)} segundos desde tu primera toma. ¡Es un avance real!` : difference === 0 ? 'Mantuviste tu primera marca: la regularidad también es parte del entrenamiento.' : `Tu mejor marca sigue siendo parte de tu recorrido. La última toma varió ${Math.abs(Math.round(difference))} segundos respecto a la primera; cada sesión aporta experiencia.`}</div>}
    <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/50">Tu evolución · menos tiempo es mejor</p>
      <svg viewBox="0 0 320 170" className="w-full overflow-visible" role="img" aria-label={`Evolución de ${rows.length} tomas de ${report.distanceKm} kilómetros`}>
        <defs><linearGradient id={`shifter-line-${report.distanceKm}`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#a78bfa"/><stop offset="1" stopColor="#fb923c"/></linearGradient></defs>
        {[40,85,130].map(y => <line key={y} x1="14" y1={y} x2="306" y2={y} stroke="white" strokeOpacity=".09" strokeDasharray="3 6"/>)}
        <path d={line} fill="none" stroke={`url(#shifter-line-${report.distanceKm})`} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-700"/>
        {points.map((p,i) => <g key={rows[i].id || i}><circle cx={p.x} cy={p.y} r="7" fill="#18101f" stroke={i===points.length-1 ? '#fb923c' : '#a78bfa'} strokeWidth="3"/><text x={p.x} y={Math.max(12,p.y-13)} textAnchor="middle" fontSize="10" fill="#fff" fontWeight="700">{rows[i].formattedTime}</text><text x={p.x} y="166" textAnchor="middle" fontSize="10" fill="#b6a9c8">T{i+1}</text></g>)}
      </svg>
    </div>
    <div className="overflow-hidden rounded-2xl border border-white/10"><table className="w-full text-left text-xs"><thead className="bg-white/[.07] text-white/65"><tr><th className="p-3">Toma</th><th className="p-3">Fecha</th><th className="p-3 text-right">Tiempo</th></tr></thead><tbody>{rows.map((row,i) => <tr key={row.id||i} className="border-t border-white/10"><td className="p-3 font-semibold text-violet-200">{row.takeNumber || i+1}</td><td className="p-3 text-white/55">{String(row.date||'—').slice(0,10)}</td><td className="p-3 text-right font-bold tabular-nums">{row.formattedTime}{row.seconds === report.bestSeconds ? <span className="ml-1 text-emerald-300" title="Mejor marca">★</span> : null}</td></tr>)}</tbody></table></div>
  </div>
}

export default function ShifterFinal() {
  const [remaining, setRemaining] = useState(timeUntilRace)
  useEffect(() => { const timer = window.setInterval(() => setRemaining(timeUntilRace()), 1000); return () => window.clearInterval(timer) }, [])
  const { user } = useAuth()
  const [coaches, setCoaches] = useState([])
  const [takes, setTakes] = useState([])
  const [feedback, setFeedback] = useState([])
  const [tasks, setTasks] = useState([])
  const [results, setResults] = useState([])
  const [enrollment, setEnrollment] = useState(null)
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!user?.id) return
    let alive = true
    async function load() {
      const event = 'shifter-marathon-2026'
      const queries = await Promise.all([
        supabase.from('pr_performance_tomas_calculadas').select('*').eq('alumno_id', user.id),
        supabase.from('pr_training_enrollments').select('*').eq('profile_id', user.id).eq('event_slug', event).maybeSingle(),
        supabase.from('pr_training_tasks').select('*').eq('event_slug', event).eq('active', true),
        supabase.from('pr_training_task_results').select('*').eq('profile_id', user.id),
        supabase.from('pr_inline_skate_activities').select('distancia_metros').eq('alumno_id', user.id).eq('fuente', 'strava').eq('eliminada', false).limit(1000),
        supabase.from('pr_performance_notes').select('id,body,visibility,created_at').eq('profile_id', user.id).eq('visibility','student').order('created_at',{ascending:false}).limit(100),
      ])
      if (!alive) return
      if (queries.some(x => x.error)) setError('Algunos datos no están disponibles. No se modificó ningún registro.')
      setTakes(queries[0].data || [])
      const coachResponse = await supabase.from('profiles').select('id,nombre,apellido,foto,role,es_profesor').in('id',['admin-claudio','profe-david'])
      if (alive && !coachResponse.error) setCoaches((coachResponse.data || []).filter(p => ['Claudio','David'].some(name => String(p.nombre || '').toLowerCase() === name.toLowerCase()) && (p.es_profesor || ['admin','profesor'].includes(p.role))))
      setEnrollment(queries[1].data || null)
      setTasks(queries[2].data || [])
      setResults(queries[3].data || [])
      setActivity(queries[4].data || [])
      setFeedback(queries[5].data || [])
      setLoading(false)
    }
    load()
    return () => { alive = false }
  }, [user?.id])
  const reports = useMemo(() => buildShifterFinalReport(takes), [takes])
  const assigned = tasks.filter(t => enrollment?.category && enrollment.category !== 'NO' && (t.category === 'ALL' || t.category === enrollment.category))
  const completed = assigned.filter(t => results.some(r => r.task_id === t.id && r.status === 'completed')).length
  const kilometers = activity.reduce((sum, a) => sum + (Number(a.distancia_metros) || 0) / 1000, 0)
  return <AppLayout title="Shifter 2026" showBack><div className="mx-auto max-w-xl space-y-4 px-4 pb-28 pt-5 text-white">
    <section className="rounded-[30px] border border-violet-300/20 relative isolate overflow-hidden bg-gradient-to-br from-[#301a39] via-[#1c1427] to-[#0d0a15] p-6 text-center shadow-[0_20px_65px_rgba(126,65,190,.25)]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"><div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 animate-pulse rounded-full bg-violet-500/20 blur-3xl"/><div className="absolute -right-20 top-1/3 h-64 w-64 animate-pulse rounded-full bg-orange-400/10 blur-3xl"/><div className="absolute inset-0 opacity-20" style={{backgroundImage:"radial-gradient(circle, rgba(255,255,255,.45) 1px, transparent 1px)",backgroundSize:"30px 30px",maskImage:"linear-gradient(to bottom,black,transparent)"}}/></div>
      <div className="mb-5 flex justify-center gap-5">{['Claudio','David'].map(name => { const coach = coaches.find(p => String(p.nombre || '').toLowerCase() === name.toLowerCase()); return <div key={name} className="flex flex-col items-center gap-2">{coach ? <ProfileAvatar profile={coach} className="h-[84px] w-[84px] ring-2 ring-orange-300/60 ring-offset-4 ring-offset-[#23162c] shadow-xl" badge={false}/> : <div className="grid h-[74px] w-[74px] place-items-center rounded-full border border-white/15 bg-white/5 text-sm font-black text-white/50">{name.slice(0,1)}</div>}<span className="text-xs font-semibold text-white/70">{name}</span></div> })}</div>
      <p className="text-[10px] font-black uppercase tracking-[.2em] text-orange-300">Un mensaje de tus entrenadores</p>
      <h2 className="mt-3 text-[27px] font-black leading-tight">Estás en la recta final.</h2>
      <p className="mt-4 text-sm leading-7 text-white/75">Queremos felicitarte por todo lo que venís construyendo. Por tu esfuerzo, tu constancia y las ganas que le pusiste a cada entrenamiento.</p>
      <p className="mt-3 text-sm leading-7 text-white/75">Estamos orgullosos de vos, y todavía nos quedan momentos para compartir: las últimas clases, la clínica y esos pequeños detalles que nos van a ayudar a llegar de la mejor manera.</p>
      <p className="mt-4 text-sm font-bold text-white">Disfrutá estos últimos días. La carrera está cada vez más cerca y lo mejor de esta experiencia todavía está por vivirse.</p>
      <p className="mt-5 border-t border-white/10 pt-4 text-xs text-white/60">Claudio y David · Tus entrenadores</p>
      <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-orange-300">No es solo patinar, es pertenecer.</p>
      <div className="mt-5 rounded-2xl border border-orange-300/20 bg-black/25 px-3 py-4" aria-label="Cuenta regresiva hasta Shifter Marathon 2026"><p className="mb-3 text-[10px] font-black uppercase tracking-[.15em] text-orange-300">Falta para Shifter</p><div className="grid grid-cols-4 gap-2">{[[Math.floor(remaining/86400),'días'],[Math.floor(remaining%86400/3600),'horas'],[Math.floor(remaining%3600/60),'min'],[remaining%60,'seg']].map(([value,label]) => <div key={label}><p className="font-mono text-xl font-black tabular-nums text-white">{String(value).padStart(2,'0')}</p><p className="text-[10px] text-white/50">{label}</p></div>)}</div></div>
    </section>
    <section className="rounded-[30px] border border-orange-400/25 bg-gradient-to-br from-[#381806] via-[#15101c] to-[#09090e] p-6">
      <p className="text-[10px] font-black uppercase tracking-[.2em] text-orange-300">Punta Rollers · Shifter Marathon 2026</p>
      <h1 className="mt-3 text-4xl font-black leading-tight">Tu camino<br/>hasta acá.</h1>
      <p className="mt-3 text-sm leading-6 text-white/65">Seguimos preparando cada detalle. Tus tomas, tus entrenamientos y tus deberes forman parte del camino hacia la carrera.</p>
      <p className="mt-4 text-[10px] font-bold tracking-wide text-orange-200">Tu preparación continúa</p>
    </section>
    {loading && <p className="text-sm text-white/60">Cargando tus registros reales…</p>}
    {error && <p role="alert" className="rounded-xl border border-amber-500/30 p-3 text-sm text-amber-200">{error}</p>}
    {!loading && <><section className="grid grid-cols-2 gap-3">
      <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4"><p className="text-xs text-white/50">Entrenamientos Strava</p><p className="mt-2 text-2xl font-black">{activity.length}</p></div>
      <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4"><p className="text-xs text-white/50">Kilómetros registrados</p><p className="mt-2 text-2xl font-black">{kilometers.toFixed(1)}</p></div>
    </section>
    {reports.map(report => <section key={report.distanceKm} className="rounded-[28px] border border-violet-400/20 bg-[#14111c] p-5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-violet-300">Evolución · {report.distanceKm} km</p>
      <h2 className="mt-2 text-xl font-black">{report.title}</h2>
      {report.count ? <><ProgressComparison report={report}/>
      <p className="mt-3 text-xs text-white/55">Mejor marca: {report.bestSeconds == null ? '—' : report.rows.find(r=>r.seconds===report.bestSeconds)?.formattedTime} · {report.finalRecorded ? 'Toma final registrada' : 'Esperando la toma final'}</p>
      {report.hasComparison && <p className="mt-1 text-xs text-orange-200">{report.differenceSeconds > 0 ? 'Mejoraste respecto a tu primera toma' : report.differenceSeconds < 0 ? 'Diferencia respecto a tu primera toma' : 'Misma marca que tu primera toma'}: {Math.abs(report.changePercent).toFixed(1)}%</p>}
      </> : <p className="mt-3 text-sm text-white/50">Todavía no hay tomas registradas para esta distancia.</p>}
      <p className="mt-4 text-sm leading-6 text-white/75">{report.message}</p>
    </section>)}
    <section className="rounded-[28px] border border-orange-300/20 bg-[#171116] p-5">
      <p className="text-[10px] font-black uppercase tracking-widest text-orange-300">Tus devoluciones</p>
      <h2 className="mt-2 text-xl font-black">Lo que fuimos observando</h2>
      {takes.filter(t => t.devolucion && t.eliminado !== true).length === 0 && feedback.length === 0 ? <p className="mt-3 text-sm text-white/55">Todavía no hay devoluciones registradas en tu perfil.</p> : <div className="mt-4 space-y-3">
        {takes.filter(t => t.devolucion && t.eliminado !== true).map((t,i) => <div key={t.id || i} className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><p className="text-[10px] font-bold text-orange-200">Toma {t.numero_toma || i+1}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/75">{t.devolucion}</p></div>)}
        {feedback.map(n => <div key={n.id} className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><p className="text-[10px] font-bold text-violet-300">Devolución del entrenador</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/75">{n.body}</p></div>)}
      </div>}
    </section>
    <section className="rounded-[28px] border border-emerald-400/20 bg-[#0b1916] p-5">
      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Deberes de preparación</p>
      <h2 className="mt-2 text-2xl font-black">{assigned.length ? `${completed} de ${assigned.length} completados` : 'Sin deberes asignados'}</h2>
      {assigned.length > 0 && <><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-emerald-400" style={{width:`${completed/assigned.length*100}%`}}/></div><p className="mt-3 text-sm text-white/65">{completed===assigned.length ? 'Todos los deberes registrados están completos.' : `Todavía quedan ${assigned.length-completed} deberes pendientes. Podés seguir completándolos.`}</p></>}
      <Link to="/app/deberes" className="mt-4 inline-block rounded-xl border border-white/20 px-4 py-3 text-sm font-bold">Ver mis deberes</Link>
    </section>
    <section className="rounded-[28px] border border-white/10 p-5"><h2 className="text-xl font-black">Cada entrenamiento cuenta.</h2><p className="mt-3 text-sm leading-6 text-white/60">Los números cuentan parte de tu historia. Lo que entrenaste, aprendiste y compartiste también forma parte de este camino. Todavía tenemos clases, clínica y momentos para seguir aprendiendo antes de la carrera.</p><p className="mt-3 text-xs text-orange-300">No es solo patinar, es pertenecer.</p></section></>}
  </div></AppLayout>
}
