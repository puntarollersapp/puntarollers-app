import ProfileAvatar from './ProfileAvatar'
import CommunityPhoto,{CommunityFullPhoto} from './community/CommunityPhoto'
import {FeedFormatBanner,AnimatedReactions,formatStyle,FORMATS} from './community/SocialVisual'
import {SocialVideo} from './community/SocialVideo'
import SocialCommentInput from './community/SocialCommentInput'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {SocialComposer,SocialTags} from './community/SocialComposer'
import {SocialPostTools,SocialReply,SocialPoll,useSocialPolls,useSocialStatus,useSocialSaved} from './community/PRSocial2'

function OfficialHeader({post}){return <div className="flex items-center gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-cyan-300/40 bg-[#0b202b] p-1.5"><img src="/logo.png" alt="" className="h-full w-full object-contain"/></div><div className="min-w-0"><div className="flex items-center gap-1.5 text-[#67E8F9]"><span className="text-[15px] font-black">Punta Rollers</span><svg role="img" aria-label="Cuenta oficial" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="m12 1 3 2.4 3.8.1 1.1 3.6 2.9 2.5-1.2 3.6.2 3.8-3.6 1.3-2.4 3-3.8-.9-3.8.9-2.4-3-3.6-1.3.2-3.8L1.2 9.6l2.9-2.5 1.1-3.6L9 3.4Z"/><path d="m7.6 12 3 3 5.8-6" fill="none" stroke="#09202b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></div><p className="text-[10px] text-white/45">Publicación oficial · {new Date(post.created_at).toLocaleString('es-UY')}</p></div></div>}
function OfficialRecognition({official}){const people=official.participants||[];return <div className="mt-4 rounded-2xl border border-cyan-300/20 bg-gradient-to-br from-[#142631] to-[#10151d] p-3.5"><div className="flex items-center gap-3">{official.badge_image&&<img src={official.badge_image} alt="Insignia de la rodada solidaria" className="h-[70px] w-[70px] shrink-0 object-contain"/>}<div className="min-w-0"><p className="text-[9px] font-black tracking-[.18em] text-cyan-200">RECONOCIMIENTO PR</p><p className="mt-1 text-sm font-black text-white">{official.badge_title}</p><p className="mt-1 text-xs text-white/60">{official.count} integrantes reconocidos</p></div></div>{people.length>0&&<div className="mt-3 flex flex-wrap gap-1.5" aria-label="Participantes reconocidos">{people.map(p=>{const name=[p.nombre,p.apellido].filter(Boolean).join(' ');return <Link key={p.id} to={'/app/comunidad/perfil/'+p.id} aria-label={name} title={name} className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full border border-cyan-300/35 bg-[#18313c] text-[10px] font-black text-cyan-100">{p.foto?<img src={p.foto} alt={name} loading="lazy" className="h-full w-full object-cover" onError={e=>{e.currentTarget.style.display='none';e.currentTarget.parentElement.dataset.fallback='true'}}/>:name.split(' ').map(x=>x[0]).slice(0,2).join('')}</Link>})}</div>}{people.length<official.count&&<p className="mt-2 text-[10px] text-white/45">Se muestran los perfiles según sus permisos de privacidad.</p>}</div>}

const OPTIONS = [['heart','❤️'],['fire','🔥'],['skate','🛼'],['clap','👏']]

function ConversometroBanner(){
  return <Link to="/app/conversometro" className="rf-cm-banner" aria-label="Abrir el Conversómetro PR">
    <div className="rf-cm-art" aria-hidden="true">
      <span className="rf-cm-bubble rf-cm-bubble-a">💬</span>
      <span className="rf-cm-bubble rf-cm-bubble-b">…</span>
      <span className="rf-cm-bubble rf-cm-bubble-c">JA!</span>
      <div className="rf-cm-meter"><i/><i/><i/><i/><i/></div>
    </div>
    <div className="rf-cm-copy">
      <p className="rf-cm-kicker">PR · EL LABORATORIO DEL BLA BLA BLA</p>
      <h3>Conversómetro<span>.</span></h3>
      <p className="rf-cm-desc">¿Quién patina más… y quién habla más? 😂</p>
      <span className="rf-cm-cta">Ver el ranking de conversadores <span aria-hidden="true">→</span></span>
    </div>
  </Link>
}
export default function RollerFeedCommunity({ initialPosts = [], albums = [], showConversometro = false }) {
  const location=useLocation()
  const targetId=useRef(new URLSearchParams(location.search).get('socialPost'))
  const [targetUnavailable,setTargetUnavailable]=useState(false)
  const socialStatus=useSocialStatus(),saved=useSocialSaved(socialStatus),polls=useSocialPolls(socialStatus)
  const [onlySaved,setOnlySaved]=useState(false)
  const [formatFilter,setFormatFilter]=useState('all')
  const [posts,setPosts] = useState(initialPosts)
  const [loaded,setLoaded]=useState(initialPosts.length>0)
  const [drafts,setDrafts] = useState({})
  const [busy,setBusy] = useState('')
  const [error,setError] = useState('')
  const [expanded,setExpanded] = useState(null)
  const [openAlbums,setOpenAlbums] = useState([])
  const [viewer,setViewer] = useState(null)
  const [visibleCount,setVisibleCount] = useState(()=>new URLSearchParams(window.location.search).has('socialPost')?100:12)
  const refreshAgain = useRef(false)
  const refreshing = useRef(null)
  function refresh() {
    if(refreshing.current){refreshAgain.current=true;return refreshing.current}
    const task=async()=>{
      do {
        refreshAgain.current=false
        try{
          const {data,error:loadError}=await supabase.rpc('community_social_feed')
          if(loadError)setError(previous=>previous||'No se pudieron actualizar las publicaciones. Intentá de nuevo.')
          else{const next=Array.isArray(data)?data:[];const id=targetId.current;if(id&&!next.some(p=>p.id===id)){const {data:target,error:targetError}=await supabase.rpc('community_social_post',{p_post_id:id});if(targetError)throw targetError;if(targetId.current===id){if(Array.isArray(target)&&target.length)next.push(target[0]);setTargetUnavailable(!target?.length)}}else setTargetUnavailable(false);setPosts(previous=>JSON.stringify(previous)===JSON.stringify(next)?previous:next);setError('')}
        }catch{setError('No se pudieron actualizar las publicaciones. Intentá de nuevo.')}
        setLoaded(true)
      }while(refreshAgain.current)
    }
    refreshing.current=task().finally(()=>{refreshing.current=null})
    return refreshing.current
  }
  useEffect(()=>{refresh();const timer=setInterval(()=>{if(document.visibilityState==='visible')refresh()},60000);const onFocus=()=>refresh();const onVisibility=()=>{if(document.visibilityState==='visible')refresh()};window.addEventListener('focus',onFocus);window.addEventListener('pr-social-published',onFocus);document.addEventListener('visibilitychange',onVisibility);return()=>{clearInterval(timer);window.removeEventListener('focus',onFocus);window.removeEventListener('pr-social-published',onFocus);document.removeEventListener('visibilitychange',onVisibility)}},[])
  useEffect(()=>{if(socialStatus?.enabled)refresh()},[socialStatus?.enabled,socialStatus?.preview])
  async function react(post,key) {
    if(busy)throw Error('Ya hay una reacción en proceso.')
    setBusy(post.id);setError('')
    try{
      const {error:actionError}=socialStatus?.enabled&&!socialStatus.preview?await supabase.rpc("pr_social_react",{p_post:post.id,p_reaction:key}):await supabase.rpc("community_toggle_reaction",{p_post_id:post.id,p_reaction:key})
      if(actionError)throw actionError
      await refresh()
    }catch(e){setError('No se pudo guardar tu reacción: '+(e.message||'Revisá tu conexión.'));throw e}
    finally{setBusy('')}
  }
  async function comment(post) {
    const body=(drafts[post.id]||'').trim()
    if(!body||busy)return
    setBusy(post.id);setError('')
    const {error:actionError}=await supabase.rpc('community_add_comment',{p_post_id:post.id,p_body:body})
    if(actionError)setError('No se pudo publicar tu comentario: '+actionError.message)
    else {setDrafts(old=>({...old,[post.id]:''}));await refresh()}
    setBusy('')
  }
  const [scrollPost,setScrollPost]=useState(()=>new URLSearchParams(window.location.search).get('socialPost'))
  useEffect(()=>{const open=e=>{targetId.current=e.detail;setOnlySaved(false);setFormatFilter('all');setVisibleCount(100);setScrollPost(e.detail);refresh()};window.addEventListener('pr-social2-scroll-post',open);return()=>window.removeEventListener('pr-social2-scroll-post',open)},[])
  useEffect(()=>{const id=new URLSearchParams(location.search).get('socialPost');if(id){targetId.current=id;setOnlySaved(false);setFormatFilter('all');setVisibleCount(100);setScrollPost(id);refresh()}},[location.search])
  useEffect(()=>{if(!scrollPost)return;const el=document.getElementById('social-post-'+scrollPost);if(el){el.scrollIntoView({block:'center',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});setScrollPost(null);const url=new URL(window.location.href);if(url.searchParams.has('socialPost')){url.searchParams.delete('socialPost');window.history.replaceState(window.history.state,'',url.pathname+url.search+url.hash)}}},[scrollPost,visibleCount,posts,onlySaved,formatFilter])
  const allEntries=[...posts.filter(p=>p?.id&&(!onlySaved||!socialStatus?.enabled||saved.includes(p.id))).map(p=>({kind:'post',created_at:p.created_at,item:p})),...albums.filter(a=>a?.id&&(!onlySaved||!socialStatus?.enabled)).map(a=>({kind:'album',created_at:a.created_at,item:a}))].sort((a,b)=>Date.parse(b.created_at||0)-Date.parse(a.created_at||0))
  const latest=allEntries.filter(e=>!socialStatus?.enabled||formatFilter==='all'||(e.kind==='album'?'album':e.item.social_kind||'post')===formatFilter)
  function selectFilter(key){setFormatFilter(key);setVisibleCount(12)}
  return <section id="rollerfeed-comunidad" className="scroll-mt-36 space-y-3">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-[#FF6694]">ROLLERFEED · PR SOCIAL</p><h2 className="mt-1 font-display text-[30px] text-white">Publicaciones<span className="text-[#FF0055]">.</span></h2><p className="mt-1 text-xs text-white/45">{socialStatus?.enabled?"Lo último de tu gente.":"Compartí, reaccioná y comentá sin salir del feed."}</p></div>{socialStatus?.enabled&&<button type="button" aria-label="Actualizar publicaciones" title="Actualizar publicaciones" onClick={()=>refresh()} className="self-end rounded-full border border-white/10 bg-white/5 p-2.5 text-white/70"><svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 11a8 8 0 0 0-14-5L3 9m0-5v5h5M4 13a8 8 0 0 0 14 5l3-3m0 5v-5h-5"/></svg></button>}</div>
    {!socialStatus?.enabled&&<SocialComposer compact onPublished={refresh}/>}{socialStatus?.enabled&&<div className="flex gap-2"><button type="button" onClick={()=>setOnlySaved(false)} className={'rounded-xl px-3 py-2 text-xs font-bold '+(!onlySaved?'bg-rose-500 text-white':'bg-white/5 text-white/65')}>Todas</button><button type="button" onClick={()=>setOnlySaved(true)} className={'rounded-xl px-3 py-2 text-xs font-bold '+(onlySaved?'bg-rose-500 text-white':'bg-white/5 text-white/65')}>Guardadas · {saved.length}</button></div>}
    {socialStatus?.enabled&&<div className="flex gap-2 overflow-x-auto pb-2" aria-label="Filtrar publicaciones">{['all','post','daily','class','poll','video','album'].map(key=><button key={key} type="button" aria-pressed={formatFilter===key} onClick={()=>selectFilter(key)} style={{color:formatFilter===key?(FORMATS[key]?.color||'#ff719e'):undefined}} className={'shrink-0 rounded-full border px-3 py-2 text-xs font-bold '+(formatFilter===key?'border-current bg-white/10':'border-white/10 text-white/65')}>{key==='all'?'Todo':FORMATS[key].icon+' '+FORMATS[key].label}</button>)}</div>}
    {targetUnavailable&&<p role="status" className="rounded-xl border border-white/15 p-3 text-xs text-white/65">Esta publicación ya no está disponible o no tenés permiso para verla.</p>}
    {error&&<div role="alert" className="flex items-center justify-between gap-2 rounded-xl border border-red-400/30 p-3 text-xs text-red-200"><span>{error}</span><button type="button" onClick={()=>refresh()} className="shrink-0 rounded-lg border border-red-300/25 px-2 py-2 font-bold">Reintentar</button></div>}
    {!loaded&&!latest.length&&!error&&<div role="status" aria-label="Cargando publicaciones" className="rounded-[20px] border border-white/10 bg-white/[.03] p-4"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-full bg-white/10 motion-safe:animate-pulse"/><div className="flex-1 space-y-2"><div className="h-3 w-28 rounded bg-white/10 motion-safe:animate-pulse"/><div className="h-2 w-16 rounded bg-white/5"/></div></div><div className="mt-4 aspect-[16/7] rounded-xl bg-white/5 motion-safe:animate-pulse"/></div>}
    {loaded&&!latest.length&&!error&&<p className="rounded-2xl border border-white/10 p-5 text-center text-xs text-white/50">{onlySaved?'Todavía no tenés publicaciones guardadas de este formato.':formatFilter!=='all'?'Todavía no hay publicaciones de este formato.':'Todavía no hay publicaciones para mostrar.'}{socialStatus?.enabled&&formatFilter!=='all'&&<button type="button" className="mx-auto mt-3 block text-rose-200 font-bold" onClick={()=>selectFilter('all')}>Ver todos los formatos</button>}</p>}
    {latest.slice(0,visibleCount).map(entry=>{
      if(entry.kind==='album') { const album=entry.item; const photos=album.photos||[]; const opened=openAlbums.includes(album.id); return <article key={'album-'+album.id} className="overflow-hidden rounded-[26px] border border-orange-400/30 bg-[#161017] shadow-lg"><div className="p-4"><p className="text-[10px] font-black uppercase tracking-widest text-orange-300">🛼 Álbum · {album.owner_name||'Punta Rollers'}</p><h3 className="mt-1 text-lg font-black text-white">{album.title}</h3><p className="mt-1 text-xs text-white/60">{photos.length} fotos · {album.created_at?new Date(album.created_at).toLocaleString('es-UY'):''}</p></div><div className="grid grid-cols-3 gap-1">{(opened?photos:photos.slice(0,3)).map((photo,index)=><button key={photo.id} type="button" onClick={()=>setViewer({album,index})} className="aspect-square overflow-hidden bg-black/30"><CommunityPhoto src={photo.url}/></button>)}</div>{photos.length>3&&<button type="button" onClick={()=>setOpenAlbums(ids=>opened?ids.filter(id=>id!==album.id):[...ids,album.id])} className="w-full border-t border-white/10 px-4 py-3 text-center text-sm font-bold text-orange-200">{opened?'Mostrar menos fotos ↑':'Ver las '+photos.length+' fotos acá ↓'}</button>}</article> }
      const post=entry.item;
      const name=[post.author?.nombre,post.author?.apellido].filter(Boolean).join(' ')||'Integrante PR'
      const reactions=Array.isArray(post.reactions)?post.reactions:[]
      const comments=Array.isArray(post.comments)?post.comments:[]
      const media=Array.isArray(post.media)?post.media:[]
      return <article key={post.id} id={"social-post-"+post.id} style={!post.official&&socialStatus?.enabled?formatStyle(post.social_kind):undefined} className={post.official?"relative isolate overflow-hidden rounded-[26px] border border-cyan-300/35 bg-gradient-to-br from-[#10242d] via-[#111921] to-[#0d0d13] shadow-[0_0_24px_rgba(34,211,238,.10)]":"relative isolate overflow-hidden rounded-[26px] border border-[#FF0055]/35 bg-[linear-gradient(140deg,#1c0b16,#0d0d13_60%)] shadow-[0_0_25px_rgba(255,0,85,.10)] "+(socialStatus?.enabled?"pr-social-card":"")}>
        {post.official?<div className="flex items-center justify-between border-b border-cyan-300/15 bg-cyan-300/[.07] px-4 py-2 text-[10px] font-black tracking-[.19em] text-cyan-200"><span>PR · COMUNICADO OFICIAL</span><span>✦</span></div>:socialStatus?.enabled?<FeedFormatBanner post={post}/>:<div className="h-[2px] bg-gradient-to-r from-[#FF0055] via-[#FF7AAB] to-transparent"/>}
        <div className="p-4">{post.official?<OfficialHeader post={post}/>:<Link to={(post.author?.id||post.author_id)?'/app/comunidad/perfil/'+(post.author?.id||post.author_id):'/app/comunidad'} className="flex items-center gap-3"><ProfileAvatar profile={{...post.author,id:post.author?.id||post.author_id}} className="h-10 w-10" badge={false}/><div><p className="text-sm font-black text-white">{name}</p><p className="text-[10px] text-white/40">{post.created_at?new Date(post.created_at).toLocaleString('es-UY'):''}</p></div></Link>}
        {post.body&&<p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-white/80">{post.body}</p>}{post.official&&<OfficialRecognition official={post.official}/>}<SocialTags post={post} onChange={refresh}/><SocialPoll poll={polls.find(p=>p.post_id===post.id)} status={socialStatus}/><SocialPostTools post={post} status={socialStatus} saved={saved.includes(post.id)} onChange={refresh}/></div>
        {socialStatus?.enabled&&post.video_path&&<SocialVideo path={post.video_path}/>}
        {media.length>0&&<div className={media.length===1?'grid grid-cols-1 gap-1 bg-black/25':'grid grid-cols-2 gap-1 bg-black/25'}>{media.slice(0,4).map((photo,index)=><button key={photo.id||photo.url} type="button" onClick={()=>setViewer({album:{title:'Fotos de '+name,photos:media},index})} className="relative block aspect-[4/3] min-h-0 overflow-hidden bg-black/30"><CommunityPhoto src={photo.url}/>{index===3&&media.length>4&&<span className="absolute inset-0 grid place-items-center bg-black/65 text-3xl font-black text-white">+{media.length-4}</span>}</button>)}</div>}
        <div className="space-y-3 p-4">{socialStatus?.enabled&&!(post.official&&socialStatus.preview)?<AnimatedReactions post={post} preview={socialStatus.preview} disabled={Boolean(busy)} onReact={key=>react(post,key)}/>: <div className="flex flex-wrap gap-2">{OPTIONS.map(([key,emoji])=><button key={key} type="button" disabled={Boolean(busy)} onClick={()=>react(post,key).catch(()=>{})} aria-pressed={post.my_reaction===key} className={"rounded-full border px-3 py-2 text-xs text-white disabled:opacity-40 "+(post.my_reaction===key?"border-[#FF6694] bg-[#FF0055]/30":"border-[#FF0055]/25 bg-[#FF0055]/[.06]")}>{emoji} {reactions.filter(r=>r.reaction===key).length||0}</button>)}</div>}
        {comments.length>0&&<div className="space-y-2">{(expanded===post.id?comments:comments.slice(-2)).map(c=><div key={c.id} className={"rounded-xl bg-white/[.035] px-3 py-2 text-[11px] text-white/65 "+(c.parent_comment_id?"ml-5 border-l border-rose-300/20":"")}><strong className="text-white/85">{c.nombre||c.name||c.author_name||'Alumno'}: </strong>{c.body}<SocialReply post={post} comment={c} status={post.official&&socialStatus?.preview?null:socialStatus} onChange={refresh}/></div>)}{comments.length>2&&<button onClick={()=>setExpanded(expanded===post.id?null:post.id)} className="text-[10px] font-bold text-[#FF91B2]">{expanded===post.id?'Mostrar menos':'Ver todos los '+comments.length+' comentarios'}</button>}</div>}
        {socialStatus?.enabled&&!(post.official&&socialStatus.preview)?<SocialCommentInput post={post} status={socialStatus} onChange={refresh} disabled={Boolean(busy)}/>:<form onSubmit={e=>{e.preventDefault();comment(post)}} className="flex gap-2"><input aria-label="Escribí un comentario" maxLength={1000} value={drafts[post.id]||''} onChange={e=>setDrafts(old=>({...old,[post.id]:e.target.value}))} placeholder="Comentá esta publicación…" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-xs text-white outline-none"/><button disabled={Boolean(busy)||!(drafts[post.id]||'').trim()} className="rounded-xl bg-[#FF0055] px-4 text-sm font-bold text-white disabled:opacity-40" aria-label="Publicar comentario">↑</button></form>}</div>
      </article>
    }).flatMap((card,index)=>showConversometro&&!onlySaved&&formatFilter==='all'&&index===Math.min(2,latest.length,visibleCount)-1?[card,<ConversometroBanner key="rf-conversometro"/>]:[card])}
    {showConversometro&&!onlySaved&&formatFilter==='all'&&latest.length===0&&<ConversometroBanner/>}
    {latest.length>visibleCount&&<button type="button" onClick={()=>setVisibleCount(n=>n+12)} className="w-full rounded-xl border border-rose-300/30 p-3 text-sm font-bold text-rose-200">Ver más publicaciones ↓</button>}
    {viewer&&<div className="fixed inset-0 z-[250] flex flex-col bg-black/95" role="dialog" aria-modal="true" aria-label="Galería de fotos"><div className="flex items-center justify-between gap-3 px-4 py-4 text-white"><div><p className="text-sm font-bold">{viewer.album.title}</p><p className="text-xs text-white/60">{viewer.index+1} de {viewer.album.photos.length}</p></div><button type="button" onClick={()=>setViewer(null)} className="rounded-full bg-white/15 px-4 py-2 text-sm font-bold">Cerrar ✕</button></div><div className="flex min-h-0 flex-1 items-center justify-between gap-1 px-2"><button type="button" disabled={viewer.index===0} onClick={()=>setViewer(v=>({...v,index:v.index-1}))} className="rounded-full bg-white/15 px-3 py-3 text-xl text-white disabled:opacity-20">‹</button><div className="min-w-0 flex-1"><CommunityFullPhoto src={viewer.album.photos[viewer.index]?.url}/></div><button type="button" disabled={viewer.index===viewer.album.photos.length-1} onClick={()=>setViewer(v=>({...v,index:v.index+1}))} className="rounded-full bg-white/15 px-3 py-3 text-xl text-white disabled:opacity-20">›</button></div></div>}
  </section>
}
