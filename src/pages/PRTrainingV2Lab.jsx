import { useEffect, useRef, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

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
    <div className="relative mx-auto w-full max-w-[320px] rounded-full bg-[radial-gradient(circle,rgba(125,55,219,.35),transparent_70%)] p-1 sm:max-w-[390px]">
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
    <div className="mt-5 grid grid-cols-3 gap-2" aria-live="polite">{Array.from({length:6},(_,i)=><div key={i} className={`min-h-[64px] rounded-xl border p-3 text-center ${revealed[i]?'border-[#C4FF36]/55 bg-[#4D3176]/70':'border-violet-200/20 bg-[#37264E]/70'}`}><p className="text-[10px] font-black text-[#BBFF1F]">{String(i+1).padStart(2,'0')}</p><p className="mt-1 text-xs font-semibold leading-tight text-white">{revealed[i]||'Por revelar'}</p></div>)}</div>
    {stage==='done'&&<button type="button" onClick={onViewDuties} className="mt-5 w-full rounded-[20px] bg-[linear-gradient(110deg,#C6FF25_0%,#81F56D_52%,#31DCD1_100%)] px-5 py-4 text-sm font-black text-[#0D0303]">Ver mis deberes →</button>}
    {stage!=='done'&&<button type="button" onClick={start} disabled={stage!=='idle'} className="mt-5 w-full rounded-full bg-[#BBFF1F] px-5 py-4 text-sm font-black uppercase tracking-wider text-[#0D0303] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">{stage==='done'?'Revelación completada':stage==='spinning'?'Girando…':`GIRAR · ${revealed.length+1} de 6`}</button>}
    <p className="mt-3 text-center text-[11px] leading-5 text-white/40">Vista de prueba · Los ejercicios mostrados son ilustrativos.</p>
  </div>
}
function TrainingDailyControl(){
 const [tab,setTab]=useState('hoy')
 const tabs=[['hoy','Hoy'],['alumnos','Alumnos'],['contenido','Contenido']]
 return <section className="mt-5 rounded-[24px] border border-[#BBFF1F]/30 bg-[#101012] p-4 sm:p-6">
  <div className="mb-4"><p className="text-xs font-bold tracking-[.16em] text-[#BBFF1F]">CENTRO DE CONTROL</p><h2 className="mt-1 text-2xl font-black">PR Training</h2><p className="mt-1 text-xs text-white/50">Todo lo importante, en un solo lugar.</p></div>
  <div role="tablist" aria-label="Administración de PR Training" className="grid grid-cols-3 gap-2">{tabs.map(([id,label])=><button key={id} type="button" role="tab" aria-selected={tab===id} onClick={()=>setTab(id)} className={`rounded-xl px-2 py-3 text-sm font-bold ${tab===id?'bg-[#BBFF1F] text-[#0D0303]':'bg-white/10 text-white/70'}`}>{label}</button>)}</div>
  <div role="tabpanel">{tab==='hoy'?<TrainingReviewQueue/>:tab==='alumnos'?<TrainingStudentSearch/>:<TrainingAdminControls/>}</div>
  {tab==='alumnos'&&<p className="mt-3 text-xs text-white/45">Asignación de nivel B1, B2 o B3. La búsqueda por nombre se incorpora en la siguiente conexión.</p>}
  {tab==='contenido'&&<p className="mt-3 text-xs text-white/45">Catálogo y videos demostrativos: los archivos se podrán incorporar posteriormente.</p>}
 </section>
}

function TrainingStudentSearch(){
 const [query,setQuery]=useState('')
 const [items,setItems]=useState([])
 const [message,setMessage]=useState('')
 async function search(e){
  e.preventDefault()
  const {data,error}=await supabase.rpc('pr_training_v2_admin_search_students',{p_query:query.trim()})
  if(error)setMessage(error.message);else {setItems(data||[]);setMessage('')}
 }
 async function setLevel(id,level){
  const {error}=await supabase.rpc('pr_training_v2_admin_set_level',{p_profile_id:id,p_level:level})
  if(error)setMessage(error.message);else setItems(rows=>rows.map(r=>r.id===id?{...r,level}:r))
 }
 return <div className="mt-4 rounded-2xl bg-[#101014] p-4">
  <h3 className="text-lg font-black">Buscar alumnos</h3>
  <p className="mt-1 text-xs text-white/50">Los alumnos nuevos empiezan en B1. Cambiá su nivel desde acá.</p>
  <form onSubmit={search} className="mt-4 flex gap-2"><input value={query} onChange={e=>setQuery(e.target.value)} minLength={2} required placeholder="Nombre del alumno" className="min-w-0 flex-1 rounded-xl border border-white/15 bg-black/30 px-3 py-3 text-sm"/><button className="rounded-xl bg-[#BBFF1F] px-4 font-bold text-[#0D0303]">Buscar</button></form>
  {message&&<p role="status" className="mt-3 text-xs">{message}</p>}
  <div className="mt-4 space-y-2">{items.map(p=><div key={p.id} className="flex items-center justify-between gap-2 rounded-xl bg-white/5 p-3"><div><p className="text-sm font-bold">{p.name}</p><p className="text-xs text-white/40">{p.level}</p></div><select value={p.level} onChange={e=>setLevel(p.id,e.target.value)} aria-label={'Nivel de '+p.name} className="rounded-lg bg-[#1A1A1D] p-2 text-sm">{['B1','B2','B3'].map(l=><option key={l}>{l}</option>)}</select></div>)}</div>
 </div>
}

