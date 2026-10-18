import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const tiles=[
 {id:'active',title:'ACTIVE',subtitle:'TU MOVIMIENTO',color:'#57E7DA',description:'Tus salidas sobre patines y kilómetros registrados. No hay rankings: el objetivo es conocer tu propia actividad.'},
 {id:'orbit',title:'ORBIT',subtitle:'TU CONSTANCIA',color:'#FF78AC',description:'Un vistazo a tus registros y a los días en los que saliste a patinar. La evolución se construye con el tiempo.'},
 {id:'patch',title:'PATCH',subtitle:'TU HISTORIA',color:'#C4FF24',description:'Tu identidad en Punta Rollers y los hitos que vas construyendo. Los reconocimientos se incorporarán cuando estén verificados.'},
]
const km=n=>(n/1000).toLocaleString('es-UY',{maximumFractionDigits:1})
async function loadAllActivities(profileId){
 const rows=[];const pageSize=500
 for(let start=0;start<20000;start+=pageSize){
  const result=await supabase.from('pr_activities').select('id,fecha_inicio,distancia_metros,fuente,estado_validacion,es_privada,eliminada,tipo,strava_activity_id').eq('alumno_id',profileId).order('fecha_inicio',{ascending:false}).order('id',{ascending:false}).range(start,start+pageSize-1)
  if(result.error)return {data:[],error:result.error}
  rows.push(...(result.data||[]))
  if((result.data||[]).length<pageSize)return {data:rows,error:null,truncated:false}
 }
 return {data:rows,error:null,truncated:true}
}
export default function Ecosistema(){
 const {user}=useAuth()
 const [state,setState]=useState({loading:true,error:'',activities:[],profile:null})
 useEffect(()=>{if(!user?.id)return;let mounted=true;async function load(){
  const [activities,profile]=await Promise.all([
   loadAllActivities(user.id),
   supabase.from('profiles').select('id,nombre,apellido,foto,pr_avatar,miembro_desde').eq('id',user.id).maybeSingle()
  ])
  if(!mounted)return
  setState({loading:false,error:activities.error?.message||profile.error?.message||'',activities:activities.data||[],truncated:!!activities.truncated,profile:profile.data||null})
 }load();return()=>{mounted=false}},[user?.id])
 const stats=useMemo(()=>{
  const rows=state.activities.filter(a=>!a.eliminada&&a.tipo==='Patinaje'&&a.fecha_inicio&&new Date(a.fecha_inicio).getTime()<=Date.now()&&Number.isFinite(Number(a.distancia_metros))&&Number(a.distancia_metros)>=0&&((a.fuente==='strava'&&a.estado_validacion==='sincronizada')||(a.fuente==='manual'&&a.estado_validacion==='validada')))
  const distance=rows.reduce((sum,a)=>sum+Number(a.distancia_metros),0)
  const days=new Set(rows.map(a=>String(a.fecha_inicio||'').slice(0,10)).filter(Boolean))
  return {rows,distance,days:days.size,last:rows[0]?.fecha_inicio}
 },[state.activities])
 return <AppLayout><div className="min-h-screen bg-[#101117] pb-24 text-white"><div className="mx-auto max-w-5xl px-4 pb-12 pt-7 sm:px-7">
 <header className="relative overflow-hidden rounded-[30px] border border-[#57E7DA]/20 px-6 py-8 sm:px-9" style={{background:'radial-gradient(ellipse at 90% 0%,rgba(87,231,218,.2),transparent 58%),linear-gradient(135deg,#2B2D39,#15161D)'}}>
  <p className="text-[10px] font-black tracking-[.24em] text-[#57E7DA]">PUNTA ROLLERS / TU ESPACIO</p>
  <h1 className="mt-4 text-[clamp(40px,9vw,74px)] font-black italic leading-none tracking-[-.075em]">ECO<span className="text-[#57E7DA]">SISTEMA.</span></h1>
  <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/75">Todo lo que construís sobre ruedas, en un solo lugar. Tu actividad, tu constancia y tu historia. Sin competir con nadie.</p>
  <p className="mt-5 text-xs font-bold text-white/65">{state.profile?.nombre?('Tu espacio, '+state.profile.nombre+'.'):'Tu espacio personal'}</p>
 </header>
 {state.loading?<p className="mt-6 rounded-2xl bg-white/5 p-5 text-sm text-white/60">Cargando tus registros…</p>:state.error?<p role="alert" className="mt-6 rounded-2xl border border-amber-300/30 p-5 text-sm text-amber-100">No pudimos consultar todos tus registros. Intentá ingresar nuevamente más tarde.</p>:<section className="mt-6 grid grid-cols-3 gap-2 sm:gap-4" aria-label="Resumen de actividad registrada">
  {[['KM REGISTRADOS',km(stats.distance)],['SALIDAS',stats.rows.length.toLocaleString('es-UY')],['DÍAS ACTIVOS',stats.days.toLocaleString('es-UY')]].map(([label,value])=><div key={label} className="rounded-[20px] border border-white/10 bg-[#20222B] p-3 sm:p-5"><p className="text-[9px] font-black tracking-wide text-white/55">{label}</p><p className="mt-3 text-[clamp(20px,5vw,36px)] font-black tabular-nums tracking-tight text-[#C4FF24]">{value}</p></div>)}
 </section>}
 <p className="mt-3 text-[11px] leading-relaxed text-white/50">Se muestran únicamente actividades disponibles para tu perfil. Las cifras no incluyen registros ausentes ni garantizan que todo tu historial esté sincronizado. {state.truncated?'Se alcanzó el límite de consulta: parte del historial podría faltar.':'Se consultaron todas las páginas disponibles dentro del límite de seguridad.'}</p>
 <section className="mt-6 grid gap-3 md:grid-cols-3" aria-label="Explorá tu Ecosistema">{tiles.map(tile=><Link to={"/app/ecosistema/"+tile.id} key={tile.id} className="relative block overflow-hidden rounded-[26px] border border-white/10 bg-[#20212A] p-6 no-underline transition hover:border-white/30 active:scale-[.99]"><div className="absolute -right-5 -top-7 h-28 w-28 rounded-full opacity-15 blur-2xl" style={{background:tile.color}}/><p className="text-[10px] font-black tracking-[.18em]" style={{color:tile.color}}>{tile.subtitle}</p><h2 className="mt-5 text-4xl font-black italic tracking-[-.06em]">{tile.title}</h2><p className="mt-3 min-h-20 text-sm leading-relaxed text-white/65">{tile.description}</p>{tile.id==='active'&&<p className="mt-5 text-xs font-bold" style={{color:tile.color}}>{state.loading?'Consultando…':state.error?'Datos no disponibles':stats.rows.length?km(stats.distance)+' km disponibles':'Todavía no hay actividades disponibles'}</p>}{tile.id==='orbit'&&<p className="mt-5 text-xs font-bold" style={{color:tile.color}}>{state.loading?'Consultando…':state.error?'Datos no disponibles':stats.days?stats.days+' días con actividad':'Aún sin días registrados'}</p>}{tile.id==='patch'&&<p className="mt-5 text-xs font-bold" style={{color:tile.color}}>Próximamente · reconocimientos verificados</p>}<p className="mt-4 text-[11px] font-black tracking-wider text-white/80">EXPLORAR {tile.title} →</p></Link>)}</section>
 <section className="mt-6 rounded-[24px] border border-[#C4FF24]/20 bg-[#242A26] p-5 sm:p-7"><p className="text-[10px] font-black tracking-[.18em] text-[#C4FF24]">TU APRENDIZAJE CONTINÚA</p><h2 className="mt-2 text-2xl font-black">Tus deberes tienen su propio espacio.</h2><p className="mt-2 text-sm leading-relaxed text-white/65">En TAREAS encontrás los ejercicios de tus profesores, las entregas y las correcciones. Acá podés ver cómo se integra ese trabajo a tu recorrido.</p><Link to="/app/deberes" className="mt-5 inline-flex rounded-xl bg-[#C4FF24] px-5 py-3 text-sm font-black text-[#14161B]">IR A TAREAS →</Link></section>
 <div className="mt-5 text-xs text-white/50"><Link className="underline underline-offset-4" to="/app/entrenamiento">Ver el rendimiento anterior</Link> · <Link className="underline underline-offset-4" to="/app/perfil">Mi perfil</Link></div>
 </div></div></AppLayout>
}
