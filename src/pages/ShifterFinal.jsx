import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { buildShifterFinalReport, SHIFTER_FINAL_LABEL } from '../lib/shifterFinalReport'

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
      <div className="overflow-x-auto pb-1"><svg viewBox="0 0 320 170" style={{minWidth:`${Math.max(280,rows.length*76)}px`}} className="w-full overflow-visible" role="img" aria-label={`Evolución de ${rows.length} tomas de ${report.distanceKm} kilómetros`}>
        <defs><linearGradient id={`shifter-line-${report.distanceKm}`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#a78bfa"/><stop offset="1" stopColor="#fb923c"/></linearGradient></defs>
        {[40,85,130].map(y => <line key={y} x1="14" y1={y} x2="306" y2={y} stroke="white" strokeOpacity=".09" strokeDasharray="3 6"/>)}
        <path d={line} fill="none" stroke={`url(#shifter-line-${report.distanceKm})`} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-700"/>
        {points.map((p,i) => <g key={rows[i].id || i}><circle cx={p.x} cy={p.y} r="7" fill="#18101f" stroke={i===points.length-1 ? '#fb923c' : '#a78bfa'} strokeWidth="3"/><text x={p.x} y={Math.max(12,p.y-13)} textAnchor="middle" fontSize="10" fill="#fff" fontWeight="700">{rows[i].formattedTime}</text><text x={p.x} y="166" textAnchor="middle" fontSize="10" fill="#b6a9c8">T{i+1}</text></g>)}
      </svg></div>
    </div>
    <div className="overflow-hidden rounded-2xl border border-white/10"><table className="w-full text-left text-xs"><thead className="bg-white/[.07] text-white/65"><tr><th className="p-3">Toma</th><th className="p-3">Fecha</th><th className="p-3 text-right">Tiempo</th></tr></thead><tbody>{rows.map((row,i) => <tr key={row.id||i} className="border-t border-white/10"><td className="p-3 font-semibold text-violet-200">{row.takeNumber || i+1}</td><td className="p-3 text-white/55">{String(row.date||'—').slice(0,10)}</td><td className="p-3 text-right font-bold tabular-nums">{row.formattedTime}{row.seconds === report.bestSeconds ? <span className="ml-1 text-emerald-300" title="Mejor marca">★</span> : null}</td></tr>)}</tbody></table></div>
  </div>
}


