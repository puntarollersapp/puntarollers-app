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
 const [state,setState]=useState({loading:true,error:'',warnings:[],activities:[],otherEvents:[],profile:null})
 const [revision,setRevision]=useState(0)
 const [refreshing,setRefreshing]=useState(false)
 const [lastUpdated,setLastUpdated]=useState(null)
 useEffect(()=>{if(!user?.id)return;const refresh=()=>{if(document.visibilityState==='visible')setRevision(v=>v+1)};const channel=supabase.channel('ecosistema-activities-'+user.id).on('postgres_changes',{event:'*',schema:'public',table:'pr_activities',filter:'alumno_id=eq.'+user.id},refresh).on('postgres_changes',{event:'INSERT',schema:'public',table:'pr_check_attendance'},refresh).subscribe();const timer=setInterval(refresh,30000);const onVisible=()=>{if(document.visibilityState==='visible')refresh()};document.addEventListener('visibilitychange',onVisible);return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',onVisible);supabase.removeChannel(channel)}},[user?.id])
 useEffect(()=>{if(!user?.id)return;let live=true
  async function fetchData(){
   setRefreshing(true)
   const [a,p,ids,rsvps,clinicRows]=await Promise.all([
    loadAllActivities(user.id),
    supabase.from('profiles').select('id,nombre,apellido,foto,miembro_desde').eq('id',user.id).maybeSingle(),
    supabase.from('pr_check_ids').select('id').eq('profile_id',user.id).is('child_id',null),
    supabase.from('pr_event_rsvps').select('id,event_slug,status,created_at').eq('profile_id',user.id),
    supabase.from('pr_clinic_participation').select('id,clinic_key,participant_name,attended,updated_at').eq('profile_id',user.id).eq('attended',true)
   ])
   let otherEvents=[];const warnings=[]
   if(ids.error)warnings.push('No se pudieron consultar los identificadores PR Check')
   if(rsvps.error)warnings.push('No se pudieron consultar las inscripciones a eventos')
   if(clinicRows.error)warnings.push('No se pudieron consultar las clínicas confirmadas')
   if(!ids.error&&(ids.data||[]).length){const attendanceRows=[];let attendanceError=null;for(let start=0;start<20000;start+=500){const page=await supabase.from('pr_check_attendance').select('id,class_id,identity_id,scanned_at').in('identity_id',ids.data.map(x=>x.id)).order('scanned_at',{ascending:false}).order('id',{ascending:false}).range(start,start+499);if(page.error){attendanceError=page.error;break}attendanceRows.push(...(page.data||[]));if((page.data||[]).length<500)break;if(start===19500)warnings.push('El historial de asistencias alcanzó el límite de consulta')}const att={data:attendanceRows,error:attendanceError};if(att.error)warnings.push('No se pudieron consultar las asistencias escaneadas');if(!att.error&&att.data?.length){const classIds=[...new Set(att.data.map(x=>x.class_id).filter(Boolean))];const classRows=[];let classError=null;for(let i=0;i<classIds.length;i+=100){const part=await supabase.from('pr_check_classes').select('id,title,starts_at,status,is_test').in('id',classIds.slice(i,i+100));if(part.error){classError=part.error;break}classRows.push(...(part.data||[]))}const classes={data:classRows,error:classError};if(classes.error)warnings.push('No se pudieron consultar los datos de las clases');const byId=new Map((classes.data||[]).map(x=>[x.id,x]));otherEvents.push(...att.data.filter((x,i,rows)=>byId.has(x.class_id)&&!byId.get(x.class_id).is_test&&!['cancelled','canceled','cancelado','anulada','anulado'].includes(String(byId.get(x.class_id).status||'').toLowerCase())&&rows.findIndex(y=>y.identity_id===x.identity_id&&y.class_id===x.class_id)===i).map(x=>({id:'class-'+x.id,nombre:byId.get(x.class_id).title||'Clase Punta Rollers',fecha_inicio:x.scanned_at,fuente:'Asistencia verificada',kind:'attendance',detail:'Asistencia registrada mediante PR Check'})))}}
   if(!rsvps.error){otherEvents.push(...(rsvps.data||[]).filter(x=>!['cancelled','cancelado','rejected','rechazado'].includes(String(x.status||'').toLowerCase())).map(x=>({id:'rsvp-'+x.id,nombre:'Evento · '+String(x.event_slug||'Punta Rollers').replace(/[-_]/g,' '),fecha_inicio:x.created_at,fuente:'Inscripción a evento',kind:'rsvp',detail:'Inscripción registrada · '+(x.status||'estado no informado')})))}
   if(!clinicRows.error)otherEvents.push(...(clinicRows.data||[]).map(x=>({id:'clinic-'+x.id,nombre:x.clinic_key==='sept_2026'?'Clínica Punta Rollers · Septiembre 2026':'Clínica Punta Rollers · Octubre 2026',fecha_inicio:x.updated_at,fuente:'Clínica Punta Rollers',kind:'clinic',detail:'Participación confirmada por administración · fecha mostrada: confirmación'})))
   otherEvents.sort((x,y)=>new Date(y.fecha_inicio)-new Date(x.fecha_inicio))
   if(live){const error=[a.error,p.error].filter(Boolean).map(x=>x.message).join(' · ');setState(prev=>({loading:false,error,truncated:error?prev.truncated:!!a.truncated,warnings,activities:error?prev.activities:(a.data||[]),otherEvents:error?prev.otherEvents:[...otherEvents,...prev.otherEvents.filter(x=>(x.kind==='attendance'&&warnings.some(w=>/PR Check|asistencias|clases/.test(w)))||(x.kind==='rsvp'&&!!rsvps.error)||(x.kind==='clinic'&&!!clinicRows.error))].filter((x,i,arr)=>arr.findIndex(y=>y.id===x.id)===i).sort((x,y)=>new Date(y.fecha_inicio)-new Date(x.fecha_inicio)),profile:error?prev.profile:(p.data||null)}));setRefreshing(false);if(!error&&!warnings.length)setLastUpdated(new Date())}
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
 const theme=config[kind],d=useEcosystemData(),{user}=useAuth()
 return <AppLayout><main className="min-h-screen bg-[#101117] pb-28 text-white"><div className="mx-auto max-w-5xl px-4 pt-6 sm:px-7">
  <div className="mb-5 flex flex-wrap items-center justify-between gap-2"><Link to="/app/ecosistema" className="text-xs font-bold text-white/65 hover:text-white">← ECOSISTEMA</Link><div className="flex flex-wrap items-center gap-2">{kind==='active'&&user?.rol==='admin'&&<Link to="/admin/clinicas-participacion" className="rounded-full border border-[#57E7DA]/40 px-3 py-1 text-[10px] font-black text-[#57E7DA]">GESTIONAR CLÍNICAS ↗</Link>}<button type="button" onClick={d.refresh} disabled={d.refreshing} className="rounded-full border border-white/20 px-3 py-1 text-[10px] font-black tracking-wider text-white/75 disabled:opacity-40">{d.refreshing?'ACTUALIZANDO…':'ACTUALIZAR DATOS ↻'}</button><span className="rounded-full border border-white/20 px-3 py-1 text-[10px] font-black tracking-wider text-white/60">LAB PRIVADO · PRELANZAMIENTO</span></div></div>
  {kind==='active'?<header className="relative isolate overflow-hidden rounded-[32px] border border-[#57E7DA]/30 px-5 py-9 text-center shadow-[0_24px_80px_rgba(0,0,0,.28)] sm:px-10 sm:py-12" style={{background:'radial-gradient(ellipse at 50% 75%,rgba(87,231,218,.2),transparent 65%),linear-gradient(145deg,#1D343B,#12151F 78%)'}}>
   <style>{`@keyframes activeHeroRing{to{transform:rotate(360deg)}}@keyframes activeHeroWave{0%,100%{transform:scale(.85);opacity:.25}50%{transform:scale(1.12);opacity:.8}}@keyframes activeHeroTrace{0%{stroke-dashoffset:280}100%{stroke-dashoffset:0}}@keyframes activeHeroGlint{0%,100%{opacity:.3;transform:translateY(5px)}50%{opacity:1;transform:translateY(-5px)}}.active-hero-ring{animation:activeHeroRing 18s linear infinite}.active-hero-wave{animation:activeHeroWave 4s ease-in-out infinite}.active-hero-trace{stroke-dasharray:280;animation:activeHeroTrace 5s linear infinite}.active-hero-glint{animation:activeHeroGlint 3s ease-in-out infinite}@media(prefers-reduced-motion:reduce){.active-hero-ring,.active-hero-wave,.active-hero-trace,.active-hero-glint{animation:none!important}}`}</style>
   <div className="pointer-events-none absolute -left-16 top-0 h-48 w-48 rounded-full bg-[#57E7DA]/10 blur-3xl"/><div className="pointer-events-none absolute -right-12 bottom-0 h-48 w-48 rounded-full bg-[#57E7DA]/10 blur-3xl"/>
   <div className="relative mx-auto flex max-w-2xl flex-col items-center"><p className="text-[10px] font-black tracking-[.26em] text-[#57E7DA]">PUNTA ROLLERS / TU MOVIMIENTO</p><h1 className="mt-4 text-[clamp(56px,13vw,106px)] font-black italic leading-none tracking-[-.08em]">ACTIVE<span className="text-[#57E7DA]">.</span></h1><p className="mt-4 max-w-lg text-sm leading-6 text-white/70">Cada salida cuenta. Explorá tu actividad, los kilómetros recorridos y tus últimos registros, a tu ritmo.</p>
   <div className="relative mt-5 grid h-36 w-full max-w-[340px] place-items-center" role="img" aria-label="Animación de energía y movimiento de ACTIVE"><div className="active-hero-wave absolute h-32 w-32 rounded-full border border-[#57E7DA]/25 bg-[#57E7DA]/5"/><div className="active-hero-ring absolute h-28 w-28 rounded-full border-2 border-dashed border-[#57E7DA]/55"/><div className="absolute grid h-20 w-20 place-items-center rounded-full border border-[#57E7DA]/60 bg-[#18373C] shadow-[0_0_36px_rgba(87,231,218,.28)]"><svg viewBox="0 0 48 48" className="h-12 w-12" fill="none" stroke="#57E7DA" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path className="active-hero-trace" d="M3 26h10l6-15 9 27 6-12h11"/></svg></div><div className="active-hero-glint absolute left-5 top-8 h-px w-20 bg-gradient-to-r from-transparent to-[#57E7DA]/80"/><div className="active-hero-glint absolute bottom-9 right-5 h-px w-20 bg-gradient-to-l from-transparent to-[#57E7DA]/80" style={{animationDelay:'-1.3s'}}/></div>
   <p className="mt-2 text-xs text-white/50">Perfil: {d.profile?.nombre||'Cuenta autenticada'} · Registros de Punta Rollers</p><span className="mt-4 inline-flex items-center rounded-full border border-[#57E7DA]/35 bg-[#57E7DA]/10 px-4 py-2 text-[10px] font-black tracking-widest text-[#8AF5EA]">TU ACTIVIDAD · TU PROGRESO</span></div>
  </header>:kind==='orbit'?<header className="relative isolate overflow-hidden rounded-[32px] border border-[#FF78AC]/30 px-5 py-9 text-center shadow-[0_24px_80px_rgba(0,0,0,.25)] sm:px-10 sm:py-12" style={{background:'radial-gradient(ellipse at 50% 75%,rgba(255,120,172,.18),transparent 64%),linear-gradient(145deg,#352336,#171520 80%)'}}>
   <style>{`@keyframes orbitHeroSpin{to{transform:rotate(360deg)}}@keyframes orbitHeroSpinReverse{to{transform:rotate(-360deg)}}@keyframes orbitHeroPulse{0%,100%{opacity:.5;transform:scale(.92)}50%{opacity:1;transform:scale(1.08)}}@keyframes orbitHeroBars{0%,100%{transform:scaleY(.6)}50%{transform:scaleY(1.1)}}.orbit-hero-ring{animation:orbitHeroSpin 24s linear infinite}.orbit-hero-ring-reverse{animation:orbitHeroSpinReverse 16s linear infinite}.orbit-hero-pulse{animation:orbitHeroPulse 4s ease-in-out infinite}.orbit-hero-bar{transform-box:fill-box;transform-origin:center bottom;animation:orbitHeroBars 2.6s ease-in-out infinite}@media(prefers-reduced-motion:reduce){.orbit-hero-ring,.orbit-hero-ring-reverse,.orbit-hero-pulse,.orbit-hero-bar{animation:none!important}}`}</style>
   <div className="pointer-events-none absolute -left-16 -top-12 h-56 w-56 rounded-full bg-[#FF78AC]/10 blur-3xl"/><div className="pointer-events-none absolute -right-16 bottom-0 h-56 w-56 rounded-full bg-[#FF78AC]/10 blur-3xl"/>
   <div className="relative mx-auto flex max-w-2xl flex-col items-center"><p className="text-[10px] font-black tracking-[.26em] text-[#FF9BC4]">PUNTA ROLLERS / TU EVOLUCIÓN</p><h1 className="mt-4 text-[clamp(56px,13vw,106px)] font-black italic leading-none tracking-[-.08em]">ORBIT<span className="text-[#FF78AC]">.</span></h1><p className="mt-4 max-w-lg text-sm leading-6 text-white/70">Tu progreso tiene su propia trayectoria. Descubrí cómo evolucionan tus kilómetros, tu frecuencia y tu constancia.</p>
   <div className="relative mt-5 grid h-44 w-full max-w-[340px] place-items-center" role="img" aria-label="Órbitas rosas animadas alrededor de un gráfico de evolución"><div className="orbit-hero-pulse absolute h-40 w-40 rounded-full bg-[#FF78AC]/10 blur-xl"/><div className="orbit-hero-ring absolute h-36 w-36 rounded-full border border-dashed border-[#FF9BC4]/55"/><div className="orbit-hero-ring-reverse absolute h-28 w-28 rounded-full border-2 border-dotted border-[#FF78AC]/45"/><div className="absolute grid h-24 w-24 place-items-center rounded-full border border-[#FF78AC]/50 bg-[#3C233A] shadow-[0_0_42px_rgba(255,120,172,.24)]"><svg viewBox="0 0 90 90" className="h-16 w-16" fill="none" aria-hidden="true"><path d="M10 65L30 52L48 58L68 25L81 32" stroke="#FFB3CF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>{[20,34,48,62].map((x,i)=><rect key={x} className="orbit-hero-bar" x={x} y={64-[16,29,22,42][i]} width="8" height={[16,29,22,42][i]} rx="3" fill="#FF78AC" opacity=".55" style={{animationDelay:-i*.35+'s'}}/>)}</svg></div><span className="absolute left-[13%] top-9 h-2 w-2 rounded-full bg-[#FF9BC4] shadow-[0_0_15px_#FF78AC]"/><span className="absolute right-[12%] bottom-10 h-1.5 w-1.5 rounded-full bg-[#FF9BC4] shadow-[0_0_15px_#FF78AC]"/></div>
   <p className="mt-2 text-xs text-white/50">Perfil: {d.profile?.nombre||'Cuenta autenticada'} · Evolución según registros</p><span className="mt-4 inline-flex rounded-full border border-[#FF78AC]/35 bg-[#FF78AC]/10 px-4 py-2 text-[10px] font-black tracking-widest text-[#FFB3CF]">TU RECORRIDO · TU RITMO</span></div>
  </header>:<header className="relative overflow-hidden rounded-[30px] border border-white/10 p-6 sm:p-10" style={{background:'radial-gradient(ellipse at 100% 0%,'+theme.color+'33,transparent 60%),linear-gradient(125deg,#2B2C37,#16171D)'}}>
   <p className="text-[11px] font-black tracking-[.24em]" style={{color:theme.color}}>{theme.eyebrow}</p><h1 className="mt-5 text-[clamp(54px,13vw,110px)] font-black italic leading-none tracking-[-.08em]">{theme.title}<span style={{color:theme.color}}>.</span></h1>
   <p className="mt-5 max-w-xl text-sm leading-6 text-white/75">{theme.description}</p>
   <p className="mt-5 text-xs text-white/50">Perfil: {d.profile?.nombre||'Cuenta autenticada'} · Datos de la plataforma oficial</p>
  </header>}
  {d.lastUpdated&&<p className="mt-3 text-[11px] text-white/45">Última consulta correcta: {d.lastUpdated.toLocaleTimeString('es-UY',{hour:'2-digit',minute:'2-digit',timeZone:'America/Montevideo'})} (Uruguay)</p>}
  {d.loading?<p className="mt-6 rounded-2xl bg-white/5 p-5 text-sm">Consultando registros…</p>:d.error?<p role="alert" className="mt-6 rounded-2xl border border-amber-300/30 bg-amber-200/5 p-5 text-sm text-amber-100">No pudimos actualizar los registros de ACTIVE y ORBIT. No mostramos cifras sin verificar como si fueran actuales. {d.error} <button type="button" onClick={d.refresh} className="ml-2 underline underline-offset-4">Reintentar</button></p>:null}
  {!!d.warnings?.length&&<p role="status" className="mt-4 rounded-2xl border border-amber-300/25 bg-amber-200/5 p-4 text-xs leading-5 text-amber-100">Algunas fuentes todavía no pudieron sincronizarse: {d.warnings.join(' · ')}. Conservamos los registros disponibles. <button type="button" onClick={d.refresh} className="ml-2 font-bold underline">Reintentar</button></p>}
  {!d.loading&&kind==='active'&&<ActiveNow d={d}/>}
  {!d.loading&&kind==='orbit'&&<OrbitEvolution d={d}/>}
    {kind==='patch'&&<PatchRegistry/>}
  <p className="mt-5 text-xs leading-5 text-white/45">Versión privada de trabajo. Los datos de ACTIVE y ORBIT se vuelven a consultar ante cambios detectados y cada 30 segundos mientras la página esté abierta. El historial se consulta por páginas hasta 20.000 registros por perfil. {d.truncated?'Se alcanzó el límite de consulta: algunas actividades podrían faltar.':'La consulta terminó sin alcanzar ese límite.'}</p>
 </div></main></AppLayout>
}
export function EcosistemaActive(){return <Page kind="active"/>}
export function EcosistemaOrbit(){return <Page kind="orbit"/>}
export function EcosistemaPatch(){return <Page kind="patch"/>}
