import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

const B1=[
  {code:'B1-01',title:'Primer contacto',type:'VIDEO',copy:'Practicá el fundamento y enviá tu evidencia para revisión.'},
  {code:'B1-02',title:'Control y postura',type:'VIDEO',copy:'Mostrá una ejecución clara y controlada de la técnica.'},
  {code:'B1-03',title:'Tiempo sobre ruedas',type:'STRAVA',copy:'Registrá la actividad con Strava para validar el entrenamiento.'},
  {code:'B1-04',title:'Fundamentos B1',type:'VIDEO',copy:'Grabá la evidencia solicitada para que el equipo la apruebe.'}
]

function Wheel({spinning,onSpin}){
 const slices=['B1','PR','B1','PR','B1','PR','B1','PR']
 return <div className="relative mx-auto grid h-64 w-64 place-items-center">
   <div className="absolute -inset-7 rounded-full bg-violet-500/20 blur-3xl"/>
   <div className="absolute -top-3 z-20 h-0 w-0 border-x-[13px] border-x-transparent border-t-[24px] border-t-white drop-shadow-[0_0_12px_rgba(255,255,255,.8)]"/>
   <div className={`relative h-60 w-60 overflow-hidden rounded-full border border-white/20 bg-[conic-gradient(from_22.5deg,#7c3aed_0_45deg,#111827_45deg_90deg,#a855f7_90deg_135deg,#171717_135deg_180deg,#6d28d9_180deg_225deg,#111827_225deg_270deg,#9333ea_270deg_315deg,#171717_315deg_360deg)] shadow-[0_0_0_8px_rgba(139,92,246,.08),0_0_55px_rgba(124,58,237,.45)] transition-transform duration-[1400ms] ease-[cubic-bezier(.16,.84,.24,1)] ${spinning?'rotate-[1080deg]':''}`}>
     {slices.map((x,i)=><span key={i} className="absolute left-1/2 top-1/2 text-[11px] font-black tracking-[.18em] text-white/85" style={{transform:`rotate(${i*45}deg) translateY(-91px) translateX(-50%)`}}>{x}</span>)}
     <button onClick={onSpin} disabled={spinning} className="absolute left-1/2 top-1/2 grid h-24 w-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/80 text-center shadow-2xl backdrop-blur-xl disabled:opacity-80">
       <span><b className="block text-2xl font-black">PR</b><small className="text-[8px] font-black uppercase tracking-[.2em] text-violet-300">Spin</small></span>
     </button>
   </div>
 </div>
}

export default function PRTraining2Beta(){
 const {user}=useAuth()
 const key=user?.id?'pr-training2-beta-spin:'+user.id:'pr-training2-beta-spin'
 const initial=useMemo(()=>{try{return Number(localStorage.getItem(key)||0)}catch{return 0}},[key])
 const [revealed,setRevealed]=useState(Math.min(initial,B1.length))
 const [spinning,setSpinning]=useState(false)
 if(!user)return <Navigate to="/beta/login" replace/>
 if(user.role!=='beta')return <Navigate to="/app/deberes" replace/>
 function spin(){
   if(spinning||revealed>=B1.length)return
   setSpinning(true)
   window.setTimeout(()=>{setRevealed(v=>{const n=Math.min(v+1,B1.length);localStorage.setItem(key,String(n));return n});setSpinning(false)},1450)
 }
 const done=revealed===B1.length
 return <main className="min-h-screen bg-[#07070b] text-white">
  <div className="mx-auto max-w-[520px] px-4 pb-24 pt-6">
   <header className="flex items-center justify-between">
    <div><p className="text-[9px] font-black uppercase tracking-[.28em] text-violet-300">Punta Rollers · Beta</p><h1 className="mt-1 text-2xl font-black tracking-tight">PR TRAINING <span className="text-violet-400">2.0</span></h1></div>
    <span className="rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-1 text-[9px] font-black text-violet-200">B1 · PRUEBA</span>
   </header>

   {!done?<section className="mt-6 overflow-hidden rounded-[36px] border border-violet-300/15 bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,.26),transparent_38%),linear-gradient(180deg,#12111b,#09090e)] p-5 shadow-2xl">
    <div className="text-center"><p className="text-[10px] font-black uppercase tracking-[.28em] text-white/35">Noviembre 2026</p><h2 className="mt-2 text-3xl font-black leading-none">DESCUBRÍ TUS<br/><span className="text-violet-300">DEBERES.</span></h2><p className="mx-auto mt-3 max-w-xs text-xs leading-5 text-white/45">Tu ciclo se revela una sola vez. Cada giro descubre uno de tus deberes del mes.</p></div>
    <div className="mt-6"><Wheel spinning={spinning} onSpin={spin}/></div>
    <button onClick={spin} disabled={spinning} className="mt-6 w-full rounded-[22px] bg-gradient-to-r from-violet-600 via-fuchsia-500 to-violet-500 py-4 text-sm font-black shadow-[0_12px_35px_rgba(139,92,246,.28)] disabled:opacity-60">{spinning?'DESCUBRIENDO…':revealed?'GIRAR DE NUEVO':'GIRAR PR SPIN'}</button>
    <p className="mt-3 text-center text-[10px] font-bold text-white/35">{revealed} / {B1.length} descubiertos</p>
   </section>:<section className="mt-6 rounded-[34px] border border-violet-300/15 bg-[radial-gradient(circle_at_90%_0%,rgba(168,85,247,.22),transparent_35%),#101016] p-5">
    <p className="text-[9px] font-black uppercase tracking-[.25em] text-violet-300">Ciclo descubierto</p><h2 className="mt-2 text-3xl font-black">MIS DEBERES</h2><p className="mt-2 text-xs text-white/45">Noviembre · B1 · {B1.length} deberes asignados</p>
   </section>}

   {revealed>0&&<section className="mt-4 space-y-3">
    {B1.slice(0,revealed).map((d,i)=><article key={d.code} className="relative overflow-hidden rounded-[26px] border border-white/[.08] bg-white/[.045] p-4 shadow-xl">
      <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-violet-500/10 blur-2xl"/>
      <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-violet-500/15 text-sm font-black text-violet-200">{String(i+1).padStart(2,'0')}</span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><h3 className="font-black">{d.title}</h3><span className="rounded-full border border-white/10 bg-black/25 px-2 py-1 text-[8px] font-black text-white/50">{d.type}</span></div><p className="mt-1 text-[11px] leading-5 text-white/45">{d.copy}</p><div className="mt-3 flex items-center justify-between"><span className="text-[9px] font-black uppercase tracking-wider text-white/30">{d.code}</span><span className="text-[9px] font-black text-violet-300">PENDIENTE</span></div></div></div>
    </article>)}
   </section>}
   <footer className="mt-6 text-center text-[9px] font-bold uppercase tracking-[.18em] text-white/20">Preview aislada · no publicada</footer>
  </div>
 </main>
}