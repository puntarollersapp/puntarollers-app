import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { duoProgressPercent } from '../../lib/prDuoRules'

/** Read-only staff laboratory: real assigned duties and review states, no writes. */
export default function PRTrainingLiveAudit(){
 const [data,setData]=useState(null)
 const [error,setError]=useState('')
 const [loading,setLoading]=useState(false)
 const [refresh,setRefresh]=useState(0)
 useEffect(()=>{
  let active=true
  async function load(){
   setLoading(true);setError('')
   try{
    const [cycles,assignments]=await Promise.all([
     supabase.from('pr_training_v2_cycles').select('id,cycle_month,is_visible,assignments_enabled').order('cycle_month',{ascending:false}).limit(4),
     supabase.from('pr_training_v2_assignments').select('id,cycle_id,profile_id,level_code,spin_discovered').limit(500)
    ])
    if(cycles.error)throw cycles.error
    if(assignments.error)throw assignments.error
    const rows=assignments.data||[]
    const ids=rows.map(r=>r.id)
    const duties=ids.length?await supabase.from('pr_training_v2_assignment_duties').select('id,assignment_id,duty_id,slot').in('assignment_id',ids).limit(3000):{data:[],error:null}
    if(duties.error)throw duties.error
    const dutyIds=(duties.data||[]).map(r=>r.id)
    const submissions=dutyIds.length?await supabase.from('pr_training_v2_submissions').select('id,assignment_duty_id,profile_id,status').in('assignment_duty_id',dutyIds).limit(5000):{data:[],error:null}
    if(submissions.error)throw submissions.error
    const dutyByAssignment=new Map()
    for(const d of duties.data||[])dutyByAssignment.set(d.assignment_id,[...(dutyByAssignment.get(d.assignment_id)||[]),d])
    const submissionByDuty=new Map()
    for(const s of submissions.data||[]){
      const key=s.assignment_duty_id+':'+s.profile_id
      const previous=submissionByDuty.get(key)
      // Preserve approval if duplicate submissions exist; never count one duty twice.
      if(!previous||s.status==='approved'||previous.status!=='approved')submissionByDuty.set(key,s)
    }
    const approved=new Set([...submissionByDuty.entries()].filter(([,s])=>s.status==='approved').map(([key])=>key))
    const perCycle=new Map()
    for(const a of rows){
      const ds=dutyByAssignment.get(a.id)||[]
      const done=ds.filter(d=>approved.has(d.id+':'+a.profile_id)).length
      const k=a.cycle_id
      const entry=perCycle.get(k)||{assignments:0,approved:0,assigned:0,levelCounts:{},states:{approved:0,submitted:0,rejected:0,pending:0}}
      entry.assignments++;entry.approved+=done;entry.assigned+=ds.length;entry.levelCounts[a.level_code]=(entry.levelCounts[a.level_code]||0)+1
      for(const d of ds){
       const s=submissionByDuty.get(d.id+':'+a.profile_id)
       const state=s?.status==='approved'?'approved':s?.status==='rejected'?'rejected':s?'submitted':'pending'
       entry.states[state]++
      }
      perCycle.set(k,entry)
    }
    if(active)setData({cycles:cycles.data||[],byCycle:perCycle,assignmentCount:rows.length,dutyCount:(duties.data||[]).length,submissionCount:(submissions.data||[]).length,truncated:rows.length===500||(duties.data||[]).length===3000||(submissions.data||[]).length===5000})
   }catch(e){if(active)setError(e.message||'No se pudieron consultar los datos.')}
   finally{if(active)setLoading(false)}
  }
  load()
  return()=>{active=false}
 },[refresh])
 return <section className="mx-4 mt-5 rounded-[24px] border border-white/15 bg-[#22232B] p-4 text-white sm:p-6" aria-label="Auditoría de conexiones reales de Tareas">
 <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-black tracking-[.18em] text-[#4EE8CE]">CONEXIONES REALES · SOLO LECTURA</p><h2 className="mt-1 text-xl font-black">Estado de TAREAS</h2></div><button type="button" onClick={()=>setRefresh(v=>v+1)} disabled={loading} className="rounded-xl border border-white/20 px-3 py-2 text-xs font-bold disabled:opacity-50">Actualizar</button></div>
 <p className="mt-2 text-xs leading-relaxed text-white/55">Consulta asignaciones y aprobaciones reales visibles para tu sesión. No muestra nombres ni evidencias, y no modifica alumnos.</p>
 {loading&&<p className="mt-4 text-sm text-white/65">Consultando…</p>}
 {error&&<p role="alert" className="mt-4 rounded-xl border border-[#FF7890]/30 bg-[#FF7890]/10 p-3 text-xs text-[#FFB5C3]">Sin acceso a datos: {error}. Revisar permisos RLS; no se usan credenciales administrativas en el navegador.</p>}
 {data&&!loading&&<div className="mt-4 grid gap-3 sm:grid-cols-2">{data.cycles.map(c=>{const s=data.byCycle.get(c.id)||{assignments:0,approved:0,assigned:0,levelCounts:{},states:{approved:0,submitted:0,rejected:0,pending:0}};return <div key={c.id} className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-xs font-black text-[#C4FF24]">{c.cycle_month}</p><p className="mt-2 text-2xl font-black tabular-nums">{s.assignments} <span className="text-xs font-medium text-white/55">asignaciones</span></p><p className="mt-2 text-sm text-white/75">{s.approved} / {s.assigned} deberes aprobados</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-[#C4FF24]" style={{width:(duoProgressPercent(s.approved,s.assigned)||0)+'%'}}/></div><div className="mt-4 grid grid-cols-2 gap-2">{[['approved','Aprobados','#C4FF24'],['submitted','En revisión','#57E7DA'],['rejected','Para corregir','#FF72A6'],['pending','Sin entregar','#A3A3AD']].map(([state,label,color])=><div key={state} className="rounded-xl border border-white/10 bg-white/[.035] p-3"><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{background:color}}/><span className="text-[11px] text-white/65">{label}</span></div><p className="mt-2 text-2xl font-black tabular-nums" style={{color}}>{s.states[state]}</p></div>)}</div>
 <p className="mt-3 text-xs leading-relaxed text-white/55">Los estados muestran el avance del ciclo. Una entrega enviada todavía necesita revisión; una tarea para corregir puede volver a presentarse.</p>
 <p className="mt-3 text-[11px] text-white/55">Visible: {String(c.is_visible)} · Asignación activa: {String(c.assignments_enabled)}</p><p className="mt-1 text-[11px] text-white/55">Niveles: {Object.entries(s.levelCounts).map(([k,v])=>k+': '+v).join(' · ')||'Sin asignaciones'}</p></div>})}<div className="rounded-2xl border border-dashed border-white/20 p-4"><p className="text-xs font-black text-[#4EE8CE]">INTEGRIDAD DE CONSULTA</p><p className="mt-2 text-sm text-white/75">{data.assignmentCount} asignaciones · {data.dutyCount} deberes · {data.submissionCount} entregas consultadas</p><p className="mt-2 text-xs text-white/50">{data.truncated?'Límite de consulta alcanzado: totales parciales.':'Totales de las filas accesibles para esta sesión; sujetos a RLS. Cero registros no confirma que la base esté vacía.'}</p></div></div>}
 </section>
}
