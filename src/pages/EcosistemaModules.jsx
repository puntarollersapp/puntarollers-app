import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import PatchRegistry from '../components/ecosistema/PatchRegistry'
import { ActiveNow, OrbitEvolution } from '../components/ecosistema/ActiveOrbitViews'

const config={
 active:{title:'ACTIVE',eyebrow:'AHORA MISMO',color:'#57E7DA',description:'Tu semana en movimiento. Actividades recientes, novedades y el pulso actual de tus registros.'},
 orbit:{title:'ORBIT',eyebrow:'TU EVOLUCIÓN',color:'#FF78AC',description:'Tu progreso en perspectiva. Tendencias, frecuencia y evolución a lo largo del tiempo.'},
 patch:{title:'PATCH',eyebrow:'TU HISTORIA REGISTRADA',color:'#C4FF24',description:'Clases, asistencias, rolleadas, eventos y tomas de tiempo: todo lo que registrás en Punta Rollers, en una sola experiencia visual. Las insignias también viven acá.'}
}
const formatKm=m=>(Number(m||0)/1000).toLocaleString('es-UY',{maximumFractionDigits:1})
const formatDate=d=>d?new Date(d).toLocaleDateString('es-UY',{day:'2-digit',month:'short',year:'numeric'}):'—'
function useEcosystemData(){
 const {user}=useAuth()
 const [state,setState]=useState({loading:true,error:'',activities:[],profile:null,catalog:[],catalogError:''})
 const [revision,setRevision]=useState(0)
 useEffect(()=>{if(!user?.id)return;const refresh=()=>setRevision(v=>v+1);const channel=supabase.channel('ecosistema-activities-'+user.id).on('postgres_changes',{event:'*',schema:'public',table:'pr_activities',filter:'alumno_id=eq.'+user.id},refresh).subscribe();const timer=setInterval(refresh,30000);return()=>{clearInterval(timer);supabase.removeChannel(channel)}},[user?.id])
 useEffect(()=>{if(!user?.id)return;let live=true
  async function fetchData(){
   const [a,p,b]=await Promise.all([
    supabase.from('pr_activities').select('id,nombre,fecha_inicio,distancia_metros,tiempo_movimiento_segundos,fuente,estado_validacion,es_privada,eliminada').eq('alumno_id',user.id).order('fecha_inicio',{ascending:false}).limit(1000),
    supabase.from('profiles').select('id,nombre,apellido,foto,miembro_desde').eq('id',user.id).maybeSingle(),
    supabase.from('insignias_catalogo').select('id,nombre,descripcion,categoria,imagen,activa,orden').eq('activa',true).order('orden',{ascending:true}).limit(100)
   ])
   if(live)setState({loading:false,error:[a.error,p.error].filter(Boolean).map(x=>x.message).join(' · '),catalogError:b.error?.message||'',activities:a.data||[],profile:p.data||null,catalog:b.data||[]})
  }fetchData();return()=>{live=false}
 },[user?.id,revision])
 const data=useMemo(()=>{
  const activities=state.activities.filter(a=>!a.eliminada&&Number.isFinite(Number(a.distancia_metros))&&Number(a.distancia_metros)>=0&&a.fecha_inicio&&new Date(a.fecha_inicio).getTime()<=Date.now()).sort((a,b)=>new Date(b.fecha_inicio)-new Date(a.fecha_inicio))
  const days=new Set(activities.map(a=>String(a.fecha_inicio||'').slice(0,10)).filter(Boolean))
  const months=new Map()
  for(const a of activities){const key=String(a.fecha_inicio||'').slice(0,7);if(!key)continue;const old=months.get(key)||{month:key,count:0,meters:0};old.count++;old.meters+=Number(a.distancia_metros);months.set(key,old)}
  const lastSix=Array.from({length:6},(_,i)=>{const now=new Date();const dt=new Date(Date.UTC(now.getFullYear(),now.getMonth()-5+i,1));const key=dt.toISOString().slice(0,7);return months.get(key)||{month:key,count:0,meters:0}})
  return {activities,days:days.size,meters:activities.reduce((s,a)=>s+Number(a.distancia_metros),0),months:lastSix}
 },[state.activities])
 return {...state,...data}
}
function Stat({label,value,color}){return <div className="rounded-[22px] border border-white/10 bg-white/[.055] p-4 sm:p-6"><p className="text-[10px] font-black tracking-wider text-white/55">{label}</p><p className="mt-3 text-[clamp(24px,5vw,40px)] font-black tabular-nums tracking-tight" style={{color}}>{value}</p></div>}
function Page({kind}){
 const theme=config[kind],d=useEcosystemData()
 return <AppLayout><main className="min-h-screen bg-[#101117] pb-28 text-white"><div className="mx-auto max-w-5xl px-4 pt-6 sm:px-7">
  <div className="mb-5 flex flex-wrap items-center justify-between gap-2"><Link to="/app/ecosistema" className="text-xs font-bold text-white/65 hover:text-white">← ECOSISTEMA</Link><span className="rounded-full border border-white/20 px-3 py-1 text-[10px] font-black tracking-wider text-white/60">LAB PRIVADO · PRELANZAMIENTO</span></div>
  <header className="relative overflow-hidden rounded-[30px] border border-white/10 p-6 sm:p-10" style={{background:'radial-gradient(ellipse at 100% 0%,'+theme.color+'33,transparent 60%),linear-gradient(125deg,#2B2C37,#16171D)'}}>
   <p className="text-[11px] font-black tracking-[.24em]" style={{color:theme.color}}>{theme.eyebrow}</p><h1 className="mt-5 text-[clamp(54px,13vw,110px)] font-black italic leading-none tracking-[-.08em]">{theme.title}<span style={{color:theme.color}}>.</span></h1>
   <p className="mt-5 max-w-xl text-sm leading-6 text-white/75">{theme.description}</p>
   <p className="mt-5 text-xs text-white/50">Perfil: {d.profile?.nombre||'Cuenta autenticada'} · Datos de la plataforma oficial</p>
  </header>
  {d.loading?<p className="mt-6 rounded-2xl bg-white/5 p-5 text-sm">Consultando registros…</p>:d.error?<p role="alert" className="mt-6 rounded-2xl border border-amber-300/30 bg-amber-200/5 p-5 text-sm text-amber-100">Algunas fuentes no se pudieron consultar. No mostramos estadísticas estimadas. {d.error}</p>:null}
  {kind==='active'&&<ActiveNow d={d}/>}
  {kind==='orbit'&&<OrbitEvolution d={d}/>}
    {kind==='patch'&&<PatchRegistry/>}
  <p className="mt-5 text-xs leading-5 text-white/45">Versión privada de trabajo. Los datos de ACTIVE y ORBIT se vuelven a consultar ante cambios detectados y cada 30 segundos mientras la página esté abierta. La consulta tiene un límite de 1000 actividades por perfil; no necesariamente incluye todo el historial.</p>
 </div></main></AppLayout>
}
export function EcosistemaActive(){return <Page kind="active"/>}
export function EcosistemaOrbit(){return <Page kind="orbit"/>}
export function EcosistemaPatch(){return <Page kind="patch"/>}
