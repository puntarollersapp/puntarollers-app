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
   <div className="ph-hero-content"><div className="ph-hero-copy"><div className="ph-edition"><span>☀</span> SUMMER SEASON / 26—27</div><Label>DESDE 2016 · URUGUAY</Label><h1>No es solo<br/>patinar.<br/><em>Es pertenecer.</em></h1><p>Aprendé a patinar, disfrutá el verano y encontrá tu comunidad. Desde tus primeras ruedas hasta tu próximo desafío.</p><div className="ph-cta-row"><a className="ph-button ph-primary" href="#inscripciones">Quiero patinar <span>↗</span></a><a className="ph-button ph-secondary" href="#clases">Ver horarios ↓</a></div></div>
   <div className="ph-art" aria-hidden="true"><div className="ph-sun"/><TrackArt/><div className="ph-art-type">ROLL<br/>INTO<br/><span>2027.</span></div><div className="ph-art-tag">COSTA / PUNTA DEL ESTE</div></div></div>
   <div className="ph-hero-stats"><Metric value="10" label="Años sobre ruedas"/><Metric value="2" label="Sedes PR"/><Metric value={schedule.sabado.length+schedule.miercoles.length} label="Turnos de verano"/></div>
  </header>
  <section id="clases" className="ph-section ph-schedule">
   <Header label="01 / SUMMER ROLLERCLASS" title="Elegí tu próxima rodada.">Clases para empezar desde cero, mejorar tu técnica o volver a disfrutar sobre ruedas.</Header>
   <div className="ph-day-switch" role="group" aria-label="Día de clases">{[['sabado','Sábados','Turno regular'],['miercoles','Miércoles','Extra incluido']].map(([key,label,sub])=><button type="button" aria-pressed={day===key} key={key} onClick={()=>setDay(key)}><strong>{label}</strong><small>{sub}</small></button>)}</div>
   <div className="ph-class-list">{schedule[day].map(item=><article className="ph-class" key={item.time}><div className="ph-time"><strong>{item.time}</strong><small>— {item.end}</small></div><div className="ph-class-info"><strong>{item.title}</strong><p>{item.place}</p><span>{item.type}</span></div>{day==='sabado'&&<Link className="ph-class-link" to={item.kids?KIDS:ADULT} aria-label={'Consultar inscripción '+item.title+' '+item.time}>↗</Link>}</article>)}</div>
   <p className="ph-note">{day==='sabado'?'Elegí tu turno fijo semanal. Si suspendemos una clase regular, coordinamos su reposición.':'Clases complementarias para adultos incluidas en la membresía, según nivel, clima y disponibilidad docente. No tienen reposición si se suspenden.'} La disponibilidad se confirma en el proceso de inscripción.</p>
   <div id="inscripciones" className="ph-registration"><Link className="ph-sign ph-adults" to={ADULT}><span>01 / ADULTOS</span><strong>Tu próxima<br/>historia empieza acá.</strong><small>Grupales o personalizadas 1 a 1</small><b>Ver opciones e inscribirme ↗</b></Link><Link className="ph-sign ph-kids" to={KIDS}><span>02 / PR KIDS</span><strong>Pequeñas ruedas.<br/>Grandes aventuras.</strong><small>Clases para niños · pista cerrada</small><b>Conocer PR Kids ↗</b></Link></div>
   <p className="ph-note">El equipo confirma tu inscripción y crea tu acceso a la plataforma.</p>
  </section>
  <section className="ph-section ph-about"><Header label="02 / SOMOS PR" title="Una escuela. Una comunidad.">Hace 10 años acompañamos a niños, adolescentes, adultos y adultos mayores. La técnica importa, pero compartir el camino también.</Header><div className="ph-places"><div><Label>01 / OUTDOOR</Label><h3>Parada 2</h3><p>Punta del Este · Aire libre</p></div><div><Label>02 / INDOOR</Label><h3>Pista cerrada</h3><p>Maldonado</p></div></div><div className="ph-team"><img src="/logo.png" alt=""/><div><strong>Equipo Punta Rollers</strong><p>Claudio Facelli · David Almeida · Lucía Bernales</p></div></div></section>
  <Motion summary={summary} loading={loading} error={error} destination={destination}/>
  <section className="ph-section ph-digital"><Header label="04 / LA EXPERIENCIA PR" title="Mucho más que venir a clase.">Tu camino no termina cuando te sacás los patines. En PR tenés herramientas para disfrutar, entrenar y crecer.</Header><div className="ph-digital-grid">{[['01','Tu perfil','Tus logros y tu identidad roller.'],['02','Entrenamiento','Deberes, objetivos y devoluciones.'],['03','Progreso','Kilómetros, tomas de tiempo y evolución.'],['04','Comunidad','Experiencias y beneficios compartidos.']].map(([n,t,d])=><article key={n}><span>{n}</span><strong>{t}</strong><p>{d}</p></article>)}</div><Link className="ph-button ph-primary" to={destination}>{user?'Ir a mi espacio':'Acceder a mi cuenta'} ↗</Link></section>
  <section id="explorar" className="ph-section"><Header label="05 / ECOSISTEMA" title="Todo Punta Rollers.">Explorá los servicios, beneficios y experiencias de nuestra escuela.</Header><div className="ph-service-grid">{tools.map(([n,t,d,to])=>{const content=<><span>{n} <b aria-hidden="true">↗</b></span><strong>{t}</strong><p>{d}</p></>;return to.startsWith('https://')?<a key={to} href={to} target="_blank" rel="noreferrer">{content}</a>:<Link key={to} to={to}>{content}</Link>})}</div></section>
  <section className="ph-section"><Header label="06 / MOMENTOS PR" title="Así se vive sobre ruedas.">Volvé a nuestras clases, rolleadas y recuerdos.</Header><div className="ph-gallery">{gallery.map(([name,url],i)=><a key={name} href={url} target="_blank" rel="noreferrer"><span>0{i+1} / GALERÍA</span><strong>{name}</strong><b>↗</b></a>)}</div></section>
  <section className="ph-section"><Header label="07 / AGENDA" title="Lo próximo en PR.">Nuevas fechas y actividades de la comunidad.</Header>{events.length?<div className="ph-events">{events.map(event=><article key={event.id}><Label>{new Intl.DateTimeFormat('es-UY',{day:'numeric',month:'long',timeZone:'America/Montevideo'}).format(new Date(event.inicio))}</Label><h3>{event.titulo}</h3><p>{event.mes_referencia||''}</p><p>{event.lugar||'Ubicación a confirmar'}</p></article>)}</div>:<div className="ph-data-state">{eventStatus==='loading'?'Cargando agenda…':eventStatus==='error'?'La agenda no está disponible en este momento.':'Nuevas fechas próximamente.'}</div>}</section>
  <footer className="ph-footer"><img src="/logo.png" alt="Punta Rollers"/><Label>SUMMER SEASON 2026—2027</Label><h2>No es solo patinar.<br/><em>Es pertenecer.</em></h2><p>Punta del Este · Maldonado · Uruguay</p><a className="ph-button ph-primary" href="#inscripciones">Empezá tu historia ↗</a></footer>
 </div></main></PublicLayout>
}
