import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'

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
function DesignDirection(){
 const cards=[
  {name:'PR ACTIVE',tag:'TU ACTIVIDAD',accent:'#57E7DA',desc:'Kilómetros y sesiones de patín, con los registros disponibles en tu historial. Sin rankings ni carreras.'},
  {name:'PR ORBIT',tag:'TU EVOLUCIÓN',accent:'#FF72A6',desc:'Una visualización de tu constancia y tus avances. Sin datos suficientes, te explicamos qué falta registrar.'},
  {name:'PR PATH',tag:'TUS DEBERES',accent:'#C4FF24',desc:'Conservamos las tarjetas numeradas, la tipografía y los colores que ya funcionan. Sumamos estados y devoluciones reales.'},
 ]
 return <section className="mt-5 rounded-[28px] border border-white/15 bg-[#1F2028] p-5 sm:p-8"><p className="text-[10px] font-black tracking-[.2em] text-[#57E7DA]">DIRECCIÓN VISUAL · PR TRAINING 2.0</p><h2 className="mt-2 text-2xl font-black italic">TU HISTORIA SIGUE ACÁ.</h2><p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/65">Los registros útiles de tu etapa anterior siguen sumando a tu experiencia. Dejamos atrás las comparaciones competitivas y nos enfocamos en tu evolución.</p><div className="mt-5 grid gap-3 md:grid-cols-3">{cards.map(card=><article key={card.name} className="relative overflow-hidden rounded-[23px] border border-white/10 bg-[#14151B] p-5"><div className="absolute -right-4 -top-6 h-24 w-24 rounded-full opacity-10 blur-2xl" style={{background:card.accent}}/><p className="text-[10px] font-black tracking-widest" style={{color:card.accent}}>{card.tag}</p><h3 className="mt-5 text-3xl font-black italic tracking-[-.05em]">{card.name}</h3><p className="mt-3 text-xs leading-relaxed text-white/65">{card.desc}</p><div className="mt-6 h-1 w-16 rounded-full" style={{background:card.accent}}/></article>)}</div><p className="mt-4 text-[11px] text-white/45">Diseño conceptual. Los indicadores no representan mediciones reales todavía.</p></section>
}
function StudentStatusGuide(){
 const states=[['Aprobado','#C4FF24','Claudio o David revisaron tu ejercicio y confirmaron que está completo.'],['En revisión','#57E7DA','Ya enviaste tu evidencia. Tu profesor tiene que revisarla.'],['Para corregir','#FF72A6','Hay un detalle para mejorar. Leé la devolución y volvé a intentarlo.'],['Sin entregar','#B8BBC6','La tarea está disponible y todavía no enviaste tu práctica.']]
 return <section className="mt-5 rounded-[24px] border border-white/10 bg-[#23252D] p-5 sm:p-7"><p className="text-[10px] font-black tracking-[.19em] text-[#57E7DA]">SEGUÍ TU EVOLUCIÓN</p><h2 className="mt-2 text-xl font-black">Entendé el estado de tus tareas</h2><p className="mt-2 text-sm leading-relaxed text-white/60">Cada estado te cuenta en qué etapa está tu ejercicio. Enviar no es lo mismo que aprobar: siempre vas a saber qué sigue.</p><div className="mt-5 grid gap-3 sm:grid-cols-2">{states.map(([name,color,description])=><article key={name} className="rounded-[17px] border border-white/10 bg-black/20 p-4"><div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{background:color}}/><h3 className="text-sm font-black">{name}</h3></div><p className="mt-2 text-xs leading-relaxed text-white/65">{description}</p></article>)}</div><p className="mt-4 text-[11px] text-white/45">Guía de estados. No representa el resultado de ningún alumno.</p></section>
}
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
 const [mode,setMode]=useState('path')
 const [revealed,setRevealed]=useState(0)
 const [selected,setSelected]=useState(null)
 const [live,setLive]=useState({loading:true,error:'',items:[],cycle:null})
 useEffect(()=>{
  let active=true
  async function load(){
   try{
    const {data:session,error:sessionError}=await supabase.auth.getUser()
    if(sessionError)throw sessionError
    const uid=session?.user?.id
    if(!uid)throw new Error('No se encontró una sesión autenticada.')
    const {data:cycles,error:cycleError}=await supabase.from('pr_training_v2_cycles').select('id,cycle_month,is_visible').order('cycle_month',{ascending:false}).limit(6)
    if(cycleError)throw cycleError
    const cycle=(cycles||[]).find(x=>x.cycle_month==='2026-11')||cycles?.[0]
    if(!cycle){if(active)setLive({loading:false,error:'',items:[],cycle:null});return}
    const {data:assignments,error:assignmentError}=await supabase.from('pr_training_v2_assignments').select('id,profile_id,level_code,cycle_id').eq('cycle_id',cycle.id).eq('profile_id',uid).limit(1)
    if(assignmentError)throw assignmentError
    const assignment=assignments?.[0]
    if(!assignment){if(active)setLive({loading:false,error:'',items:[],cycle});return}
    const {data:slots,error:slotError}=await supabase.from('pr_training_v2_assignment_duties').select('id,duty_id,slot,duty_snapshot').eq('assignment_id',assignment.id).order('slot',{ascending:true})
    if(slotError)throw slotError
    const dutyIds=(slots||[]).map(s=>s.duty_id)
    const [duties,submissions]=await Promise.all([
     dutyIds.length?supabase.from('pr_training_v2_duties').select('id,title,instructions,evidence_type').in('id',dutyIds):Promise.resolve({data:[],error:null}),
     (slots||[]).length?supabase.from('pr_training_v2_submissions').select('assignment_duty_id,status,reviewer_note,submitted_at').eq('profile_id',uid).in('assignment_duty_id',slots.map(s=>s.id)).order('submitted_at',{ascending:false}):Promise.resolve({data:[],error:null})
    ])
    if(duties.error)throw duties.error
    if(submissions.error)throw submissions.error
    const catalog=new Map((duties.data||[]).map(d=>[d.id,d]))
    const latest=new Map()
    for(const s of submissions.data||[])if(!latest.has(s.assignment_duty_id))latest.set(s.assignment_duty_id,s)
    const items=(slots||[]).map(s=>{
      const d=catalog.get(s.duty_id)
      const snapshot=s.duty_snapshot&&typeof s.duty_snapshot==='object'?s.duty_snapshot:{}
      const review=latest.get(s.id)
      return {id:s.id,title:d?.title||snapshot.title||'Actividad asignada',desc:d?.instructions||snapshot.instructions||'Consultá las indicaciones de tu profesor.',kind:d?.evidence_type||'PRÁCTICA',status:review?.status||'pending',note:review?.reviewer_note||''}
    })
    if(active)setLive({loading:false,error:'',items,cycle,level:assignment.level_code})
   }catch(e){if(active)setLive({loading:false,error:e.message||'Error de consulta',items:[],cycle:null})}
  }
  load();return()=>{active=false}
 },[])
 const realTasks=live.items
 const timer=useRef(null)
 useEffect(()=>()=>clearTimeout(timer.current),[])
 const next=()=>{if(revealed>=previewDuties.length)return;setSelected(revealed);setRevealed(n=>n+1)}
 return <section className="min-h-[85vh] px-4 pb-14 pt-6 text-white sm:px-8" style={{background:'radial-gradient(ellipse at 100% 0%,rgba(193,255,32,.13),transparent 48%),#111217'}}>
 <div className="mx-auto max-w-4xl">
 <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-black tracking-[.22em] text-[#C4FF24]">PUNTA ROLLERS / TAREAS</p><h1 className="mt-2 text-3xl font-black italic tracking-[-.06em] sm:text-5xl">LA CLASE CONTINÚA.</h1></div><span className="rounded-full border border-white/20 px-3 py-2 text-[10px] font-bold text-white/60">LAB PRIVADO · SIN DATOS REALES</span></div>
 <LearningGuide/>
 <div className="mt-5 overflow-hidden rounded-[26px] border border-[#C4FF24]/25 p-5 sm:p-8" style={{background:'radial-gradient(ellipse at 95% 0%,rgba(196,255,36,.17),transparent 55%),linear-gradient(125deg,#30323A,#1B1C22)'}}><p className="text-[10px] font-black tracking-[.18em] text-[#C4FF24]">TU PLAN PERSONAL · NOVIEMBRE 2026</p><h2 className="mt-3 max-w-xl text-[clamp(28px,6vw,46px)] font-black italic leading-[1.03] tracking-[-.06em]">CLAUDIO PREPARÓ TUS PRÓXIMOS DESAFÍOS.</h2><p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75">Estas actividades están pensadas para que sigas practicando fuera de clase. Nos ayudan a observar tu técnica, trabajar aspectos puntuales y acompañar tu evolución sobre los patines.</p><p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75">Hacelas a tu ritmo. Cuando corresponda, enviá tu evidencia para que podamos revisar tu trabajo y darte una devolución.</p><div className="mt-5 flex flex-wrap gap-2"><span className="rounded-full bg-[#C4FF24] px-3 py-2 text-[11px] font-black text-[#181A1D]">6 ACTIVIDADES DE EJEMPLO</span><span className="rounded-full border border-white/20 px-3 py-2 text-[11px] font-bold text-white/75">VISTA DE DISEÑO</span></div></div>
 <DesignDirection/>
 <StudentStatusGuide/>
 <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl bg-white/[.06] p-1.5" role="tablist" aria-label="Comparar diseños">{[['path','MI PLAN · PR PATH'],['reveal','REVEAL · ALTERNATIVA']].map(([id,label])=><button key={id} role="tab" aria-selected={mode===id} type="button" onClick={()=>setMode(id)} className={`rounded-xl px-4 py-3 text-xs font-black transition-all duration-300 ${mode===id?'bg-[#C4FF24] text-[#121316] shadow-[0_5px_28px_rgba(196,255,36,.2)]':'text-white/65 hover:bg-white/10'}`}>{label}</button>)}</div>
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
 <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[11px] font-black tracking-[.2em] text-[#57E7DA]">PR PATH / MI RECORRIDO</p><h2 className="mt-2 text-3xl font-black italic tracking-tight">CADA PRÁCTICA CUENTA.</h2></div><span className="rounded-full bg-white/10 px-3 py-2 text-xs font-bold">PR TAREAS</span></div>
 <p className="mt-4 text-sm leading-relaxed text-white/65">Este es tu espacio de práctica. Cuando tengas tareas asignadas, vas a encontrar aquí sus instrucciones, el estado de cada entrega y las devoluciones del equipo docente.</p>
 <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-3 text-xs leading-relaxed text-white/65">{live.loading?'Consultando tus asignaciones reales…':live.error?'No se pudo cargar tu plan real: '+live.error:realTasks.length?'Tus tareas asignadas están disponibles debajo. Los estados corresponden a las entregas visibles para tu cuenta.':'No hay tareas asignadas visibles para tu cuenta en el ciclo consultado. Los ejercicios se mostrarán aquí cuando el equipo docente habilite tu ciclo.'}</div>
 <div className="mt-7 space-y-3">{realTasks.map((d,i)=><button type="button" key={d.id||d.title} onClick={()=>setSelected(selected===i?null:i)} className="group relative flex w-full items-center gap-4 rounded-[22px] border border-white/10 bg-[#17181E] p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-white/30"><div className="absolute bottom-0 left-[35px] top-0 w-[2px] bg-white/10"/><div className="relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 bg-[#282932] text-sm font-black" style={{borderColor:palette[i],color:palette[i]}}>{String(i+1).padStart(2,'0')}</div><div className="min-w-0 flex-1"><span className="text-[10px] font-black tracking-widest" style={{color:palette[i]}}>{String(d.kind||'PRÁCTICA').toUpperCase()}</span><h3 className="mt-1 text-base font-black">{d.title}</h3><p className="mt-1 text-xs text-white/50">{selected===i?d.desc:'Tocá para ver el objetivo'}</p></div>{realTasks.length&&<span className="shrink-0 rounded-full border border-white/15 px-2 py-1 text-[10px] font-bold text-white/70">{d.status==='approved'?'Aprobado':d.status==='rejected'?'Para corregir':d.status==='pending'?'Sin entregar':'En revisión'}</span>}<span className="text-xl text-white/50">{selected===i?'−':'+'}</span></button>)}</div>
 <p className="mt-5 text-xs text-white/45">Las tareas reales se muestran únicamente cuando existe una asignación visible para la sesión actual. Los ejemplos no representan progreso.</p>
 </div>}
 </div></section>
}
