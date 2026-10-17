import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const config={
 active:{title:'ACTIVE',eyebrow:'TU MOVIMIENTO',color:'#57E7DA',description:'Cada salida suma a tu historia. Explorá los kilómetros y actividades que ya están registrados en Punta Rollers.'},
 orbit:{title:'ORBIT',eyebrow:'TU EVOLUCIÓN',color:'#FF78AC',description:'No es una carrera contra otros. Es una forma de observar tu constancia y entender cómo se construye tu propio recorrido.'},
 patch:{title:'PATCH',eyebrow:'TUS RECONOCIMIENTOS',color:'#C4FF24',description:'Un espacio para coleccionar hitos reales de tu camino sobre ruedas. Los reconocimientos se activarán únicamente cuando sus reglas estén verificadas.'}
}
const formatKm=m=>(Number(m||0)/1000).toLocaleString('es-UY',{maximumFractionDigits:1})
const formatDate=d=>d?new Date(d).toLocaleDateString('es-UY',{day:'2-digit',month:'short',year:'numeric'}):'—'
function useEcosystemData(){
 const {user}=useAuth()
 const [state,setState]=useState({loading:true,error:'',activities:[],profile:null,catalog:[]})
 useEffect(()=>{if(!user?.id)return;let live=true
  async function fetchData(){
   const [a,p,b]=await Promise.all([
    supabase.from('pr_activities').select('id,nombre,fecha_inicio,distancia_metros,tiempo_movimiento_segundos,fuente,estado_validacion,es_privada,eliminada').eq('alumno_id',user.id).order('fecha_inicio',{ascending:false}).limit(1000),
    supabase.from('profiles').select('id,nombre,apellido,foto,miembro_desde').eq('id',user.id).maybeSingle(),
    supabase.from('insignias_catalogo').select('id,nombre,descripcion,categoria,imagen,activa,orden').eq('activa',true).order('orden',{ascending:true}).limit(100)
   ])
   if(live)setState({loading:false,error:[a.error,p.error,b.error].filter(Boolean).map(x=>x.message).join(' · '),activities:a.data||[],profile:p.data||null,catalog:b.data||[]})
  }fetchData();return()=>{live=false}
 },[user?.id])
 const data=useMemo(()=>{
  const activities=state.activities.filter(a=>!a.eliminada&&Number.isFinite(Number(a.distancia_metros))&&Number(a.distancia_metros)>=0)
  const days=new Set(activities.map(a=>String(a.fecha_inicio||'').slice(0,10)).filter(Boolean))
  const months=new Map()
  for(const a of activities){const key=String(a.fecha_inicio||'').slice(0,7);if(!key)continue;const old=months.get(key)||{month:key,count:0,meters:0};old.count++;old.meters+=Number(a.distancia_metros);months.set(key,old)}
  return {activities,days:days.size,meters:activities.reduce((s,a)=>s+Number(a.distancia_metros),0),months:[...months.values()].sort((a,b)=>a.month.localeCompare(b.month)).slice(-6)}
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
  {kind==='active'&&<><section className="mt-5 grid grid-cols-3 gap-2 sm:gap-4"><Stat label="KM REGISTRADOS" value={d.loading||d.error?'—':formatKm(d.meters)} color={theme.color}/><Stat label="SALIDAS" value={d.loading||d.error?'—':d.activities.length} color={theme.color}/><Stat label="DÍAS ACTIVOS" value={d.loading||d.error?'—':d.days} color={theme.color}/></section><section className="mt-5 rounded-[26px] border border-white/10 bg-[#20212A] p-5 sm:p-7"><h2 className="text-xl font-black">Tus últimas actividades</h2><p className="mt-2 text-xs leading-5 text-white/55">Registro disponible en PR. Las actividades privadas solo se muestran dentro de esta vista de administración.</p><div className="mt-5 space-y-2">{!d.loading&&!d.error&&!d.activities.length?<p className="text-sm text-white/55">Todavía no hay actividades disponibles para este perfil.</p>:d.activities.slice(0,12).map(a=><div key={a.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 p-3"><div className="min-w-0"><p className="truncate text-sm font-bold">{a.nombre||'Salida en patines'}</p><p className="mt-1 text-[11px] text-white/50">{formatDate(a.fecha_inicio)} · {a.fuente||'Registro PR'}{a.es_privada?' · Privada':''}</p></div><p className="shrink-0 text-lg font-black" style={{color:theme.color}}>{formatKm(a.distancia_metros)} km</p></div>)}</div></section></>}
  {kind==='orbit'&&<><section className="mt-5 grid grid-cols-2 gap-3"><Stat label="DÍAS CON ACTIVIDAD" value={d.loading||d.error?'—':d.days} color={theme.color}/><Stat label="SALIDAS REGISTRADAS" value={d.loading||d.error?'—':d.activities.length} color={theme.color}/></section><section className="mt-5 rounded-[26px] border border-white/10 bg-[#20212A] p-5 sm:p-7"><h2 className="text-xl font-black">Tus últimos seis meses con registros</h2><p className="mt-2 text-xs leading-5 text-white/55">Cada barra representa kilómetros de actividades registradas durante ese mes. Los meses sin datos no se inventan.</p>{!d.loading&&!d.error&&d.months.length?<div className="mt-8 flex h-48 items-end gap-3">{d.months.map(m=><div key={m.month} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"><p className="text-[10px] font-black text-white/70">{formatKm(m.meters)}</p><div className="w-full max-w-20 rounded-t-xl" style={{height:Math.max(4,Math.round(m.meters/Math.max(...d.months.map(x=>x.meters),1)*140))+'px',background:'linear-gradient(#FF78AC,#794F92)'}}/><p className="text-[10px] text-white/60">{m.month.slice(5)}</p></div>)}</div>:<p className="mt-6 text-sm text-white/55">{d.loading?'Consultando datos…':d.error?'Datos no disponibles':'Aún no hay suficientes registros para construir tu gráfica.'}</p>}</section><p className="mt-4 text-xs leading-5 text-white/50">La asistencia de PR Check y las aprobaciones de deberes se sumarán cuando sus relaciones con cada perfil estén verificadas.</p></>}
  {kind==='patch'&&<section className="mt-5 rounded-[26px] border border-white/10 bg-[#20212A] p-5 sm:p-7"><h2 className="text-xl font-black">Colección de reconocimientos</h2><p className="mt-2 text-sm leading-6 text-white/60">Este espacio utiliza el catálogo oficial cuando hay insignias activas. No se asigna ningún reconocimiento por entrar a esta pantalla.</p><div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">{!d.loading&&!d.error&&d.catalog.length?d.catalog.map(b=><div key={b.id} className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="grid h-14 w-14 place-items-center rounded-full border border-white/15 bg-white/5 text-2xl">✦</div><h3 className="mt-3 text-sm font-black">{b.nombre}</h3><p className="mt-2 text-xs leading-5 text-white/55">{b.descripcion||'Reconocimiento del catálogo PR'}</p><p className="mt-3 text-[10px] font-black text-[#C4FF24]">CATÁLOGO · SIN ASIGNAR</p></div>):<p className="col-span-2 text-sm text-white/55">{d.loading?'Consultando catálogo…':d.error?'Catálogo no disponible':'El catálogo todavía no tiene insignias activas. Prepararemos aquí las colecciones futuras.'}</p>}</div></section>}
  <p className="mt-5 text-xs leading-5 text-white/45">Versión privada de trabajo. Las métricas reflejan únicamente registros accesibles de la cuenta actual, con un límite de consulta de 1000 actividades; no representan necesariamente el historial completo.</p>
 </div></main></AppLayout>
}
export function EcosistemaActive(){return <Page kind="active"/>}
export function EcosistemaOrbit(){return <Page kind="orbit"/>}
export function EcosistemaPatch(){return <Page kind="patch"/>}