function TrainingReviewQueue(){
 const [items,setItems]=useState([]),[error,setError]=useState(''),[busy,setBusy]=useState(''),[notes,setNotes]=useState({}),[showAll,setShowAll]=useState(false)
 async function refresh(){const {data,error:e}=await supabase.rpc('pr_training_v2_staff_submissions');if(e)setError(e.message);else {setItems(data||[]);setError('')}}
 useEffect(()=>{refresh()},[])
 async function review(id,status){
  setBusy(id);const {error:e}=await supabase.rpc('pr_training_v2_review_submission',{p_submission_id:id,p_status:status,p_note:notes[id]||''})
  if(e)setError(e.message);else await refresh();setBusy('')
 }
 async function openEvidence(item,path){
  const {data,error:e}=await supabase.storage.from('pr-training-v2-evidence').createSignedUrl(path,120)
  if(e||!data?.signedUrl){setError(e?.message||'No se pudo abrir el archivo');return}
  window.open(data.signedUrl,'_blank','noopener,noreferrer')
 }
 const pending=items.filter(item=>item.status==='submitted'||item.status==='under_review')
 const visible=showAll?items:pending
 return <section className="mt-5 rounded-[24px] border border-white/10 bg-[#101014] p-5"><div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-black">Revisión de evidencias · {pending.length} pendientes</h2><p className="mt-1 text-xs text-white/50">Entregas privadas · Claudio y profesores</p></div><button type="button" onClick={refresh} className="rounded-full border border-white/20 px-4 py-2 text-xs font-bold">Actualizar</button></div>{error&&<p role="alert" className="mt-3 text-xs text-[#FF8DAF]">{error}</p>}<label className="mt-4 flex items-center gap-2 text-xs text-white/60"><input type="checkbox" checked={showAll} onChange={e=>setShowAll(e.target.checked)}/> Mostrar también aprobadas</label>{visible.length===0?<p className="mt-4 text-sm text-white/45">No hay entregas pendientes.</p>:<div className="mt-4 space-y-3">{visible.map(item=><article key={item.id} className="rounded-xl border border-white/10 bg-white/5 p-4"><div className="flex flex-wrap justify-between gap-2"><div><p className="text-sm font-bold">{item.duty_title}</p><p className="mt-1 text-xs text-white/50">Perfil: {item.profile_id}</p></div><span className="text-xs text-[#BBFF1F]">{item.status}</span></div><div className="mt-3 flex flex-wrap gap-2">{(item.evidence?.paths||[]).map((path,i)=><button key={path} type="button" onClick={()=>openEvidence(item,path)} className="rounded-lg border border-white/20 px-3 py-2 text-xs">Ver evidencia {i+1}</button>)}</div><textarea value={notes[item.id]??item.reviewer_note??''} onChange={e=>setNotes(p=>({...p,[item.id]:e.target.value}))} placeholder="Comentario para el alumno" className="mt-3 w-full rounded-xl border border-white/15 bg-black/30 p-3 text-sm" rows={2}/><div className="mt-3 flex flex-wrap gap-2">{[['approved','Aprobar'],['returned','Solicitar corrección'],['under_review','En revisión']].map(([status,label])=><button type="button" key={status} disabled={busy===item.id} onClick={()=>review(item.id,status)} className="rounded-full border border-[#BBFF1F]/40 px-3 py-2 text-xs font-bold text-[#BBFF1F] disabled:opacity-40">{label}</button>)}</div></article>)}</div>}</section>
}

function TrainingAdminControls(){
 const [overview,setOverview]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(false)
 const [dutyMessage,setDutyMessage]=useState('')
 async function refresh(){
  setLoading(true);setError('')
  const {data,error:e}=await supabase.rpc('pr_training_v2_admin_overview')
  if(e)setError(e.message);else setOverview(data)
  setLoading(false)
 }
 useEffect(()=>{refresh()},[])
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
  <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-black">Centro de control · PR Training 2.0</h2><p className="mt-1 text-xs text-white/50">Datos reales de Supabase · Acceso administrativo</p></div><button type="button" onClick={refresh} disabled={loading} className="rounded-full border border-white/20 px-4 py-2 text-xs font-bold">{loading?'Actualizando…':'Actualizar datos'}</button></div>
  {error&&<p role="alert" className="mt-4 text-sm text-[#FF8DAF]">{error}</p>}
  {overview&&<><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">{[['Deberes',overview.catalog?.length||0],['Videos listos',overview.catalog?.filter(d=>d.demo_ready).length||0],['Incidencias',overview.incidents?.length||0],['Niveles asignados',overview.levels?.length||0]].map(([label,value])=><div key={label} className="rounded-xl bg-white/5 p-3"><p className="text-2xl font-black text-[#BBFF1F]">{value}</p><p className="text-xs text-white/50">{label}</p></div>)}</div>
  <div className="mt-4 space-y-2">{overview.cycles?.map(c=><div key={c.month} className="flex justify-between gap-3 rounded-xl bg-white/5 p-3 text-sm"><span>{c.month}</span><span className={c.visible&&c.assignments_enabled?'text-[#BBFF1F]':'text-white/50'}>{c.visible&&c.assignments_enabled?'Habilitado':'Oculto / bloqueado'}</span></div>)}</div>
  <h3 className="mt-5 text-sm font-black">Catálogo real</h3><div className="mt-2 max-h-52 overflow-y-auto rounded-xl border border-white/10">{overview.catalog?.map(d=><div key={d.code} className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2 text-xs"><span><b className="text-[#BBFF1F]">{d.code}</b> · {d.title}</span><span className="flex shrink-0 gap-1"><button type="button" onClick={()=>updateDuty(d,'demo')} className={`rounded-md border px-2 py-1 ${d.demo_ready?'border-[#BBFF1F] text-[#BBFF1F]':'border-white/20 text-white/50'}`} title="Confirmar que el video demostrativo está cargado y validado">{d.demo_ready?'Demo ✓':'Demo pendiente'}</button><button type="button" onClick={()=>updateDuty(d,'active')} className={`rounded-md border px-2 py-1 ${d.active?'border-[#BBFF1F] text-[#BBFF1F]':'border-white/20 text-white/50'}`}>{d.active?'Activo':'Inactivo'}</button></span></div>)}</div>
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
  return <div className="grid grid-cols-7 gap-2">{weekdays.map((d,i)=><span key={i} className="pb-2 text-center text-[11px] font-bold text-white/40">{d}</span>)}{days.map((d,i)=><span key={i} className={`flex aspect-square items-center justify-center rounded-full text-xs font-bold ${d<1||d>30?'text-white/10':d===1?'bg-[#BBFF1F] text-[#0D0303]':d===14||d===21||d===28?'bg-[#FF0055] text-white':'bg-white/[.055] text-white/65'}`}>{d>=1&&d<=30?d:''}</span>)}</div>
}
function Ring({value=0,size=110}){
 return <div className="relative grid shrink-0 place-items-center rounded-full" style={{width:size,height:size,background:`conic-gradient(#BBFF1F ${value}%,#7851A6 0)`}}><div className="absolute inset-[9px] grid place-items-center rounded-full bg-[#28183F]"><span className="text-2xl font-black text-[#EFF8FF]">{value}%</span></div></div>
}
function TaskCard({task,index,onClick}){
 const tone=index%3===0?'from-[#57249D]/45 via-[#26133F] to-[#160E27]':index%3===1?'from-[#253F4C]/45 via-[#1B2440] to-[#160E27]':'from-[#59304B]/40 via-[#29172F] to-[#160E27]'
 return <button type="button" onClick={onClick} className={`group relative flex w-full min-w-0 items-center gap-3 overflow-hidden rounded-[19px] border border-white/[.11] bg-gradient-to-r ${tone} px-4 py-4 text-left shadow-[0_8px_22px_rgba(0,0,0,.15)] transition duration-200 hover:border-violet-300/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400`}>
 <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] border border-white/15 bg-white/[.09] text-[13px] font-extrabold tabular-nums text-white/85">{task.n}</span>
 <span className="min-w-0 flex-1"><span className="block text-[15px] font-bold leading-tight tracking-tight text-white">{task.title}</span><span className="mt-1.5 block text-xs leading-snug text-white/60">{task.detail}</span></span>
 <span className="shrink-0 rounded-full bg-white/[.09] p-2 text-base leading-none text-white/65" aria-hidden="true">›</span>
 </button>
}
export default function PRTrainingV2Lab(){
 const {user,loading}=useAuth()
 const [section,setSection]=useState('spin')
 const adminView=useLocation().pathname==='/admin/pr-training-control'
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
 <main className="min-h-screen w-full min-w-0 max-w-full overflow-x-hidden bg-[radial-gradient(ellipse_at_15%_0%,rgba(110,38,197,.20),transparent_55%),linear-gradient(180deg,#10091F_0%,#120B21_45%,#0D0917_100%)] px-3 pb-28 pt-5 text-[#EFF8FF] sm:px-6">
 <div className="mx-auto w-full min-w-0 max-w-5xl">
  {adminView?<TrainingDailyControl/>:<>
  <div className="mb-3 flex items-center justify-between gap-3 px-1"><div><p className="text-[10px] font-semibold uppercase tracking-[.22em] text-white/45">Punta Rollers / Training</p><h1 className="mt-1 text-[25px] font-black leading-tight tracking-tight text-[#EFF8FF]">{spinCompleted?'Mis deberes':'Descubrí tus deberes'}</h1></div><div className="shrink-0 rounded-full border border-violet-300/25 bg-violet-500/15 px-3 py-2 text-xs font-semibold text-white/85">{spinCompleted?'0 de 6':'PR SPIN'}</div></div>
  {spinCompleted&&<nav className="mt-4 grid grid-cols-3 gap-1 rounded-2xl border border-violet-300/10 bg-[#201333]/75 p-1.5" aria-label="Secciones de PR Training">{tabs.filter(([key])=>key!=='spin').map(([key,label])=><button key={key} type="button" onClick={()=>{setSection(key);setSelected(null)}} className={`min-w-0 px-1 py-2.5 text-xs font-semibold transition ${section===key?'rounded-xl bg-[#5E29A9] text-white shadow-[0_4px_15px_rgba(89,36,161,.28)]':'rounded-xl text-white/60 hover:text-white'}`}>{label}</button>)}</nav>}
  {spinCompleted&&section==='inicio'&&<div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_.9fr]"><div className="space-y-4"><section className="rounded-[24px] border border-violet-200/25 bg-[linear-gradient(135deg,#593187_0%,#362251_55%,#26183D_100%)] p-5 sm:p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-white/70">Mi progreso</p><h2 className="mt-2 text-2xl font-black">Ciclo de noviembre</h2><p className="mt-2 text-xs text-white/70">Seis deberes · Vista de diseño</p></div><Ring value={0}/></div><div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full w-0 rounded-full bg-[#BBFF1F]"/></div><div className="mt-3 flex justify-between text-xs text-white/75"><span>0 de 6 completados</span><span>Aún no iniciado</span></div></section><section className="rounded-[24px] border border-violet-200/20 bg-[linear-gradient(145deg,#342052_0%,#241839_65%,#20162F_100%)] p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><h2 className="text-xl font-black">Mis desafíos</h2><button onClick={()=>setSection('deberes')} className="text-xs font-bold text-[#D7FF86]">Ver todos ↗</button></div><div className="mt-5 space-y-3">{sample.slice(0,3).map((task,i)=><TaskCard key={task.n} task={task} index={i} onClick={()=>{setSection('deberes');setSelected(i)}}/>)}</div></section></div><div className="space-y-4"><section className="rounded-[24px] border border-violet-200/20 bg-[linear-gradient(145deg,#342052_0%,#241839_65%,#20162F_100%)] p-5 sm:p-6"><div className="flex items-center justify-between"><h2 className="text-xl font-black">Calendario</h2><span className="text-xs text-white/65">NOV / 2026</span></div><p className="mb-5 mt-1 text-xs text-white/70">Vista ilustrativa de actividad</p><MonthPreview/><div className="mt-5 flex flex-wrap gap-4 text-[11px] text-white/75"><span><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[#BBFF1F]"/>Deber realizado</span><span><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[#FF0055]"/>Clase asistida</span><span><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-gradient-to-r from-[#BBFF1F] to-[#FF0055]"/>Ambas actividades</span></div></section></div></div>}
  {spinCompleted&&section==='deberes'&&<section className="mt-2 w-full min-w-0 max-w-full overflow-hidden bg-transparent px-0 py-3 sm:p-5"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[11px] font-semibold uppercase tracking-widest text-white/45">NOVIEMBRE / 2026</p><h2 className="mt-1 text-[26px] font-black tracking-tight">Tus seis ejercicios</h2><p className="mt-2 text-xs text-white/55">Ejercicios de muestra · Vista privada</p></div><span className="rounded-full border border-violet-300/20 bg-violet-500/15 px-3 py-2 text-xs font-bold">0 / 6</span></div><div className="mt-4 grid min-w-0 grid-cols-1 gap-2.5 md:grid-cols-2">{sample.map((task,i)=><TaskCard key={task.n} task={task} index={i} onClick={()=>setSelected(selected===i?null:i)}/>)}</div>{selected!==null&&<div className="mt-5 rounded-2xl border border-[#BBFF1F]/35 bg-[#BBFF1F]/[.07] p-5"><p className="text-xs font-bold uppercase text-[#BBFF1F]">Vista del deber {sample[selected].n}</p><h3 className="mt-2 text-xl font-black">{sample[selected].title}</h3><p className="mt-2 text-sm text-white/60">{sample[selected].detail}</p><p className="mt-4 text-xs text-white/45">El envío de evidencia se habilitará cuando estén conectados el catálogo real y la revisión docente.</p></div>}</section>}
  {spinCompleted&&section==='actividad'&&<div className="mt-4 grid gap-4 lg:grid-cols-2"><section className="rounded-[24px] border border-violet-200/20 bg-[linear-gradient(145deg,#342052_0%,#241839_65%,#20162F_100%)] p-5 sm:p-6"><p className="text-xs font-bold uppercase tracking-widest text-white/65">Estadísticas</p><h2 className="mt-2 text-2xl font-black">Tu evolución</h2><div className="mt-7 flex items-center gap-5"><Ring value={0} size={125}/><div><p className="text-3xl font-black">0 <span className="text-sm text-white/65">/ 6</span></p><p className="mt-2 text-sm text-white/75">Tareas del próximo ciclo</p><p className="mt-3 text-xs text-[#D7FF86]">Tu progreso se actualizará con las entregas</p></div></div></section><section className="rounded-[24px] border border-violet-200/20 bg-[linear-gradient(145deg,#342052_0%,#241839_65%,#20162F_100%)] p-5 sm:p-6"><h2 className="text-2xl font-black">Cómo se valida</h2><div className="mt-5 space-y-4">{[['01','Enviado','Foto, video o Strava'],['02','En revisión','Claudio o David comprueban la evidencia'],['03','Aprobado','Tu progreso se actualiza']].map(([n,title,desc])=><div key={n} className="flex gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-pink-200/25 bg-[#A02F78] font-black">{n}</span><div><p className="font-bold">{title}</p><p className="mt-1 text-xs text-white/75">{desc}</p></div></div>)}</div></section></div>}
  {!spinCompleted&&section==='spin'&&<section className="mt-3 w-full min-w-0 max-w-full overflow-hidden rounded-[28px] border border-[#C7FF2B]/30 bg-[radial-gradient(ellipse_at_50%_15%,rgba(113,52,181,.45),transparent_65%),linear-gradient(145deg,#231029,#171020)] px-4 py-6 sm:p-8"><div className="text-center"><p className="text-xs font-black tracking-[.2em] text-[#BBFF1F]">PUNTA ROLLERS · PR TRAINING</p><h2 className="mt-2 text-4xl font-black tracking-tight">PR SPIN</h2><p className="mt-2 text-sm text-white/45">Seis giros, seis deberes. Tocá GIRAR para descubrirlos de a uno.</p><p className="mx-auto mt-2 max-w-md text-xs leading-5 text-white/55">Cada ejercicio fue preparado por el Profe Claudio para acompañar tu progreso. Esta ruleta es una demostración visual.</p></div><div className="mx-auto mt-5 max-w-[450px]"><SpinWheel initialRevealed={spinCount} onReveal={rememberSpin} onViewDuties={()=>{setSpinCompleted(true);setSection('deberes')}}/></div></section>}
  </>}
  <footer className="mt-5 px-2 text-center text-[10px] leading-5 text-white/35">PR Training 2.0 · Laboratorio privado · Contenido de demostración sin escritura de datos</footer>
 </div></main></AppLayout>
}