function Ring({value,label}) {
  const safe=Math.max(0,Math.min(100,Number(value)||0)), radius=35, circumference=2*Math.PI*radius
  return <div className="relative flex flex-col items-center justify-center"><svg viewBox="0 0 100 100" className="h-28 w-28 -rotate-90" role="img" aria-label={`${label}: ${safe.toFixed(0)} por ciento`}><circle cx="50" cy="50" r={radius} fill="none" stroke="#ffffff19" strokeWidth="8"/><circle cx="50" cy="50" r={radius} fill="none" stroke="#fb923c" strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference*(1-safe/100)} className="transition-all duration-700"/></svg><span className="absolute top-9 text-2xl font-black tabular-nums">{safe.toFixed(0)}%</span><span className="text-xs text-white/60">{label}</span></div>
}
function SportRadar({metrics,title,subtitle}) {
  const center=150,radius=104,count=metrics.length
  const point=(i,factor)=>{const angle=-Math.PI/2+2*Math.PI*i/count;return [center+Math.cos(angle)*radius*factor,center+Math.sin(angle)*radius*factor]}
  const polygon=(factor)=>metrics.map((_,i)=>point(i,factor).map(n=>n.toFixed(1)).join(',')).join(' ')
  const shape=metrics.map((m,i)=>point(i,Math.max(.05,Math.min(1,m.value/100))).map(n=>n.toFixed(1)).join(',')).join(' ')
  return <section className="overflow-hidden rounded-[28px] border border-orange-300/20 bg-gradient-to-b from-[#23192c] to-[#100e17] p-5">
    <p className="text-[10px] font-black uppercase tracking-[.18em] text-orange-300">Índice deportivo</p>
    <h2 className="mt-2 text-2xl font-black">{title}</h2><p className="mt-2 text-xs leading-5 text-white/55">{subtitle}</p>
    <svg viewBox="0 0 300 300" className="mx-auto mt-2 w-full max-w-[340px]" role="img" aria-label={metrics.map(m=>`${m.label}: ${m.value}%`).join('; ')}>
      {[.25,.5,.75,1].map(f=><polygon key={f} points={polygon(f)} fill="none" stroke="#c4b5fd" strokeOpacity=".24" strokeWidth="1.2"/>)}
      {metrics.map((_,i)=><line key={i} x1={center} y1={center} x2={point(i,1)[0]} y2={point(i,1)[1]} stroke="#c4b5fd" strokeOpacity=".16"/>)}
      <polygon points={shape} fill="#fb923c" fillOpacity=".27" stroke="#fb923c" strokeWidth="2.6" strokeLinejoin="round"/>
      {metrics.map((m,i)=>{const [x,y]=point(i,Math.max(.05,Math.min(1,m.value/100))),[lx,ly]=point(i,1.23);return <g key={m.label}><circle cx={x} cy={y} r="4.5" fill="#fb923c" stroke="#fff" strokeWidth="1.4"/><text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="#e9def5" fontWeight="600">{m.label}</text></g>})}
    </svg>
    <p className="text-center text-[11px] leading-5 text-white/45">Indicadores de preparación, no una evaluación médica ni una comparación entre alumnos.</p>
  </section>
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
  const [groupIndex,setGroupIndex] = useState(null)
  const [copied,setCopied] = useState(false)
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
        supabase.from('pr_inline_skate_activities').select('nombre,fecha_inicio,distancia_metros,tiempo_movimiento_segundos').eq('alumno_id', user.id).eq('fuente', 'strava').eq('eliminada', false).limit(1000),
        supabase.from('pr_performance_notes').select('id,body,visibility,created_at').eq('profile_id', user.id).eq('visibility','student').order('created_at',{ascending:false}).limit(100),
      ])
      if (!alive) return
      if (queries.some(x => x.error)) setError('Algunos datos no están disponibles. No se modificó ningún registro.')
      setTakes(queries[0].data || [])
      const [coachResponse,groupResponse] = await Promise.all([supabase.rpc('shifter_coach_profiles'),supabase.rpc('shifter_group_index')])
      if(alive && !groupResponse.error) setGroupIndex(groupResponse.data)
      if (alive && !coachResponse.error) setCoaches((coachResponse.data || []).filter(p => ['admin-claudio','profe-david'].includes(p.id)))
      if (alive && coachResponse.error) setError('No se pudieron cargar las fotos de los entrenadores. El resto de tus datos sigue disponible.')
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
  const finalActivity = activity.filter(a=>String(a.nombre||'').trim().toUpperCase()===SHIFTER_FINAL_LABEL)
  const latestFinal = [...finalActivity].sort((a,b)=>new Date(b.fecha_inicio||0)-new Date(a.fecha_inicio||0))[0]
  const finalKm=latestFinal?Number(latestFinal.distancia_metros||0)/1000:0
  const finalDistance=finalKm>=5&&finalKm<=7?6:finalKm>=10.76&&finalKm<=13.5?12:null
  const finalReport=reports.find(r=>r.distanceKm===finalDistance&&r.count>0)
  const finalSeconds=Number(latestFinal?.tiempo_movimiento_segundos||0)
  const finalDifference=finalReport&&finalSeconds>0?finalReport.firstSeconds-finalSeconds:null
  const metrics = [
    {label:'Tomas',value:Math.min(100,reports.reduce((s,r)=>s+r.count,0)*20)},
    {label:'Deberes',value:assigned.length?Math.round(completed/assigned.length*100):0},
    {label:'Actividad',value:Math.min(100,activity.length*10)},
    {label:'Distancias',value:Math.round(reports.filter(r=>r.count>0).length/2*100)},
    {label:'Evolución',value:reports.some(r=>r.hasComparison)?Math.round(reports.filter(r=>r.hasComparison&&r.differenceSeconds>0).length/Math.max(1,reports.filter(r=>r.hasComparison).length)*100):0},
  ]
  const kilometers = activity.reduce((sum, a) => sum + (Number(a.distancia_metros) || 0) / 1000, 0)
  return <AppLayout title="Shifter 2026" showBack><div className="mx-auto max-w-xl space-y-4 px-4 pb-28 pt-5 text-white">
    <section className="rounded-[30px] border border-violet-300/20 relative isolate overflow-hidden bg-gradient-to-br from-[#301a39] via-[#1c1427] to-[#0d0a15] p-6 text-center shadow-[0_20px_65px_rgba(126,65,190,.25)]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"><div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 animate-pulse rounded-full bg-violet-500/20 blur-3xl"/><div className="absolute -right-20 top-1/3 h-64 w-64 animate-pulse rounded-full bg-orange-400/10 blur-3xl"/><div className="absolute inset-0 opacity-20" style={{backgroundImage:"radial-gradient(circle, rgba(255,255,255,.45) 1px, transparent 1px)",backgroundSize:"30px 30px",maskImage:"linear-gradient(to bottom,black,transparent)"}}/></div>
      <style>{`@keyframes shifterDrift{0%{transform:translate3d(0,0,0);opacity:0}15%{opacity:.5}85%{opacity:.5}100%{transform:translate3d(12px,220px,0);opacity:0}}@keyframes shifterGlow{0%,100%{transform:translate(-10%,-5%) scale(1)}50%{transform:translate(12%,10%) scale(1.25)}}@media(prefers-reduced-motion:reduce){.shifter-drift,.shifter-glow{animation:none!important}}`}</style>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">{Array.from({length:22},(_,i)=><span key={i} className="shifter-drift absolute h-1 w-1 rounded-full bg-orange-200/70" style={{left:`${(i*37+13)%100}%`,top:`${(i*19+3)%85}%`,animation:`shifterDrift ${7+(i%5)*2}s linear ${-(i%8)*2}s infinite`}}/>)}<div className="shifter-glow absolute -top-28 left-1/4 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" style={{animation:'shifterGlow 13s ease-in-out infinite'}}/></div>
      <div className="mb-6 flex items-center justify-center gap-8">{[{id:'admin-claudio',label:'Claudio'},{id:'profe-david',label:'David'}].map(({id,label})=>{const coach=coaches.find(p=>p.id===id);return <div key={id} className="flex flex-col items-center gap-3"><div className="relative h-[88px] w-[88px] rounded-full bg-gradient-to-br from-violet-400 via-fuchsia-500 to-orange-400 p-[3px] shadow-[0_0_28px_rgba(167,100,245,.28)]"><div className="h-full w-full overflow-hidden rounded-full bg-[#24182c]">{coach?.foto?<img src={coach.foto} alt={`Foto de perfil de ${label}`} className="h-full w-full object-cover" loading="eager"/>:<span className="grid h-full w-full place-items-center text-xl font-black text-white/60">{label[0]}</span>}</div></div><span className="text-xs font-bold tracking-wide text-white/80">{label}</span></div>})}</div>
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
    <section className="relative overflow-hidden rounded-[28px] border border-fuchsia-400/20 bg-gradient-to-br from-[#26122d] via-[#171323] to-[#0e141b] p-5">
      <div className="pointer-events-none absolute -right-14 -top-20 h-44 w-44 rounded-full bg-fuchsia-500/15 blur-3xl"/>
      <p className="text-[10px] font-black uppercase tracking-[.18em] text-fuchsia-300">Tu preparación en números</p>
      <h2 className="mt-2 text-2xl font-black">Cada toma cuenta.</h2>
      <p className="mt-2 text-sm leading-6 text-white/60">Tus resultados se actualizan cuando se registra una nueva toma. Los mejores tiempos se calculan por distancia.</p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/[.05] p-4"><p className="text-xs text-white/55">Tomas registradas</p><p className="mt-2 text-3xl font-black tabular-nums text-white">{reports.reduce((sum,r)=>sum+r.count,0)}</p></div>
        <div className="rounded-2xl border border-white/10 bg-white/[.05] p-4"><p className="text-xs text-white/55">Devoluciones recibidas</p><p className="mt-2 text-3xl font-black tabular-nums text-white">{takes.filter(t=>t.devolucion&&t.eliminado!==true).length+feedback.length}</p></div>
        {reports.filter(r=>r.count>0).map(r=><div key={r.distanceKm} className="rounded-2xl border border-violet-400/20 bg-violet-400/[.07] p-4"><p className="text-xs font-semibold text-violet-200">Tu récord · {r.distanceKm}K</p><p className="mt-2 text-2xl font-black tabular-nums">{r.rows.find(row=>row.seconds===r.bestSeconds)?.formattedTime}</p>{r.count>1&&<p className="mt-1 text-[11px] text-emerald-200/80">{r.firstSeconds>r.bestSeconds?`${Math.round(r.firstSeconds-r.bestSeconds)} s más rápido que tu primera marca`:'Tu primera referencia sigue siendo tu récord'}</p>}</div>)}
      </div>
    </section>
    {reports.map(report => <section key={report.distanceKm} className="rounded-[28px] border border-violet-400/20 bg-[#14111c] p-5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-violet-300">Evolución · {report.distanceKm} km</p>
      <h2 className="mt-2 text-xl font-black">{report.title}</h2>
      {report.count ? <><ProgressComparison report={report}/>
      <p className="mt-3 text-xs text-white/55">Mejor marca: {report.bestSeconds == null ? '—' : report.rows.find(r=>r.seconds===report.bestSeconds)?.formattedTime} · {report.finalRecorded ? 'Toma final identificada' : 'Historial actualizado con las tomas disponibles'}</p>
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
    <section className="rounded-[28px] border border-orange-300/20 bg-[#17131d] p-5"><h2 className="text-xl font-black">Tu preparación, de un vistazo</h2><div className="mt-4 grid grid-cols-2 gap-3"><Ring value={assigned.length?completed/assigned.length*100:0} label="Deberes"/><Ring value={Math.min(100,reports.reduce((s,r)=>s+r.count,0)*20)} label="Tomas"/></div><p className="mt-3 text-center text-xs text-white/45">Los anillos reflejan registros de preparación, no un porcentaje de condición física.</p></section>
    <SportRadar metrics={metrics} title="Tu huella deportiva" subtitle="Cinco señales calculadas con tus tomas, deberes y actividades registradas. La escala representa avance de preparación, no capacidad física ni un diagnóstico."/>
    <section className="rounded-[28px] border border-orange-400/25 bg-[#1b1414] p-5">
      <p className="text-[10px] font-black uppercase tracking-widest text-orange-300">Toma final · Strava</p>
      <h2 className="mt-2 text-xl font-black">Tu último registro, conectado.</h2>
      <p className="mt-2 text-sm leading-6 text-white/65">Usá este nombre exacto para la actividad final de patín en Strava. Cuando se sincronice, Shifter podrá reconocerla automáticamente.</p>
      <div className="mt-4 break-all rounded-xl border border-white/10 bg-black/30 p-3 font-mono text-sm font-bold text-white">{SHIFTER_FINAL_LABEL}</div>
      <button type="button" onClick={async()=>{try{await navigator.clipboard.writeText(SHIFTER_FINAL_LABEL);setCopied(true)}catch{setCopied(false)}}} className="mt-3 w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-black text-black">{copied?'Nombre copiado':'Copiar nombre para Strava'}</button>
      {latestFinal?<p className="mt-4 rounded-xl border border-emerald-300/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">Actividad final detectada en Strava · {Number(latestFinal.distancia_metros/1000).toFixed(2)} km · {latestFinal.fecha_inicio?String(latestFinal.fecha_inicio).slice(0,10):'Fecha no disponible'}. El tiempo proviene de Strava y se muestra por separado de las tomas validadas.</p>:<p className="mt-4 text-xs text-orange-200/70">Pendiente de sincronización. Tu progreso anterior se conserva intacto.</p>}
      {finalDifference!==null&&<div className="mt-3 rounded-xl border border-orange-300/20 bg-orange-400/[.06] p-4"><p className="text-xs font-bold uppercase tracking-wide text-orange-200">Comparativa provisional · {finalDistance}K</p><p className="mt-2 text-sm text-white/80">Primera toma: {finalReport.rows[0].formattedTime} · Actividad Strava: {Math.floor(finalSeconds/60)}:{String(Math.round(finalSeconds%60)).padStart(2,'0')}</p><p className="mt-2 text-sm font-bold">{finalDifference>0?`${Math.round(finalDifference)} segundos más rápido que la primera toma`:finalDifference===0?'Mismo tiempo que tu primera toma':`${Math.abs(Math.round(finalDifference))} segundos por encima de tu primera toma`}</p><p className="mt-2 text-xs text-white/55">Comparación informativa con el tiempo en movimiento de Strava. No reemplaza la devolución técnica del entrenador.</p></div>}
    </section>
    {groupIndex?.participants>=5&&<SportRadar title="Índice deportivo grupal" subtitle={`Panorama colectivo de ${groupIndex.participants} participantes. Solo indicadores agregados, sin tiempos ni datos personales de compañeros.`} metrics={[{label:'Tomas',value:groupIndex.takes_coverage||0},{label:'Deberes',value:groupIndex.task_coverage||0},{label:'Actividad',value:groupIndex.activity_coverage||0},{label:'6K',value:groupIndex.six_k_coverage||0},{label:'12K',value:groupIndex.twelve_k_coverage||0}]}/>}
    <section className="rounded-[28px] border border-white/10 p-5"><h2 className="text-xl font-black">Cada entrenamiento cuenta.</h2><p className="mt-3 text-sm leading-6 text-white/60">Los números cuentan parte de tu historia. Lo que entrenaste, aprendiste y compartiste también forma parte de este camino. Todavía tenemos clases, clínica y momentos para seguir aprendiendo antes de la carrera.</p><p className="mt-3 text-xs text-orange-300">No es solo patinar, es pertenecer.</p></section></>}
  </div></AppLayout>
}
