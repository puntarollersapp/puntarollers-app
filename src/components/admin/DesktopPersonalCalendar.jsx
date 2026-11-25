import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'

function todayUruguay(){
 const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'America/Montevideo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]))
 return p.year+'-'+p.month+'-'+p.day
}
function shiftDay(date,n){const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)}
function monday(date){return shiftDay(date,1-(new Date(date+'T12:00:00Z').getUTCDay()||7))}
const label=(date,options)=>new Intl.DateTimeFormat('es-UY',{...options,timeZone:'UTC'}).format(new Date(date+'T12:00:00Z'))
const chunks=(ids,n=100)=>Array.from({length:Math.ceil(ids.length/n)},(_,i)=>ids.slice(i*n,i*n+n))
const hhmm=value=>String(value||'').slice(0,5)
const occupying=new Set(['reservada','realizada','ausente'])
const statusLabel={reservada:'Reservado',realizada:'Realizada',ausente:'Ausente'}
const statusStyle={reservada:'border-emerald-400/35 bg-emerald-400/10 text-emerald-200',realizada:'border-sky-400/30 bg-sky-400/10 text-sky-200',ausente:'border-orange-400/30 bg-orange-400/10 text-orange-200'}
async function allRows(makeQuery){
 const rows=[]
 for(let start=0;start<5000;start+=200){
  const {data,error}=await makeQuery().range(start,start+199)
  if(error)throw error
  rows.push(...(data||[]))
  if(!data||data.length<200)return rows
 }
 throw new Error('La consulta excede el límite de seguridad. No se muestra una agenda incompleta.')
}

