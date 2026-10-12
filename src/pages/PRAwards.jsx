import { useState } from 'react'
import { Link } from 'react-router-dom'

const categories = [
  ['Leyenda del Asfalto','Deportivo','Podio histórico de kilómetros válidos registrados en Punta Rollers. Clasificación automática.','automatic'],
  ['Revelación del Año','Deportivo','La evolución que más sorprendió a la comunidad.'],
  ['Espíritu Imparable','Deportivo','Nunca se rinde, siempre vuelve a intentarlo.'],
  ['La Técnica Dorada','Deportivo','Dominio, control y técnica sobre ruedas.'],
  ['El Alma de PR','Comunidad','Ese compañero que siempre está para los demás.'],
  ['Energía Infinita','Comunidad','La mejor actitud y la energía más contagiosa.'],
  ['La Dupla del Año','Comunidad','Dos personas que parecen venir siempre en equipo.'],
  ['Asistencia Perfecta','Comunidad','Quien nunca falta a una clase.'],
  ['GPS Perdido','Divertido','La persona más distraída de Punta Rollers.'],
  ['Micrófono de Oro','Divertido','Habla incluso cuando todo el mundo está patinando.'],
  ['El Traspié del Año','Divertido','Un desequilibrio que pasó a la historia.'],
  ['Gravedad 1 — Patinador 0','Divertido','La caída más recordada, siempre con respeto.'],
  ['Siempre Cinco Minutitos','Divertido','El clásico que llega justo sobre la hora.'],
  ['La Cuchara de Oro','Divertido','Quien conquista al grupo con sus comidas.'],
  ['Mecha Corta','Divertido','Quien se enoja más rápido, con cariño.'],
  ['DJ sobre Ruedas','Divertido','La persona que siempre tiene la música indicada.'],
]
const sections=['Todas','Deportivo','Comunidad','Divertido']
const nowPhase=()=>{const now=new Date();const year=now.getFullYear();if(year!==2026)return 'preview';const t=now.getTime();if(t<Date.parse('2026-11-01T00:00:00-03:00'))return 'preview';if(t<Date.parse('2026-12-01T00:00:00-03:00'))return 'nominate';if(t<Date.parse('2026-12-21T00:00:00-03:00'))return 'vote';return 'closed'}
export default function PRAwards(){
 const [filter,setFilter]=useState('Todas')
 const [expanded,setExpanded]=useState(-1)
 const [query,setQuery]=useState('')
 const [suggestOpen,setSuggestOpen]=useState(false)
 const [suggestName,setSuggestName]=useState('')
 const [suggestDescription,setSuggestDescription]=useState('')
  const phase=nowPhase()
 const share=async()=>{const url=window.location.href;if(navigator.share){try{await navigator.share({title:'PR Awards 2026',url});return}catch{}}try{await navigator.clipboard.writeText(url);window.alert('Enlace copiado')}catch{window.prompt('Copiá el enlace:',url)}}
 return <main className="min-h-screen bg-[#0e0d0b] text-[#f5eee2]" style={{fontFamily:'Inter,system-ui,sans-serif'}}>
  <div className="mx-auto max-w-5xl px-4 pb-24 pt-7 sm:px-8">
   <header className="flex items-center justify-between gap-4 border-b border-[#bda478]/20 pb-5">
    <Link to="/" className="text-xs font-black tracking-[.2em] text-[#e5d3ae] no-underline">PUNTA ROLLERS</Link>
    <button type="button" onClick={share} className="inline-flex items-center gap-2 rounded-full border border-[#bda478]/40 px-4 py-2 text-xs font-semibold text-[#e5d3ae]"><span aria-hidden="true">↗</span> Compartir</button>
   </header>
   <section className="relative overflow-hidden py-16 text-center sm:py-24">
    <div className="pointer-events-none absolute left-1/2 top-16 h-64 w-64 -translate-x-1/2 rounded-full bg-[#a98443]/10 blur-[85px]"/>
    <div className="relative mx-auto mb-7 flex h-24 w-24 items-center justify-center rounded-[30px] border border-[#c8a866]/40 bg-gradient-to-br from-[#3b2d19] to-[#15120e] shadow-[0_15px_60px_#b5913622]"><span aria-hidden="true">★</span></div>
    <p className="mb-3 text-[11px] font-bold tracking-[.33em] text-[#c7a66d]">PUNTA ROLLERS PRESENTA</p>
    <h1 className="text-5xl font-black tracking-[-.06em] sm:text-7xl">PR <span className="text-[#e4bd73]">AWARDS</span></h1>
    <p className="mt-2 text-lg font-light tracking-[.45em] text-[#c6b08a]">2026</p>
    <p className="mx-auto mt-8 max-w-lg text-sm leading-7 text-[#d0c6b7]">Una temporada. Una comunidad. Sus protagonistas. Reconocemos a quienes hicieron de Punta Rollers algo más que una escuela de patinaje.</p>
    <div className="mx-auto mt-7 inline-flex items-center gap-2 rounded-full border border-[#d2b478]/30 bg-[#d2b478]/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[.12em] text-[#ebc88a]">{phase==='preview'?'Estreno: 1.º de noviembre':phase==='nominate'?'Etapa de postulaciones':phase==='vote'?'Etapa de votaciones': 'Ganadores por anunciar'}</div>
   </section>
   <section className="grid gap-3 sm:grid-cols-3">
    {[['01','NOVIEMBRE','1 al 30 de noviembre','Postulá compañeros y proponé nuevas categorías.'],['02','DICIEMBRE','1 al 20 de diciembre','Votá por los tres nominados oficiales de cada premio.'],['03','GRAN GALA','Fiesta de fin de año','Los ganadores se anuncian en vivo, con sobres y premios.']].map(s=><div key={s[0]} className="rounded-2xl border border-[#bda478]/20 bg-[#1b1915] p-5"><span className="text-3xl font-black text-[#e1be79]">{s[0]}</span><p className="mt-4 text-[11px] font-black tracking-[.18em] text-[#d6b87e]">{s[1]}</p><p className="mt-2 font-semibold">{s[2]}</p><p className="mt-2 text-sm leading-6 text-[#bdb3a4]">{s[3]}</p></div>)}
   </section>
   <section className="mt-14">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-[11px] font-black tracking-[.2em] text-[#d3af71]">LOS PREMIOS</p><h2 className="mt-2 text-3xl font-black tracking-tight">16 categorías iniciales</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[#bdb3a4]">La comunidad podrá proponer otras cuatro para completar los 20 premios. Cada categoría tendrá tres finalistas oficiales en diciembre.</p></div><span className="rounded-full border border-[#bda478]/25 px-4 py-2 text-xs text-[#d5bc90]">16 + 4 de la comunidad</span></div>
    <div className="mt-7 flex flex-wrap gap-2">{sections.map(x=><button key={x} type="button" onClick={()=>{setFilter(x);setExpanded(-1)}} className={`rounded-full px-4 py-2 text-xs font-bold transition ${filter===x?'bg-[#d5b371] text-[#15110b]':'border border-[#bda478]/25 text-[#c9bda8]'}`}>{x}</button>)}</div>
    <div className="mt-5 grid gap-3 sm:grid-cols-2">{categories.map((c,i)=>({c,i})).filter(({c})=>filter==='Todas'||c[1]===filter).map(({c,i})=><article key={i} className="self-start overflow-hidden rounded-2xl border border-[#bda478]/20 bg-[#191713]">
     <div className="p-5"><div className="flex items-center justify-between gap-3"><span className="text-[10px] font-black uppercase tracking-[.15em] text-[#c4a16b]">{c[1]}</span><span aria-hidden="true">✦</span></div><h3 className="mt-3 text-lg font-bold">{c[0]}</h3><p className="mt-2 min-h-12 text-sm leading-6 text-[#bdb3a4]">{c[2]}</p>
     {c[3]==='automatic'?<div className="mt-4 rounded-xl border border-[#bda478]/25 bg-[#c9a669]/10 p-3 text-xs leading-5 text-[#dfc9a2]">Ranking automático por kilómetros registrados. Se actualizará hasta el cierre del certamen, una vez validada la conexión histórica de Strava.</div>:<button type="button" onClick={()=>{setExpanded(expanded===i?-1:i);setQuery('')}} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#c5a36b]/45 px-4 py-3 text-xs font-bold text-[#e4c58d]"><span aria-hidden="true">◎</span>{expanded===i?'Cerrar selector':'Postular compañeros'}{expanded===i?<span aria-hidden="true">⌃</span>:<span aria-hidden="true">⌄</span>}</button>}</div>
     {expanded===i&&c[3]!=='automatic'&&<div className="border-t border-[#bda478]/20 bg-[#242018] p-4"><p className="mb-3 text-sm font-semibold">Buscá a tus compañeros</p><div className="relative"><span aria-hidden="true">⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Nombre o apellido" className="w-full rounded-xl border border-[#bda478]/30 bg-[#13110e] py-3 pl-10 pr-3 text-sm text-white outline-none"/></div><div className="mt-3 rounded-xl border border-[#bda478]/20 p-4 text-sm leading-6 text-[#c5b9a5]">{phase==='preview'?'Las postulaciones se habilitarán el 1.º de noviembre.':phase==='nominate'?'Estamos preparando el directorio seguro de alumnos y el registro de postulaciones.': 'Las postulaciones ya están cerradas.'} El listado de alumnos y las fotografías se incorporarán únicamente después de validar sus permisos de publicación.</div></div>}
    </article>)}</div>
   </section>
   <section className="mt-14 rounded-3xl border border-[#c5a36b]/30 bg-gradient-to-br from-[#302619] to-[#191713] p-7 sm:p-10"><div className="flex items-center gap-3"><span aria-hidden="true">✦</span><p className="text-[11px] font-black tracking-[.2em] text-[#d8b779]">CUATRO PREMIOS MÁS</p></div><h2 className="mt-4 text-2xl font-black">¿Qué categoría falta?</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-[#d1c2a8]">Durante noviembre vas a poder inventar una categoría deportiva, divertida o de compañerismo. Las propuestas serán revisadas y cuatro podrán sumarse a la gala.</p><button type="button" onClick={()=>setSuggestOpen(!suggestOpen)} className="mt-5 w-full rounded-xl border border-[#c5a36b]/45 px-4 py-3 text-sm font-bold text-[#e4c58d]">{suggestOpen?"Cerrar propuesta":"Sugerir una categoría"}</button>{suggestOpen&&<div className="mt-4 space-y-3"><label htmlFor="award-name" className="block text-sm">Nombre de la categoría</label><input id="award-name" value={suggestName} onChange={e=>setSuggestName(e.target.value)} maxLength={70} placeholder="Ej. El Rey de los Conos" className="w-full rounded-xl border border-[#c5a36b]/40 bg-[#17130e] p-3 text-white"/><label htmlFor="award-description" className="block text-sm">¿Qué premiaría?</label><textarea id="award-description" value={suggestDescription} onChange={e=>setSuggestDescription(e.target.value)} maxLength={300} rows={3} placeholder="Contanos qué reconoce este premio" className="w-full rounded-xl border border-[#c5a36b]/40 bg-[#17130e] p-3 text-white"/><p className="text-xs text-[#cbb99b]">El envío se habilitará cuando el registro de propuestas esté conectado y probado.</p><button type="button" disabled className="w-full rounded-xl bg-[#a68a58]/40 p-3 text-sm font-bold">Enviar propuesta · Próximamente</button></div>}</section>
   <footer className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-[#bda478]/20 pt-6 text-xs text-[#9f9381]"><span>PR Awards 2026 · Punta Rollers</span><span>Los resultados se mantienen en secreto hasta la gala.</span></footer>
  </div>
 </main>
}