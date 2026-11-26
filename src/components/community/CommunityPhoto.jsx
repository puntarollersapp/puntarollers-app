import { useEffect,useState } from 'react'
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
function usePrivateUrl(src){const{user}=useAuth(),uid=user?.id,loc=privatePath(src),bucket=loc?.bucket,path=loc?.path,[result,setResult]=useState(null),[retry,setRetry]=useState(0);const key=uid+':'+bucket+':'+path;useEffect(()=>{if(!uid||!bucket||!path)return;let alive=true;async function load(){let task=pending.get(key);if(!task){task=Promise.resolve(supabase.storage.from(bucket).createSignedUrl(path,300)).finally(()=>{if(pending.get(key)===task)pending.delete(key)});pending.set(key,task)}try{const{data,error}=await task;if(alive)setResult({key,url:error?null:data?.signedUrl,failed:Boolean(error||!data?.signedUrl)})}catch{if(alive)setResult({key,url:null,failed:true})}}load();const timer=setInterval(()=>{if(document.visibilityState==='visible')load()},240000);window.addEventListener('focus',load);return()=>{alive=false;clearInterval(timer);window.removeEventListener('focus',load)}},[uid,bucket,path,retry]);const current=result?.key===key?result:null;return{url:loc?current?.url:src,failed:loc?current?.failed:false,retry:()=>setRetry(n=>n+1)}}
function PrivateImage({src,eager=false,full=false}){const{url,failed,retry}=usePrivateUrl(src),[loadError,setLoadError]=useState(false);useEffect(()=>setLoadError(false),[url]);return url&&!loadError?<img src={url} alt="Foto compartida" loading={eager||full?'eager':'lazy'} decoding="async" onError={()=>setLoadError(true)} className={full?'max-h-[68vh] w-full object-contain':'h-full w-full object-cover'}/>:<div className="grid min-h-20 h-full w-full place-items-center bg-violet-400/10 p-2 text-center text-[10px] text-violet-200/70">{failed||loadError?<span role="button" tabIndex={0} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();setLoadError(false);retry()}}} onClick={e=>{e.stopPropagation();setLoadError(false);retry()}}>Foto no disponible · Reintentar</span>:'Cargando foto…'}</div>}
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
