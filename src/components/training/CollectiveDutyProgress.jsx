import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

// Solo resultados aprobados del ciclo visible actual; no muestra evidencias privadas.
export default function CollectiveDutyProgress() {
 const [state,setState]=useState({loading:true,rows:[],total:0,error:false})
 useEffect(()=>{
  let alive=true
  async function load(){
   const month=new Date().toISOString().slice(0,7)
   const {data:cycles,error:cycleError}=await supabase.from('pr_training_v2_cycles').select('id,cycle_month').eq('is_visible',true).order('cycle_month',{ascending:false}).limit(12)
   if(cycleError){if(alive)setState({loading:false,rows:[],total:0,error:true});return}
   const cycle=(cycles||[]).find(c=>String(c.cycle_month||'').startsWith(month))
   if(!cycle){if(alive)setState({loading:false,rows:[],total:0,error:false});return}
   const {data:assignments,error:assignmentError}=await supabase.from('pr_training_v2_assignments').select('id,profile_id').eq('cycle_id',cycle.id).limit(1000)
   if(assignmentError){if(alive)setState({loading:false,rows:[],total:0,error:true});return}
   const ids=(assignments||[]).map(a=>a.id)
   if(!ids.length){if(alive)setState({loading:false,rows:[],total:0,error:false});return}
   const {data:slots,error:slotError}=await supabase.from('pr_training_v2_assignment_duties').select('id,assignment_id,slot').in('assignment_id',ids).limit(6000)
   if(slotError){if(alive)setState({loading:false,rows:[],total:0,error:true});return}
   const primary=(slots||[]).filter(s=>Number(s.slot)>=1&&Number(s.slot)<=6)
   const slotIds=primary.map(s=>s.id)
   const {data:approved,error:submissionError}=slotIds.length?await supabase.from('pr_training_v2_submissions').select('assignment_duty_id').in('assignment_duty_id',slotIds).eq('status','approved').limit(6000):{data:[],error:null}
   if(submissionError){if(alive)setState({loading:false,rows:[],total:0,error:true});return}
   const approvedIds=new Set((approved||[]).map(s=>s.assignment_duty_id))
   const byAssignment=new Map()
   for(const slot of primary){const entry=byAssignment.get(slot.assignment_id)||{slots:new Set(),done:new Set()};entry.slots.add(slot.slot);if(approvedIds.has(slot.id))entry.done.add(slot.slot);byAssignment.set(slot.assignment_id,entry)}
   const profileIds=[...new Set((assignments||[]).map(a=>a.profile_id).filter(Boolean))]
   const {data:profiles}=profileIds.length?await supabase.from('profiles').select('id,nombre,apellido,foto').in('id',profileIds.slice(0,1000)):{data:[]}
   const profileMap=new Map((profiles||[]).map(p=>[p.id,p]))
   const people=(assignments||[]).map(a=>{const p=profileMap.get(a.profile_id);const progress=byAssignment.get(a.id);return {id:a.profile_id,name:[p?.nombre,p?.apellido].filter(Boolean).join(' ')||'Integrante PR',photo:p?.foto||null,done:progress?.done.size||0,total:progress?.slots.size||0}}).filter(p=>p.total>0&&profileMap.has(p.id)).sort((a,b)=>b.done-a.done||a.name.localeCompare(b.name,'es'))
   if(alive)setState({loading:false,rows:people,total:people.reduce((n,p)=>n+p.done,0),error:false})
  }
  load();return()=>{alive=false}
 },[])
 if(state.loading||state.error||!state.rows.length)return null
 const max=state.rows.reduce((n,p)=>n+p.total,0)
 const percent=max?Math.round(state.total/max*100):0
 return <section aria-label="Así avanza PR" className="mx-3 my-6 rounded-[28px] border border-[#FF0055]/30 bg-[#1D1721] p-5 text-white sm:p-6">
  <p className="text-[10px] font-black uppercase tracking-[.18em] text-[#FF88B0]">JUNTOS SUMAMOS RUEDAS</p>
  <div className="mt-2 flex items-end justify-between gap-3"><div><h2 className="text-2xl font-black">Así avanza PR</h2><p className="mt-1 text-xs text-white/55">Deberes aprobados este mes · sin ranking</p></div><strong className="text-3xl font-black text-[#FF88B0]">{percent}%</strong></div>
  <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#FF0055]" style={{width:percent+'%'}}/></div>
  <p className="mt-2 text-xs text-white/55">{state.total} de {max} deberes aprobados entre {state.rows.length} integrantes</p>
  <div className="mt-5 grid gap-3 sm:grid-cols-2">{state.rows.map(p=><div key={p.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.04] p-3">{p.photo?<img src={p.photo} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover"/>:<div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#FF0055]/20 text-xs font-black">PR</div>}<div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><span className="truncate text-xs font-bold">{p.name}</span><span className="shrink-0 text-xs font-black text-[#FF88B0]">{p.done}/{p.total}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#FF0055]" style={{width:(100*p.done/p.total)+'%'}}/></div></div></div>)}</div>
 </section>
}
