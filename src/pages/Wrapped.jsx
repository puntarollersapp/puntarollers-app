import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { buildSlides, fmt, personality, plaqueStats } from '../lib/wrapped'
import { getBadgeImage } from '../lib/badges'
import './wrapped.css'

const themes={dark:['#191A20','#F3F1EC','#FF0055'],fucsia:['#FF0055','#F3F1EC','#191A20'],ivory:['#F3F1EC','#191A20','#FF0055']}
const demo={year:2026,name:'Sofi',lastInitial:'R',attendance:{classes:38,busiestMonth:10,favoriteWeekday:3},activity:{km:186.4,hours:17.5,bestMonth:11},duties:{approved:11},shifter:{category:'6K',completed:7},performance:{count:2,distances:[{km:3,count:2,firstSeconds:780,lastSeconds:690,bestSeconds:690,bestPace:230,bestSpeed:15.65,timeReductionPct:11.54}]},frames:{frames:4},badges:['Primeros 6K','Rodador frecuente','Ya frena en T']}
const localDate=v=>new Intl.DateTimeFormat('es-UY',{timeZone:'America/Montevideo',day:'numeric',month:'long',year:'numeric'}).format(new Date(v))
function Count({value,decimals=0,motion}) {
 const [n,setN]=useState(()=>motion?0:value)
 useEffect(()=>{if(!motion){setN(value);return}let raf,start;const step=t=>{start??=t;const p=Math.min(1,(t-start)/850);setN(value*(1-(1-p)**3));if(p<1)raf=requestAnimationFrame(step)};raf=requestAnimationFrame(step);return()=>cancelAnimationFrame(raf)},[value,motion])
 return <>{fmt(n,decimals)}</>
}
function loadImage(src,cors=false){
 return new Promise(resolve=>{if(!src){resolve(null);return}const img=new Image();const done=x=>{clearTimeout(timer);img.onload=null;img.onerror=null;resolve(x)};const timer=setTimeout(()=>done(null),3500);if(cors)img.crossOrigin='anonymous';img.onload=()=>done(img);img.onerror=()=>done(null);img.src=src})
}
async function renderPlaque(data,includePhoto,isDemo){
 const c=document.createElement('canvas');c.width=1080;c.height=1920;const g=c.getContext('2d');if(!g)throw Error('Canvas unavailable')
 const [logo,photo]=await Promise.all([loadImage('/logo.png'),includePhoto&&!isDemo?loadImage(data.photo,true):null])
 if(includePhoto&&!isDemo&&data.photo&&!photo)throw Error('PHOTO_UNAVAILABLE')
 if(!logo)throw Error('LOGO_UNAVAILABLE')
 g.fillStyle='#191A20';g.fillRect(0,0,1080,1920)
 const gradient=g.createRadialGradient(90,250,10,90,250,1200);gradient.addColorStop(0,'#9d0049');gradient.addColorStop(1,'#191A20');g.fillStyle=gradient;g.fillRect(0,0,1080,1920)
 g.save();g.translate(540,1430);g.rotate(-0.17);g.fillStyle='#FF0055';g.fillRect(-850,0,1700,140);g.fillStyle='#F3F1EC';g.fillRect(-850,155,1700,15);g.restore()
 const fit=(value,x,y,size,max,fill='#F3F1EC',weight=900)=>{g.fillStyle=fill;g.font=weight+' '+size+'px system-ui,sans-serif';while(g.measureText(value).width>max&&size>24){size-=2;g.font=weight+' '+size+'px system-ui,sans-serif'}g.fillText(value,x,y,max)}
 if(logo){const w=Math.min(260,140*logo.width/logo.height);g.drawImage(logo,72,112,w,w*logo.height/logo.width)}
 if(photo){const side=Math.min(photo.width,photo.height);g.save();g.beginPath();g.arc(880,210,116,0,Math.PI*2);g.clip();g.drawImage(photo,(photo.width-side)/2,(photo.height-side)/2,side,side,764,94,232,232);g.restore()}
 fit('PR WRAPPED 2026',72,355,42,930)
 fit('TU AÑO',72,470,126,936);fit('SOBRE RUEDAS',72,570,106,936)
 fit((data.name||'ROLLER')+(data.lastInitial?' '+data.lastInitial+'.':''),72,680,78,930,'#FF91B5')
 const stats=plaqueStats(data);stats.forEach((s,i)=>{const x=72+(i%2)*480,y=850+Math.floor(i/2)*220;fit(s.value,x,y,112,440);fit(s.label,x,y+55,33,440,'#F3F1EC',700)})
 if(!stats.length)fit('Mi historia recién arranca',72,900,66,936)
 fit(personality(data).toUpperCase(),72,1380,58,936)
 fit(isDemo?'DEMO · DATOS FICTICIOS':'2027: LA HISTORIA CONTINÚA',72,1745,41,936)
 fit('PUNTAROLLERS.COM',72,1820,36,936)
 return new Promise((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(Error('PNG unavailable')),'image/png'))
}
function StoryOverlay({children,closeTo,onStep}){
 const dialog=useRef(null),navigate=useNavigate()
 useEffect(()=>{
  const root=document.getElementById('root'),prevFocus=document.activeElement,overflow=document.body.style.overflow,wasInert=root?.inert
  document.body.style.overflow='hidden';if(root)root.inert=true
  dialog.current?.focus({preventScroll:true})
  return()=>{document.body.style.overflow=overflow;if(root)root.inert=wasInert;prevFocus?.focus?.({preventScroll:true})}
 },[])
 return createPortal(<div className="prw-overlay" ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-label="PR Wrapped 2026" onKeyDown={e=>{
  if(e.key==='Escape'){e.preventDefault();navigate(closeTo);return}
  if(e.key==='Tab'){const items=[...dialog.current.querySelectorAll('a[href],button:not(:disabled),input:not(:disabled),summary')].filter(el=>el.getClientRects().length);if(!items.length)return;const first=items[0],last=items[items.length-1];if(e.shiftKey&&(document.activeElement===first||document.activeElement===dialog.current)){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}
  if(!e.target.closest('button,a,input,summary')&&(e.key==='ArrowLeft'||e.key==='ArrowRight')){e.preventDefault();onStep?.(e.key==='ArrowLeft'?-1:1)}
 }}>{children}</div>,document.body)
}
function StoryAtmosphere(){
 return <div className="prw-atmosphere" aria-hidden="true">
  <div className="prw-prism"/><div className="prw-orbit prw-orbit-a"/><div className="prw-orbit prw-orbit-b"/>
  <div className="prw-sparkles">{Array.from({length:8},(_,i)=><i key={i} style={{'--x':[8,24,47,68,88,96,55,14][i]+'%','--y':[38,12,55,19,35,65,8,77][i]+'%','--s':[12,5,8,15,6,9,5,6][i]+'px','--delay':i*.47+'s'}}/>)}</div>
  <div className="prw-grain"/>
 </div>
}
const WRAPPED_THEME_TRACK='https://open.spotify.com/track/3uyJrbOnK7fMunoFjRfsew'
function SpotifyLink({url,children='Escuchar en Spotify ↗',className='prw-spotify'}){
 return <a className={className} href={url} target="_blank" rel="noopener noreferrer">{children}</a>
}
function MusicStory({song}){
 return <div className="prw-music-story"><span className="prw-music-label">PR MUSIC · 2026</span><h1>{song.title}</h1><p className="prw-artist">{song.artist}</p><p className="prw-song-description">{song.description}</p><SpotifyLink url={song.url}/></div>
}
function BadgeCollection({badges}){
 return <div className="prw-badge-list">{badges.map(title=><div className="prw-badge" key={title}>{getBadgeImage(title)?<img src={getBadgeImage(title)} alt="" loading="lazy"/>:<span aria-hidden="true">🏅</span>}<small>{title}</small></div>)}</div>
}
export default function Wrapped(){
 const {user}=useAuth();const location=useLocation();const closeTo=location.state?.wrappedFrom==='/app/dashboard'?'/app/dashboard':'/app/perfil';const [data,setData]=useState(null),[dataOwner,setDataOwner]=useState(null),[error,setError]=useState(''),[index,setIndex]=useState(0),[isDemo,setDemo]=useState(false),[motion,setMotion]=useState(false),[photo,setPhoto]=useState(false),[blob,setBlob]=useState(null),[busy,setBusy]=useState(false),[notice,setNotice]=useState(''),[reload,setReload]=useState(0)
 const touch=useRef(null);const generation=useRef(0)
 useEffect(()=>{const m=window.matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setMotion(!m.matches);update();m.addEventListener?.('change',update);return()=>m.removeEventListener?.('change',update)},[])
 useEffect(()=>{let live=true;setData(null);setDemo(false);setIndex(0);setBlob(null);setError('');supabase.rpc('pr_wrapped_2026').then(({data:d,error:e})=>{if(!live)return;if(e||!d)setError('No pudimos cargar tu resumen. Probá nuevamente.');else {setDataOwner(user?.id);setData(d)}}).catch(()=>live&&setError('No pudimos cargar tu resumen.'));return()=>{live=false;generation.current++}},[user?.id,reload])
 const current=isDemo?demo:data;const slides=useMemo(()=>current&&(isDemo||data?.open)?buildSlides(current,isDemo?'demo-2026':String(user?.id||'')):[],[current,isDemo,data?.open,user?.id]);const slide=slides[index];const last=index===slides.length-1
 const go=d=>{setIndex(i=>Math.max(0,Math.min(slides.length-1,i+d)));setBlob(null);generation.current++}
 async function publish(){if(!data?.admin||busy)return;setBusy(true);setNotice('');try{const {data:d,error:e}=await supabase.rpc('pr_wrapped_2026',{p_publish:!data.published});if(e||!d)throw Error();setData(d);setNotice(d.published?'Publicación programada desde el 1 de diciembre.':'Acceso de alumnos pausado.')}catch{setNotice('No se pudo modificar la publicación.')}finally{setBusy(false)}}
 async function prepare(){const token=++generation.current;setBusy(true);setNotice('');try{const b=await renderPlaque(current,photo,isDemo);if(token===generation.current){setBlob(b);setNotice('Placa lista. Elegí descargar o compartir.')}}catch(e){if(token===generation.current)setNotice(e.message==='PHOTO_UNAVAILABLE'?'No pudimos incorporar tu foto. Desmarcá la opción para generar la placa sin ella.':'No se pudo generar la placa. Probá nuevamente.')}finally{setBusy(false)}}
 function download(){if(!blob)return;const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='PR-Wrapped-2026.png';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000)}
 async function share(){if(!blob)return;const file=new File([blob],'PR-Wrapped-2026.png',{type:'image/png'});try{if(navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:'PR Wrapped 2026'});return}}catch(e){if(e.name==='AbortError')return}download()}
 if(error||!data||dataOwner!==user?.id||!slide)return <StoryOverlay closeTo={closeTo}><section className="prw prw-wait"><StoryAtmosphere/><img className="prw-logo" src="/logo.png" alt="Punta Rollers"/><p className="prw-kicker">PR WRAPPED 2026</p><h1>{error?'No pudimos abrir tu resumen':!data?'Armando tu año…':data.published?'Llega el 1 de diciembre':'Muy pronto'}</h1><p>{error||(!data?'Recuperando tus registros de 2026.':'Tu año sobre ruedas se está preparando.')}</p>{error&&<button onClick={()=>setReload(x=>x+1)}>Reintentar</button>}<Link to={closeTo}>Volver</Link></section></StoryOverlay>
 const [bg,fg,accent]=themes[slide.theme]||themes.dark
 return <StoryOverlay closeTo={closeTo} onStep={go}><section className="prw prw-story" style={{'--bg':bg,'--fg':fg,'--accent':accent}} onPointerDown={e=>{if(e.target.closest('button,a,input,label'))return;touch.current=e.clientX;}} onPointerUp={e=>{if(touch.current!==null){const dx=e.clientX-touch.current;if(Math.abs(dx)>45)go(dx<0?1:-1);touch.current=null}}} onPointerCancel={()=>{touch.current=null;}} onPointerLeave={()=>{touch.current=null;}}>
  <StoryAtmosphere/>
  <div className="prw-top"><img className="prw-logo" src="/logo.png" alt="Punta Rollers"/><div className="prw-top-label"><span>PR WRAPPED</span><strong>2026</strong></div><div className="prw-top-actions"><a className="prw-theme-link" href={WRAPPED_THEME_TRACK} target="_blank" rel="noopener noreferrer" aria-label="Escuchar Up & Down de Vengaboys en Spotify"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18V5l11-2v13M9 9l11-2"/><ellipse cx="6" cy="18" rx="3" ry="2.5"/><ellipse cx="17" cy="16" rx="3" ry="2.5"/></svg></a><Link to={closeTo} aria-label="Cerrar Wrapped" className="prw-close">✕</Link></div></div>
  <div className="prw-bars" aria-label={'Historia '+(index+1)+' de '+slides.length}>{slides.map((s,i)=><button key={s.id} aria-label={'Ir a historia '+(i+1)} aria-current={i===index?'step':undefined} onClick={()=>{setIndex(i);setBlob(null);generation.current++}}><i className={i<=index?'active':''}/></button>)}</div>
  {data.admin&&<details className="prw-admin-panel"><summary>Administración</summary><div className="prw-admin"><button onClick={()=>{setDemo(x=>!x);setIndex(0);setBlob(null);setPhoto(false);generation.current++}}>{isDemo?'Ver mi resumen':'Demo ficticia'}</button><button disabled={busy} onClick={publish}>{data.published?'Pausar lanzamiento':'Programar lanzamiento'}</button></div></details>}
  {isDemo&&<p className="prw-demo">VISTA PREVIA · DATOS FICTICIOS</p>}
  <div className={["prw-content",slide.humor?"prw-editorial":"",slide.id==="flexion"?"prw-flexion":"",slide.song?"prw-music-content":""].filter(Boolean).join(" ")} key={slide.id}>
   {slide.id==='intro'&&current.photo&&!isDemo&&<img className="prw-avatar" src={current.photo} alt="Tu foto de perfil" referrerPolicy="no-referrer" onError={e=>e.currentTarget.hidden=true}/>}
   <p className="prw-kicker">{slide.kicker}</p>
   {slide.song&&<MusicStory song={slide.song}/>}
   {slide.value!=null&&<div className="prw-number"><Count value={Number(slide.value)} decimals={slide.decimals} motion={motion}/><span>{slide.unit}</span></div>}
   {slide.big&&<h1>{slide.big}</h1>}<p className="prw-small">{slide.small}</p>
   {slide.id==="intro"&&<SpotifyLink url={WRAPPED_THEME_TRACK} className="prw-theme-cta">♪ Tema elegido para Wrapped: Up &amp; Down · Vengaboys ↗</SpotifyLink>}
   {slide.badges&&<BadgeCollection badges={slide.badges}/>}
   {slide.share&&<div className="prw-actions">{current.photo&&!isDemo&&<label><input type="checkbox" checked={photo} onChange={e=>{setPhoto(e.target.checked);setBlob(null);generation.current++}}/> Incluir mi foto en la placa</label>}<button disabled={busy} onClick={prepare}>{busy?'Generando…':'Generar mi placa PNG'}</button>{blob&&<><button onClick={download}>Descargar PNG</button><button onClick={share}>Compartir</button></>}</div>}
   {last&&<div className="prw-actions"><button onClick={()=>go(-index)}>Ver de nuevo</button></div>}
  </div>
  {last&&motion&&<div aria-hidden="true" className="prw-confetti">{Array.from({length:18},(_,i)=><i key={i} style={{left:(i*37%100)+'%',animationDelay:(i%7)*.25+'s',background:['#F5C451','#F3F1EC','#191A20','#3CFFB8'][i%4]}}/>)}</div>}
  <div className="prw-controls"><button disabled={index===0} onClick={()=>go(-1)}>‹ Anterior</button><span className="prw-step">{index+1} / {slides.length}</span>{last?<Link className="prw-finish" to={closeTo}>Finalizar ✓</Link>:<button className="prw-next" onClick={()=>go(1)}>Seguir ›</button>}</div>
  <p className="prw-cutoff">{isDemo?'Ejemplo ficticio':'Registros hasta '+localDate(data.asOf)}</p>{notice&&<p className="prw-notice" role="status">{notice}</p>}

 </section></StoryOverlay>
}
