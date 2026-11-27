import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PublicLayout from '../layouts/PublicLayout'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import './HomeSummer.css'

const ADULT='/inscripciones-2026', KIDS='/inscripciones-kids-2026'
const schedule={
 sabado:[
  {time:'08:00',end:'09:00',title:'Intermedios + avanzados',place:'Parada 2 · Punta del Este',type:'Aire libre'},
  {time:'09:00',end:'10:00',title:'Principiantes',place:'Parada 2 · Punta del Este',type:'Aire libre'},
  {time:'19:00',end:'20:00',title:'PR Kids',place:'Pista cerrada · Maldonado',type:'Indoor',kids:true},
  {time:'20:00',end:'21:00',title:'Adultos · todos los niveles',place:'Pista cerrada · Maldonado',type:'Indoor'}
 ],
 miercoles:[
  {time:'19:00',end:'20:00',title:'Principiantes',place:'Parada 2 · Punta del Este',type:'Aire libre'},
  {time:'20:00',end:'21:00',title:'Intermedios + avanzados',place:'Parada 2 · Punta del Este',type:'Aire libre'}
 ]
}
const gallery=[
 ['Clases','https://drive.google.com/drive/folders/1Bn4Yy6IDiy8lJYyKf12z99Qyx5GllSST'],
 ['Rolleadas','https://drive.google.com/drive/folders/1b7I4VFk36V9CTcXsCJDogcD8ayC1WIfJ'],
 ['Videos','https://drive.google.com/drive/folders/1hnBU-O1sjZC88O6EqMa_1dKAE5HybkW_']
]
const tools=[
 ['01','Pasaporte Kids','Cada pequeño logro cuenta.','/pasaporte-kids'],
 ['02','Cuponeras','Elegí tu experiencia PR.','/cuponeras'],
 ['03','Uniformes','Llevá nuestros colores.','/uniformes'],
 ['04','PR Tracking','Identificá tus elementos con NFC.','/tracking'],
 ['05','PR Card','Beneficios en comercios adheridos.','https://puntarollerscard.com/'],
 ['06','RollerMap','Descubrí lugares para rodar.','/rollermap/'],
 ['07','Alianza Rollers','Una red que nos conecta.','/alianza'],
 ['08','Reglas PR','Conocé cómo funciona la escuela.','/terminos']
]

