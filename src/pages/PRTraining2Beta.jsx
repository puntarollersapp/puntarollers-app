import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const B1=[
 {code:'B1-01',title:'Medio limón · Izquierdo',type:'VIDEO',objective:'Controlar el impulso con el lado izquierdo.',work:'Patín izquierdo + calzado derecho. Repeticiones según indicación del profe.',delivery:'Enviá una ejecución final clara.',demo:'PRT-VID-001'},
 {code:'B1-02',title:'Medio limón · Derecho',type:'VIDEO',objective:'Controlar el impulso con el lado derecho.',work:'Patín derecho + calzado izquierdo. Repeticiones según indicación del profe.',delivery:'Enviá una ejecución final clara.',demo:'PRT-VID-002'},
 {code:'B1-03',title:'Línea recta · Izquierdo',type:'VIDEO',objective:'Trabajar dirección y estabilidad con el lado izquierdo.',work:'Patín izquierdo + calzado derecho. Base: 5 pasadas cortas; editable por el profe.',delivery:'Enviá las últimas 2 pasadas o un clip corto.',demo:'PRT-VID-003'},
 {code:'B1-04',title:'Línea recta · Derecho',type:'VIDEO',objective:'Trabajar dirección y estabilidad con el lado derecho.',work:'Patín derecho + calzado izquierdo. Base: 5 pasadas cortas; editable por el profe.',delivery:'Enviá las últimas 2 pasadas o un clip corto.',demo:'PRT-VID-004'}
]

function Wheel({spinning,onSpin}){
 return <div className="relative mx-auto grid h-64 w-64 place-items-center">
  <div className="absolute -inset-8 rounded-full bg-violet-500/20 blur-3xl"/><div className="absolute -top-3 z-20 h-0 w-0 border-x-[13px] border-x-transparent border-t-[24px] border-t-white"/>
  <div className={`relative h-60 w-60 overflow-hidden rounded-full border border-white/20 bg-[conic-gradient(from_22.5deg,#7c3aed_0_45deg,#111827_45deg_90deg,#a855f7_90deg_135deg,#171717_135deg_180deg,#6d28d9_180deg_225deg,#111827_225deg_270deg,#9333ea_270deg_315deg,#171717_315deg_360deg)] shadow-[0_0_0_8px_rgba(139,92,246,.08),0_0_55px_rgba(124,58,237,.45)] transition-transform duration-[1400ms] ease-[cubic-bezier(.16,.84,.24,1)] ${spinning?'rotate-[1080deg]':''}`}>
   {Array.from({length:8},(_,i)=><span key={i} className="absolute left-1/2 top-1/2 text-[10px] font-black tracking-[.16em] text-white/80" style={{transform:`rotate(${i*45}deg) translateY(-91px) translateX(-50%)`}}>{'PR'}</span>)}
   <button onClick={onSpin} disabled={spinning} className="absolute left-1/2 top-1/2 grid h-24 w-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/85 shadow-2xl"><span><b className="block text-2xl font-black">PR</b><small className="text-[8px] font-black uppercase tracking-[.2em] text-violet-300">Spin</small></span></button>
  </div>
 </div>
}

function DutyCard({d,i}){
 return <article className="relative overflow-hidden rounded-[26px] border border-white/[.08] bg-white/[.045] p-4 shadow-xl">
  <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-violet-500/10 blur-2xl"/>
  <div className="flex gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-violet-500/15 text-sm font-black text-violet-200">{String(i+1).padStart(2,'0')}</span><div className="min-w-0 flex-1">
   <div className="flex items-start justify-between gap-2"><div><p className="text-[8px] font-black uppercase tracking-[.18em] text-white/25">{d.code}</p><h3 className="mt-1 font-black leading-tight">{d.title}</h3></div><span className="rounded-full border border-fuchsia-300/15 bg-fuchsia-400/10 px-2 py-1 text-[8px] font-black text-fuchsia-200">{d.type}</span></div>
   <p className="mt-2 text-[11px] leading-5 text-white/50">{d.objective}</p>
   <div className="mt-3 rounded-2xl bg-black/25 p-3"><p className="text-[8px] font-black uppercase tracking-[.16em] text-violet-300">Qué hacer</p><p className="mt-1 text-[10px] leading-4 text-white/55">{d.work}</p></div>
   <div className="mt-2 grid grid-cols-2 gap-2"><div className="rounded-2xl border border-white/[.06] p-3"><p className="text-[8px] font-black uppercase tracking-wider text-white/30">Demo</p><p className="mt-1 text-[9px] font-bold text-white/60">{d.demo}</p></div><div className="rounded-2xl border border-white/[.06] p-3"><p className="text-[8px] font-black uppercase tracking-wider text-white/30">Entrega</p><p className="mt-1 text-[9px] leading-4 text-white/60">{d.delivery}</p></div></div>
   <div className="mt-3 flex items-center justify-between"><span className="text-[9px] font-black text-white/25">0 / 1</span><span className="text-[9px] font-black text-violet-300">PENDIENTE</span></div>
  </div></div>
 </article>
}

