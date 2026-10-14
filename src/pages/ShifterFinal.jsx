import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import ProfileAvatar from '../components/ProfileAvatar'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { buildShifterFinalReport, SHIFTER_FINAL_LABEL } from '../lib/shifterFinalReport'

const RACE_DATE = new Date('2026-11-01T08:00:00-03:00')
function timeUntilRace() { return Math.max(0, Math.floor((RACE_DATE.getTime() - Date.now()) / 1000)) }
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
  const [feedback, setFeedback] = useState([])
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
        supabase.from('pr_performance_notes').select('id,body,visibility,created_at').eq('profile_id', user.id).eq('visibility', 'student').order('created_at', { ascending: false }),
      ])
      if (!alive) return
      if (queries.some(x => x.error)) setError('Algunos datos no están disponibles. No se modificó ningún registro.')
      setTakes(queries[0].data || [])
      setFeedback(queries[5].data || [])
      const coachResponse = await supabase.from('profiles').select('id,nombre,apellido,foto,role,es_profesor').or('nombre.ilike.%Claudio%,nombre.ilike.%David%').limit(30)
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
    <section className="rounded-[30px] border border-violet-300/20 bg-gradient-to-br from-[#261829] via-[#17111d] to-[#0d0a10] p-6 text-center shadow-[0_16px_50px_rgba(80,35,115,.15)]">
      <div className="mb-5 flex justify-center gap-4">{['Claudio','David'].map(name => { const coach = coaches.find(p => String(p.nombre || '').toLowerCase() === name.toLowerCase()); return <div key={name} className="flex flex-col items-center gap-2">{coach ? <ProfileAvatar profile={coach} className="h-[74px] w-[74px]" badge={false}/> : <div className="grid h-[74px] w-[74px] place-items-center rounded-full border border-white/15 bg-white/5 text-sm font-black text-white/50">{name.slice(0,1)}</div>}<span className="text-xs font-semibold text-white/70">{name}</span></div> })}</div>
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
      <p className="mt-3 text-sm leading-6 text-white/65">La última toma cierra la etapa de mediciones. Los entrenamientos y deberes pendientes continúan hasta la carrera.</p>
      <p className="mt-4 text-[10px] font-bold tracking-wide text-orange-200">{SHIFTER_FINAL_LABEL}</p>
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
      {report.count ? <><div className="mt-4 space-y-3">{report.rows.map((row, i) => <div key={row.id || i} className="flex items-center justify-between border-b border-white/10 pb-2 text-sm"><span className="text-white/60">{row.date || 'Sin fecha'} · Toma {row.takeNumber || i + 1}</span><strong>{row.formattedTime}</strong></div>)}</div>
      <div className="mt-4 flex h-28 items-end gap-2" aria-label="Gráfica de tiempos por toma">{report.rows.map((row,i) => {const values=report.rows.map(r=>r.seconds), min=Math.min(...values),max=Math.max(...values);return <div key={row.id||i} className="flex flex-1 flex-col items-center gap-1"><span className="text-[9px] text-white/50">{row.formattedTime}</span><div className="w-full rounded-t-md bg-gradient-to-t from-violet-700 to-orange-400" style={{height:`${25+((row.seconds-min)/(max-min||1))*55}px`}}/><span className="text-[9px] text-white/50">T{i+1}</span></div>})}</div>
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
    <section className="rounded-[28px] border border-white/10 p-5"><h2 className="text-xl font-black">Nos vemos en la Shifter.</h2><p className="mt-3 text-sm leading-6 text-white/60">Los números cuentan parte de tu historia. Lo que entrenaste, aprendiste y compartiste también forma parte de este camino. Ahora toca cuidarse y disfrutar la carrera.</p><p className="mt-3 text-xs text-orange-300">No es solo patinar, es pertenecer.</p></section></>}
  </div></AppLayout>
}
