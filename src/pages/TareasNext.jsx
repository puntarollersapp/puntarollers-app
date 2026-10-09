import SpinPreview from '../components/training/SpinPreview'
import {useEffect,useState} from 'react'
import AppLayout from '../layouts/AppLayout'

const MONTHS=[{id:'2026-11',label:'NOVIEMBRE 2026'},{id:'2026-12',label:'DICIEMBRE 2026'}]
const STAGES=[['01','DESCUBRÍ','Una revelación mensual de seis deberes con PR SPIN'],['02','ENTRENÁ','Practicá los ejercicios asignados a tu nivel'],['03','ENVIÁ','Adjuntá la evidencia solicitada: foto, video o Strava'],['04','RECIBÍ TU REVISIÓN','Claudio o David aprueban y califican tu trabajo']]
const storageKey=(month)=>'pr-next-supervision-spin-'+month
function readSeen(month){try{return window.localStorage.getItem(storageKey(month))==='1'}catch{return false}}
export default function TareasNext(){
 const [month,setMonth]=useState('2026-11')
 const [seen,setSeen]=useState(()=>readSeen('2026-11'))
 const [revealed,setRevealed]=useState(0)
 const [showGuide,setShowGuide]=useState(false)
 useEffect(()=>{setSeen(readSeen(month));setRevealed(0)},[month])
 function reveal(){setRevealed(6);setSeen(true);try{window.localStorage.setItem(storageKey(month),'1')}catch{}}
 return <AppLayout title="PR Training 2.0"><main className="mx-auto max-w-[760px] space-y-5 px-4 pb-32 pt-5 text-white">
 <section className="relative overflow-hidden rounded-[34px] border border-lime-300/20 bg-gradient-to-br from-[#202715] via-[#11150e] to-[#0b0c11] p-6">
 <p className="text-[11px] font-black tracking-[.22em] text-lime-200/70">PR TRAINING 2.0 · NEW SEASON</p>
 <h1 className="mt-8 text-[40px] font-black leading-[.98]">Seis desafíos.<br/><span className="text-lime-200/80">Tu evolución.</span></h1>
 <p className="mt-5 max-w-md text-[13px] leading-6 text-white/65">Un ciclo nuevo cada mes. Descubrí tus tareas, practicá, enviá evidencias y recibí devoluciones de tus profesores.</p>
 <div className="mt-7 rounded-2xl border border-lime-200/15 bg-black/25 p-4"><p className="text-[11px] font-black tracking-[.18em] text-lime-200/70">INICIO DEL PROGRAMA</p><p className="mt-2 text-xl font-black">1 NOVIEMBRE 2026 · 15:00 UY</p><p className="mt-2 text-xs text-white/55">Activación prevista después de Shifter, sujeta a aprobación final.</p></div>
 </section>
 <section className="rounded-[27px] border border-white/10 bg-[#14151b] p-5">
 <div className="flex items-center justify-between gap-3"><div><p className="text-[11px] font-black tracking-[.2em] text-lime-200/70">PR SPIN</p><h2 className="mt-1 text-xl font-black">Tu ciclo mensual</h2></div><span className="rounded-full border border-amber-200/20 px-3 py-2 text-[10px] font-black text-amber-100/70">PROTOTIPO LOCAL</span></div>
 <div className="mt-5 flex flex-wrap gap-2">{MONTHS.map(m=><button type="button" key={m.id} onClick={()=>setMonth(m.id)} className={`rounded-xl border px-4 py-3 text-[11px] font-black ${month===m.id?'border-lime-200/35 bg-lime-200/10 text-lime-100':'border-white/10 text-white/50'}`}>{m.label}</button>)}</div>
 {!seen?<div className="mt-6 text-center"><div className="mx-auto grid h-44 w-44 place-items-center rounded-full border-[12px] border-dashed border-lime-200/35 bg-gradient-to-br from-lime-200/15 to-transparent shadow-[0_0_70px_rgba(163,230,53,.08)]"><div className="text-center"><p className="text-[32px] font-black">PR</p><p className="text-[12px] font-black tracking-[.25em] text-lime-200">SPIN</p></div></div><p className="mt-5 text-xs leading-5 text-white/55">Probá la revelación de seis posiciones. No se asignan ejercicios reales.</p><button type="button" onClick={reveal} className="mt-4 rounded-2xl bg-lime-200 px-6 py-4 text-sm font-black text-black">Descubrir seis posiciones →</button></div>:<p className="mt-5 rounded-xl border border-lime-200/15 bg-lime-200/[.06] p-3 text-xs text-lime-100/70">PR SPIN ya se reveló para este mes en este dispositivo. Volvé a entrar y verás directamente las seis posiciones.</p>}
 {(seen||revealed===6)&&<div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">{Array.from({length:6},(_,i)=><div key={i} className="min-h-[130px] rounded-[22px] border border-white/10 bg-[#0b0d0e] p-4"><span className="text-[11px] font-black tracking-widest text-lime-200/65">DEBER {String(i+1).padStart(2,'0')}</span><div className="mt-4 text-[12px] font-black text-white/75">Por asignar</div><p className="mt-2 text-[11px] leading-4 text-white/45">Sin consigna ni nivel asignado</p></div>)}</div>}
 <button type="button" onClick={()=>setShowGuide(x=>!x)} className="mt-5 w-full rounded-xl border border-white/15 px-4 py-3 text-xs font-black">{showGuide?'Ocultar':'Ver'} proceso de revisión</button>
 {showGuide&&<div className="mt-3 grid gap-2">{['Enviado · check 1','Aprobado / calificado · check 2','Revisión exclusiva de Claudio y David','Evidencia: foto, video o Strava según la consigna'].map(t=><p key={t} className="rounded-xl border border-white/10 p-3 text-xs text-white/65">{t}</p>)}</div>}
 </section>
 <SpinPreview/><section><p className="mb-3 text-[11px] font-black tracking-[.2em] text-white/50">CÓMO FUNCIONA</p><div className="grid gap-3 sm:grid-cols-2">{STAGES.map(([n,title,desc])=><div key={n} className="rounded-[24px] border border-white/10 bg-[#14151b] p-5"><span className="text-[26px] font-black text-lime-200/55">{n}</span><h2 className="mt-4 text-lg font-black">{title}</h2><p className="mt-2 text-xs leading-5 text-white/50">{desc}</p></div>)}</div></section>
 <p className="rounded-2xl border border-white/10 p-4 text-xs leading-5 text-white/55">Esta pantalla es una prueba de interacción en tu navegador. Guarda únicamente si revelaste la ruleta en este dispositivo; no registra entregas, asignaciones, evidencias, notas ni alumnos en Supabase.</p>
 </main></AppLayout>
}