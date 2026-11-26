import { useEffect,useState,useRef } from 'react'
import {supabase} from '../../lib/supabase'
import {useAuth} from '../../lib/auth'

export function thumbnailUrl(original) {
  try {
    const url = new URL(original)
    const prefix = '/storage/v1/object/public/'
    if (url.hostname !== 'ycgxnzeaihuwlwfwalom.supabase.co' || !url.pathname.startsWith(prefix)) return original
    const path = url.pathname.slice(prefix.length)
    if (!/^community-media\//.test(path)) return original
    return `/api/community-thumbnail?path=${encodeURIComponent(path)}&v=1`
  } catch { return original }
}

function privatePath(src){try{const u=new URL(src),prefix='/storage/v1/object/public/';if(u.hostname!=='ycgxnzeaihuwlwfwalom.supabase.co'||!u.pathname.startsWith(prefix))return null;const full=u.pathname.slice(prefix.length),i=full.indexOf('/'),bucket=full.slice(0,i);if(!['community-albums','community-media'].includes(bucket))return null;return {bucket,path:decodeURIComponent(full.slice(i+1))}}catch{return null}}
const pending=new Map()
function usePrivateUrl(src,near){
 const {user}=useAuth(),uid=user?.id,loc=privatePath(src),bucket=loc?.bucket,path=loc?.path,[result,setResult]=useState(null),[retry,setRetry]=useState(0);
 const key=uid+':'+bucket+':'+path,latest=useRef(null);latest.current=result;
 useEffect(()=>{
   if(!uid||!bucket||!path||!near)return;
   let alive=true,sequence=0;
   async function load(force=false){
     if(document.visibilityState==='hidden')return;
     const previous=latest.current;
     if(!force&&previous?.key===key&&previous.url&&previous.expiresAt>Date.now()+60000)return;
     const seq=++sequence;
     let task=pending.get(key);
     if(!task){task=Promise.resolve(supabase.storage.from(bucket).createSignedUrl(path,300)).finally(()=>{if(pending.get(key)===task)pending.delete(key)});pending.set(key,task)}
     try{const{data,error}=await task;if(alive&&seq===sequence)setResult({key,url:error?null:data?.signedUrl,failed:Boolean(error||!data?.signedUrl),expiresAt:Date.now()+285000})}catch{if(alive&&seq===sequence)setResult({key,url:null,failed:true,expiresAt:0})}
   }
   load(retry>0);
   const timer=setInterval(()=>load(),30000),focus=()=>load(true),visible=()=>{if(document.visibilityState==='visible')load(true)};
   window.addEventListener('focus',focus);document.addEventListener('visibilitychange',visible);
   return()=>{alive=false;clearInterval(timer);window.removeEventListener('focus',focus);document.removeEventListener('visibilitychange',visible)}
 },[uid,bucket,path,near,retry]);
 const current=uid&&result?.key===key?result:null;
 return {url:loc?current?.url:src,failed:loc?current?.failed:false,retry:()=>setRetry(n=>n+1)}
}
function PrivateImage({src,eager=false,full=false}){
 const host=useRef(null),[near,setNear]=useState(eager||full),[loadError,setLoadError]=useState(false);
 useEffect(()=>{
   if(eager||full||typeof IntersectionObserver==='undefined'){setNear(true);return}
   const node=host.current;if(!node)return;
   const observer=new IntersectionObserver(([entry])=>setNear(Boolean(entry?.isIntersecting)),{rootMargin:'320px 0px'});
   observer.observe(node);return()=>observer.disconnect()
 },[eager,full]);
 const {url,failed,retry}=usePrivateUrl(src,near);
 useEffect(()=>setLoadError(false),[url]);
 function reload(e){e.stopPropagation();setLoadError(false);setNear(true);retry()}
 return <div ref={host} className={full?'relative w-full':'relative h-full w-full'}>{url&&!loadError?<img src={url} alt="Foto compartida" loading={eager||full?'eager':'lazy'} decoding="async" onError={()=>setLoadError(true)} className={full?'max-h-[68vh] w-full object-contain':'h-full w-full object-cover'}/>:<div className="grid min-h-20 h-full w-full place-items-center bg-violet-400/10 p-2 text-center text-[10px] text-violet-200/70">{failed||loadError?<span role="button" tabIndex={0} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();reload(e)}}} onClick={reload}>Foto no disponible · Reintentar</span>:'Cargando foto…'}</div>}</div>
}
export default function CommunityPhoto({src,eager=false}){return privatePath(src)?<PrivateImage key={src} src={src} eager={eager}/>:<LegacyCommunityPhoto key={src} src={src} eager={eager}/>}
function LegacyCommunityPhoto({ src, eager = false }) {
  const [fallback, setFallback] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  return <div className="relative h-full w-full bg-violet-400/10">
    {!loaded && <span role="status" className="absolute inset-0 grid place-items-center text-[10px] text-violet-200/70">{failed ? 'No se pudo cargar la foto' : 'Cargando foto…'}</span>}
    <img src={fallback ? src : thumbnailUrl(src)} alt="Foto del álbum" loading={eager ? 'eager' : 'lazy'} decoding="async"
      className={`h-full w-full object-cover transition-opacity ${loaded ? 'opacity-100' : 'opacity-0'}`}
      onLoad={() => setLoaded(true)} onError={() => { if (!fallback) setFallback(true); else setFailed(true) }} />
  </div>
}

export function CommunityFullPhoto({src}){return privatePath(src)?<PrivateImage key={src} src={src} full/>:<LegacyCommunityFullPhoto key={src} src={src}/>}
function LegacyCommunityFullPhoto({ src }) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  return <div className="relative overflow-hidden rounded-[24px] bg-violet-400/10">
    <img src={thumbnailUrl(src)} alt="Foto del álbum" className="max-h-[68vh] w-full object-contain" />
    <img src={src} alt="Foto original del álbum" onLoad={() => setLoaded(true)} onError={() => setFailed(true)}
      className={`absolute inset-0 h-full w-full object-contain ${loaded ? 'opacity-100' : 'opacity-0'}`} />
    {!loaded && <span role="status" className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-[10px] text-white/80">{failed ? 'Vista previa · no se pudo cargar el original' : 'Cargando calidad original…'}</span>}
  </div>
}
