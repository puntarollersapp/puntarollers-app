import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import PRTrainingV2Evidence from '../components/training/PRTrainingV2Evidence'

const monthNow = () => {
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Montevideo',year:'numeric',month:'2-digit'}).format(new Date())
 return parts+'-01'
}
export default function PRTrainingV2Student({profileId}) {
 const [cycle,setCycle]=useState(null)
 const [loading,setLoading]=useState(true)
 const [error,setError]=useState('')
 const [expanded,setExpanded]=useState(null)
 const [done,setDone]=useState(false)
 async function load(){
  setLoading(true);setError('')
  const {data,error:e}=await supabase.rpc('pr_training_v2_my_cycle',{p_month:monthNow()})
  if(e)setError(e.message);else setCycle(data)
  setLoading(false)
 }
 useEffect(()=>{load()},[])
 async function discover(){
  const {data,error:e}=await supabase.rpc('pr_training_v2_discover_spin',{p_month:monthNow()})
  if(e){setError(e.message);return}
  if(data?.spin_discovered){setDone(true);await load()}
 }
 const duties=cycle?.duties||[]
 return <section className="rounded-[24px] bg-[#222328] p-5 text-[#EFF8FF]">
  <h2 className="text-2xl font-black">Mis deberes</h2>
  {loading?<p className="mt-3 text-sm">Cargando…</p>:error?<p role="alert" className="mt-3 text-sm text-[#FF0055]">{error}</p>:cycle?.status==='ready'?<>
   {!cycle.spin_discovered&&!done?<div className="mt-5 rounded-2xl bg-white/5 p-5"><p className="text-sm">Tus seis deberes del mes ya están preparados.</p><button type="button" onClick={discover} className="mt-3 rounded-full bg-[#BBFF1F] px-5 py-3 font-bold text-[#0D0303]">Descubrir mis deberes</button></div>:<div className="mt-4 space-y-3">{duties.map(d=><article key={d.slot} className="rounded-2xl border border-white/10 p-4"><button type="button" onClick={()=>setExpanded(expanded===d.slot?null:d.slot)} className="flex w-full items-center justify-between text-left font-bold"><span>{d.slot}. {d.title}</span><span>{expanded===d.slot?'−':'+'}</span></button>{expanded===d.slot&&<div className="mt-4"><p className="whitespace-pre-line text-sm text-white/70">{d.instructions}</p>{d.evidence_type==='strava'?<p className="mt-4 text-xs text-white/50">Este deber se verifica con Strava.</p>:<PRTrainingV2Evidence profileId={profileId} assignmentDutyId={d.assignment_duty_id} onSubmitted={load}/>}</div>}</article>)}</div>}
  </>:<p className="mt-4 text-sm text-white/60">{cycle?.status==='needs_review'?'Estamos preparando tus deberes.':'Todavía no hay un ciclo disponible.'}</p>}
 </section>
}
