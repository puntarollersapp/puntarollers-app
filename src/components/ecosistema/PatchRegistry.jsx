import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'

const patterns={class:/\\b(clase|class|entrenamiento|training)\\b/i,roll:/rolleada|roll(eada|ing)?|patinada|salida grupal/i,time:/shifter|toma de tiempo|contrarreloj|time trial|crono/i,event:/evento|encuentro|festival|competencia/i}
const names={class:'CLASES EN STRAVA',roll:'ROLLEADAS POSIBLES',time:'TOMAS DE TIEMPO POSIBLES',event:'EVENTOS POSIBLES'}
function category(name){return Object.keys(patterns).find(k=>patterns[k].test(String(name||'')))||null}
const dateKey=v=>String(v||'').slice(0,10)
function Orbit({days}){const cells=Array.from({length:84},(_,i)=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-83+i);const key=[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');return {key,count:days.get(key)||0}});return <div className="mt-5 grid grid-cols-12 gap-[5px]" aria-label="Mapa de 84 días de registros">{cells.map(c=><div key={c.key} title={c.key+' · '+c.count+' registros'} className="aspect-square rounded-[5px] border border-white/5" style={{background:c.count>2?'#C4FF24':c.count===2?'#9FCB48':c.count===1?'#4F7E6C':'#343641'}}/>)}</div>}
function Metric({number,label,detail,color}){return <div className="rounded-[22px] border border-white/10 bg-[#20222C] p-4"><p className="text-[10px] font-black tracking-[.11em] text-white/55">{label}</p><p className="mt-3 text-[clamp(27px,7vw,48px)] font-black tabular-nums" style={{color}}>{number}</p><p className="mt-2 text-[11px] leading-relaxed text-white/50">{detail}</p></div>}
export default function PatchRegistry(){
 const {user}=useAuth()
 const [s,setS]=useState({loading:true,error:'',scans:[],classes:[],activities:[],rsvps:[]})
 useEffect(()=>{if(!user?.id)return;let live=true;async function load(){try{
  const [identities,activities,rsvps]=await Promise.all([
   supabase.from('pr_check_ids').select('id').eq('profile_id',user.id).eq('enabled',true),
   supabase.from('pr_activities').select('id,nombre,fecha_inicio,fuente,estado_validacion,eliminada').eq('alumno_id',user.id).order('fecha_inicio',{ascending:false}).limit(1000),
   supabase.from('pr_event_rsvps').select('id,event_slug,status,created_at').eq('profile_id',user.id).limit(300)
  ])
  for(const x of [identities,activities,rsvps])if(x.error)throw x.error
  const ids=(identities.data||[]).map(x=>x.id)
  const attendance=ids.length?await supabase.from('pr_check_attendance').select('id,class_id,identity_id,scanned_at').in('identity_id',ids).order('scanned_at',{ascending:false}).limit(1000):{data:[],error:null}
  if(attendance.error)throw attendance.error
  const classIds=[...new Set((attendance.data||[]).map(x=>x.class_id))]
  const classes=classIds.length?await supabase.from('pr_check_classes').select('id,title,starts_at,is_test').in('id',classIds):{data:[],error:null}
  if(classes.error)throw classes.error
  if(live)setS({loading:false,error:'',scans:attendance.data||[],classes:classes.data||[],activities:(activities.data||[]).filter(x=>!x.eliminada),rsvps:rsvps.data||[]})
 }catch(e){if(live)setS(v=>({...v,loading:false,error:e.message||'No se pudieron consultar los registros'}))}}load();return()=>{live=false}},[user?.id])
 const summary=useMemo(()=>{
  const classes=new Map(s.classes.map(x=>[x.id,x]))
  const scans=s.scans.filter(x=>classes.has(x.class_id)&&!classes.get(x.class_id).is_test)
  const uniqueScans=[...new Map(scans.map(x=>[x.class_id,x])).values()]
  const counts={class:0,roll:0,time:0,event:0};const days=new Map()
  for(const x of uniqueScans){const key=dateKey(x.scanned_at);if(key)days.set(key,(days.get(key)||0)+1)}
  for(const a of s.activities){const type=category(a.nombre);if(type)counts[type]++;const key=dateKey(a.fecha_inicio);if(key)days.set(key,(days.get(key)||0)+1)}
  return {scans:uniqueScans,counts,days,registrations:s.rsvps.length}
 },[s])
 const log=[...summary.scans.map(x=>({id:'qr'+x.id,date:x.scanned_at,title:s.classes.find(c=>c.id===x.class_id)?.title||'Clase PR Check',source:'QR CONFIRMADO',confirmed:true})),...s.activities.filter(x=>category(x.nombre)).map(x=>({id:'a'+x.id,date:x.fecha_inicio,title:x.nombre,source:'STRAVA / CLASIFICACIÓN SUGERIDA',confirmed:false}))].sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,18)
 return <div className="mt-5 space-y-5">
 <section className="relative overflow-hidden rounded-[28px] border border-[#C4FF24]/20 p-6 sm:p-9" style={{background:'radial-gradient(ellipse at 100% 0%,rgba(196,255,36,.13),transparent 60%),#20232C'}}>
 <p className="text-[10px] font-black tracking-[.2em] text-[#C4FF24]">TU HUELLA SOBRE RUEDAS</p><h2 className="mt-3 text-[clamp(28px,7vw,52px)] font-black italic leading-none tracking-[-.06em]">CADA REGISTRO CUENTA.</h2><p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70">Tus clases, salidas y experiencias forman una historia. Este mapa se ilumina cuando hay registros; los días vacíos quedan vacíos, sin inventar asistencias.</p>
 {s.loading?<p className="mt-5 text-sm text-white/60">Auditando registros del perfil…</p>:s.error?<p className="mt-5 text-sm text-amber-200" role="alert">No pudimos completar la auditoría: {s.error}</p>:<><Orbit days={summary.days}/><div className="mt-3 flex flex-wrap items-center gap-4 text-[10px] text-white/50"><span>■ Sin registro</span><span className="text-[#4F7E6C]">■ Actividad</span><span className="text-[#C4FF24]">■ Varias actividades</span><span>Últimos 84 días</span></div></>}
 </section>
 <section className="grid grid-cols-2 gap-3 sm:grid-cols-4"><Metric number={s.loading||s.error?'—':summary.scans.length} label="ASISTENCIAS QR" detail="Clases distintas escaneadas, excluyendo pruebas" color="#C4FF24"/><Metric number={s.loading||s.error?'—':summary.counts.class} label="CLASES EN ACTIVIDADES" detail="Coincidencias de nombre; requieren revisión" color="#57E7DA"/><Metric number={s.loading||s.error?'—':summary.counts.roll} label="ROLLEADAS" detail="Detectadas por el nombre de la actividad" color="#FF78AC"/><Metric number={s.loading||s.error?'—':summary.counts.time} label="TOMAS DE TIEMPO" detail="Posibles registros; sin validar" color="#B4A0FF"/></section>
 <section className="rounded-[26px] border border-white/10 bg-[#20212A] p-5 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-black tracking-widest text-[#57E7DA]">LÍNEA DE VIDA</p><h2 className="mt-2 text-2xl font-black">Tus registros recientes</h2></div><span className="rounded-full border border-white/20 px-3 py-2 text-[10px] font-black text-white/65">QR + ACTIVIDADES</span></div><p className="mt-3 text-xs leading-5 text-white/55">Un escaneo QR confirma asistencia a una clase. El nombre de una actividad de Strava solo sugiere su categoría: no confirma que asististe a una clase o evento oficial.</p><div className="mt-5 space-y-2">{!s.loading&&!s.error&&!log.length?<p className="text-sm text-white/60">Todavía no hay registros de estas categorías asociados a este perfil.</p>:log.map(x=><div key={x.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-full" style={{background:x.confirmed?'#C4FF2420':'#57E7DA20',color:x.confirmed?'#C4FF24':'#57E7DA'}}>{x.confirmed?'✓':'↗'}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{x.title}</p><p className="mt-1 text-[10px] text-white/50">{x.source}</p></div><span className="shrink-0 text-[10px] text-white/50">{dateKey(x.date)}</span></div>)}</div></section>
 <section className="rounded-[24px] border border-[#FF78AC]/20 bg-[#28232D] p-5 sm:p-7"><p className="text-[10px] font-black tracking-widest text-[#FF78AC]">EVENTOS Y RECONOCIMIENTOS</p><h2 className="mt-3 text-2xl font-black">Lo que también forma parte de tu historia</h2><p className="mt-3 text-sm text-white/65">Inscripciones a eventos registradas: <strong>{s.loading||s.error?'—':summary.registrations}</strong>. Una inscripción no confirma participación. Los eventos realizados y las tomas de tiempo se incorporarán cuando podamos verificar su evidencia.</p><p className="mt-3 text-sm text-white/65">Las insignias vivirán aquí, pero solo se mostrarán como obtenidas cuando exista un registro verificable de desbloqueo.</p></section>
 <p className="text-[11px] leading-relaxed text-white/45">Vista privada en desarrollo. La auditoría consulta los registros visibles de este perfil, con límites de paginación; todavía no representa necesariamente todo su historial.</p>
 </div>
}