export default function PRTraining2Beta(){
 const {user}=useAuth()
 const [assignment,setAssignment]=useState(null); const [duties,setDuties]=useState([]); const [revealed,setRevealed]=useState(0); const [spinning,setSpinning]=useState(false); const [loading,setLoading]=useState(true); const [loadError,setLoadError]=useState('')
 useEffect(()=>{let alive=true;(async()=>{
   if(!user?.id)return
   setLoading(true);setLoadError('')
   const {data:a,error:ae}=await supabase.from('pr_training_assignments_v2').select('id,target_duty_count,spin_reveal_progress,spin_discovered_at,pr_training_cycles_v2!inner(cycle_key,title)').eq('profile_id',user.id).eq('pr_training_cycles_v2.cycle_key','2026-11').maybeSingle()
   if(!alive)return
   if(ae||!a){setLoadError('Todavía no hay una asignación preparada para este ciclo.');setLoading(false);return}
   const {data:rows,error:de}=await supabase.from('pr_training_assignment_duties_v2').select('position,duty_code_snapshot,duty_snapshot').eq('assignment_id',a.id).order('position')
   if(!alive)return
   if(de||!rows?.length){setLoadError('No pudimos cargar tus deberes.');setLoading(false);return}
   setAssignment(a);setDuties(rows.map(r=>({code:r.duty_code_snapshot,title:r.duty_snapshot?.title||r.duty_code_snapshot,type:String(r.duty_snapshot?.evidenceType||'video').toUpperCase(),objective:r.duty_snapshot?.objective||'',work:r.duty_snapshot?.workSpec?.instruction||r.duty_snapshot?.workSpec?.description||'',delivery:r.duty_snapshot?.deliverySpec?.instruction||'',demo:(r.duty_snapshot?.demoAssetIds||[])[0]||'—'})));setRevealed(Math.min(Number(a.spin_reveal_progress||0),rows.length));setLoading(false)
 })();return()=>{alive=false}},[user?.id])
 if(!user)return <Navigate to="/beta/login" replace/>; if(user.role!=='beta')return <Navigate to="/app/deberes" replace/>
 async function persistReveal(n){
   if(!assignment?.id)return false
   const patch={spin_reveal_progress:n}
   if(n>=duties.length)patch.spin_discovered_at=new Date().toISOString()
   const {error}=await supabase.from('pr_training_assignments_v2').update(patch).eq('id',assignment.id)
   if(error){setLoadError('No pudimos guardar el avance de PR SPIN.');return false}
   return true
 }
 function spin(){if(spinning||revealed>=duties.length)return;setSpinning(true);window.setTimeout(async()=>{const n=Math.min(revealed+1,duties.length);if(await persistReveal(n))setRevealed(n);setSpinning(false)},1450)}
 const done=duties.length>0&&revealed===duties.length
 if(loading)return <main className="min-h-screen bg-[#07070b] text-white grid place-items-center"><p className="text-xs font-black tracking-[.2em] text-violet-300">CARGANDO PR TRAINING…</p></main>
 if(loadError)return <main className="min-h-screen bg-[#07070b] text-white grid place-items-center p-6"><div className="max-w-sm rounded-3xl border border-white/10 bg-white/5 p-6 text-center"><h1 className="font-black">PR TRAINING 2.0</h1><p className="mt-3 text-sm text-white/55">{loadError}</p></div></main>
 return <main className="min-h-screen bg-[#07070b] text-white"><div className="mx-auto max-w-[520px] px-4 pb-24 pt-6">
  <header className="flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.28em] text-violet-300">Punta Rollers · Beta</p><h1 className="mt-1 text-2xl font-black tracking-tight">PR TRAINING <span className="text-violet-400">2.0</span></h1></div><span className="rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-1 text-[9px] font-black text-violet-200">BETA</span></header>
  {!done?<section className="mt-6 overflow-hidden rounded-[36px] border border-violet-300/15 bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,.26),transparent_38%),linear-gradient(180deg,#12111b,#09090e)] p-5 shadow-2xl">
   <div className="text-center"><p className="text-[10px] font-black uppercase tracking-[.28em] text-white/35">Noviembre 2026</p><h2 className="mt-2 text-3xl font-black leading-none">DESCUBRÍ TUS<br/><span className="text-violet-300">DEBERES.</span></h2><p className="mx-auto mt-3 max-w-xs text-xs leading-5 text-white/45">Este ciclo de prueba tiene 4 deberes. PR SPIN los revela y mantiene tu selección guardada durante todo el mes.</p></div><div className="mt-6"><Wheel spinning={spinning} onSpin={spin}/></div>
   <button onClick={spin} disabled={spinning} className="mt-6 w-full rounded-[22px] bg-gradient-to-r from-violet-600 via-fuchsia-500 to-violet-500 py-4 text-sm font-black shadow-[0_12px_35px_rgba(139,92,246,.28)] disabled:opacity-60">{spinning?'DESCUBRIENDO…':revealed?'DESCUBRIR SIGUIENTE':'GIRAR PR SPIN'}</button><p className="mt-3 text-center text-[10px] font-bold text-white/35">{revealed} / {duties.length} descubiertos</p>
  </section>:<section className="mt-6 rounded-[34px] border border-violet-300/15 bg-[radial-gradient(circle_at_90%_0%,rgba(168,85,247,.22),transparent_35%),#101016] p-5"><p className="text-[9px] font-black uppercase tracking-[.25em] text-violet-300">Ciclo descubierto</p><h2 className="mt-2 text-3xl font-black">MIS DEBERES</h2><div className="mt-4 flex items-end justify-between"><p className="text-xs text-white/45">Noviembre · 4 deberes</p><p className="text-2xl font-black">0<span className="text-white/25">/{duties.length}</span></p></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full w-0 rounded-full bg-violet-400"/></div></section>}
  {revealed>0&&<section className="mt-4 space-y-3">{duties.slice(0,revealed).map((d,i)=><DutyCard key={d.code} d={d} i={i}/>)}</section>}
  <footer className="mt-6 text-center text-[9px] font-bold uppercase tracking-[.18em] text-white/20">Beta aislada · Staging · asignación persistida</footer>
 </div></main>
}