// Public-only illustrations: inspired by Mi PR's floating card, map pin and NFC pulse.
// All artwork is synthetic; no student data or unreleased membership card design.
function BannerArt({kind}){
 const id='ph-'+kind, paint=n=>'url(#'+id+'-'+n+')', metal=paint('metal'), dark=paint('dark'), light=paint('light');
 const star=(x,y,s=1)=><path transform={'translate('+x+' '+y+') scale('+s+')'} d="M0-9 2-2 9 0 2 2 0 9-2 2-9 0-2-2Z" fill={light}/>;
 const line=(x,y,w)=><rect x={x} y={y} width={w} height="3" rx="1.5" fill="currentColor" opacity=".5"/>;
 const card=(x,y,w,h,angle=0,children)=><g transform={'translate('+x+' '+y+') rotate('+angle+' '+w/2+' '+h/2+')'}><rect x="2" y="5" width={w} height={h} rx="11" fill="#090c10" opacity=".75"/><rect width={w} height={h} rx="11" fill={dark} stroke="currentColor" strokeOpacity=".65"/><rect x="1.5" y="1.5" width={w-3} height={h-3} rx="10" fill={paint('shine')} stroke="#fff" strokeOpacity=".1"/>{children}</g>;
 const person=(x,y,s)=> <g transform={'translate('+x+' '+y+') scale('+s+')'}><circle r="25" fill={dark} stroke="currentColor" strokeOpacity=".6"/><circle cy="-7" r="8" fill={metal}/><path d="M-16 16Q-15 2 0 2T16 16Q0 27-16 16" fill={metal}/></g>;
 const wheel=(x,y,r=9)=><g><circle cx={x} cy={y+3} r={r} fill="#0b1015"/><circle cx={x} cy={y} r={r} fill={metal} stroke="#fff" strokeOpacity=".65"/><circle cx={x} cy={y} r={r*.48} fill={dark} stroke="currentColor"/><circle cx={x} cy={y} r="2" fill="#fff"/></g>;
 const cone=(x,y,s)=><g transform={'translate('+x+' '+y+') scale('+s+')'}><ellipse cy="28" rx="23" ry="7" fill="#090b0e"/><ellipse cy="25" rx="20" ry="6" fill={metal}/><path d="M-14 23 -4-14Q0-20 4-14L14 23Q0 29-14 23" fill={metal} stroke="currentColor" strokeOpacity=".6"/><path d="M-9 8Q0 13 9 8L11 15Q0 20-11 15Z" fill="#f3f1ec" opacity=".8"/></g>;
 const route=(d)=><><path d={d} fill="none" stroke="currentColor" strokeWidth="5" strokeOpacity=".17" strokeLinecap="round"/><path className="ph-art-route" d={d} fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="5 7" strokeLinecap="round"/></>;
 let scene;
 switch(kind){
 case 'adults': case 'kids': scene=<g transform={kind==='kids'?'translate(0 2) rotate(-8 90 65)':'rotate(-11 90 65)'}>{route('M5 110Q40 95 70 112T173 99')}<g className="ph-art-float"><path d="M29 23Q48 16 65 26L75 54Q89 70 116 74L141 79Q156 83 156 95L150 100H28Q19 99 19 88L23 65Q27 48 29 23Z" fill={dark} stroke="currentColor" strokeWidth="1.4"/><path d="M29 23Q50 17 64 26L69 44Q46 48 26 41Z" fill={metal}/><path d="M27 57Q44 63 70 52L78 60Q60 74 23 72Z" fill={metal}/><path d="M21 79Q53 84 81 71L118 79Q139 79 151 90L154 95H23Z" fill={metal}/><path d="M34 29 61 32M35 39 65 42M40 50 68 49" stroke="#fff" strokeOpacity=".65" strokeWidth="2" strokeLinecap="round"/><path d="M28 100H149L140 111H37Z" fill="#202b2e" stroke="currentColor"/>{[43,73,103,133].map(x=><g key={x}>{wheel(x,112,10)}</g>)}</g>{kind==='kids'&&<>{star(145,25,1.5)}{star(166,49,.7)}</>}</g>;break;
 case 'profile': scene=<g className="ph-art-float">{card(35,24,113,76,-9)}{card(23,29,125,76,6,<>{person(28,35,.72)}{line(56,25,45)}{line(56,36,34)}{line(56,47,48)}<text x="15" y="67" fill="currentColor" fontSize="8" fontWeight="800">PR / IDENTITY</text></>)}</g>;break;
 case 'training': scene=<>{route('M10 105C40 43 124 128 153 33')}<g className="ph-art-float">{cone(45,75,.75)}{cone(98,50,1.12)}{cone(145,83,.7)}</g>{star(154,24,.7)}</>;break;
 case 'progress': scene=<g className="ph-art-float">{card(19,19,142,96,-4,<>{[1,2,3].map(i=><path key={i} d={'M13 '+(20+i*16)+'H129'} stroke="#fff" strokeOpacity=".1"/>)}{[22,36,28,53,65].map((h,i)=><rect key={i} x={15+i*23} y={77-h} width="14" height={h} rx="3" fill={metal} opacity={.45+i*.1}/>)}<path className="ph-art-graph" d="M15 65 38 48 61 56 84 31 108 24 130 9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/><circle cx="130" cy="9" r="4" fill="#fff"/></>)}</g>;break;
 case 'community': scene=<><g className="ph-art-float"><path d="M34 76 90 38 145 76 90 109Z" fill="none" stroke="currentColor" strokeDasharray="4 5" strokeWidth="2"/>{person(34,76,.78)}{person(145,76,.78)}{person(90,36,1.05)}{person(90,108,.55)}</g>{star(148,28,.8)}{star(25,30,.6)}</>;break;
 case 'alliance': scene=<g className="ph-art-card-tilt"><g transform="rotate(-30 90 65)"><rect x="16" y="43" width="88" height="48" rx="24" fill="none" stroke="#0b0c10" strokeWidth="18"/><rect x="16" y="43" width="88" height="48" rx="24" fill="none" stroke={metal} strokeWidth="13"/><rect x="76" y="43" width="88" height="48" rx="24" fill="none" stroke="#0b0c10" strokeWidth="18"/><rect x="76" y="43" width="88" height="48" rx="24" fill="none" stroke={metal} strokeWidth="13"/><path d="M82 43H90Q104 43 104 67" stroke={metal} strokeWidth="13" strokeLinecap="round"/></g>{star(149,21,1)}{star(27,112,.65)}</g>;break;
 case 'passport': scene=<g className="ph-art-float" transform="rotate(-9 90 65)"><rect x="50" y="16" width="81" height="109" rx="9" fill="#dbb787"/><rect x="44" y="12" width="80" height="109" rx="9" fill={dark} stroke="currentColor"/><path d="M51 15V117" stroke="currentColor" opacity=".6"/><circle cx="85" cy="56" r="20" fill={metal}/><circle cx="85" cy="56" r="15" fill={dark}/>{star(85,56,1.45)}<text x="84" y="91" fill="currentColor" fontSize="11" fontWeight="900" textAnchor="middle">PR KIDS</text><text x="84" y="104" fill="#fff" fontSize="6.5" textAnchor="middle" letterSpacing="1">PASAPORTE</text>{star(138,33,1.2)}{star(151,52,.6)}</g>;break;
 case 'tickets': scene=<g className="ph-art-float">{card(33,25,119,55,-12)}{card(23,55,129,55,8,<><path d="M92 5V50" stroke="currentColor" strokeDasharray="3 4"/><text x="12" y="21" fontSize="10" fontWeight="900" fill="currentColor">PR / PASS</text>{line(12,32,56)}{line(12,41,38)}<path d="m102 26 6 6 11-15" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round"/></>)}</g>;break;
 case 'uniform': scene=<g className="ph-art-float" transform="rotate(-7 90 65)"><path d="M65 15 80 20Q90 33 100 20L115 15 155 39 139 64 121 55 125 119H55L59 55 41 64 25 39Z" fill={dark} stroke="currentColor" strokeWidth="1.5"/><path d="M65 15 80 20Q90 33 100 20L115 15 155 39 139 64 121 55 125 119H55L59 55 41 64 25 39Z" fill={paint('shine')}/><path d="M80 20Q90 39 100 20M59 55 65 31M121 55 115 31M58 111H122" fill="none" stroke="currentColor" strokeOpacity=".55" strokeWidth="2"/><path d="M75 41Q68 72 75 111M105 41Q112 72 105 111" stroke="#fff" strokeOpacity=".08" fill="none"/></g>;break;
 case 'tracking': scene=<g><circle className="ph-art-pulse" cx="90" cy="65" r="49" fill="none" stroke="currentColor" strokeWidth="2"/><circle className="ph-art-pulse ph-art-pulse-delay" cx="90" cy="65" r="49" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="90" cy="65" r="41" fill="none" stroke="currentColor" strokeOpacity=".3"/><g className="ph-art-float"><circle cx="90" cy="65" r="33" fill={dark} stroke="currentColor" strokeWidth="2"/><circle cx="90" cy="65" r="29" fill={paint('shine')}/><text x="90" y="70" textAnchor="middle" fontSize="17" fontWeight="900" fill="currentColor" letterSpacing="2">NFC</text></g></g>;break;
 case 'card': scene=<g className="ph-art-card-tilt">{card(31,25,119,77,-10)}{card(22,35,129,77,5,<><rect x="14" y="16" width="23" height="16" rx="4" fill={metal}/><path d="M21 16V32M30 16V32M14 24H37" stroke="#16191d" strokeOpacity=".65"/><text x="112" y="25" textAnchor="end" fill="currentColor" fontSize="15" fontWeight="900">PR</text>{line(14,52,72)}{line(14,62,41)}<text x="114" y="64" textAnchor="end" fontSize="9" fontWeight="800" fill="currentColor">CARD</text></>)}</g>;break;
 case 'map': scene=<g className="ph-art-float"><path d="m17 43 45-18 48 17 49-17v71l-49 18-48-17-45 18Z" fill={dark} stroke="currentColor" strokeOpacity=".7"/><path d="M62 25v72M110 42v72M20 70l41-14 49 15 47-17M42 35v74M133 36v67" fill="none" stroke="currentColor" opacity=".23"/>{route('M29 94 55 72 81 87 112 55 145 73')}<g className="ph-art-pin"><path d="M102 10a16 16 0 0 0-16 16c0 13 16 30 16 30s16-17 16-30a16 16 0 0 0-16-16Z" fill={metal} stroke="#fff" strokeOpacity=".65"/><circle cx="102" cy="26" r="6" fill={dark}/></g></g>;break;
 case 'rules': scene=<g className="ph-art-float">{card(54,10,82,111,7)}{card(38,13,83,110,-7,<><text x="12" y="22" fontSize="10" fill="currentColor" fontWeight="900">GUÍA PR</text>{[36,54,72,90].map(y=><g key={y}><path d={'m11 '+y+' 4 4 7-9'} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>{line(30,y-2,36)}</g>)}</>)}</g>;break;
 case 'classes': scene=<g className="ph-art-float">{card(33,26,119,74,-8)}{card(19,36,126,75,6,<><path d="M10 57 35 29 55 48 83 18 115 57Z" fill={metal} opacity=".7"/><circle cx="94" cy="20" r="10" fill={light}/><path d="M9 61H116" stroke="#fff" opacity=".4"/><text x="12" y="70" fontSize="6.5" fontWeight="800" fill="currentColor">PR / MOMENTS</text></>)}</g>;break;
 case 'outings': scene=<g className="ph-art-float"><circle cx="125" cy="40" r="27" fill={metal}/><path d="M12 89Q49 60 85 89T168 79V116H12Z" fill={dark} stroke="currentColor" strokeOpacity=".5"/>{route('M12 110Q48 80 85 100T169 88')}<path d="M12 78H169M15 70H157" stroke="currentColor" strokeOpacity=".2"/></g>;break;
 case 'videos': scene=<g className="ph-art-float">{card(24,32,132,83,-4,<><path d="M0 20H132" stroke="currentColor" strokeOpacity=".7"/><circle cx="66" cy="48" r="24" fill={metal}/><path d="M60 35 80 48 60 61Z" fill={dark}/></>)}<g transform="rotate(-11 24 32)"><rect x="24" y="23" width="132" height="15" rx="3" fill={metal}/>{[38,70,102,134].map(x=><path key={x} d={'M'+x+' 23l-10 15'} stroke="#182128" strokeWidth="7"/>)}</g></g>;break;
 default: scene=null
 }
 return <span className={'ph-banner-art ph-art-'+kind} aria-hidden="true"><svg viewBox="0 0 180 140" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id={id+'-metal'} x1="0" y1="0" x2=".85" y2="1"><stop stopColor="#fff7e5"/><stop offset=".25" stopColor="currentColor"/><stop offset=".65" stopColor="currentColor" stopOpacity=".68"/><stop offset="1" stopColor="#23252b"/></linearGradient><linearGradient id={id+'-dark'} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#41434a"/><stop offset=".48" stopColor="#24262d"/><stop offset="1" stopColor="#101116"/></linearGradient><linearGradient id={id+'-shine'} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff" stopOpacity=".2"/><stop offset=".35" stopColor="#fff" stopOpacity=".02"/><stop offset=".52" stopColor="currentColor" stopOpacity=".13"/><stop offset="1" stopColor="#fff" stopOpacity="0"/></linearGradient><radialGradient id={id+'-light'}><stop stopColor="#fff"/><stop offset="1" stopColor="currentColor"/></radialGradient></defs><ellipse cx="90" cy="126" rx="65" ry="9" fill="#000" opacity=".21"/>{scene}</svg></span>
}
const experience=[['01','Tu perfil','Tus logros y tu identidad roller.','profile','/app/perfil'],['02','Entrenamiento','Deberes, objetivos y devoluciones.','training','/app/entrenamiento'],['03','Progreso','Kilómetros, tomas de tiempo y evolución.','progress','/app/evolucion'],['04','Comunidad','Experiencias y beneficios compartidos.','community','/app/comunidad']]
const serviceKinds=['passport','tickets','uniform','tracking','card','map','alliance','rules']
function BannerContent({n,title,description,kind,link=true}){return <><BannerArt kind={kind}/><div className="ph-banner-copy"><span>{n} / PUNTA ROLLERS</span><strong>{title}</strong><p>{description}</p></div>{link&&<b className="ph-banner-arrow" aria-hidden="true">↗</b>}</>}

const number=v=>Number(v).toLocaleString('es-UY',{maximumFractionDigits:1})
const localMonth=()=>{const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/Montevideo',year:'numeric',month:'2-digit'}).formatToParts(new Date()).map(p=>[p.type,p.value]));return parts.year+'-'+parts.month}
const monthName=day=>new Intl.DateTimeFormat('es-UY',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(day+'T12:00:00Z'))
function Label({children}){return <p className="ph-label">{children}</p>}
function Header({label,title,children}){return <div className="ph-heading"><Label>{label}</Label><h2>{title}</h2>{children&&<p>{children}</p>}</div>}
function Metric({value,label}){return <div className="ph-metric"><strong>{value}</strong><span>{label}</span></div>}
function TrackArt(){return <svg className="ph-track" viewBox="0 0 500 500" fill="none" aria-hidden="true"><defs><linearGradient id="ph-track-grad" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff" stopOpacity=".72"/><stop offset="1" stopColor="#fff" stopOpacity=".12"/></linearGradient></defs>{[0,1,2,3,4].map(i=><rect key={i} x={54+i*24} y={54+i*24} width={392-i*48} height={392-i*48} rx={196-i*24} stroke="url(#ph-track-grad)" strokeWidth="2"/>)}<path d="M250 14v472M14 250h472" stroke="#fff" strokeOpacity=".16" strokeDasharray="5 10"/><circle cx="250" cy="250" r="40" fill="#191A20"/><path d="M253 221l-19 32h17l-5 26 22-35h-19l4-23z" fill="#d8ff65"/></svg>}
function ActivityChart({weekly,monthStart}){
 const max=Math.max(1,...weekly.map(x=>Number(x.km)||0))
 const lastDay=new Date(Date.UTC(Number(monthStart.slice(0,4)),Number(monthStart.slice(5,7)),0)).getUTCDate()
 return <div className="ph-chart"><div className="ph-chart-title"><strong>El mes, tramo a tramo</strong><span>KM</span></div><div className="ph-bars">{weekly.map(x=>{const start=(x.bucket-1)*7+1,end=Math.min(x.bucket*7,lastDay);return <div className="ph-bar-col" key={x.bucket}><span>{number(x.km)}</span><div className="ph-bar-track"><div className="ph-bar" style={{height:(Number(x.km)/max*100)+'%'}}/></div><small>{start}–{end}</small></div>})}</div><p className="ph-muted">Días del mes · el último tramo puede estar en curso.</p></div>
}
function Motion({summary,loading,error,destination}){
 const current=summary&&String(summary.month_start).slice(0,7)===localMonth()
 const fresh=current&&Date.now()-Date.parse(summary.updated_at)<2*60*60*1000
 const available=fresh&&summary.km!=null&&summary.participants!=null&&summary.outings!=null
 return <section className="ph-motion ph-section" aria-labelledby="ph-motion-title">
  <div className="ph-motion-head"><div><Label>03 / PUNTA ROLLERS EN MOVIMIENTO</Label><h2 id="ph-motion-title">Cada kilómetro<br/>nos conecta<span>.</span></h2><p>Lo que nuestra comunidad va construyendo sobre ruedas.</p></div><span className="ph-motion-mark" aria-hidden="true">↗</span></div>
  {available?<><div className="ph-total"><span>{monthName(summary.month_start)}</span><strong>{number(summary.km)} <small>KM</small></strong><p>Distancia registrada en el mes</p></div><div className="ph-motion-grid"><Metric value={number(summary.outings)} label="Rodadas registradas"/><Metric value={number(summary.participants)} label="Participantes con actividad"/></div>{Array.isArray(summary.weekly)&&summary.weekly.length>0&&<ActivityChart weekly={summary.weekly} monthStart={summary.month_start}/>}<p className="ph-source">Datos agregados de patinaje en Strava compartidos públicamente. No representan el padrón total ni incluyen actividades privadas. Actualización cada 30 minutos.</p></>:<div className="ph-data-state" role="status">{loading?'Estamos cargando los kilómetros de este mes…':error?'No pudimos actualizar las estadísticas. Volvé a consultar en otro momento.':'Todavía no hay suficientes registros públicos para mostrar el resumen mensual.'}</div>}
  <div className="ph-private"><div><strong>RollerFeed vive dentro de PR.</strong><p>Publicaciones, desafíos y momentos de los alumnos, en su espacio personal.</p></div><Link to={destination} aria-label="Ingresar a la plataforma Punta Rollers">Ingresar ↗</Link></div>
 </section>
}
export default function Home(){
 const {user}=useAuth()
 const [day,setDay]=useState('sabado')
 const [summary,setSummary]=useState(null)
 const [loading,setLoading]=useState(true)
 const [error,setError]=useState(false)
 const [events,setEvents]=useState([])
 const [eventStatus,setEventStatus]=useState('loading')
 const destination=user?(user.role==='familiar'?'/kids':'/app/perfil'):'/login'
 useEffect(()=>{if(!window.location.hash)return;const timer=setTimeout(()=>document.getElementById(window.location.hash.slice(1))?.scrollIntoView(),100);return()=>clearTimeout(timer)},[])
 useEffect(()=>{
  let live=true
  async function load(){
   try{const {data,error:err}=await supabase.from('pr_home_monthly_summary').select('month_start,km,outings,participants,weekly,updated_at').eq('id',1).maybeSingle();if(err)throw err;if(live){setSummary(data);setError(false)}}catch{if(live){setSummary(null);setError(true)}}finally{if(live)setLoading(false)}
  }
  load();const timer=setInterval(load,30*60*1000);window.addEventListener('focus',load)
  return()=>{live=false;clearInterval(timer);window.removeEventListener('focus',load)}
 },[])
 useEffect(()=>{
  let live=true
  async function load(){try{const {data,error:err}=await supabase.from('rollerfeed_events').select('id,titulo,inicio,fin,mes_referencia,lugar,estado,visible_feed').eq('visible_feed',true).gte('inicio',new Date().toISOString()).in('estado',['Publicado','Próximamente']).order('inicio').limit(5);if(err)throw err;if(live){setEvents(data||[]);setEventStatus('ready')}}catch{if(live)setEventStatus('error')}}
  load();return()=>{live=false}
 },[])
 return <PublicLayout><main className="pr-summer-home"><div className="ph-shell">
  <header className="ph-hero">
   <div className="ph-hero-top"><div className="ph-brand"><img src="/logo.png" alt="Punta Rollers"/><div><strong>PUNTA ROLLERS</strong><small>Punta del Este · Maldonado</small></div></div><Link className="ph-login" to={destination}>{user?'Mi espacio':'Ingresar'} ↗</Link></div>
   <div className="ph-hero-content"><div className="ph-hero-copy"><div className="ph-edition"><span>☀</span> SUMMER SEASON / 26—27</div><Label>DESDE 2016 · URUGUAY</Label><h1 className="ph-sunset-title"><span>No es solo patinar.</span><em>Es pertenecer.</em></h1><p>Aprendé a patinar, disfrutá el verano y encontrá tu comunidad. Desde tus primeras ruedas hasta tu próximo desafío.</p><div className="ph-cta-row"><a className="ph-button ph-primary" href="#inscripciones">Quiero patinar <span>↗</span></a><a className="ph-button ph-secondary" href="#clases">Ver horarios ↓</a></div></div>
   <div className="ph-art" aria-hidden="true"><div className="ph-sun"/><TrackArt/><div className="ph-art-type">ROLL<br/>INTO<br/><span>2027.</span></div><div className="ph-art-tag">COSTA / PUNTA DEL ESTE</div></div></div>
   <div className="ph-hero-stats"><Metric value="10" label="Años sobre ruedas"/><Metric value="2" label="Sedes PR"/><Metric value={schedule.sabado.length+schedule.miercoles.length} label="Turnos de verano"/></div>
  </header>
  <section id="clases" className="ph-section ph-schedule">
   <Header label="01 / SUMMER ROLLERCLASS" title="Elegí tu próxima rodada.">Clases para empezar desde cero, mejorar tu técnica o volver a disfrutar sobre ruedas.</Header>
   <div className="ph-day-switch" role="group" aria-label="Día de clases">{[['sabado','Sábados','Turno regular'],['miercoles','Miércoles','Extra incluido']].map(([key,label,sub])=><button type="button" aria-pressed={day===key} key={key} onClick={()=>setDay(key)}><strong>{label}</strong><small>{sub}</small></button>)}</div>
   <div className="ph-class-list">{schedule[day].map(item=><article className="ph-class" key={item.time}><div className="ph-time"><strong>{item.time}</strong><small>— {item.end}</small></div><div className="ph-class-info"><strong>{item.title}</strong><p>{item.place}</p><span>{item.type}</span></div>{day==='sabado'&&<Link className="ph-class-link" to={item.kids?KIDS:ADULT} aria-label={'Consultar inscripción '+item.title+' '+item.time}>↗</Link>}</article>)}</div>
   <p className="ph-note">{day==='sabado'?'Elegí tu turno fijo semanal. Si suspendemos una clase regular, coordinamos su reposición.':'Clases complementarias para adultos incluidas en la membresía, según nivel, clima y disponibilidad docente. No tienen reposición si se suspenden.'} La disponibilidad se confirma en el proceso de inscripción.</p>
   <div id="inscripciones" className="ph-registration"><Link className="ph-sign ph-adults" to={ADULT}><BannerArt kind="adults"/><div className="ph-sign-copy"><span>01 / ADULTOS</span><strong>Tu próxima historia empieza acá.</strong><small>Grupales o personalizadas 1 a 1</small><b>Ver opciones e inscribirme ↗</b></div></Link><Link className="ph-sign ph-kids" to={KIDS}><BannerArt kind="kids"/><div className="ph-sign-copy"><span>02 / PR KIDS</span><strong>Pequeñas ruedas. Grandes aventuras.</strong><small>Clases para niños · pista cerrada</small><b>Conocer PR Kids ↗</b></div></Link></div>
   <p className="ph-note">El equipo confirma tu inscripción y crea tu acceso a la plataforma.</p>
  </section>
  <section className="ph-section ph-about"><Header label="02 / SOMOS PR" title="Una escuela. Una comunidad.">Hace 10 años acompañamos a niños, adolescentes, adultos y adultos mayores. La técnica importa, pero compartir el camino también.</Header><div className="ph-places"><div><Label>01 / OUTDOOR</Label><h3>Parada 2</h3><p>Punta del Este · Aire libre</p></div><div><Label>02 / INDOOR</Label><h3>Pista cerrada</h3><p>Maldonado</p></div></div><div className="ph-team"><img src="/logo.png" alt=""/><div><strong>Equipo Punta Rollers</strong><p>Claudio Facelli · David Almeida · Lucía Bernales</p></div></div></section>
  <Motion summary={summary} loading={loading} error={error} destination={destination}/>
  <section className="ph-section ph-digital"><Header label="04 / LA EXPERIENCIA PR" title="Mucho más que venir a clase.">Tu camino no termina cuando te sacás los patines. En PR tenés herramientas para disfrutar, entrenar y crecer.</Header><div className="ph-digital-grid">{experience.map(([n,t,d,kind,to])=><Link key={n} className={'ph-feature ph-feature-'+kind} to={user&&user.role!=='familiar'?to:destination}><BannerContent n={n} title={t} description={d} kind={kind}/></Link>)}</div><Link className="ph-button ph-primary" to={destination}>{user?'Ir a mi espacio':'Acceder a mi cuenta'} ↗</Link></section>
  <section id="explorar" className="ph-section"><Header label="05 / ECOSISTEMA" title="Todo Punta Rollers.">Explorá los servicios, beneficios y experiencias de nuestra escuela.</Header><div className="ph-service-grid">{tools.map(([n,t,d,to],i)=>{const kind=serviceKinds[i],cls='ph-feature ph-feature-'+kind,content=<BannerContent n={n} title={t} description={d} kind={kind}/>;return to.startsWith('https://')?<a key={to} className={cls} href={to} target="_blank" rel="noreferrer">{content}</a>:<Link key={to} className={cls} to={to}>{content}</Link>})}</div></section>
  <section className="ph-section"><Header label="06 / MOMENTOS PR" title="Así se vive sobre ruedas.">Volvé a nuestras clases, rolleadas y recuerdos.</Header><div className="ph-gallery">{gallery.map(([name,url],i)=><a key={name} className={'ph-feature ph-feature-'+['classes','outings','videos'][i]} href={url} target="_blank" rel="noreferrer"><BannerContent n={'0'+(i+1)} title={name} description="Abrir galería" kind={['classes','outings','videos'][i]}/></a>)}</div></section>
  <section className="ph-section"><Header label="07 / AGENDA" title="Lo próximo en PR.">Nuevas fechas y actividades de la comunidad.</Header>{events.length?<div className="ph-events">{events.map(event=><article key={event.id}><Label>{new Intl.DateTimeFormat('es-UY',{day:'numeric',month:'long',timeZone:'America/Montevideo'}).format(new Date(event.inicio))}</Label><h3>{event.titulo}</h3><p>{event.mes_referencia||''}</p><p>{event.lugar||'Ubicación a confirmar'}</p></article>)}</div>:<div className="ph-data-state">{eventStatus==='loading'?'Cargando agenda…':eventStatus==='error'?'La agenda no está disponible en este momento.':'Nuevas fechas próximamente.'}</div>}</section>
  <footer className="ph-footer"><img src="/logo.png" alt="Punta Rollers"/><Label>SUMMER SEASON 2026—2027</Label><h2>No es solo patinar.<br/><em>Es pertenecer.</em></h2><p>Punta del Este · Maldonado · Uruguay</p><a className="ph-button ph-primary" href="#inscripciones">Empezá tu historia ↗</a></footer>
 </div></main></PublicLayout>
}
