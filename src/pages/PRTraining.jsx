import { useEffect, useMemo, useState } from 'react'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const EVENT='shifter-marathon-2026'
const CATEGORY_LABEL={ '6K':'6K', '12K':'12K' }

function Radar({values=[0,0,0,0,0]}){
  const labels=['Distancia','Resistencia','Ritmo','Constancia','Velocidad']
  const points=values.map((v,i)=>{const a=-Math.PI/2+i*Math.PI*2/5,r=78*Math.max(.06,Math.min(1,v/100));return [100+Math.cos(a)*r,100+Math.sin(a)*r]})
  const ring=(r)=>Array.from({length:5},(_,i)=>{const a=-Math.PI/2+i*Math.PI*2/5;return `${100+Math.cos(a)*r},${100+Math.sin(a)*r}`}).join(' ')
  return <div className="relative mx-auto max-w-[340px]"><svg viewBox="0 0 200 200" className="w-full overflow-visible">
    {[22,42,62,82].map(r=><polygon key={r} points={ring(r)} fill="none" stroke="rgba(255,255,255,.13)" strokeWidth="1"/> )}
    {Array.from({length:5},(_,i)=>{const a=-Math.PI/2+i*Math.PI*2/5;return <line key={i} x1="100" y1="100" x2={100+Math.cos(a)*82} y2={100+Math.sin(a)*82} stroke="rgba(255,255,255,.11)"/>})}
    <polygon points={points.map(p=>p.join(',')).join(' ')} fill="rgba(255,139,40,.25)" stroke="#ff963e" strokeWidth="2"/>
    {points.map((p,i)=><circle key={i} cx={p[0]} cy={p[1]} r="3.4" fill="#ff963e" stroke="#fff" strokeWidth="1.2"/>)}
  </svg><div className="absolute inset-0 pointer-events-none">{labels.map((l,i)=>{const a=-Math.PI/2+i*Math.PI*2/5;return <span key={l} className="absolute -translate-x-1/2 -translate-y-1/2 text-[9px] font-black uppercase tracking-[.08em] text-white/42" style={{left:`${50+Math.cos(a)*48}%`,top:`${50+Math.sin(a)*47}%`}}>{l}</span>})}</div></div>
}

