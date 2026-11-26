import {useEffect,useState} from 'react'
import {Link,useLocation} from 'react-router-dom'
import {useAuth} from '../lib/auth'
import {supabase} from '../lib/supabase'
import {isSantaAudience} from '../lib/prDecemberNavigation'
import useWrappedAccess from '../lib/useWrappedAccess'
const start=Date.parse('2026-12-01T00:00:00-03:00'),end=Date.parse('2027-01-01T00:00:00-03:00'),gap=6*60*60*1000
const visited=new Set()
// A real logout starts a new visit; route changes do not.
supabase.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT')visited.clear()})
const get=k=>{try{return Number(localStorage.getItem(k)||0)}catch{return 0}}
const put=(k,v)=>{try{localStorage.setItem(k,String(v))}catch{}}
export default function SeasonCampaignNotice(){
 const {user}=useAuth(),uid=user?.id,{pathname}=useLocation(),wrapped=useWrappedAccess(uid),[notice,setNotice]=useState(null)
 useEffect(()=>{setNotice(null)},[uid])
 useEffect(()=>{
  if(!uid||!pathname.startsWith('/app/')||['/app/voice','/app/secret-santa','/app/wrapped'].includes(pathname))return
  let live=true,running=false
  async function check(){
   if(!live||running||document.visibilityState==='hidden'||document.querySelector('[role="dialog"][aria-modal="true"]'))return
   const now=Date.now(),season=now<start?'november':now<end?'december':null
   if(!season||visited.has(uid+':'+season))return
   running=true
   try{
    let next=null
    if(season==='november'){
     const{data,error}=await supabase.rpc('pr_november_reminder_status')
     if(!error&&data&&(data.feedback_pending||data.nomination_open))next={kind:'november',...data}
    }else{
     const key='pr-december-notice-v2:'+uid+':',last=get(key+'last')
     if(now-last<gap)return
     if(isSantaAudience(user)){
      const{data,error}=await supabase.rpc('pr_santa_state')
      if(error)return
      if(data?.event?.visible&&data.event.status==='drawn'&&data.mine?.participating===true&&!data.mine.revealed&&!get(key+'reveal'))next={kind:'reveal'}
      else if(data?.event?.visible&&data.event.status==='open'&&data.mine?.participating==null&&!get(key+'invite'))next={kind:'invite'}
     }
     if(!next&&wrapped?.open&&!get(key+'wrapped'))next={kind:'wrapped'}
     if(next){if(!live||document.querySelector('[role="dialog"][aria-modal="true"]'))return;put(key+'last',Date.now());put(key+next.kind,Date.now())}
    }
    if(next&&live&&!document.querySelector('[role="dialog"][aria-modal="true"]')){visited.add(uid+':'+season);setNotice({...next,uid})}
   }catch{/* Retry on a later visible check. */}finally{running=false}
  }
  const first=setTimeout(check,1800),timer=setInterval(check,30000)
  return()=>{live=false;clearTimeout(first);clearInterval(timer)}
 },[uid,pathname,wrapped?.open])
 if(!notice||notice.uid!==uid)return null
 const close=()=>setNotice(null),kind=notice.kind,isNov=kind==='november',isWrapped=kind==='wrapped'
 return <div role="dialog" aria-modal="true" aria-label={isNov?'Novedades Punta Rollers':isWrapped?'PR Wrapped 2026':'PR Secret Santa'} className="fixed inset-0 z-[150] grid place-items-center bg-black/85 p-4"><section className={'max-h-[85vh] w-full max-w-sm space-y-4 overflow-y-auto rounded-[30px] border p-6 text-center text-white shadow-2xl '+(isNov?'border-violet-400/40 bg-[#191A20]':isWrapped?'border-fuchsia-300/35 bg-gradient-to-br from-[#291249] to-[#171326]':'border-amber-200/30 bg-gradient-to-br from-[#153b2b] to-[#2c141a]')}>
 {isNov?<><p className="text-xs font-black tracking-widest text-violet-300">NOVEDADES · PUNTA ROLLERS</p>{notice.feedback_pending&&<><h2 className="text-2xl font-black">¡Tu opinión nos importa!</h2><p className="text-sm text-white/75">Completá Feedback y contanos cómo podemos mejorar tu experiencia.</p><Link to="/app/voice" onClick={close} className="block rounded-xl bg-violet-600 p-3 font-bold">Dar mi opinión</Link></>}{notice.nomination_open&&<><h3 className="text-xl font-black text-amber-300">🏆 ¡Últimos días para nominar!</h3><p className="text-sm text-white/75">Elegí a tus candidatos de PR Awards antes del 1 de diciembre.</p><Link to="/pr-awards" onClick={close} className="block rounded-xl bg-amber-300 p-3 font-black text-black">Participar en PR Awards</Link></>}</>:<><div className="text-6xl" aria-hidden="true">{isWrapped?'✨':kind==='reveal'?'🎁':'💌'}</div><p className="text-xs font-black tracking-widest text-amber-200">{isWrapped?'PR WRAPPED 2026':'PR SECRET SANTA · NAVIDAD 2026'}</p><h2 className="text-3xl font-black">{isWrapped?'Tu año sobre ruedas.':kind==='reveal'?'¡Descubrí a tu amigo invisible!':'Escribile tu carta a Santa'}</h2><p className="text-sm leading-relaxed text-white/80">{isWrapped?'Descubrí tus logros, tus momentos y todo lo que viviste en Punta Rollers durante 2026.':kind==='reveal'?'Ya podés ver a quién te toca regalarle y leer su carta.':'Sumate al amigo invisible. Contá tus gustos en una carta para que la persona que te regale sepa qué elegir.'}</p><Link to={isWrapped?'/app/wrapped':'/app/secret-santa'} onClick={close} className={'block rounded-xl p-4 font-black '+(isWrapped?'bg-fuchsia-600':'bg-[#b72b3c]')}>{isWrapped?'Ver mi Wrapped':kind==='reveal'?'Abrir mi regalo':'Escribir mi carta'}</Link></>}
 <button type="button" onClick={close} className="w-full p-2 text-sm text-white/70">Ahora no</button></section></div>
}
