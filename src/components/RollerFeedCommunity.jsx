import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import CommunityPhoto from './community/CommunityPhoto'

const OPTIONS = [['heart','❤️'],['fire','🔥'],['skate','🛼'],['clap','👏']]

export default function RollerFeedCommunity({ initialPosts = [], albums = [] }) {
  const [posts,setPosts] = useState(initialPosts)
  const [drafts,setDrafts] = useState({})
  const [busy,setBusy] = useState('')
  const [error,setError] = useState('')
  const [expanded,setExpanded] = useState(null)
  const [openAlbums,setOpenAlbums] = useState([])
  const [viewer,setViewer] = useState(null)
  async function refresh() {
    const {data,error:loadError} = await supabase.rpc('community_social_feed')
    if (loadError) setError('No se pudieron actualizar las publicaciones. Intentá de nuevo.')
    else { setPosts(Array.isArray(data)?data:[]); setError('') }
  }
  useEffect(()=>{refresh();const timer=setInterval(()=>{if(document.visibilityState==='visible')refresh()},15000);const onFocus=()=>refresh();const onVisibility=()=>{if(document.visibilityState==='visible')refresh()};window.addEventListener('focus',onFocus);document.addEventListener('visibilitychange',onVisibility);return()=>{clearInterval(timer);window.removeEventListener('focus',onFocus);document.removeEventListener('visibilitychange',onVisibility)}},[])
  async function react(post,key) {
    if(busy)return
    setBusy(post.id);setError('')
    const {error:actionError}=await supabase.rpc('community_toggle_reaction',{p_post_id:post.id,p_reaction:key})
    if(actionError)setError('No se pudo guardar tu reacción: '+actionError.message)
    else await refresh()
    setBusy('')
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
  const latest=[...posts.filter(p=>p?.id).map(p=>({kind:'post',created_at:p.created_at,item:p})),...albums.filter(a=>a?.id).map(a=>({kind:'album',created_at:a.created_at,item:a}))].sort((a,b)=>Date.parse(b.created_at||0)-Date.parse(a.created_at||0)).slice(0,12)
  return <section id="rollerfeed-comunidad" className="scroll-mt-36 space-y-3">
    <div className="flex items-end justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-[#FF6694]">PR Social · publicaciones y álbumes</p><h2 className="mt-1 font-display text-[30px] text-white">Actividad de la comunidad<span className="text-[#FF0055]">.</span></h2><p className="mt-1 text-xs text-white/45">Lo último que compartimos en Punta Rollers, ordenado por fecha.</p></div><Link to="/app/comunidad" className="shrink-0 rounded-xl border border-[#FF0055]/30 px-3 py-2 text-[10px] font-bold text-[#FF91B2]">Ver comunidad →</Link></div>
    {error&&<p role="alert" className="rounded-xl border border-red-400/30 p-3 text-xs text-red-200">{error}</p>}
    {!latest.length&&!error&&<p className="rounded-2xl border border-white/10 p-5 text-center text-xs text-white/50">Todavía no hay publicaciones para mostrar.</p>}
    {latest.map(entry=>{
      if(entry.kind==='album') { const album=entry.item; const photos=album.photos||[]; const opened=openAlbums.includes(album.id); return <article key={'album-'+album.id} className="overflow-hidden rounded-[26px] border border-orange-400/30 bg-[#161017] shadow-lg"><div className="p-4"><p className="text-[10px] font-black uppercase tracking-widest text-orange-300">🛼 Álbum · {album.owner_name||'Punta Rollers'}</p><h3 className="mt-1 text-lg font-black text-white">{album.title}</h3><p className="mt-1 text-xs text-white/60">{photos.length} fotos · {album.created_at?new Date(album.created_at).toLocaleString('es-UY'):''}</p></div><div className="grid grid-cols-3 gap-1">{(opened?photos:photos.slice(0,3)).map((photo,index)=><button key={photo.id} type="button" onClick={()=>setViewer({album,index})} className="aspect-square overflow-hidden bg-black/30"><img src={photo.url} alt={'Foto '+(index+1)} loading="lazy" className="h-full w-full object-cover"/></button>)}</div>{photos.length>3&&<button type="button" onClick={()=>setOpenAlbums(ids=>opened?ids.filter(id=>id!==album.id):[...ids,album.id])} className="w-full border-t border-white/10 px-4 py-3 text-center text-sm font-bold text-orange-200">{opened?'Mostrar menos fotos ↑':'Ver las '+photos.length+' fotos acá ↓'}</button>}</article> }
      const post=entry.item;
      const name=[post.author?.nombre,post.author?.apellido].filter(Boolean).join(' ')||'Integrante PR'
      const reactions=Array.isArray(post.reactions)?post.reactions:[]
      const comments=Array.isArray(post.comments)?post.comments:[]
      const media=Array.isArray(post.media)?post.media:[]
      return <article key={post.id} className="relative isolate overflow-hidden rounded-[26px] border border-[#FF0055]/35 bg-[linear-gradient(140deg,#1c0b16,#0d0d13_60%)] shadow-[0_0_25px_rgba(255,0,85,.10)]">
        <div className="h-[2px] bg-gradient-to-r from-[#FF0055] via-[#FF7AAB] to-transparent"/>
        <div className="p-4"><Link to={(post.author?.id||post.author_id)?'/app/comunidad/perfil/'+(post.author?.id||post.author_id):'/app/comunidad'} className="flex items-center gap-3">{post.author?.foto?<img src={post.author.foto} alt="" className="h-10 w-10 rounded-full border border-[#FF0055]/40 object-cover"/>:<span className="grid h-10 w-10 place-items-center rounded-full bg-[#FF0055]/15 text-white">PR</span>}<div><p className="text-sm font-black text-white">{name}</p><p className="text-[10px] text-white/40">{post.created_at?new Date(post.created_at).toLocaleString('es-UY'):''}</p></div></Link>
        {post.body&&<p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-white/80">{post.body}</p>}</div>
        {media.length>0&&<div className={media.length===1?'grid grid-cols-1 gap-1 bg-black/25':'grid grid-cols-2 gap-1 bg-black/25'}>{media.map(photo=><a key={photo.id||photo.url} href={photo.url} target="_blank" rel="noreferrer" className="relative block overflow-hidden"><CommunityPhoto src={photo.url}/><span className="absolute bottom-2 right-2 rounded-full bg-black/75 px-2 py-1 text-[10px] text-white">⌕ Ampliar</span></a>)}</div>}
        <div className="space-y-3 p-4"><div className="flex flex-wrap gap-2">{OPTIONS.map(([key,emoji])=><button key={key} type="button" disabled={Boolean(busy)} onClick={()=>react(post,key)} className="rounded-full border border-[#FF0055]/25 bg-[#FF0055]/[.06] px-3 py-2 text-xs text-white disabled:opacity-40">{emoji} {reactions.filter(r=>r.reaction===key).length||0}</button>)}</div>
        {comments.length>0&&<div className="space-y-2">{comments.slice(expanded===post.id?0:-2).map(c=><p key={c.id} className="rounded-xl bg-white/[.035] px-3 py-2 text-[11px] text-white/65"><strong className="text-white/85">{c.nombre||c.name||c.author_name||'Alumno'}: </strong>{c.body}</p>)}{comments.length>2&&<button onClick={()=>setExpanded(expanded===post.id?null:post.id)} className="text-[10px] font-bold text-[#FF91B2]">{expanded===post.id?'Mostrar menos':'Ver todos los '+comments.length+' comentarios'}</button>}</div>}
        <form onSubmit={e=>{e.preventDefault();comment(post)}} className="flex gap-2"><input aria-label="Escribí un comentario" maxLength={1000} value={drafts[post.id]||''} onChange={e=>setDrafts(old=>({...old,[post.id]:e.target.value}))} placeholder="Comentá esta publicación…" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-xs text-white outline-none"/><button disabled={Boolean(busy)||!(drafts[post.id]||'').trim()} className="rounded-xl bg-[#FF0055] px-4 text-sm font-bold text-white disabled:opacity-40" aria-label="Publicar comentario">↑</button></form></div>
      </article>
    })}
    {viewer&&<div className="fixed inset-0 z-[250] flex flex-col bg-black/95" role="dialog" aria-modal="true" aria-label="Galería de fotos"><div className="flex items-center justify-between gap-3 px-4 py-4 text-white"><div><p className="text-sm font-bold">{viewer.album.title}</p><p className="text-xs text-white/60">{viewer.index+1} de {viewer.album.photos.length}</p></div><button type="button" onClick={()=>setViewer(null)} className="rounded-full bg-white/15 px-4 py-2 text-sm font-bold">Cerrar ✕</button></div><div className="flex min-h-0 flex-1 items-center justify-between gap-1 px-2"><button type="button" disabled={viewer.index===0} onClick={()=>setViewer(v=>({...v,index:v.index-1}))} className="rounded-full bg-white/15 px-3 py-3 text-xl text-white disabled:opacity-20">‹</button><img src={viewer.album.photos[viewer.index]?.url} alt="Foto ampliada" className="max-h-full min-w-0 flex-1 object-contain"/><button type="button" disabled={viewer.index===viewer.album.photos.length-1} onClick={()=>setViewer(v=>({...v,index:v.index+1}))} className="rounded-full bg-white/15 px-3 py-3 text-xl text-white disabled:opacity-20">›</button></div></div>}
  </section>
}
