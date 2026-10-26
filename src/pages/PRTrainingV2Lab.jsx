import { useEffect, useRef, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import TrainingStudio from '../components/training/TrainingStudio'
import PRRevealConcept from '../components/training/PRRevealConcept'
import PRTrainingLiveAudit from '../components/training/PRTrainingLiveAudit'

const levels = [
  { code: 'B1', label: 'Fundamentos', detail: 'Control, equilibrio y frenadas' },
  { code: 'B2', label: 'Desarrollo', detail: 'Técnica y confianza' },
  { code: 'B3', label: 'Progresión', detail: 'Resistencia y precisión' },
  { code: 'B4', label: 'Rendimiento', detail: 'Desafíos de mayor exigencia' },
]
const sampleSteps = ['Descubrí tus deberes', 'Entrená a tu ritmo', 'Enviá tu evidencia', 'Recibí la revisión']
const wheelColors = ['#BFFF22','#31DCC9','#FF2777','#8B58F5','#BFFF22','#31DCC9','#FF2777','#8B58F5']
const demoTasks = ['Control y equilibrio','Frenada en T','Técnica de giro','Resistencia','Patinaje hacia atrás','Precisión y postura']
function SpinWheel({onViewDuties, initialRevealed=0, onReveal}) {
  const [stage,setStage]=useState(initialRevealed===6?'done':'idle')
  const [revealed,setRevealed]=useState(()=>demoTasks.slice(0,initialRevealed))
  const [angle,setAngle]=useState(0)
  const timer=useRef(null)
  const run=useRef(false)
  useEffect(()=>()=>{run.current=false;if(timer.current)clearTimeout(timer.current)},[])
  function start(){
    if(run.current||stage==='done'||revealed.length>=6)return
    run.current=true
    setStage('spinning')
    const index=revealed.length
    const next=angle+1800+((index*3+1)%8)*45
    setAngle(next)
    timer.current=setTimeout(()=>{
      if(!run.current)return
      setRevealed(prev=>[...prev,demoTasks[index]])
      onReveal?.(index+1)
      setStage(index===5?'done':'idle')
      run.current=false
    },1950)
  }
  const segments=wheelColors.map((color,i)=>{
    const a=(-90+i*45)*Math.PI/180,b=(-90+(i+1)*45)*Math.PI/180
    const x=t=>180+145*Math.cos(t),y=t=>180+145*Math.sin(t)
    return <path key={i} d={`M 180 180 L ${x(a)} ${y(a)} A 145 145 0 0 1 ${x(b)} ${y(b)} Z`} fill={color} stroke="#150D21" strokeWidth="5"/>
  })
  return <div className="w-full">
    <div className="relative mx-auto w-full max-w-[320px] rounded-full bg-lime-300/10 p-1 sm:max-w-[390px]">
      <svg viewBox="0 0 360 370" className="block h-auto w-full max-w-full" role="img" aria-label="Ruleta PR SPIN de ocho segmentos, verde lima, negro, rosa eléctrico y blanco hielo">
        <defs>
          <radialGradient id="prSpinGloss"><stop offset="35%" stopColor="#FFFFFF" stopOpacity="0"/><stop offset="83%" stopColor="#FFFFFF" stopOpacity=".10"/><stop offset="100%" stopColor="#000000" stopOpacity=".30"/></radialGradient>
          <filter id="prSpinGlow"><feGaussianBlur stdDeviation="8"/></filter>
          <linearGradient id="prSpinHub" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#EFF8FF"/><stop offset="1" stopColor="#AEB6BC"/></linearGradient>
        </defs>
        <circle cx="180" cy="180" r="151" fill="#C4FF26" opacity=".36" filter="url(#prSpinGlow)"/>
        <g style={{transform:`rotate(${angle}deg)`,transformOrigin:'180px 180px',transition:'transform 1.95s cubic-bezier(.12,.72,.15,1)'}}>
          {segments}
          <circle cx="180" cy="180" r="141" fill="url(#prSpinGloss)" pointerEvents="none"/>
          {wheelColors.map((color,i)=>{
            const a=(-67.5+i*45)*Math.PI/180
            const x=180+101*Math.cos(a),y=180+101*Math.sin(a)
            const light=color==='#BFFF22'||color==='#31DCC9'
            return <g key={i} transform={`translate(${x} ${y})`}><circle r="21" fill={light?'#0D0303':'#EFF8FF'} opacity=".14"/><circle r="15" fill={light?'#0D0303':'#EFF8FF'} opacity=".86"/><text y="5" textAnchor="middle" fontSize="13" fontWeight="900" fill={light?'#EFF8FF':'#0D0303'}>{['✦','01','✧','02','✦','03','✧','04'][i]}</text></g>
          })}
        </g>
        <circle cx="180" cy="180" r="65" fill="#20112F" stroke="#EFF8FF" strokeWidth="5"/>
        <circle cx="180" cy="180" r="56" fill="#C3FF2C" stroke="#EFF8FF" strokeWidth="2"/>
        <text x="180" y="193" textAnchor="middle" fontWeight="1000" fontSize="47" letterSpacing="-4" fill="#0D0303">PR</text>
        <path d="M 165 13 Q 180 7 195 13 L 180 42 Z" fill="#FF2777" stroke="#EFF8FF" strokeWidth="2"/>
      </svg>
    </div>
    <p className="mt-1 text-center text-[10px] font-semibold uppercase tracking-[.12em] text-white/50">{stage==='done'?'Revelación de muestra completa':stage==='spinning'?'Revelando desafíos…':'Diseño interactivo · vista de prueba'}</p>
    <div className="mt-5 grid grid-cols-3 gap-2" aria-live="polite">{Array.from({length:6},(_,i)=><div key={i} className={`min-h-[64px] rounded-xl border p-3 text-center ${revealed[i]?'border-[#C4FF36]/55 bg-[#273522]/70':'border-white/15 bg-[#211F27]/80'}`}><p className="text-[10px] font-black text-[#BBFF1F]">{String(i+1).padStart(2,'0')}</p><p className="mt-1 text-xs font-semibold leading-tight text-white">{revealed[i]||'Por revelar'}</p></div>)}</div>
    {stage==='done'&&<button type="button" onClick={onViewDuties} className="mt-5 w-full rounded-[20px] bg-gradient-to-r from-lime-300 via-green-300 to-cyan-300 px-5 py-4 text-sm font-black text-[#0D0303]">Ver mis deberes →</button>}
    {stage!=='done'&&<button type="button" onClick={start} disabled={stage!=='idle'} className="mt-5 w-full rounded-full bg-[#BBFF1F] px-5 py-4 text-sm font-black uppercase tracking-wider text-[#0D0303] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">{stage==='done'?'Revelación completada':stage==='spinning'?'Girando…':`GIRAR · ${revealed.length+1} de 6`}</button>}
    <p className="mt-3 text-center text-[11px] leading-5 text-white/40">Vista de prueba · Los ejercicios mostrados son ilustrativos.</p>
  </div>
}
function TrainingDailyControl(){
 const [tab,setTab]=useState('hoy')
 const tabs=[['hoy','Entregas'],['alumnos','Alumnos'],['contenido','Ejercicios']]
 return <section className="mt-5 rounded-[24px] border border-[#BBFF1F]/30 bg-[#101012] p-4 sm:p-6">
  <div className="mb-4"><p className="text-xs font-bold tracking-[.16em] text-[#BBFF1F]">CENTRO DE CONTROL</p><h2 className="mt-1 text-2xl font-black">PR TAREAS</h2><p className="mt-1 text-xs text-white/50">Todo lo importante, en un solo lugar.</p></div>
  <div role="tablist" aria-label="Administración de PR TAREAS" className="grid grid-cols-3 gap-2">{tabs.map(([id,label])=><button key={id} type="button" role="tab" aria-selected={tab===id} onClick={()=>setTab(id)} className={`rounded-xl px-2 py-3 text-sm font-bold ${tab===id?'bg-[#BBFF1F] text-[#0D0303]':'bg-white/10 text-white/70'}`}>{label}</button>)}</div>
  <div role="tabpanel">{tab==='hoy'?<TrainingReviewQueue/>:tab==='alumnos'?<TrainingStudentSearch/>:<TrainingAdminControls/>}</div>


 </section>
}

function TrainingLevelRoster(){
 const [month,setMonth]=useState('2026-11'),[students,setStudents]=useState([]),[loading,setLoading]=useState(false),[error,setError]=useState(''),[level,setLevel]=useState('B1'),[chosen,setChosen]=useState([]),[saving,setSaving]=useState(false)
 const [nameFilter,setNameFilter]=useState('')
 const descriptions={B1:'Iniciación: equilibrio, postura y primeros controles del patinaje.',B2:'Desarrollo: afianzar el control y combinar movimientos técnicos.',B3:'Progresión técnica: frenadas, precisión y desafíos de mayor complejidad.',B4:'Nivel avanzado: contenido pedagógico pendiente de definir; todavía no hay ejercicios cargados.'}
 async function load(){setLoading(true);const {data,error:e}=await supabase.rpc('pr_tareas_admin_student_roster',{p_month:month+'-01'});if(e)setError(e.message);else{setStudents(data?.students||[]);setError('')}setLoading(false)}
 useEffect(()=>{load()},[month])
 const visible=students.filter(p=>(level==='pending'?!p.level:!p.level||p.level===level)&&p.name?.toLocaleLowerCase().includes(nameFilter.trim().toLocaleLowerCase()))
 const unplanned=students.filter(p=>p.level&&!p.has_plan).length
 const unclassified=students.filter(p=>!p.level).length
 function toggle(id){if(!students.some(p=>p.id===id&&!p.level&&!p.has_plan))return;setChosen(old=>old.includes(id)?old.filter(x=>x!==id):[...old,id])}
 async function assign(){if(!chosen.length||level==='pending')return;const confirmed=window.confirm('¿Asignar '+chosen.length+' alumnos al nivel '+level+'? Esto modifica su nivel pedagógico, pero no publica tareas.');if(!confirmed)return;setSaving(true);const {data,error:e}=await supabase.rpc('pr_tareas_admin_bulk_set_level',{p_ids:chosen,p_level:level});if(e)setError(e.message);else{setError('Se clasificaron '+data.count+' alumnos en '+level+'.');setChosen([]);await load()}setSaving(false)}
 return <section className="mt-4 rounded-2xl border border-white/10 bg-[#101014] p-4"><h3 className="text-lg font-black">Clasificar alumnos por nivel</h3><p className="mt-2 text-xs leading-5 text-white/65">Seleccioná un bloque, marcá los alumnos y guardá el nivel para todos juntos. Esto no les asigna todavía los seis desafíos mensuales.</p><label className="mt-4 block text-xs font-bold" htmlFor="roster-month">Mes a controlar</label><input id="roster-month" type="month" value={month} onChange={e=>{setMonth(e.target.value);setChosen([])}} className="mt-2 rounded-lg border border-white/20 bg-[#18191D] p-2 text-sm"/><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">{['pending','B1','B2','B3','B4'].map(l=><button key={l} type="button" onClick={()=>{setLevel(l);setChosen([])}} className={`rounded-xl border p-3 text-left text-xs ${level===l?'border-[#BBFF1F] bg-[#BBFF1F]/10':'border-white/15'}`}><strong className="block text-sm">{l==='pending'?'Sin nivel':l}</strong><span className="text-white/65">{students.filter(p=>l==='pending'?!p.level:p.level===l).length} alumnos</span></button>)}</div><p className="mt-3 text-xs text-white/65">{level==='pending'?'Estos alumnos todavía no tienen nivel. Elegí B1, B2, B3 o B4 y marcalos para clasificarlos.':descriptions[level]+' Seleccioná alumnos sin nivel para incorporarlos a este bloque.'}</p><p className="mt-3 text-xs font-semibold text-[#BBFF1F]">{unclassified} sin nivel · {unplanned} con nivel pero sin plan para {month}</p><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{['B1','B2','B3','B4'].map(l=><div key={l} className="rounded-lg border border-white/10 p-3"><p className="text-xs font-bold">{l} · {students.filter(p=>p.level===l).length} alumnos</p><p className="mt-1 text-xs text-white/50">{students.filter(p=>p.level===l&&!p.has_plan).length} pendientes de plan mensual</p></div>)}</div>{error&&<p role="status" className="mt-3 text-xs text-[#FF8DAF]">{error}</p>}{loading?<p className="mt-4 text-sm">Cargando alumnos…</p>:<><label className="mt-4 block text-xs font-bold">Buscar alumno dentro del bloque<input type="search" value={nameFilter} onChange={e=>setNameFilter(e.target.value)} placeholder="Escribí un nombre o apellido" className="mt-2 w-full rounded-lg border border-white/20 bg-[#18191D] p-3 text-sm"/></label><div className="mt-4 max-h-80 space-y-2 overflow-y-auto">{visible.map(p=><label key={p.id} className="flex items-center gap-3 rounded-lg border border-white/10 p-3 text-sm"><input type="checkbox" checked={chosen.includes(p.id)} onChange={()=>toggle(p.id)} disabled={!!p.has_plan||level==='pending'||!!p.level}/><span className="flex-1">{p.name}</span><span className="text-xs text-white/50">{p.has_plan?'Plan guardado':p.level?'Falta plan':'Sin nivel'}</span></label>)}{visible.length===0&&<p className="text-xs text-white/50">No hay alumnos en este grupo.</p>}</div>{level!=='pending'&&<><div className="mt-3 flex gap-2"><button type="button" onClick={()=>setChosen(visible.filter(p=>!p.has_plan&&!p.level).map(p=>p.id))} className="rounded-lg border border-white/20 px-3 py-2 text-xs">Seleccionar todos los sin nivel</button><button type="button" onClick={()=>setChosen([])} className="rounded-lg border border-white/20 px-3 py-2 text-xs">Limpiar</button></div><button type="button" disabled={saving||chosen.length===0} onClick={assign} className="mt-4 w-full rounded-xl bg-[#BBFF1F] px-4 py-3 text-sm font-black text-black disabled:opacity-40">{saving?'Guardando…':'Asignar '+chosen.length+' alumnos a '+level}</button></>}</>}</section>
}

function TrainingStudentSearch(){
 const [query,setQuery]=useState('')
 const [items,setItems]=useState([])
 const [message,setMessage]=useState('')
 const [selected,setSelected]=useState(null)
 const [preview,setPreview]=useState(null)
 const [previewBusy,setPreviewBusy]=useState(false)
 const [month,setMonth]=useState('2026-11')
 const [selectedCodes,setSelectedCodes]=useState([])
 const [draftNotice,setDraftNotice]=useState('')
 const [savingPlan,setSavingPlan]=useState(false)
 const [savedPlan,setSavedPlan]=useState(false)
 const [autoNotice,setAutoNotice]=useState('')
 const [batch,setBatch]=useState([])
 const [batchBusy,setBatchBusy]=useState(false)
 const [batchError,setBatchError]=useState('')
 const [batchChosen,setBatchChosen]=useState([])
 const [batchSaving,setBatchSaving]=useState(false)
 const [batchResult,setBatchResult]=useState(null)
 const [batchNames,setBatchNames]=useState({})
 const [batchLevel,setBatchLevel]=useState('all')
 const [batchChecked,setBatchChecked]=useState(false)
 const [batchMonthChecked,setBatchMonthChecked]=useState('')
 const [batchReport,setBatchReport]=useState('')
 async function checkMonthlyBatch(){setBatchBusy(true);const {data,error}=await supabase.rpc('pr_tareas_admin_monthly_batch_preview',{p_month:month+'-01'});if(error){setBatchError(error.message);setBatchChecked(false)}else{setBatch(data?.students||[]);setBatchError('');setBatchChosen([]);setBatchChecked(true);setBatchMonthChecked(month)}setBatchBusy(false)}
 function copyBatchReport(){const lines=['PR TAREAS · '+month,'Planes guardados: '+(batchResult?.saved?.length||0),'Pendientes: '+(batchResult?.skipped?.length||0),...(batchResult?.skipped||[]).map(p=>(batchNames[p.id]||p.id)+' — '+({NO_LEVEL:'Sin nivel',ALREADY_ASSIGNED:'Plan existente',NOT_ENOUGH_READY_DUTIES:'Faltan ejercicios aprobados',INVALID_STUDENT:'Perfil inválido'}[p.reason]||p.reason))];const report=lines.join('\n');setBatchReport(report);navigator.clipboard?.writeText(report).then(()=>setBatchReport('Informe copiado al portapapeles.'),()=>setBatchReport(report))}
 async function assignBatch(){if(!batchChosen.length||!batchChecked||batchMonthChecked!==month)return;const yes=window.confirm('¿Guardar seis tareas por alumno para '+batchChosen.length+' alumnos del mes '+month+'? Solo se procesan ejercicios aprobados y el mes debe seguir oculto.');if(!yes)return;setBatchSaving(true);setBatchResult(null);setBatchNames(Object.fromEntries(batch.map(p=>[p.id,p.name])));const {data,error}=await supabase.rpc('pr_tareas_admin_assign_batch',{p_month:month+'-01',p_profile_ids:batchChosen});if(error)setBatchError(error.message);else{await checkMonthlyBatch();setBatchResult(data);setBatchReport('')}setBatchSaving(false)}
 async function search(e){
  e.preventDefault()
  const {data,error}=await supabase.rpc('pr_training_v2_admin_search_students',{p_query:query.trim()})
  if(error)setMessage(error.message);else {setItems(data||[]);setMessage('')}
  setSelected(null);setPreview(null);setSelectedCodes([])
 }
 async function setLevel(id,level){
  const {error}=await supabase.rpc('pr_training_v2_admin_set_level',{p_profile_id:id,p_level:level})
  if(error)setMessage(error.message);else {setItems(rows=>rows.map(r=>r.id===id?{...r,level}:r));setSelected(null);setPreview(null)}
 }
 function changeDraft(next){setSelectedCodes(next);try{localStorage.setItem('pr-tareas-draft-'+selected.id+'-'+month,JSON.stringify(next));setDraftNotice('Borrador guardado en este dispositivo. No está publicado.')}catch{setDraftNotice('No se pudo guardar el borrador en este dispositivo.')}}
 async function saveMonthlyPlan(){if(!selected||selectedCodes.length!==6)return;const confirmed=window.confirm('¿Guardar los seis ejercicios de '+selected.name+' para '+month+'? Esto crea una asignación real, pero no publica el ciclo.');if(!confirmed)return;setSavingPlan(true);setDraftNotice('');const {data,error}=await supabase.rpc('pr_tareas_admin_assign_month',{p_profile_id:selected.id,p_month:month+'-01',p_codes:selectedCodes});if(error)setDraftNotice('No se pudo guardar: '+error.message);else{setSavedPlan(true);setDraftNotice('Plan guardado en Supabase. '+(data?.published?'El ciclo ya estaba visible.':'El ciclo sigue oculto.'));try{localStorage.removeItem('pr-tareas-draft-'+selected.id+'-'+month)}catch{}}setSavingPlan(false)}
 function suggestSix(){if(!preview||!selected)return;const eligible=preview.duties.filter(d=>d.active&&d.demo_ready&&!d.requires_explicit_enable);if(eligible.length<6){setAutoNotice('No hay seis ejercicios habilitados para '+selected.level+'. Faltan demostraciones y aprobación docente. No se asignó nada.');return}const codes=eligible.slice(0,6).map(d=>d.duty_code);changeDraft(codes);setAutoNotice('Propuesta de seis ejercicios preparada. Revisala antes de guardar; no se publicó nada.')}
 async function previewStudent(p){
  setSelected(p);setPreview(null);setAutoNotice('');setSavedPlan(false);setDraftNotice('');setPreviewBusy(true);try{const draft=JSON.parse(localStorage.getItem('pr-tareas-draft-'+p.id+'-'+month)||'[]');setSelectedCodes(Array.isArray(draft)?draft.filter(x=>typeof x==='string').slice(0,6):[])}catch{setSelectedCodes([])}
  const [catalog,eligibility]=await Promise.all([
   supabase.from('pr_training_v2_duties').select('duty_code,title,level_code,instructions,evidence_type,metadata,active,demo_ready,requires_explicit_enable').eq('level_code',p.level).order('duty_code'),
   supabase.rpc('pr_tareas_preview_selection',{p_level:p.level})
  ])
  if(catalog.error||eligibility.error)setMessage(catalog.error?.message||eligibility.error?.message)
  else {setMessage('');setPreview({duties:catalog.data||[],eligible:eligibility.data});setSelectedCodes(old=>old.filter(code=>(catalog.data||[]).some(d=>d.duty_code===code&&d.active&&d.demo_ready&&!d.requires_explicit_enable)).slice(0,6))}
  setPreviewBusy(false)
 }
 return <div className="mt-4 rounded-2xl bg-[#101014] p-4">
  <TrainingLevelRoster/><section className="mt-4 rounded-xl border border-white/10 p-4"><h3 className="text-base font-black">Control mensual de todos los alumnos</h3><p className="mt-2 text-xs text-white/60">Detecta alumnos sin nivel, sin seis ejercicios habilitados o con plan ya guardado. No publica tareas.</p><button type="button" onClick={checkMonthlyBatch} disabled={batchBusy} className="mt-3 rounded-lg border border-[#BBFF1F]/50 px-3 py-2 text-xs font-bold text-[#BBFF1F]">{batchBusy?'Comprobando…':'Comprobar alumnos del mes'}</button>{batchError&&<p role="alert" className="mt-2 text-xs text-[#FF8DAF]">{batchError}</p>}<p className="mt-3 text-xs text-white/70">{batchChecked?batch.length:'—'} alumnos revisados · {batch.filter(p=>p.status==='unclassified').length} sin nivel · {batch.filter(p=>p.status==='not_ready'||p.status==='no_cycle').length} sin preparación · {batch.filter(p=>p.status==='assigned').length} con plan · {batch.filter(p=>p.status==='ready').length} listos para preparar</p><div className="mt-3 flex flex-wrap items-center gap-2"><label className="text-xs text-white/70">Filtrar bloque <select value={batchLevel} onChange={e=>{setBatchLevel(e.target.value);setBatchChosen([])}} className="ml-2 rounded-lg border border-white/20 bg-[#18191D] p-2"><option value="all">Todos</option>{['B1','B2','B3','B4'].map(l=><option key={l} value={l}>{l}</option>)}</select></label><button type="button" disabled={!batchChecked||batchMonthChecked!==month} onClick={()=>setBatchChosen(batch.filter(p=>p.status==='ready'&&(batchLevel==='all'||p.level===batchLevel)).map(p=>p.id))} className="rounded-lg border border-white/20 px-3 py-2 text-xs font-bold">Seleccionar todos los preparados</button><button type="button" onClick={()=>setBatchChosen([])} className="rounded-lg border border-white/20 px-3 py-2 text-xs">Limpiar selección</button><button type="button" disabled={batchSaving||!batchChosen.length||!batchChecked||batchMonthChecked!==month} onClick={assignBatch} className="rounded-lg bg-[#BBFF1F] px-3 py-2 text-xs font-black text-black disabled:opacity-40">{batchSaving?'Guardando…':'Guardar planes de '+batchChosen.length+' alumnos'}</button></div>{batchResult&&<p role="status" className="mt-3 text-xs text-[#BBFF1F]">Resultado: {batchResult.saved?.length||0} planes guardados · {batchResult.skipped?.length||0} pendientes. Ningún ciclo publicado.</p>}{batchResult&&<button type="button" onClick={copyBatchReport} className="mt-2 rounded-lg border border-white/20 px-3 py-2 text-xs font-bold">Copiar informe de adjudicación</button>}{batchReport&&<p role="status" className="mt-2 whitespace-pre-wrap text-xs text-white/60">{batchReport}</p>}{batchResult?.skipped?.length>0&&<div className="mt-2 rounded-lg border border-white/15 p-3"><p className="text-xs font-bold">Pendientes y motivo</p>{batchResult.skipped.map(p=><p key={p.id} className="mt-1 text-xs text-white/65">{batchNames[p.id]||p.id}: {{NO_LEVEL:'Falta asignar nivel',ALREADY_ASSIGNED:'Ya tenía plan guardado',NOT_ENOUGH_READY_DUTIES:'No hay seis ejercicios con video aprobado',INVALID_STUDENT:'Perfil no válido'}[p.reason]||p.reason}</p>)}</div>}<div className="mt-3 max-h-64 space-y-2 overflow-y-auto">{batch.filter(p=>p.status!=='assigned'&&(batchLevel==='all'||p.level===batchLevel)).map(p=><div key={p.id} className="flex justify-between gap-2 border-b border-white/10 py-2 text-xs"><label className="flex items-center gap-2"><input type="checkbox" disabled={p.status!=='ready'} checked={batchChosen.includes(p.id)} onChange={()=>setBatchChosen(old=>old.includes(p.id)?old.filter(x=>x!==p.id):[...old,p.id])}/><span>{p.name} · {p.level||'Sin nivel'}</span></label><span className="text-white/50">{p.status==='unclassified'?'Falta nivel':p.status==='ready'?'Listo para preparar':(p.eligible_count||0)+' de 6 ejercicios listos'}</span></div>)}</div></section><h3 className="text-lg font-black">Alumnos y preparación de tareas</h3>
  <p className="mt-1 text-xs text-white/50">Buscá un perfil, confirmá su nivel y revisá sus ejercicios originales antes de asignarlos.</p>
  <form onSubmit={search} className="mt-4 flex gap-2"><input value={query} onChange={e=>setQuery(e.target.value)} minLength={2} required placeholder="Nombre del alumno" className="min-w-0 flex-1 rounded-xl border border-white/15 bg-black/30 px-3 py-3 text-sm"/><button className="rounded-xl bg-[#BBFF1F] px-4 font-bold text-[#0D0303]">Buscar</button></form>
  {message&&<p role="status" className="mt-3 text-xs text-[#FF8DAF]">{message}</p>}
  <div className="mt-4 space-y-2">{items.map(p=><div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/5 p-3"><div><p className="text-sm font-bold">{p.name}</p><p className="text-xs text-white/40">Nivel actual: {p.level}</p></div><div className="flex items-center gap-2"><select value={p.level} onChange={e=>setLevel(p.id,e.target.value)} aria-label={'Nivel de '+p.name} className="rounded-lg bg-[#1A1A1D] p-2 text-sm">{['B1','B2','B3','B4'].map(l=><option key={l}>{l}</option>)}</select><button type="button" onClick={()=>previewStudent(p)} className="rounded-lg border border-[#BBFF1F]/50 px-3 py-2 text-xs font-bold text-[#BBFF1F]">Ver plan</button></div></div>)}</div>
  {selected&&<section className="mt-5 rounded-2xl border border-[#BBFF1F]/30 bg-white/5 p-4"><p className="text-xs font-black uppercase tracking-widest text-[#BBFF1F]">Vista previa docente · sin publicar</p><h4 className="mt-2 text-lg font-black">{selected.name} · {selected.level}</h4>{previewBusy?<p className="mt-3 text-sm">Consultando ejercicios…</p>:preview&&<><p className="mt-2 text-sm text-white/65">{preview.duties.length} ejercicios desarrollados · {preview.eligible?.eligible_count||0} habilitados para selección de seis.</p><p className="mt-2 text-xs text-white/45">Los ejercicios sin video aprobado siguen en la biblioteca, pero todavía no están habilitados para asignación automática.</p><div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3"><label className="block text-xs font-bold" htmlFor="tareas-month">Mes del plan</label><input id="tareas-month" type="month" min="2026-11" value={month} onChange={e=>{const nextMonth=e.target.value;setMonth(nextMonth);if(selected){try{const draft=JSON.parse(localStorage.getItem('pr-tareas-draft-'+selected.id+'-'+nextMonth)||'[]');setSelectedCodes(Array.isArray(draft)?draft.slice(0,6):[])}catch{setSelectedCodes([])}}}} className="mt-2 rounded-lg border border-white/20 bg-[#18191D] p-2 text-sm"/><p className="mt-3 text-xs text-white/60">Selección pedagógica · {selectedCodes.length} de 6 ejercicios</p><button type="button" onClick={suggestSix} className="mt-3 rounded-lg border border-white/30 px-3 py-2 text-xs font-bold text-white">Preparar propuesta automática</button>{autoNotice&&<p role="status" className="mt-2 text-xs text-white/65">{autoNotice}</p>}<div className="mt-2 flex flex-wrap gap-2">{selectedCodes.map((code,i)=><span key={code} className="rounded-lg border border-[#BBFF1F]/40 bg-[#BBFF1F]/10 px-2 py-1 text-xs text-[#BBFF1F]">{i+1}. {code}</span>)}</div><p className="mt-3 text-xs text-white/45">La selección se guarda primero como borrador local. Para registrarla definitivamente, usá «Guardar plan en Supabase».</p>{draftNotice&&<p role="status" className="mt-2 text-xs text-[#BBFF1F]">{draftNotice}</p>}<button type="button" onClick={saveMonthlyPlan} disabled={savingPlan||savedPlan||selectedCodes.length!==6} className="mt-4 w-full rounded-xl bg-[#BBFF1F] px-4 py-3 text-sm font-black text-black disabled:opacity-40">{savingPlan?'Guardando…':savedPlan?'Plan registrado':'Guardar plan en Supabase'}</button><p className="mt-2 text-[11px] text-white/45">Solo administradores. Requiere seis ejercicios habilitados con video y no reemplaza asignaciones existentes.</p></div><div className="mt-4 space-y-2">{preview.duties.map(d=><details key={d.duty_code} className="rounded-xl border border-white/10 bg-black/20 p-3"><summary className="cursor-pointer text-sm font-bold"><span className="text-[#BBFF1F]">{d.duty_code}</span> · {d.title} <span className="ml-1 text-xs font-normal text-white/45">{d.active&&d.demo_ready&&!d.requires_explicit_enable?'Listo':'En preparación'}</span></summary><div className="mt-3 space-y-2 text-xs leading-5 text-white/65"><p><strong>Objetivo:</strong> {d.metadata?.objective||d.instructions}</p><p><strong>Práctica:</strong> {d.metadata?.work||'Según planificación docente'}</p><p><strong>Entrega:</strong> {d.metadata?.delivery||'Según indicación docente'}</p><p><strong>Evidencia:</strong> {d.evidence_type}</p><button type="button" disabled={!d.active||!d.demo_ready||d.requires_explicit_enable||(!selectedCodes.includes(d.duty_code)&&selectedCodes.length>=6)} onClick={()=>changeDraft(selectedCodes.includes(d.duty_code)?selectedCodes.filter(x=>x!==d.duty_code):[...selectedCodes,d.duty_code])} className="mt-2 rounded-lg border border-[#BBFF1F]/50 px-3 py-2 font-bold text-[#BBFF1F] disabled:cursor-not-allowed disabled:opacity-30">{selectedCodes.includes(d.duty_code)?'Quitar de selección':'Agregar a los seis desafíos'}</button></div></details>)}</div></>}</section>}
 </div>
}

function TrainingReviewQueue(){
 const [items,setItems]=useState([]),[error,setError]=useState(''),[busy,setBusy]=useState(''),[notes,setNotes]=useState({}),[showAll,setShowAll]=useState(false),[studentNames,setStudentNames]=useState({})
 async function refresh(){const {data,error:e}=await supabase.rpc('pr_training_v2_staff_submissions');if(e)setError(e.message);else {setItems(data||[]);setError('');const ids=[...new Set((data||[]).map(x=>x.profile_id).filter(Boolean))];if(ids.length){const found=await supabase.from('profiles').select('id,nombre,apellido').in('id',ids);if(!found.error)setStudentNames(Object.fromEntries((found.data||[]).map(p=>[p.id,[p.nombre,p.apellido].filter(Boolean).join(' ')])))}}}
 useEffect(()=>{refresh()},[])
 async function review(id,status){
  const item=items.find(x=>x.id===id);const note=(notes[id]??item?.reviewer_note??'').trim();
  if(status==='returned'&&!note){setError('Escribí qué debe corregir el alumno.');return}
  setBusy(id);setError('');const {error:e}=await supabase.rpc('pr_training_v2_review_submission',{p_submission_id:id,p_status:status,p_note:note});
  if(e)setError(e.message);else await refresh();setBusy('')
 }
 async function openEvidence(item,path){
  const {data,error:e}=await supabase.storage.from('pr-training-v2-evidence').createSignedUrl(path,120)
  if(e||!data?.signedUrl){setError(e?.message||'No se pudo abrir el archivo');return}
  window.open(data.signedUrl,'_blank','noopener,noreferrer')
 }
 const pending=items.filter(item=>item.status==='submitted'||item.status==='under_review')
 const visible=showAll?items:pending
 return <section className="mt-5 rounded-[24px] border border-white/10 bg-[#101014] p-5"><div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-black">Revisión de evidencias · {pending.length} pendientes</h2><p className="mt-1 text-xs text-white/50">Entregas privadas · Claudio y profesores</p></div><button type="button" onClick={refresh} className="rounded-full border border-white/20 px-4 py-2 text-xs font-bold">Actualizar</button></div>{error&&<p role="alert" className="mt-3 text-xs text-[#FF8DAF]">{error}</p>}<label className="mt-4 flex items-center gap-2 text-xs text-white/60"><input type="checkbox" checked={showAll} onChange={e=>setShowAll(e.target.checked)}/> Mostrar también aprobadas</label>{visible.length===0?<p className="mt-4 text-sm text-white/45">No hay entregas pendientes.</p>:<div className="mt-4 space-y-3">{visible.map(item=><article key={item.id} className="rounded-xl border border-white/10 bg-white/5 p-4"><div className="flex flex-wrap justify-between gap-2"><div><p className="text-sm font-bold">{item.duty_title}</p><p className="mt-1 text-xs text-white/50">Alumno: {studentNames[item.profile_id]||item.profile_id}</p></div><span className="text-xs text-[#BBFF1F]">{item.status}</span></div><div className="mt-3 flex flex-wrap gap-2">{(item.evidence?.paths||[]).map((path,i)=><button key={path} type="button" onClick={()=>openEvidence(item,path)} className="rounded-lg border border-white/20 px-3 py-2 text-xs">Ver evidencia {i+1}</button>)}</div><textarea value={notes[item.id]??item.reviewer_note??''} onChange={e=>setNotes(p=>({...p,[item.id]:e.target.value}))} placeholder="Comentario para el alumno" className="mt-3 w-full rounded-xl border border-white/15 bg-black/30 p-3 text-sm" rows={2}/><div className="mt-3 flex flex-wrap gap-2">{[['approved','Aprobar'],['returned','Solicitar corrección'],['under_review','En revisión']].map(([status,label])=><button type="button" key={status} disabled={busy===item.id} onClick={()=>review(item.id,status)} className="rounded-full border border-[#BBFF1F]/40 px-3 py-2 text-xs font-bold text-[#BBFF1F] disabled:opacity-40">{label}</button>)}</div></article>)}</div>}</section>
}

function TrainingAdminControls(){
 const [overview,setOverview]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(false)
 const [dutyMessage,setDutyMessage]=useState(''),[catalogDetails,setCatalogDetails]=useState([]),[catalogLevel,setCatalogLevel]=useState('B1'),[expandedDuty,setExpandedDuty]=useState(''),[readiness,setReadiness]=useState({}),[checking,setChecking]=useState(false)
 async function refresh(){
  setLoading(true);setError('')
  const [overviewResult,catalogResult]=await Promise.all([supabase.rpc('pr_training_v2_admin_overview'),supabase.from('pr_training_v2_duties').select('duty_code,title,level_code,instructions,evidence_type,metadata,active,demo_ready,requires_explicit_enable,demo_video_path').order('duty_code')])
  if(overviewResult.error||catalogResult.error)setError(overviewResult.error?.message||catalogResult.error?.message)
  else {setOverview(overviewResult.data);setCatalogDetails(catalogResult.data||[])}
  setLoading(false)
 }
 useEffect(()=>{refresh()},[])
 async function checkReadiness(){setChecking(true);const levels=['B1','B2','B3','B4'];const responses=await Promise.all(levels.map(async level=>({level,...await supabase.rpc('pr_tareas_preview_selection',{p_level:level})})));setReadiness(Object.fromEntries(responses.map(r=>[r.level,r.error?{error:r.error.message}:r.data])));setChecking(false)}
 async function updateDuty(d, field){
  setDutyMessage('')
  if(field==='demo'&&!d.demo_ready&&!d.demo_video_path){setDutyMessage('Primero hay que subir el video demostrativo del ejercicio.');return}
  const nextDemo=field==='demo'? !d.demo_ready : d.demo_ready
  const nextActive=field==='active'? !d.active : d.active
  if(nextActive&&!nextDemo&&(d.requires_demo!==false)){
   setDutyMessage('Verificá el video demostrativo antes de activar el deber.')
   return
  }
  const {error:e}=await supabase.rpc('pr_training_v2_admin_set_duty_readiness',{p_code:d.code,p_demo_ready:nextDemo,p_active:nextActive})
  if(e)setDutyMessage(e.message)
  else refresh()
 }
 return <section className="mt-5 rounded-[24px] border border-[#BBFF1F]/25 bg-[#101014] p-5">
  <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-black">Centro de control · PR TAREAS</h2><p className="mt-1 text-xs text-white/50">Datos reales de Supabase · Acceso administrativo</p></div><button type="button" onClick={refresh} disabled={loading} className="rounded-full border border-white/20 px-4 py-2 text-xs font-bold">{loading?'Actualizando…':'Actualizar datos'}</button></div>
  {error&&<p role="alert" className="mt-4 text-sm text-[#FF8DAF]">{error}</p>}
  {overview&&<><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">{[['Ejercicios desarrollados',overview.catalog?.length||0],['Videos listos',overview.catalog?.filter(d=>d.demo_ready).length||0],['Incidencias',overview.incidents?.length||0],['Niveles asignados',overview.levels?.length||0]].map(([label,value])=><div key={label} className="rounded-xl bg-white/5 p-3"><p className="text-2xl font-black text-[#BBFF1F]">{value}</p><p className="text-xs text-white/50">{label}</p></div>)}</div>
  <div className="mt-4 space-y-2">{overview.cycles?.map(c=><div key={c.month} className="flex justify-between gap-3 rounded-xl bg-white/5 p-3 text-sm"><span>{c.month}</span><span className={c.visible&&c.assignments_enabled?'text-[#BBFF1F]':'text-white/50'}>{c.visible&&c.assignments_enabled?'Habilitado':'Oculto / bloqueado'}</span></div>)}</div>
  <div className="mt-5 rounded-2xl border border-white/10 bg-white/[.03] p-4"><h3 className="text-sm font-black">¿Cómo se usa este panel?</h3><p className="mt-2 text-xs leading-5 text-white/65"><strong className="text-white">Biblioteca pedagógica:</strong> consultá los ejercicios originales y sus instrucciones. <strong className="text-white">Diagnóstico:</strong> comprobá cuáles tienen video y habilitación. <strong className="text-white">Control de publicación:</strong> administrá el estado de cada ejercicio. <strong className="text-white">Alumnos:</strong> prepará seis desafíos para un mes. <strong className="text-white">Entregas:</strong> revisá evidencias y dejá devoluciones.</p><p className="mt-2 text-xs font-semibold text-[#BBFF1F]">Los ciclos siguen ocultos: preparar ejercicios no los publica.</p></div><div className="mt-5 rounded-2xl border border-[#BBFF1F]/20 bg-[#BBFF1F]/5 p-4"><p className="text-xs font-black uppercase tracking-widest text-[#BBFF1F]">Biblioteca pedagógica original</p><h3 className="mt-2 text-lg font-black">Ejercicios desarrollados por nivel</h3><p className="mt-2 text-xs leading-5 text-white/60">Objetivos, trabajo, entrega, evidencia y validación guardados en Supabase. Los videos se incorporarán sin reemplazar el contenido existente. El número de cada nivel indica ejercicios desarrollados, no ejercicios habilitados.</p><div className="mt-4 flex flex-wrap gap-2">{['B1','B2','B3','B4'].map(level=><button key={level} type="button" onClick={()=>{setCatalogLevel(level);setExpandedDuty('')}} className={`rounded-lg px-4 py-2 text-xs font-bold ${catalogLevel===level?'bg-[#BBFF1F] text-black':'border border-white/20 text-white'}`}>{level} · {catalogDetails.filter(d=>d.level_code===level).length}</button>)}</div>{catalogDetails.length===0&&<p role="status" className="mt-3 text-xs text-white/60">No se pudieron cargar ejercicios. Tocá «Actualizar datos» para volver a consultar la biblioteca.</p>}<div className="mt-3 space-y-2">{catalogDetails.filter(d=>d.level_code===catalogLevel).map(d=><article key={d.duty_code} className="overflow-hidden rounded-xl border border-white/10 bg-[#17181D]"><button type="button" onClick={()=>setExpandedDuty(expandedDuty===d.duty_code?'':d.duty_code)} className="flex w-full items-center justify-between gap-3 p-3 text-left"><span className="text-sm"><strong className="text-[#BBFF1F]">{d.duty_code}</strong> · {d.title}</span><span>{expandedDuty===d.duty_code?'−':'+'}</span></button>{expandedDuty===d.duty_code&&<div className="space-y-3 border-t border-white/10 p-4 text-xs leading-5"><p><strong className="text-white">Objetivo:</strong> {d.metadata?.objective||d.instructions}</p><p><strong className="text-white">Trabajo:</strong> {d.metadata?.work||'Consultar planificación pedagógica'}</p><p><strong className="text-white">Entrega:</strong> {d.metadata?.delivery||'Según indicación docente'}</p><p><strong className="text-white">Evidencia:</strong> {d.evidence_type||'Por definir'}</p><p><strong className="text-white">Validación docente:</strong> {d.metadata?.review_required?'Sí':'Según planificación'}</p><p><strong className="text-white">Videos vinculados:</strong> {(d.metadata?.demo_ids||[]).join(', ')||'Sin referencia'} · {d.demo_ready?'Listo':'Pendiente de archivo'}</p><p className="text-white/45">{d.requires_explicit_enable?'Requiere habilitación individual. ':''}{d.active?'Habilitado':'Aún no publicado'}</p></div>}</article>)}{catalogDetails.length>0&&catalogDetails.filter(d=>d.level_code===catalogLevel).length===0&&<p className="text-xs text-white/50">Todavía no hay ejercicios cargados para este nivel.</p>}</div></div>
  <section className="mt-5 rounded-2xl border border-white/10 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-black">Diagnóstico de preparación mensual</h3><p className="mt-1 text-xs text-white/50">Comprueba ejercicios habilitados y demostraciones listas, sin publicar ni asignar nada.</p></div><button type="button" onClick={checkReadiness} disabled={checking} className="rounded-lg border border-[#BBFF1F]/50 px-3 py-2 text-xs font-bold text-[#BBFF1F]">{checking?'Comprobando…':'Comprobar niveles'}</button></div><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{['B1','B2','B3','B4'].map(level=><div key={level} className="rounded-xl bg-white/5 p-3"><p className="font-black text-[#BBFF1F]">{level}</p><p className="mt-1 text-xs text-white/70">{readiness[level]?.error?'No disponible':readiness[level]?`${readiness[level].eligible_count} de 6 listos`:'Pendiente de comprobar'}</p><p className="mt-1 text-[11px] text-white/45">{readiness[level]?.ready_for_six?'Preparado para asignación':'No habilitado'}</p></div>)}</div></section>
  <h3 className="mt-5 text-sm font-black">Habilitación de ejercicios</h3><p className="mt-1 text-xs text-white/50">Activar un ejercicio no publica el mes. Requiere video demostrativo verificado. No marques «Demo lista» si todavía no existe el archivo.</p><div className="mt-2 max-h-52 overflow-y-auto rounded-xl border border-white/10">{overview.catalog?.map(d=><div key={d.code} className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2 text-xs"><span><b className="text-[#BBFF1F]">{d.code}</b> · {d.title}</span><span className="flex shrink-0 gap-1"><button type="button" onClick={()=>updateDuty(d,'demo')} className={`rounded-md border px-2 py-1 ${d.demo_ready?'border-[#BBFF1F] text-[#BBFF1F]':'border-white/20 text-white/50'}`} title="Confirmar que el video demostrativo está cargado y validado">{d.demo_ready?'Demo ✓':'Demo pendiente'}</button><button type="button" onClick={()=>updateDuty(d,'active')} className={`rounded-md border px-2 py-1 ${d.active?'border-[#BBFF1F] text-[#BBFF1F]':'border-white/20 text-white/50'}`}>{d.active?'Activo':'Inactivo'}</button></span></div>)}</div>
  {dutyMessage&&<p role="alert" className="mt-2 text-xs text-[#FF8DAF]">{dutyMessage}</p>}
  {overview.incidents?.length>0&&<div className="mt-4"><h3 className="text-sm font-black text-[#FF8DAF]">Incidencias</h3>{overview.incidents.map(i=><p key={i.id} className="mt-2 text-xs text-white/65">{i.profile_id} · {i.code}</p>)}</div>}
</>}
 </section>
}

const staffIds = new Set(['admin-claudio', 'profe-david', 'alumno-48812609'])

const tabs=[['deberes','Deberes'],['inicio','Progreso'],['actividad','Actividad']]
const sample=[{n:'01',title:'Control y equilibrio',type:'Técnica',detail:'Dominio del patín y estabilidad',color:'#BBFF1F'},{n:'02',title:'Frenada en T',type:'Técnica',detail:'10 repeticiones · grabar las últimas 2',color:'#EFF8FF'},{n:'03',title:'Técnica de giro',type:'Técnica',detail:'Giros controlados y postura',color:'#FF0055'},{n:'04',title:'Resistencia',type:'Strava',detail:'Entrenamiento registrado',color:'#BBFF1F'},{n:'05',title:'Patinaje hacia atrás',type:'Video',detail:'3 minutos de práctica',color:'#EFF8FF'},{n:'06',title:'Precisión y postura',type:'Técnica',detail:'Evidencia visual de ejecución',color:'#FF0055'}]
const weekdays=['L','M','M','J','V','S','D']
function MonthPreview(){
  const days=Array.from({length:35},(_,i)=>i-5)
  return <div className="grid grid-cols-7 gap-2">{weekdays.map((d,i)=><span key={i} className="pb-2 text-center text-[11px] font-bold text-white/40">{d}</span>)}{days.map((d,i)=><span key={i} className={`flex aspect-square items-center justify-center rounded-full text-xs font-bold ${d<1||d>30?'text-white/10':d===1?'bg-white/10 text-white':d===14||d===21||d===28?'bg-white/10 text-white':'bg-white/[.055] text-white/65'}`}>{d>=1&&d<=30?d:''}</span>)}</div>
}
function Ring({value=0,size=110}){
 return <div className="relative grid shrink-0 place-items-center rounded-full" style={{width:size,height:size,background:`conic-gradient(#BBFF1F ${value}%,#33313A 0)`}}><div className="absolute inset-[9px] grid place-items-center rounded-full bg-[#18171E]"><span className="text-2xl font-black text-[#EFF8FF]">{value}%</span></div></div>
}
function TaskCard({task,index,onClick}){
 const shades=['#BFFF2B','#4EE8CE','#FF3D83','#C5F970','#72D7FF','#FFAF72']
 const accent=shades[index%shades.length]
 return <button type="button" onClick={onClick} className="group relative flex w-full min-w-0 items-center gap-4 overflow-hidden rounded-[22px] border border-white/10 px-4 py-[18px] text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-white/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300" style={{background:'linear-gradient(112deg,#202027 0%,#16151C 72%,#111117 100%)',boxShadow:'0 8px 26px rgba(0,0,0,.16)'}}>
 <span className="absolute inset-y-4 left-0 w-[3px] rounded-full" style={{background:accent}}/>
 <span className="shrink-0 text-[30px] font-black leading-none tracking-[-.08em] tabular-nums" style={{color:accent}}>{task.n}</span>
 <span className="min-w-0 flex-1"><span className="block text-[15px] font-extrabold leading-tight tracking-tight text-white">{task.title}</span><span className="mt-1.5 block text-xs leading-snug text-white/60">{task.detail}</span></span>
 <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-lg text-white/75 transition group-hover:translate-x-0.5" aria-hidden="true">›</span>
 </button>
}

function PRTareasHome({user}){
 const [info,setInfo]=useState(''),[open,setOpen]=useState(null),[plan,setPlan]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[revealed,setRevealed]=useState(0),[profile,setProfile]=useState(null),[files,setFiles]=useState({}),[sending,setSending]=useState(null),[feedback,setFeedback]=useState('')
 const today=new Date();const month=today.getFullYear()+'-'+String(today.getMonth()+1).padStart(2,'0')+'-01'
 async function refresh(){
  setBusy(true);const {data,error:e}=await supabase.rpc('pr_training_v2_student_assignments',{p_month:month})
  if(e)setError(e.message);else {setPlan(data);setError('')}setBusy(false)
 }
 useEffect(()=>{refresh()},[month])
 useEffect(()=>{try{const stored=Number(localStorage.getItem('pr-tareas-reveal-'+user?.id+'-'+month)||0);setRevealed(Number.isFinite(stored)?Math.max(0,Math.min(6,stored)):0)}catch{setRevealed(0)}},[user?.id,month])
 useEffect(()=>{let cancelled=false;async function loadProfile(){if(!user?.id)return;const {data}=await supabase.from('profiles').select('id,nombre,foto,pr_avatar').eq('auth_user_id',user.id).maybeSingle();if(!cancelled&&data)setProfile(data)}loadProfile();return()=>{cancelled=true}},[user?.id])
 const tasks=Array.isArray(plan?.duties)?plan.duties:[]
 const done=tasks.filter(t=>(t.latest_status)==='approved').length
 const percent=tasks.length?Math.round(done/tasks.length*100):0
 const discovered=tasks.length===6?Math.min(revealed,6):0
 const inReview=tasks.filter(t=>['submitted','under_review'].includes(t.latest_status)).length
 const toCorrect=tasks.filter(t=>['returned','rejected','changes_requested'].includes(t.latest_status)).length
 const statuses={approved:'Aprobada',submitted:'En revisión',under_review:'En revisión',returned:'Para corregir',rejected:'Para corregir',changes_requested:'Para corregir'}
 function revealNext(){setRevealed(n=>{const next=Math.min(6,n+1);try{localStorage.setItem('pr-tareas-reveal-'+user?.id+'-'+month,String(next))}catch{}return next})}
 async function sendEvidence(task){if(!profile?.id)return setFeedback('No encontramos tu perfil de alumno. Actualizá la página o consultá al equipo docente.');const file=files[task.assignment_duty_id];if(!file)return setFeedback('Elegí primero una foto o un video.');if(file.size>50*1024*1024)return setFeedback('El archivo supera 50 MB. Elegí uno más pequeño.');if(!['image/jpeg','image/png','image/webp','video/mp4','video/quicktime'].includes(file.type))return setFeedback('Formato no admitido. Usá JPG, PNG, WEBP, MP4 o MOV.');setSending(task.assignment_duty_id);setFeedback('');const ext=(file.name.split('.').pop()||'bin').toLowerCase().replace(/[^a-z0-9]/g,'');const path=profile.id+'/'+task.assignment_duty_id+'/'+Date.now()+'-'+Math.random().toString(36).slice(2)+'.'+ext;const uploaded=await supabase.storage.from('pr-training-v2-evidence').upload(path,file,{contentType:file.type,upsert:false});if(uploaded.error){setFeedback('No se pudo subir la evidencia: '+uploaded.error.message);setSending(null);return}const saved=await supabase.rpc('pr_training_v2_submit_evidence',{p_assignment_duty_id:task.assignment_duty_id,p_paths:[path]});if(saved.error){await supabase.storage.from('pr-training-v2-evidence').remove([path]);setFeedback('No se pudo registrar la entrega: '+saved.error.message)}else{setFeedback('¡Evidencia enviada! Claudio o el equipo docente revisarán tu ejercicio.');setFiles(prev=>({...prev,[task.assignment_duty_id]:null}));await refresh()}setSending(null)}
 return <div className="mx-auto max-w-3xl px-4 pb-28 pt-6 text-white">
  <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#C4FF24]">Punta Rollers / Tareas</p>
  <h1 className="mt-2 text-3xl font-black italic uppercase">La clase continúa.</h1>
  <p className="mt-2 max-w-lg text-sm text-white/65">Tus desafíos de patinaje, tus entregas y las devoluciones del equipo docente. Todo en un solo lugar.</p>
  <nav className="mt-5 grid grid-cols-3 gap-2" aria-label="Información de tareas">
   {[['como','Cómo funciona'],['estados','Estados'],['recorrido','Tu recorrido']].map(([key,label])=><button key={key} type="button" onClick={()=>setInfo(info===key?'':key)} className={`rounded-xl border px-2 py-3 text-xs font-bold ${info===key?'border-[#C4FF24] bg-[#C4FF24]/15 text-[#C4FF24]':'border-white/15 bg-white/5'}`}>{label}</button>)}
  </nav>
  {info&&<section className="mt-3 rounded-2xl border border-white/10 bg-[#1C1D25] p-4 text-sm leading-6 text-white/75">{info==='como'?'Cada mes el equipo docente prepara seis actividades para tu nivel. Practicás, enviás la evidencia solicitada y recibís una devolución.':info==='estados'?'Sin entregar: todavía podés practicar. En revisión: el profesor recibió tu evidencia. Para corregir: hay una devolución para mejorar. Aprobada: el ejercicio fue validado.':'Acá podés consultar tus seis actividades, su estado y cuánto avanzaste. Tu porcentaje se calcula únicamente con tareas aprobadas.'}</section>}
  <section className="mt-6 rounded-3xl border border-[#C4FF24]/20 bg-gradient-to-br from-[#182319] to-[#111218] p-5">
   <p className="text-[10px] font-black uppercase tracking-widest text-[#C4FF24]">Tu plan personal · {new Date(month+'T12:00:00').toLocaleDateString('es-UY',{month:'long',year:'numeric'})}</p>
   <h2 className="mt-3 text-2xl font-black italic uppercase">Claudio preparó tus próximos desafíos.</h2>
   <p className="mt-3 text-sm leading-6 text-white/65">Seis ejercicios para practicar a tu ritmo, mejorar tu técnica y compartir tus avances con el equipo docente.</p>
  </section>
  {tasks.length===6&&<section className="mt-6 rounded-3xl border border-[#C4FF24]/30 bg-[#181C1A] p-5"><p className="text-[10px] font-black uppercase tracking-widest text-[#C4FF24]">Revelación de desafíos</p><h2 className="mt-2 text-xl font-black italic">{discovered===6?'¡Tus seis desafíos están listos!':'Descubrí tu próximo desafío'}</h2><p className="mt-2 text-sm text-white/65">{discovered===6?'Abrí cada tarjeta para conocer las instrucciones y preparar tu entrega.':'Revelá las actividades de tu plan una por una. Cada ejercicio fue seleccionado para tu nivel.'}</p><div className="mt-4 grid grid-cols-6 gap-2">{tasks.map((t,i)=><div key={t.assignment_duty_id||i} className={`grid aspect-square place-items-center rounded-xl border text-sm font-black ${i<discovered?'border-[#C4FF24] bg-[#C4FF24]/15 text-[#C4FF24]':'border-white/15 bg-white/5 text-white/40'}`}>{i<discovered?String(i+1).padStart(2,'0'):'?'}</div>)}</div>{discovered<6&&<button type="button" onClick={revealNext} className="mt-4 w-full rounded-xl bg-[#C4FF24] px-4 py-3 text-sm font-black text-black">Revelar desafío {discovered+1} de 6</button>}</section>}
  {tasks.length>0&&<div className="mt-5 grid grid-cols-3 gap-2" aria-label="Resumen del plan"><div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center"><p className="text-xl font-black text-[#C4FF24]">{done}</p><p className="text-[11px] text-white/60">Aprobadas</p></div><div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center"><p className="text-xl font-black">{inReview}</p><p className="text-[11px] text-white/60">En revisión</p></div><div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center"><p className="text-xl font-black">{toCorrect}</p><p className="text-[11px] text-white/60">Para corregir</p></div></div>}
  <section className="mt-7" aria-label="Mis tareas">
   <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-widest text-[#C4FF24]">PR TAREAS · Mi plan</p><h2 className="mt-1 text-xl font-black">Mis seis tareas</h2></div><button type="button" onClick={refresh} disabled={busy} className="rounded-full border border-white/20 px-3 py-2 text-xs">{busy?'Cargando…':'Actualizar'}</button></div>
   {error&&<p role="alert" className="mt-4 rounded-xl bg-red-900/25 p-3 text-sm text-red-200">{error}</p>}
   {!error&&tasks.length===0&&<div className="mt-4 rounded-2xl border border-white/10 bg-[#1B1C24] p-5"><p className="font-bold">Tus tareas todavía no están disponibles.</p><p className="mt-2 text-sm leading-6 text-white/60">Cuando el equipo docente habilite tu ciclo, vas a poder descubrir tus ejercicios acá. No hay tareas pendientes que debas entregar por ahora.</p></div>}
   {feedback&&<p role="status" className="mt-3 rounded-xl border border-[#C4FF24]/30 p-3 text-sm">{feedback}</p>}
   <div className="mt-4 space-y-3">{tasks.slice(0,discovered).map((t,i)=><article key={t.assignment_duty_id||i} className="overflow-hidden rounded-2xl border border-white/10 bg-[#1B1C24]"><button type="button" onClick={()=>setOpen(open===i?null:i)} aria-expanded={open===i} className="flex w-full items-center gap-3 p-4 text-left"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#C4FF24]/60 font-black text-[#C4FF24]">{String(t.slot||i+1).padStart(2,'0')}</span><span className="min-w-0 flex-1"><strong className="block text-sm">{t.title}</strong><small className="mt-1 block text-white/50">{statuses[t.latest_status]||'Sin entregar'}</small></span><span className="flex shrink-0 flex-col items-end gap-1"><strong className="text-xs text-[#C4FF24]">{(t.latest_status)==='approved'?'100%':['submitted','under_review'].includes(t.latest_status)?'En revisión':'0%'}</strong><span className="text-xl text-[#C4FF24]">{open===i?'−':'+'}</span></span></button>{open===i&&<div className="border-t border-white/10 px-4 pb-5 pt-4"><div className="space-y-3 text-sm leading-6 text-white/75">{t.metadata?.objective&&<p><strong className="block text-[#C4FF24]">Objetivo</strong>{t.metadata.objective}</p>}{t.metadata?.work&&<p><strong className="block text-[#C4FF24]">Práctica</strong>{t.metadata.work}</p>}{t.metadata?.delivery&&<p><strong className="block text-[#C4FF24]">Qué entregar</strong>{t.metadata.delivery}</p>}{!t.metadata?.objective&&!t.metadata?.work&&<p className="whitespace-pre-wrap">{t.instructions||'El equipo docente completará las instrucciones.'}</p>}</div><p className="mt-3 text-xs text-white/50">Evidencia solicitada: {t.evidence_type||'Por confirmar'}</p><p className="mt-2 text-xs text-white/50">Video demostrativo: pendiente de incorporación.</p><p className="mt-3 text-xs text-[#C4FF24]">Validación: {statuses[t.latest_status]||'Aún no enviada'}</p>{t.reviewer_note&&<div className="mt-3 rounded-xl border border-[#C4FF24]/25 bg-[#C4FF24]/5 p-3"><p className="text-xs font-black text-[#C4FF24]">Devolución del profesor</p><p className="mt-2 whitespace-pre-wrap text-sm text-white/75">{t.reviewer_note}</p></div>}{!['approved','submitted','under_review'].includes(t.latest_status)&&<div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3"><label htmlFor={'evidence-'+i} className="block text-xs font-bold">Enviar evidencia de este ejercicio</label><input id={'evidence-'+i} type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime" onChange={e=>setFiles(prev=>({...prev,[t.assignment_duty_id]:e.target.files?.[0]||null}))} className="mt-3 block w-full text-xs text-white/70 file:mr-3 file:rounded-lg file:border-0 file:bg-white/15 file:px-3 file:py-2 file:text-white"/><p className="mt-2 text-[11px] text-white/45">Foto o video · hasta 50 MB. La entrega queda pendiente de aprobación docente.</p><button type="button" disabled={sending===t.assignment_duty_id||!files[t.assignment_duty_id]} onClick={()=>sendEvidence(t)} className="mt-3 w-full rounded-xl bg-[#C4FF24] px-4 py-3 text-sm font-black text-black disabled:opacity-40">{sending===t.assignment_duty_id?'Enviando…':'Enviar al profesor'}</button></div>}</div>}</article>)}</div>
  </section>
  <aside className="fixed bottom-16 left-0 right-0 z-30 border-t border-white/10 bg-[#121319]/95 px-4 py-3 backdrop-blur-md"><div className="mx-auto flex max-w-3xl items-center gap-3">{(profile?.foto||user?.foto)&&/^https:\/\//.test(profile?.foto||user?.foto)?<img src={profile?.foto||user?.foto} alt="Mi perfil" className="h-9 w-9 shrink-0 rounded-full object-cover"/>:<span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#C4FF24] text-xs font-black text-black">{String(profile?.nombre||user?.nombre||'PR').slice(0,2).toUpperCase()}</span>}<div className="min-w-0 flex-1"><div className="flex justify-between gap-2 text-xs"><strong>Mi recorrido</strong><span>{tasks.length?`${done}/${tasks.length} aprobadas · ${percent}%`:'Plan pendiente de asignación'}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-[#C4FF24]" style={{width:percent+'%'}}/></div></div></div></aside>
 </div>
}

export default function PRTrainingV2Lab(){
 const {user,loading}=useAuth()
 const [section,setSection]=useState('spin')
 const [visualLab,setVisualLab]=useState(true)
 const adminView=useLocation().pathname==='/admin/tareas'
 const [selected,setSelected]=useState(null)
 const [spinCompleted,setSpinCompleted]=useState(false)
 const [spinCount,setSpinCount]=useState(0)
 useEffect(()=>{
  try {
   const count=Math.min(6,Math.max(0,Number(window.localStorage.getItem('pr-training-v2-preview-spin-count')||0)))
   setSpinCount(count)
   if(count===6){setSpinCompleted(true);setSection('deberes')}
  } catch { /* Storage may be disabled; the preview remains usable. */ }
 },[])
 function rememberSpin(count){
  setSpinCount(count)
  try {window.localStorage.setItem('pr-training-v2-preview-spin-count',String(count))} catch { /* Preview-only storage */ }
 }
 if(loading)return <AppLayout><div className="p-10 text-white">Cargando…</div></AppLayout>
 if(!user)return <Navigate to="/login" replace/>
 if(!staffIds.has(user.id))return <Navigate to="/app/dashboard" replace/>
 const name=user.nombre||'Equipo'
 return <AppLayout>
 <main className="min-h-screen w-full min-w-0 max-w-full overflow-x-hidden bg-[#14141B] text-[#EFF8FF]">
 <div className="mx-auto w-full min-w-0 max-w-5xl">
  {adminView?<TrainingDailyControl/>:<PRTareasHome user={user}/>}


  {adminView&&<footer className="mt-5 px-2 text-center text-[10px] leading-5 text-white/35">PR TAREAS · Administración</footer>}
 </div></main></AppLayout>
}
