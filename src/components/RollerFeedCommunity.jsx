import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import CommunityPhoto from './community/CommunityPhoto'

const OPTIONS = [['heart','❤️'],['fire','🔥'],['skate','🛼'],['clap','👏']]

export default function RollerFeedCommunity({ initialPosts = [] }) {
  const [posts,setPosts] = useState(initialPosts)
  const [drafts,setDrafts] = useState({})
  const [busy,setBusy] = useState('')
  const [error,setError] = useState('')
  const [expanded,setExpanded] = useState(null)
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
  const latest=[...posts].filter(p=>p?.id).sort((a,b)=>Date.parse(b.created_at||0)-Date.parse(a.created_at||0)).slice(0,5)
  return <section id="rollerfeed-comunidad" className="scroll-mt-36 space-y-3">
    <div className="flex items-end justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-[#FF6694]">PR Social · novedades de alumnos</p><h2 className="mt-1 font-display text-[30px] text-white">Nuestra comunidad<span className="text-[#FF0055]">.</span></h2><p className="mt-1 text-xs text-white/45">Lo último que comparten los alumnos.</p></div><Link to="/app/comunidad" className="shrink-0 rounded-xl border border-[#FF0055]/30 px-3 py-2 text-[10px] font-bold text-[#FF91B2]">Ver comunidad →</Link></div>
    {error&&<p role="alert" className="rounded-xl border border-red-400/30 p-3 text-xs text-red-200">{error}</p>}
    {!latest.length&&!error&&<p className="rounded-2xl border border-white/10 p-5 text-center text-xs text-white/50">Todavía no hay publicaciones para mostrar.</p>}
    {latest.map(post=>{
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
  </section>
}
