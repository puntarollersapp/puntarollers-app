import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { validEcosystemActivity, ecosystemDayKey, uniqueEcosystemActivities } from '../lib/ecosystemActivity'
import PatchRegistry from '../components/ecosistema/PatchRegistry'
import { ActiveNow, OrbitEvolution } from '../components/ecosistema/ActiveOrbitViews'

const config={
 active:{title:'ACTIVE',eyebrow:'AHORA MISMO',color:'#57E7DA',description:'Tu semana en movimiento. Actividades recientes, novedades y el pulso actual de tus registros.'},
 orbit:{title:'ORBIT',eyebrow:'TU EVOLUCIÓN',color:'#FF78AC',description:'Tu progreso en perspectiva. Tendencias, frecuencia y evolución a lo largo del tiempo.'},
 patch:{title:'PATCH',eyebrow:'TU HISTORIA REGISTRADA',color:'#C4FF24',description:'Clases, asistencias, rolleadas, eventos y tomas de tiempo: tu historia registrada en Punta Rollers, con fuentes identificadas y verificables.'}
}
async function loadAllActivities(profileId){
 const rows=[];const pageSize=500
 for(let start=0;start<20000;start+=pageSize){
  const result=await supabase.from('pr_activities').select('id,nombre,fecha_inicio,distancia_metros,tiempo_movimiento_segundos,strava_activity_id,fuente,tipo,estado_validacion,es_privada,eliminada').eq('alumno_id',profileId).order('fecha_inicio',{ascending:false}).order('id',{ascending:false}).range(start,start+pageSize-1)
  if(result.error)return {data:[],error:result.error}
  rows.push(...(result.data||[]))
  if((result.data||[]).length<pageSize)return {data:rows,error:null,truncated:false}
 }
 return {data:rows,error:null,truncated:true}
}
function useEcosystemData(){
 const {user}=useAuth()
 const [state,setState]=useState({loading:true,error:'',activities:[],profile:null})
 const [revision,setRevision]=useState(0)
 const [refreshing,setRefreshing]=useState(false)
 const [lastUpdated,setLastUpdated]=useState(null)
 useEffect(()=>{if(!user?.id)return;const refresh=()=>setRevision(v=>v+1);const channel=supabase.channel('ecosistema-activities-'+user.id).on('postgres_changes',{event:'*',schema:'public',table:'pr_activities',filter:'alumno_id=eq.'+user.id},refresh).subscribe();const timer=setInterval(refresh,30000);return()=>{clearInterval(timer);supabase.removeChannel(channel)}},[user?.id])
 useEffect(()=>{if(!user?.id)return;let live=true
  async function fetchData(){
   setRefreshing(true)
   const [a,p]=await Promise.all([
    loadAllActivities(user.id),
    supabase.from('profiles').select('id,nombre,apellido,foto,miembro_desde').eq('id',user.id).maybeSingle()
   ])
   if(live)setState({loading:false,error:[a.error,p.error].filter(Boolean).map(x=>x.message).join(' · '),truncated:!!a.truncated,activities:a.data||[],profile:p.data||null,catalog:b.data||[]})
  }fetchData();return()=>{live=false}
 },[user?.id,revision])
 const data=useMemo(()=>{
  const activities=uniqueEcosystemActivities(state.activities.filter(a=>validEcosystemActivity(a))).sort((a,b)=>new Date(b.fecha_inicio)-new Date(a.fecha_inicio))
  const days=new Set(activities.map(a=>ecosystemDayKey(a.fecha_inicio)).filter(Boolean))
  const months=new Map()
  for(const a of activities){const key=ecosystemDayKey(a.fecha_inicio).slice(0,7);if(!key)continue;const old=months.get(key)||{month:key,count:0,meters:0};old.count++;old.meters+=Number(a.distancia_metros);months.set(key,old)}
  const lastSix=Array.from({length:6},(_,i)=>{const current=ecosystemDayKey(new Date());const [year,month]=current.split('-').map(Number);const dt=new Date(Date.UTC(year,month-1-5+i,1));const key=dt.toISOString().slice(0,7);return months.get(key)||{month:key,count:0,meters:0}})
  return {activities,days:days.size,meters:activities.reduce((s,a)=>s+Number(a.distancia_metros),0),months:lastSix}
 },[state.activities])
 return {...state,...data,refreshing,lastUpdated,refresh:()=>setRevision(v=>v+1)}
}
function Page({kind}){
 const theme=config[kind],d=useEcosystemData()
 return <AppLayout><main className="min-h-screen bg-[#101117] pb-28 text-white"><div className="mx-auto max-w-5xl px-4 pt-6 sm:px-7">
  <div className="mb-5 flex flex-wrap items-center justify-between gap-2"><Link to="/app/ecosistema" className="text-xs font-bold text-white/65 hover:text-white">← ECOSISTEMA</Link><div className="flex items-center gap-2"><button type="button" onClick={d.refresh} disabled={d.refreshing} className="rounded-full border border-white/20 px-3 py-1 text-[10px] font-black tracking-wider text-white/75 disabled:opacity-40">{d.refreshing?'ACTUALIZANDO…':'ACTUALIZAR DATOS ↻'}</button><span className="rounded-full border border-white/20 px-3 py-1 text-[10px] font-black tracking-wider text-white/60">LAB PRIVADO · PRELANZAMIENTO</span></div></div>
  <header className="relative overflow-hidden rounded-[30px] border border-white/10 p-6 sm:p-10" style={{background:'radial-gradient(ellipse at 100% 0%,'+theme.color+'33,transparent 60%),linear-gradient(125deg,#2B2C37,#16171D)'}}>
   <p className="text-[11px] font-black tracking-[.24em]" style={{color:theme.color}}>{theme.eyebrow}</p><h1 className="mt-5 text-[clamp(54px,13vw,110px)] font-black italic leading-none tracking-[-.08em]">{theme.title}<span style={{color:theme.color}}>.</span></h1>
   <p className="mt-5 max-w-xl text-sm leading-6 text-white/75">{theme.description}</p>
   <p className="mt-5 text-xs text-white/50">Perfil: {d.profile?.nombre||'Cuenta autenticada'} · Datos de la plataforma oficial</p>
  </header>
  {d.lastUpdated&&<p className="mt-3 text-[11px] text-white/45">Última consulta correcta: {d.lastUpdated.toLocaleTimeString('es-UY',{hour:'2-digit',minute:'2-digit'})}</p>}
  {d.loading?<p className="mt-6 rounded-2xl bg-white/5 p-5 text-sm">Consultando registros…</p>:d.error?<p role="alert" className="mt-6 rounded-2xl border border-amber-300/30 bg-amber-200/5 p-5 text-sm text-amber-100">Algunas fuentes no se pudieron consultar. No mostramos estadísticas estimadas. {d.error}</p>:null}
  {kind==='active'&&<ActiveNow d={d}/>}
  {kind==='orbit'&&<OrbitEvolution d={d}/>}
    {kind==='patch'&&<PatchRegistry/>}
  <p className="mt-5 text-xs leading-5 text-white/45">Versión privada de trabajo. Los datos de ACTIVE y ORBIT se vuelven a consultar ante cambios detectados y cada 30 segundos mientras la página esté abierta. El historial se consulta por páginas hasta 20.000 registros por perfil. {d.truncated?'Se alcanzó el límite de consulta: algunas actividades podrían faltar.':'La consulta terminó sin alcanzar ese límite.'}</p>
 </div></main></AppLayout>
}
export function EcosistemaActive(){return <Page kind="active"/>}
export function EcosistemaOrbit(){return <Page kind="orbit"/>}
export function EcosistemaPatch(){return <Page kind="patch"/>}