export default function DesktopPersonalCalendar({onAddDay,onOpenRoster}){
 const today=todayUruguay()
 const [week,setWeek]=useState(()=>monday(today))
 const [revision,setRevision]=useState(0)
 const [state,setState]=useState({week:null,loading:true,error:'',slots:[],reservations:[],profiles:[]})
 const days=useMemo(()=>Array.from({length:7},(_,i)=>shiftDay(week,i)),[week])
 useEffect(()=>{
  let alive=true
  setState(s=>({...s,week,loading:true,error:'',slots:[],reservations:[],profiles:[]}))
  async function load(){
   try{
    const slots=await allRows(()=>supabase.from('pr_personal_disponibilidad').select('id,fecha,hora_inicio,hora_fin,habilitado').gte('fecha',week).lte('fecha',shiftDay(week,6)).order('fecha').order('hora_inicio').order('id'))
    const reservations=(await Promise.all(chunks(slots.map(x=>x.id)).map(ids=>allRows(()=>supabase.from('pr_personal_reservas').select('id,disponibilidad_id,alumno_id,estado').in('disponibilidad_id',ids).order('id'))))).flat()
    const profileIds=[...new Set(reservations.filter(x=>occupying.has(x.estado)).map(x=>x.alumno_id).filter(Boolean))]
    const profiles=(await Promise.all(chunks(profileIds).map(ids=>allRows(()=>supabase.from('profiles').select('id,nombre,apellido').in('id',ids).order('id'))))).flat()
    if(alive)setState({week,loading:false,error:'',slots,reservations,profiles})
   }catch(error){if(alive)setState({week,loading:false,error:error.message||'No se pudo cargar la agenda.',slots:[],reservations:[],profiles:[]})}
  }
  load()
  const onFocus=()=>setRevision(x=>x+1)
  window.addEventListener('focus',onFocus)
  return()=>{alive=false;window.removeEventListener('focus',onFocus)}
 },[week,revision])
 const ready=state.week===week&&!state.loading&&!state.error
 const profiles=new Map(state.profiles.map(p=>[p.id,[p.nombre,p.apellido].filter(Boolean).join(' ')]))
 const bySlot=new Map()
 for(const r of state.reservations){if(!occupying.has(r.estado))continue;const list=bySlot.get(r.disponibilidad_id)||[];list.push(r);bySlot.set(r.disponibilidad_id,list)}
 const openSlots=state.slots.filter(s=>s.habilitado&&!bySlot.has(s.id)).length
 const occupiedSlots=state.slots.filter(s=>bySlot.has(s.id)).length
 return <section className="min-w-0 rounded-[28px] border border-[#FF0055]/25 bg-gradient-to-br from-[#241923] via-[#191A20] to-[#13141b] p-5 shadow-xl" aria-label="Calendario semanal de PR Personal">
  <div className="flex flex-wrap items-start justify-between gap-4">
   <div><p className="text-[10px] font-black tracking-[.22em] text-[#FF91B5]">PR PERSONAL · DESKTOP EDITION</p><h2 className="mt-1 text-2xl font-black text-white">Tu agenda semanal.</h2><p className="mt-1 text-sm text-white/55">Turnos y reservas reales · horario de Uruguay</p></div>
   <div className="flex flex-wrap items-center gap-2"><button type="button" onClick={()=>setWeek(w=>shiftDay(w,-7))} aria-label="Semana anterior" className="h-11 rounded-xl border border-white/15 px-4 text-white">←</button><button type="button" onClick={()=>setWeek(monday(today))} className="h-11 rounded-xl border border-white/15 px-4 text-sm font-bold">Hoy</button><button type="button" onClick={()=>setWeek(w=>shiftDay(w,7))} aria-label="Semana siguiente" className="h-11 rounded-xl border border-white/15 px-4 text-white">→</button><button type="button" onClick={()=>setRevision(v=>v+1)} className="h-11 rounded-xl border border-white/15 px-4 text-sm font-bold">Actualizar ↻</button></div>
  </div>
  <div className="mt-5 flex flex-wrap items-center gap-3"><strong className="text-lg capitalize">{label(week,{day:'numeric',month:'long'})} — {label(days[6],{day:'numeric',month:'long',year:'numeric'})}</strong><span className="rounded-full border border-[#FF0055]/25 bg-[#FF0055]/10 px-3 py-1 text-xs text-[#FF91B5]">{ready?openSlots:'—'} disponibles</span><span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">{ready?occupiedSlots:'—'} con registros</span><button type="button" onClick={onOpenRoster} className="ml-auto rounded-xl border border-white/15 px-4 py-3 text-xs font-bold">Ver lista de reservas</button></div>
  {!ready?<p role={state.error?'alert':'status'} className="mt-5 rounded-2xl border border-white/10 p-5 text-sm text-white/65">{state.error||'Cargando agenda de la semana…'}</p>:<div className="mt-5 overflow-x-auto pb-2"><div className="grid min-w-[770px] grid-cols-7 gap-2">
   {days.map(date=>{const slots=state.slots.filter(s=>s.fecha===date);return <div key={date} className={'min-w-0 rounded-2xl border p-2.5 '+(date===today?'border-[#FF0055]/60 bg-[#FF0055]/[.055]':'border-white/10 bg-black/25')}><div className="flex items-center justify-between gap-1"><div><p className="text-[10px] font-bold uppercase text-white/55">{label(date,{weekday:'short'})}</p><p className={'mt-1 text-2xl font-black '+(date===today?'text-[#FF91B5]':'text-white')}>{date.slice(-2)}</p></div>{date>=today&&<button type="button" onClick={()=>onAddDay(date)} aria-label={'Cargar horarios para '+label(date,{weekday:'long',day:'numeric',month:'long'})} title="Cargar horarios" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[#FF0055]/35 bg-[#FF0055]/15 text-xl font-bold text-[#FF91B5] hover:bg-[#FF0055]/30">+</button>}</div>
   <div className="mt-3 min-h-[160px] space-y-2">{slots.length?slots.map(s=>{const rs=bySlot.get(s.id)||[];const style=rs.length?statusStyle[rs[0].estado]:s.habilitado?'border-[#FF0055]/25 bg-[#FF0055]/10 text-[#FF91B5]':'border-white/10 bg-white/5 text-white/40';return <article key={s.id} className={'rounded-xl border p-2 '+style}><p className="text-xs font-black tabular-nums">{hhmm(s.hora_inicio)}–{hhmm(s.hora_fin)}</p>{rs.length?rs.map(r=><div key={r.id} className="mt-1"><p className="break-words text-[11px] font-semibold leading-tight text-white">{profiles.get(r.alumno_id)||'Alumno'}</p><p className="mt-1 text-[10px]">{statusLabel[r.estado]}</p></div>):<p className="mt-1 text-[10px]">{s.habilitado?'Disponible':'Oculto'}</p>}{!s.habilitado&&rs.length>0&&<p className="mt-1 text-[10px] text-white/50">Turno oculto</p>}</article>}):<p className="rounded-xl border border-dashed border-white/10 p-2.5 text-[11px] text-white/35">Sin horarios</p>}</div></div>})}
  </div></div>}
  <p className="mt-3 text-xs text-white/45">Los turnos se muestran según su estado real. Para modificar reservas o créditos, usá las herramientas existentes de PR Personal.</p>
 </section>
}
