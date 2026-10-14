import { useEffect, useRef, useState } from 'react'

/** Staff-only exploration of two visual systems. Never writes assignments. */
const previewDuties=[
 {title:'Control y equilibrio',kind:'TÉCNICA',desc:'Dominio del patín y estabilidad'},
 {title:'Frenada en T',kind:'CONTROL',desc:'Diez repeticiones, registrar las últimas dos'},
 {title:'Técnica de giro',kind:'TÉCNICA',desc:'Giros controlados y postura'},
 {title:'Resistencia',kind:'CALLE',desc:'Actividad registrada con Strava'},
 {title:'Patinaje hacia atrás',kind:'HABILIDAD',desc:'Control y desplazamiento'},
 {title:'Precisión y postura',kind:'CONTROL',desc:'Coordinación y técnica'},
]
const guide=[
 {title:'TAREAS (Deberes)',body:'Es tu espacio para seguir aprendiendo fuera de clase. Vas a encontrar ejercicios elegidos para tu nivel, practicarlos y recibir una devolución del equipo docente.'},
 {title:'Descubrí tu ciclo',body:'Al comenzar un mes conocés tus tareas. No es un sorteo: el plan se prepara según tu nivel. Después podés consultar las actividades cuando quieras.'},
 {title:'Mi recorrido',body:'Reuní tus ejercicios en un solo lugar. Vas a poder ver qué te falta practicar, qué enviaste y qué fue aprobado cuando la conexión esté habilitada.'},
 {title:'Evidencias y revisión',body:'Algunas tareas piden foto, video o registro de Strava. Enviarlas no significa aprobar: Claudio o David revisan y te indican cómo seguir.'},
 {title:'PR DUO',body:'Algunas misiones se hacen con un compañero. La idea es acompañarse y completar el recorrido juntos, no competir por tiempo o velocidad.'},
 {title:'Mi evolución',body:'Los gráficos van a reunir tareas aprobadas, kilómetros y asistencia cuando los registros estén conectados. Sirven para entender tu constancia, no para comparar tu capacidad con la de otros.'}
]
function LearningGuide(){
 const [open,setOpen]=useState(false)
 return <section className="mt-5 overflow-hidden rounded-[22px] border border-[#57E7DA]/25 bg-[#242830]">
 <button type="button" onClick={()=>setOpen(v=>!v)} aria-expanded={open} className="flex w-full items-center justify-between gap-4 p-4 text-left sm:p-5">
 <span><span className="block text-[10px] font-black tracking-[.18em] text-[#57E7DA]">GUÍA DE TAREAS</span><span className="mt-1 block text-base font-black text-white">¿Qué es todo esto y para qué sirve?</span><span className="mt-1 block text-xs leading-relaxed text-white/60">Tu clase continúa fuera de la pista. Conocé las herramientas antes de usarlas.</span></span>
 <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#57E7DA] text-xl font-black text-[#17191C]">{open?'−':'+'}</span>
 </button>
 {open&&<div className="grid gap-3 border-t border-white/10 p-4 sm:grid-cols-2 sm:p-5">{guide.map((item,i)=><article key={item.title} className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-[10px] font-black text-[#C4FF24]">{String(i+1).padStart(2,'0')}</p><h3 className="mt-2 text-sm font-black text-white">{item.title}</h3><p className="mt-2 text-xs leading-relaxed text-white/65">{item.body}</p></article>)}</div>}
 </section>
}
const palette=['#C4FF24','#57E7DA','#FF72A6','#C9B6FF','#C4FF24','#57E7DA']
export default function PRRevealConcept(){
 const [mode,setMode]=useState('reveal')
 const [revealed,setRevealed]=useState(0)
 const [selected,setSelected]=useState(null)
 const timer=useRef(null)
 useEffect(()=>()=>clearTimeout(timer.current),[])
 const next=()=>{if(revealed>=previewDuties.length)return;setSelected(revealed);setRevealed(n=>n+1)}
 return <section className="min-h-[85vh] px-4 pb-14 pt-6 text-white sm:px-8" style={{background:'radial-gradient(ellipse at 100% 0%,rgba(193,255,32,.13),transparent 48%),#111217'}}>
 <div className="mx-auto max-w-4xl">
 <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-black tracking-[.22em] text-[#C4FF24]">PUNTA ROLLERS / TAREAS</p><h1 className="mt-2 text-3xl font-black italic tracking-[-.06em] sm:text-5xl">LA CLASE CONTINÚA.</h1></div><span className="rounded-full border border-white/20 px-3 py-2 text-[10px] font-bold text-white/60">LAB PRIVADO · SIN DATOS REALES</span></div>
 <LearningGuide/>
 <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl bg-white/[.06] p-1.5" role="tablist" aria-label="Comparar diseños">{[['reveal','PR REVEAL'],['path','PR PATH']].map(([id,label])=><button key={id} role="tab" aria-selected={mode===id} type="button" onClick={()=>setMode(id)} className={`rounded-xl px-4 py-3 text-xs font-black transition-all duration-300 ${mode===id?'bg-[#C4FF24] text-[#121316] shadow-[0_5px_28px_rgba(196,255,36,.2)]':'text-white/65 hover:bg-white/10'}`}>{label}</button>)}</div>
 {mode==='reveal'?<div className="mt-5 overflow-hidden rounded-[30px] border border-white/15 p-5 sm:p-9" style={{background:'radial-gradient(ellipse at 80% 5%,rgba(87,231,218,.17),transparent 60%),linear-gradient(135deg,#30303A,#191920)'}}>
 <p className="mb-4 text-sm leading-relaxed text-white/70">Así vas a conocer las tareas que te corresponden cada mes. No se eligen al azar: son parte de tu aprendizaje.</p>
 <div className="flex items-center justify-between"><span className="text-[11px] font-black tracking-widest text-[#57E7DA]">TU CICLO / NOVIEMBRE</span><span className="text-xs font-black tabular-nums text-white/70">{String(revealed).padStart(2,'0')} / 06</span></div>
 <div className="relative mt-7 flex min-h-[215px] flex-col justify-center overflow-hidden rounded-[24px] border border-white/10 bg-black/20 p-6 sm:min-h-[260px]">
 <div className="pointer-events-none absolute -right-3 -top-10 text-[190px] font-black italic leading-none text-white/[.035]">PR</div>
 <span className="text-[11px] font-black tracking-[.19em] text-[#C4FF24]">{revealed===0?'PREPARATE PARA DESCUBRIR':revealed===6?'CICLO DESCUBIERTO':`DEBER ${String(revealed).padStart(2,'0')} / ${previewDuties[revealed-1].kind}`}</span>
 <h2 key={revealed} className="mt-4 animate-[fadeIn_.35s_ease-out] text-[clamp(32px,7vw,62px)] font-black italic leading-[.98] tracking-[-.065em]">{revealed===0?'TU PRÓXIMO PASO.':revealed===6?'YA TENÉS TU PLAN.':previewDuties[revealed-1].title.toUpperCase()}</h2>
 <p className="mt-4 max-w-md text-sm leading-relaxed text-white/60">{revealed===0?'Una presentación distinta para cada ciclo. Las actividades reales se asignarán según tu nivel.':revealed===6?'Tu plan de práctica queda listo para consultar cada vez que entres.':previewDuties[revealed-1].desc}</p>
 </div>
 <div className="mt-5 grid grid-cols-6 gap-2">{previewDuties.map((d,i)=><div key={d.title} className="relative h-20 overflow-hidden rounded-xl border transition-all duration-500 sm:h-24" style={{borderColor:i<revealed?palette[i]:'#4A4A54',background:i<revealed?'#333840':'#24242B',transform:i===revealed-1?'translateY(-5px)':'none'}}><div className="absolute inset-x-0 bottom-0 h-1" style={{background:i<revealed?palette[i]:'transparent'}}/><span className="absolute left-2 top-2 text-[10px] font-black" style={{color:i<revealed?palette[i]:'#777780'}}>{String(i+1).padStart(2,'0')}</span><span className="absolute bottom-3 left-2 text-lg font-black text-white">{i<revealed?'✓':'·'}</span></div>)}</div>
 <button type="button" onClick={revealed===6?()=>setMode('path'):next} className="mt-6 w-full rounded-[18px] bg-[#C4FF24] px-5 py-4 text-sm font-black text-[#131417] transition hover:brightness-110 active:scale-[.99]">{revealed===6?'VER MI RECORRIDO →':`DESCUBRIR DEBER ${revealed+1} →`}</button>
 <p className="mt-3 text-center text-[11px] text-white/45">Prototipo visual. No crea asignaciones ni modifica el PR SPIN existente.</p>
 </div>:<div className="mt-5 rounded-[30px] border border-white/15 bg-[#23242B] p-5 sm:p-8">
 <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[11px] font-black tracking-[.2em] text-[#57E7DA]">PR PATH / MI RECORRIDO</p><h2 className="mt-2 text-3xl font-black italic tracking-tight">CADA PRÁCTICA CUENTA.</h2></div><span className="rounded-full bg-white/10 px-3 py-2 text-xs font-bold">Vista conceptual</span></div>
 <p className="mt-4 text-sm leading-relaxed text-white/65">Este será tu mapa de práctica: abrí cada tarea para entender qué vas a entrenar. Cuando el sistema esté conectado también verás tus entregas y las devoluciones del profesor.</p>
 <div className="mt-7 space-y-3">{previewDuties.map((d,i)=><button type="button" key={d.title} onClick={()=>setSelected(selected===i?null:i)} className="group relative flex w-full items-center gap-4 rounded-[22px] border border-white/10 bg-[#17181E] p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-white/30"><div className="absolute bottom-0 left-[35px] top-0 w-[2px] bg-white/10"/><div className="relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 bg-[#282932] text-sm font-black" style={{borderColor:palette[i],color:palette[i]}}>{String(i+1).padStart(2,'0')}</div><div className="min-w-0 flex-1"><span className="text-[10px] font-black tracking-widest" style={{color:palette[i]}}>{d.kind}</span><h3 className="mt-1 text-base font-black">{d.title}</h3><p className="mt-1 text-xs text-white/50">{selected===i?d.desc:'Tocá para ver el objetivo'}</p></div><span className="text-xl text-white/50">{selected===i?'−':'+'}</span></button>)}</div>
 <p className="mt-5 text-xs text-white/45">Los estados de aprobación y las fechas se conectarán a las asignaciones reales. No hay resultados ficticios.</p>
 </div>}
 </div></section>
}