export default function PRTraining(){
 const {user}=useAuth()
 const [enrollment,setEnrollment]=useState(null),[tasks,setTasks]=useState([]),[results,setResults]=useState([]),[saving,setSaving]=useState(false),[copied,setCopied]=useState('')
 const staff=['admin','profesor'].includes(user?.role)
 async function load(){
   if(!user?.id)return
   const {data:e}=await supabase.from('pr_training_enrollments').select('*').eq('profile_id',user.id).eq('event_slug',EVENT).maybeSingle()
   setEnrollment(e||null)
   if(e?.category&&e.category!=='NO'){
     const [{data:t},{data:r}]=await Promise.all([
       supabase.from('pr_training_tasks').select('*').eq('event_slug',EVENT).eq('active',true).in('category',[e.category,'ALL']).order('sort_order'),
       supabase.from('pr_training_task_results').select('*').eq('profile_id',user.id)
     ]);setTasks(t||[]);setResults(r||[])
   }
 }
 useEffect(()=>{load()},[user?.id])
 async function choose(category){
   setSaving(true)
   const {data}=await supabase.from('pr_training_enrollments').upsert({profile_id:user.id,event_slug:EVENT,category,active:category!=='NO',updated_at:new Date().toISOString()},{onConflict:'profile_id,event_slug'}).select().single()
   setEnrollment(data||{category});setSaving(false);if(category!=='NO')load()
 }
 async function copy(code){try{await navigator.clipboard.writeText(code);setCopied(code);setTimeout(()=>setCopied(''),1600)}catch{}}
 const resultMap=useMemo(()=>new Map(results.map(r=>[r.task_id,r])),[results])
 const completed=tasks.filter(t=>resultMap.get(t.id)?.status==='completed').length
 const pct=tasks.length?Math.round(completed/tasks.length*100):0
 const radar=[pct,Math.min(100,pct+8),Math.max(8,pct-6),Math.min(100,pct+3),Math.max(8,pct-12)]
 if(!enrollment)return <AppLayout title="Entrenamiento" showBack><div className="mx-auto max-w-lg px-4 pb-32 pt-5">
   <section className="overflow-hidden rounded-[34px] border border-orange-300/20 bg-[radial-gradient(circle_at_75%_0%,rgba(255,114,31,.22),transparent_38%),linear-gradient(145deg,#171016,#09090d_62%)] p-6 shadow-2xl">
    <p className="text-[10px] font-black uppercase tracking-[.24em] text-orange-300">Punta Rollers · Preparación</p><h1 className="mt-3 text-4xl font-black leading-[.92] text-white">ROAD TO<br/><span className="text-orange-400">SHIFTER.</span></h1>
    <p className="mt-5 max-w-sm text-sm leading-6 text-white/48">Vamos a acompañar tu preparación con trabajos que se validan automáticamente desde Strava.</p>
   </section>
   <section className="mt-4 rounded-[28px] border border-white/8 bg-white/[.035] p-5"><p className="text-[10px] font-black uppercase tracking-[.18em] text-white/35">¿Participás de Shifter Marathon?</p><h2 className="mt-2 text-2xl font-black">Elegí tu distancia</h2>
    <div className="mt-5 grid grid-cols-2 gap-3">{['6K','12K'].map(c=><button disabled={saving} key={c} onClick={()=>choose(c)} className="rounded-[24px] border border-orange-300/20 bg-orange-400/[.09] py-7 text-3xl font-black text-orange-300 active:scale-[.98]">{c}</button>)}</div>
    <button disabled={saving} onClick={()=>choose('NO')} className="mt-3 w-full rounded-2xl border border-white/8 bg-white/[.025] py-4 text-xs font-bold text-white/40">No voy a participar</button>
   </section></div></AppLayout>
 if(enrollment.category==='NO')return <AppLayout title="Entrenamiento" showBack><div className="mx-auto max-w-lg px-4 py-10"><div className="rounded-[30px] border border-white/8 bg-white/[.03] p-6 text-center"><p className="text-xs font-black uppercase tracking-[.18em] text-white/30">Shifter Marathon</p><h1 className="mt-3 text-2xl font-black">Marcaste que no participás.</h1><p className="mt-3 text-sm text-white/40">Este plan no aparecerá como parte de tu preparación.</p><button onClick={()=>setEnrollment(null)} className="mt-6 text-xs font-black text-orange-300">Cambiar respuesta</button></div></div></AppLayout>
 return <AppLayout title="Entrenamiento" showBack><div className="mx-auto max-w-lg px-4 pb-32 pt-4">
   <section className="rounded-[34px] border border-orange-300/15 bg-[radial-gradient(circle_at_90%_0%,rgba(255,120,32,.2),transparent_38%),linear-gradient(150deg,#181015,#09090d_65%)] p-5">
    <div className="flex items-start justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.22em] text-orange-300">Road to Shifter</p><h1 className="mt-2 text-3xl font-black">{CATEGORY_LABEL[enrollment.category]}</h1></div><span className="rounded-full border border-orange-300/20 bg-orange-300/10 px-3 py-1.5 text-[9px] font-black text-orange-200">EN PREPARACIÓN</span></div>
    <div className="mt-6 flex items-end justify-between"><div><p className="text-5xl font-black">{pct}<span className="text-xl text-white/35">%</span></p><p className="mt-1 text-[10px] font-bold uppercase tracking-[.12em] text-white/35">{completed} de {tasks.length} deberes</p></div><p className="text-right text-[10px] leading-4 text-white/30">Tu progreso se actualiza<br/>desde Strava.</p></div>
    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/7"><div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-300 transition-all" style={{width:`${pct}%`}}/></div>
   </section>
   <section className="mt-4 rounded-[28px] border border-white/8 bg-white/[.03] p-5"><p className="text-[9px] font-black uppercase tracking-[.18em] text-orange-300">Cómo funciona</p><p className="mt-2 text-sm leading-6 text-white/55">Cada deber tiene un nombre PR único. Copialo y usalo <b className="text-white/80">exactamente como nombre de tu actividad en Strava</b>. PR detectará esa actividad, comprobará las condiciones y marcará el deber automáticamente.</p></section>
   <section className="mt-4 rounded-[28px] border border-white/8 bg-[#111116] p-5"><div className="flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.18em] text-white/30">Estado de preparación</p><h2 className="mt-1 text-xl font-black">Tu mapa de progreso</h2></div><span className="text-xs font-black text-orange-300">{pct}%</span></div><Radar values={radar}/><p className="text-center text-[10px] leading-5 text-white/28">Se construirá con evidencia real de tus deberes completados.</p></section>
   <div className="mt-6 flex items-end justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.2em] text-orange-300">Plan {enrollment.category}</p><h2 className="mt-1 text-2xl font-black">Tus deberes</h2></div><span className="text-[9px] text-white/30">{tasks.length||'—'} tareas</span></div>
   {!tasks.length&&<div className="mt-3 rounded-[28px] border border-dashed border-orange-300/18 bg-orange-300/[.035] p-7 text-center"><p className="text-sm font-black">Tu plan está siendo preparado.</p><p className="mt-2 text-xs leading-5 text-white/35">Cuando Claudio cargue los deberes de {enrollment.category}, aparecerán acá automáticamente.</p></div>}
   <div className="mt-3 space-y-3">{tasks.map((t,i)=>{const r=resultMap.get(t.id),status=r?.status||'pending';return <article key={t.id} className="rounded-[28px] border border-white/8 bg-white/[.028] p-5">
    <div className="flex gap-4"><div className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-xs font-black ${status==='completed'?'bg-emerald-400 text-black':'bg-white/6 text-white/45'}`}>{status==='completed'?'✓':String(i+1).padStart(2,'0')}</div><div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-[.16em] text-white/28">Deber {String(i+1).padStart(2,'0')}</p><h3 className="mt-1 text-lg font-black">{t.title}</h3><p className="mt-2 text-xs leading-5 text-white/42">{t.description}</p></div></div>
    <div className="mt-4 rounded-2xl border border-orange-300/15 bg-orange-300/[.055] p-3"><p className="text-[8px] font-black uppercase tracking-[.18em] text-orange-200/65">Nombre exacto en Strava</p><div className="mt-2 flex items-center gap-2"><code className="min-w-0 flex-1 truncate text-xs font-black text-white">{t.strava_code}</code><button onClick={()=>copy(t.strava_code)} className="rounded-xl bg-orange-400 px-3 py-2 text-[9px] font-black text-black">{copied===t.strava_code?'COPIADO ✓':'COPIAR'}</button></div></div>
    <p className={`mt-4 text-[9px] font-black uppercase tracking-[.14em] ${status==='completed'?'text-emerald-300':status==='incomplete'?'text-amber-300':'text-white/28'}`}>{status==='completed'?'Completado automáticamente':status==='incomplete'?'Actividad detectada · objetivo incompleto':status==='detected'?'Actividad detectada · verificando':'Esperando actividad en Strava'}</p>
   </article>})}</div>
   {staff&&<div className="mt-5 rounded-[24px] border border-violet-300/15 bg-violet-300/[.04] p-4"><p className="text-[9px] font-black uppercase tracking-[.15em] text-violet-200">Vista profesor habilitada</p><p className="mt-2 text-xs text-white/40">La base ya permite seguimiento del equipo. El tablero general se completará junto con los deberes definitivos.</p></div>}
 </div></AppLayout>
}
