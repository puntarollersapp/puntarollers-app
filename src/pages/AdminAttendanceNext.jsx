import { useEffect, useRef, useState } from 'react'
import AppLayout from '../layouts/AppLayout'

const STATUS=['Presente','Ausente','Justificado','Pausa','Clase personalizada','Evento']
const DEMO=[
 {name:'Alumno de prueba',status:'Pendiente'},
 {name:'Segundo alumno',status:'Pendiente'},
 {name:'Tercer alumno',status:'Pendiente'},
]

export default function AdminAttendanceNext(){
 const video=useRef(null)
 const stream=useRef(null)
 const[cam,setCam]=useState(false)
 const[rows,setRows]=useState(DEMO)
 const[manual,setManual]=useState('')
 const[status,setStatus]=useState('Presente')
 const[message,setMessage]=useState('')
 async function startCamera(){
  setMessage('')
  try{
   const s=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false})
   stream.current=s
   if(video.current){video.current.srcObject=s;await video.current.play()}
   setCam(true)
  }catch{setMessage('No pudimos abrir la cámara. Podés usar el registro manual.')}
 }
 function stopCamera(){stream.current?.getTracks?.().forEach(t=>t.stop());stream.current=null;setCam(false)}
 useEffect(()=>()=>stopCamera(),[])
 function demoScan(){
  setRows(r=>r.map((x,i)=>i===0?{...x,status:'Presente'}:x))
  setMessage('Lectura simulada en beta: Alumno de prueba · Presente. No se escribió nada en producción.')
 }
 function manualSave(){
  if(!manual.trim())return setMessage('Ingresá nombre, documento o PR ID para probar el flujo manual.')
  setMessage(`Registro simulado: ${manual.trim()} · ${status}. Beta segura, sin escritura en producción.`)
  setManual('')
 }
 return <AppLayout title="PR Check"><main className="mx-auto w-full max-w-[820px] space-y-4 px-4 pb-32 pt-4 text-white">
  <section className="relative overflow-hidden rounded-[36px] border border-cyan-300/15 bg-[#090d10] p-6">
   <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl"/><div className="absolute -bottom-20 left-16 h-52 w-52 rounded-full bg-violet-500/10 blur-3xl"/>
   <div className="relative"><div className="flex items-center justify-between gap-3"><div><p className="text-[8px] font-black tracking-[.24em] text-cyan-200">PR CHECK · ASISTENCIA</p><h1 className="mt-2 text-[31px] font-black tracking-[-.04em]">Entrada simple. Registro claro.</h1></div><span className="rounded-full border border-white/10 bg-white/[.04] px-3 py-1 text-[7px] font-black tracking-wider text-white/35">BETA SEGURA</span></div>
   <p className="mt-4 max-w-[550px] text-[11px] leading-5 text-white/38">Escaneo por QR desde el navegador, sugerencia de clase y alternativa manual. Esta beta no escribe asistencia todavía porque el entorno comparte la base productiva.</p></div>
  </section>

  <section className="grid gap-3 lg:grid-cols-[1.15fr_.85fr]">
   <article className="overflow-hidden rounded-[30px] border border-cyan-300/15 bg-white/[.025] p-4">
    <div className="flex items-center justify-between"><div><p className="text-[8px] font-black tracking-[.18em] text-cyan-200/60">ESCÁNER</p><h2 className="mt-1 text-xl font-black">Leer PR ID</h2></div>{cam&&<button onClick={stopCamera} className="rounded-full border border-white/10 px-3 py-2 text-[8px] font-black text-white/40">CERRAR CÁMARA</button>}</div>
    <div className="mt-4 overflow-hidden rounded-[24px] border border-white/[.07] bg-black/35">
     {cam?<div className="relative aspect-[4/3]"><video ref={video} muted playsInline className="h-full w-full object-cover"/><div className="pointer-events-none absolute inset-[18%] rounded-[24px] border border-cyan-200/45 shadow-[0_0_0_999px_rgba(0,0,0,.2)]"/><div className="absolute inset-x-0 bottom-4 text-center text-[8px] font-black tracking-[.15em] text-white/65">CENTRÁ EL QR DENTRO DEL MARCO</div></div>:<button onClick={startCamera} className="flex aspect-[4/3] w-full flex-col items-center justify-center"><span className="grid h-14 w-14 place-items-center rounded-full border border-cyan-200/20 bg-cyan-200/[.06] text-xl">⌁</span><b className="mt-4 text-[10px] uppercase tracking-[.14em]">Activar cámara</b><span className="mt-2 max-w-[240px] text-[9px] leading-4 text-white/25">Solo se usa localmente para probar el flujo del escáner.</span></button>}
    </div>
    {cam&&<button onClick={demoScan} className="mt-3 w-full rounded-[17px] border border-cyan-200/20 bg-cyan-200/[.08] py-3 text-[9px] font-black tracking-[.12em] text-cyan-100">SIMULAR LECTURA QR →</button>}
   </article>

   <article className="rounded-[30px] border border-violet-300/15 bg-violet-300/[.035] p-5">
    <p className="text-[8px] font-black tracking-[.18em] text-violet-200/60">CLASE SUGERIDA</p><h2 className="mt-2 text-xl font-black">Próxima clase PR</h2>
    <div className="mt-4 rounded-[20px] border border-white/[.07] bg-black/20 p-4"><p className="text-sm font-black">Selección automática</p><p className="mt-2 text-[9px] leading-4 text-white/30">La versión final tomará horario, sede y grupo para sugerir la clase correcta. El profe podrá cambiarla antes de confirmar.</p></div>
    <div className="mt-3 rounded-[20px] border border-white/[.07] bg-black/20 p-4"><p className="text-[8px] font-black text-white/35">ESTADOS DISPONIBLES</p><div className="mt-3 flex flex-wrap gap-2">{STATUS.map(s=><span key={s} className="rounded-full border border-white/[.07] px-3 py-1.5 text-[8px] font-bold text-white/40">{s}</span>)}</div></div>
   </article>
  </section>

  <section className="rounded-[30px] border border-white/[.07] bg-[#101015] p-5">
   <div className="flex items-end justify-between gap-3"><div><p className="text-[8px] font-black tracking-[.18em] text-white/25">FALLBACK</p><h2 className="mt-1 text-xl font-black">Registro manual</h2></div><span className="text-[8px] text-white/20">Documento · nombre · PR ID</span></div>
   <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_180px_auto]"><input value={manual} onChange={e=>setManual(e.target.value)} placeholder="Buscar alumno" className="rounded-[16px] border border-white/[.08] bg-black/25 px-4 py-3 text-sm outline-none placeholder:text-white/20"/><select value={status} onChange={e=>setStatus(e.target.value)} className="rounded-[16px] border border-white/[.08] bg-[#121218] px-3 py-3 text-[10px] font-bold">{STATUS.map(s=><option key={s}>{s}</option>)}</select><button onClick={manualSave} className="rounded-[16px] bg-white px-5 py-3 text-[9px] font-black text-black">REGISTRAR</button></div>
   {message&&<div className="mt-3 rounded-[16px] border border-cyan-200/10 bg-cyan-200/[.045] p-3 text-[9px] leading-4 text-cyan-100/65">{message}</div>}
  </section>

  <section className="rounded-[30px] border border-white/[.07] bg-white/[.02] p-5">
   <div className="flex items-end justify-between"><div><p className="text-[8px] font-black tracking-[.18em] text-white/25">EN VIVO</p><h2 className="mt-1 text-xl font-black">Lista de clase</h2></div><span className="text-[8px] font-black text-white/20">DEMO · SIN DATOS REALES</span></div>
   <div className="mt-4 space-y-2">{rows.map((r,i)=><div key={r.name} className="flex items-center justify-between rounded-[18px] border border-white/[.06] bg-black/20 p-3"><div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-white/[.05] text-[9px] font-black text-white/35">{i+1}</span><div><p className="text-[10px] font-black">{r.name}</p><p className="mt-1 text-[8px] text-white/22">Identidad de demostración</p></div></div><span className={`rounded-full border px-3 py-1.5 text-[8px] font-black ${r.status==='Presente'?'border-emerald-300/15 bg-emerald-300/[.07] text-emerald-200':'border-white/[.07] text-white/25'}`}>{r.status}</span></div>)}</div>
  </section>
 </main></AppLayout>
}
