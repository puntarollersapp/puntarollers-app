import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import PRTrainingV2Evidence from '../components/training/PRTrainingV2Evidence'
import PRTrainingV2Spin from '../components/training/PRTrainingV2Spin'

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
 const [discovering,setDiscovering]=useState(false)
 const [detailsOpen,setDetailsOpen]=useState(false)
 async function load(){
  setLoading(true);setError('')
  const {data,error:e}=await supabase.rpc('pr_training_v2_my_cycle',{p_month:monthNow()})
  if(e)setError(e.message);else if(data?.status==='ready'){
   const details=await supabase.rpc('pr_training_v2_student_assignments',{p_month:monthNow()})
   if(details.error)setError(details.error.message);else setCycle(details.data)
  }else setCycle(data)
  setLoading(false)
 }
 useEffect(()=>{load()},[])
 async function discover(){
  if(discovering)return
  setDiscovering(true)
  const {data,error:e}=await supabase.rpc('pr_training_v2_discover_spin',{p_month:monthNow()})
  if(e)setError(e.message)
  else if(data?.spin_discovered){setDone(true);await load()}
  else setError('No se pudo guardar el descubrimiento.')
  setDiscovering(false)
 }
 const duties=cycle?.duties||[]
 const submitted=duties.filter(d=>['submitted','under_review','approved','returned'].includes(d.latest_status)).length
 const approved=duties.filter(d=>d.latest_status==='approved').length
 return <section className="rounded-[24px] bg-[#222328] p-5 text-[#EFF8FF]">
  <h2 className="text-2xl font-black">Mis deberes</h2>
  {cycle?.status==='ready'&&<p className="mt-2 text-sm text-[#BBFF1F]">{submitted} de 6 enviados · {approved} aprobados</p>}
  {cycle?.status==='ready'&&cycle.spin_discovered&&<div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#BBFF1F] transition-all" style={{width:(submitted/6*100)+'%'}}/></div>}
  {loading?<p className="mt-3 text-sm">Cargando…</p>:error?<p role="alert" className="mt-3 text-sm text-[#FF0055]">{error}</p>:cycle?.status==='ready'?<>
   {!cycle.spin_discovered&&!done?<PRTrainingV2Spin duties={duties} onComplete={discover}/>:<div className="mt-4 space-y-3">{duties.map(d=><article key={d.slot} className="rounded-2xl border border-white/10 p-4"><button type="button" onClick={()=>setExpanded(expanded===d.slot?null:d.slot)} className="flex w-full items-center justify-between text-left font-bold"><span>{d.slot}. {d.title} {d.latest_status==='approved'?'✓ Aprobado':d.latest_status==='returned'?'· Corregir':d.latest_status==='under_review'?'· En revisión':d.latest_status?'· Enviado':''}</span><span>{expanded===d.slot?'−':'+'}</span></button>{expanded===d.slot&&<div className="mt-4"><p className="whitespace-pre-line text-sm text-white/70">{d.instructions}</p>{d.latest_status==='approved'?<p className="mt-4 text-sm text-[#BBFF1F]">Deber aprobado. No necesitás volver a enviarlo.</p>:d.latest_status==='submitted'||d.latest_status==='under_review'?<p className="mt-4 text-sm text-white/60">Tu evidencia está recibida. Esperá la revisión antes de volver a enviarla.</p>:d.evidence_type==='strava'?<p className="mt-4 text-xs text-white/50">Este deber se verifica con Strava.</p> :d.assignment_duty_id?<PRTrainingV2Evidence profileId={profileId} assignmentDutyId={d.assignment_duty_id} onSubmitted={load}/>:<p className="mt-4 text-xs text-white/50">El envío estará disponible cuando se complete la conexión con la asignación.</p>}</div>}</article>)}</div>}
  </>:<p className="mt-4 text-sm text-white/60">{cycle?.status==='needs_review'?'Estamos preparando tus deberes.':'Todavía no hay un ciclo disponible.'}</p>}
 </section>
}
