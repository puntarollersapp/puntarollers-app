import {useEffect,useState} from 'react'
import AppLayout from '../layouts/AppLayout'
import {supabase} from '../lib/supabase'

export default function PRTareasNueva(){
 const [data,setData]=useState({duties:[],cycles:[],assignments:[],submissions:[]})
 const [error,setError]=useState('')
 const [busy,setBusy]=useState(true)
 const refresh=async()=>{
  setBusy(true);setError('')
  const names=[['duties','pr_training_v2_duties'],['cycles','pr_training_v2_cycles'],['assignments','pr_training_v2_assignments'],['submissions','pr_training_v2_submissions']]
  const results=await Promise.all(names.map(async ([key,table])=>({key,...await supabase.from(table).select('*').limit(500)})))
  const failures=results.filter(x=>x.error)
  if(failures.length)setError(failures.map(x=>x.key+': '+x.error.message).join(' · '))
  setData(Object.fromEntries(results.map(x=>[x.key,x.data||[]])))
  setBusy(false)
 }
 useEffect(()=>{refresh()},[])
 const ready=data.duties.filter(x=>x.active&&x.demo_ready)
 return <AppLayout><main className="mx-auto max-w-6xl px-4 py-8 text-white">
  <div className="rounded-3xl border border-white/10 bg-[#22232B] p-6">
   <p className="text-xs font-black tracking-[.2em] text-[#C4FF24]">PUNTA ROLLERS · ÁREA PRIVADA</p>
   <h1 className="mt-2 text-4xl font-black">PR TAREAS</h1>
   <p className="mt-3 text-sm text-white/65">Versión oficial en preparación. La página antigua de deberes sigue funcionando sin cambios. Aquí se consultan los registros reales de TAREAS 2.0; no se generan asignaciones ni premios de prueba.</p>
   <div className="mt-5 flex flex-wrap gap-3"><a href="/admin/pr-training-control" className="rounded-xl bg-[#C4FF24] px-4 py-3 text-sm font-black text-[#17171D]">CONTROL DOCENTE</a><button onClick={refresh} disabled={busy} className="rounded-xl border border-white/20 px-4 py-3 text-sm font-bold">{busy?'Cargando…':'Actualizar datos'}</button></div>
   {error&&<p role="alert" className="mt-4 rounded-xl border border-red-400/30 p-3 text-sm text-red-200">Acceso a datos pendiente: {error}</p>}
  </div>
  <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">{[['Ejercicios',data.duties.length],['Demos listas',ready.length],['Ciclos',data.cycles.length],['Asignaciones',data.assignments.length]].map(([name,value])=><div key={name} className="rounded-2xl border border-white/10 bg-[#22232B] p-5"><p className="text-xs text-white/60">{name}</p><p className="mt-2 text-3xl font-black">{value}</p></div>)}</div>
  <section className="mt-6 rounded-3xl border border-white/10 bg-[#22232B] p-5"><h2 className="text-xl font-black">Catálogo real de ejercicios</h2><p className="mt-1 text-xs text-white/55">Sin ejemplos simulados. Las demostraciones pendientes no se presentan como listas.</p><div className="mt-4 grid gap-3 md:grid-cols-2">{data.duties.map(d=><article key={d.id} className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="flex items-start justify-between gap-3"><h3 className="font-bold">{d.title}</h3><span className="text-xs text-[#C4FF24]">{d.level_code}</span></div><p className="mt-2 text-sm text-white/65">{d.instructions||'Instrucciones pendientes'}</p><p className="mt-3 text-xs text-white/45">{d.demo_ready?'Demostración preparada':'Demostración pendiente'} · {d.active?'Activo en catálogo':'Inactivo'}</p></article>)}</div>{!busy&&!data.duties.length&&<p className="mt-4 text-sm text-white/60">No hay ejercicios visibles para esta sesión.</p>}</section>
  <section className="mt-6 rounded-3xl border border-white/10 bg-[#22232B] p-5"><h2 className="text-xl font-black">Seguimiento y moderación</h2><p className="mt-2 text-sm text-white/65">Asignaciones: {data.assignments.length} · Entregas recibidas: {data.submissions.length} · Pendientes de revisión: {data.submissions.filter(x=>x.status==='pending'||x.status==='submitted').length}. La aprobación se habilitará únicamente tras comprobar permisos y trazabilidad docente.</p></section>
 </main></AppLayout>
}