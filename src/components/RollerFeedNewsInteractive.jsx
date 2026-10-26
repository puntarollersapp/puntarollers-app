import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function NewsInteractive({ item, uid, onImage }) {
  const [options,setOptions]=useState([])
  const [responses,setResponses]=useState([])
  const [attendeeAvatars,setAttendeeAvatars]=useState([])
  const [busy,setBusy]=useState(false)
  const [reactions,setReactions]=useState([])
  const [comments,setComments]=useState([])
  const [people,setPeople]=useState([])
  const [draft,setDraft]=useState('')
  const [error,setError]=useState('')
  useEffect(()=>{
    if(item.kind!=='poll' && !(item.kind==='event' && item.allow_rsvp)) return
    let alive=true
    Promise.all([
      item.kind==='poll' ? supabase.from('pr_feed_news_options').select('id,label,sort_order').eq('news_id',item.id).order('sort_order') : Promise.resolve({data:[]}),
      supabase.from('pr_feed_news_responses').select('voter_uid,option_id,attending').eq('news_id',item.id),
      item.kind==='event' && item.allow_rsvp ? supabase.rpc('pr_feed_news_attendee_avatars',{p_news_id:item.id}) : Promise.resolve({data:[]})
    ]).then(([a,b,c])=>{if(alive){setOptions(a.data||[]);setResponses(b.data||[]);setAttendeeAvatars(c.data||[]);if(a.error||b.error)setError('No se pudieron cargar las participaciones.')}})
    return()=>{alive=false}
  },[item.id,item.kind,item.allow_rsvp])
  async function refreshSocial(){
    const [a,b,p]=await Promise.all([
      supabase.from('pr_feed_news_reactions').select('user_id,emoji').eq('news_id',item.id),
      supabase.from('pr_feed_news_comments').select('id,user_id,body,created_at').eq('news_id',item.id).order('created_at',{ascending:true}),
      supabase.rpc('pr_feed_news_comment_people',{p_news_id:item.id})
    ])
    if(!a.error)setReactions(a.data||[])
    if(!b.error)setComments(b.data||[])
    if(!p.error)setPeople(p.data||[])
  }
  useEffect(()=>{refreshSocial()},[item.id])
  async function react(emoji){
    if(!uid||busy)return
    setBusy(true);setError('')
    const ownReaction=reactions.find(r=>r.user_id===uid)
    const result=ownReaction?.emoji===emoji?await supabase.from('pr_feed_news_reactions').delete().eq('news_id',item.id).eq('user_id',uid):await supabase.from('pr_feed_news_reactions').upsert({news_id:item.id,user_id:uid,emoji},{onConflict:'news_id,user_id'})
    if(result.error)setError('No se pudo registrar la reacción.')
    else await refreshSocial()
    setBusy(false)
  }
  async function sendComment(e){
    e.preventDefault()
    if(!uid||busy||!draft.trim())return
    setBusy(true);setError('')
    const {error}=await supabase.from('pr_feed_news_comments').insert({news_id:item.id,user_id:uid,body:draft.trim()})
    if(error)setError('No se pudo publicar el comentario.')
    else {setDraft('');await refreshSocial()}
    setBusy(false)
  }
  async function deleteComment(comment){
    if(busy)return
    setBusy(true)
    const {error}=await supabase.from('pr_feed_news_comments').delete().eq('id',comment.id)
    if(error)setError('No se pudo eliminar el comentario.')
    else await refreshSocial()
    setBusy(false)
  }
  const own=responses.find(r=>r.voter_uid===uid)
  async function respond(optionId) {
    if(!uid||busy)return
    setBusy(true);setError('')
    const payload={news_id:item.id,voter_uid:uid,option_id:optionId,attending:optionId?null:true}
    const result=own && item.kind==='event'
      ? await supabase.from('pr_feed_news_responses').delete().eq('news_id',item.id).eq('voter_uid',uid)
      : await supabase.from('pr_feed_news_responses').upsert(payload,{onConflict:'news_id,voter_uid'})
    if(result.error)setError('No se pudo guardar tu respuesta. Probá nuevamente.')
    else {
      const {data,error:readError}=await supabase.from('pr_feed_news_responses').select('voter_uid,option_id,attending').eq('news_id',item.id)
      if(!readError)setResponses(data||[])
      if(item.kind==='event') {const {data:avatars}=await supabase.rpc('pr_feed_news_attendee_avatars',{p_news_id:item.id});setAttendeeAvatars(avatars||[])}
    }
    setBusy(false)
  }
  return <article className="overflow-hidden rounded-[22px] border border-white/10 bg-white/[.035]">
    {(item.image_urls?.length?item.image_urls:(item.image_url?[item.image_url]:[])).length>0&&<div className="flex snap-x gap-2 overflow-x-auto bg-black/30 p-2">{(item.image_urls?.length?item.image_urls:[item.image_url]).map((url,i)=><button key={i} type="button" onClick={()=>onImage(url,item.title+' · '+(i+1))} className="min-w-[80%] snap-center sm:min-w-[55%]"><img src={url} alt={item.title+' · imagen '+(i+1)} loading="lazy" className="h-56 w-full rounded-xl object-contain"/></button>)}</div>}
    <div className="p-4">
      <p className="text-[9px] font-black uppercase tracking-[.15em] text-[#BBFF1F]">{item.kind==='poll'?'Votación':item.kind==='event'?'Evento':'Novedad'}</p>
      <h3 className="mt-1 font-bold text-white">{item.title}</h3>
      {item.body && <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-white/65">{item.body}</p>}
      {item.event_at && <p className="mt-3 text-[11px] font-bold text-[#BBFF1F]">{new Date(item.event_at).toLocaleString('es-UY',{dateStyle:'long',timeStyle:'short'})}</p>}
      {item.kind==='event' && item.allow_rsvp && <div className="mt-4"><button disabled={!uid||busy} onClick={()=>respond(null)} aria-pressed={Boolean(own)} className={`rounded-xl border px-4 py-2 text-xs font-bold disabled:opacity-40 ${own?'border-[#BBFF1F] bg-[#BBFF1F] text-black':'border-[#BBFF1F]/35 text-[#BBFF1F]'}`}>{own?'✓ Asistiré · cancelar':'Asistir'}</button><p className="mt-2 text-xs text-white/50">{responses.length} {responses.length===1?'persona confirmó':'personas confirmaron'} asistencia</p>{attendeeAvatars.length>0 && <div className="mt-2 flex items-center gap-2" aria-label="Asistentes con foto de perfil visible"><div className="flex -space-x-2">{attendeeAvatars.map((person,index)=><img key={index} src={person.photo_url} alt={person.display_name||'Asistente'} title={person.display_name||'Asistente'} loading="lazy" className="h-8 w-8 rounded-full border-2 border-[#0D0303] bg-white/10 object-cover" />)}</div><span className="text-[10px] text-white/45">Asistentes</span></div>}</div>}
      {item.kind==='poll' && <div className="mt-4 space-y-2">{options.map(o=>{const count=responses.filter(r=>r.option_id===o.id).length;return <button key={o.id} type="button" disabled={!uid||busy} onClick={()=>respond(o.id)} className={`w-full rounded-xl border p-3 text-left text-xs disabled:opacity-50 ${own?.option_id===o.id?'border-[#BBFF1F] bg-[#BBFF1F]/10 text-[#BBFF1F]':'border-white/15 bg-black/25 text-white/75'}`}><span className="flex justify-between gap-2"><span>{o.label}</span><span>{count} votos</span></span><span className="mt-2 block h-1 overflow-hidden rounded-full bg-white/10"><span className="block h-full rounded-full bg-[#BBFF1F]/70" style={{width:`${responses.length?count/responses.length*100:0}%`}}/></span></button>})}<p className="text-[11px] text-white/45">{responses.length} votos · {own?'Tu voto quedó registrado':'Elegí una opción para votar'}</p></div>}
      <div className="mt-4 border-t border-white/10 pt-3"><div className="flex flex-wrap gap-2">{['❤️','👏','🔥','😍','🙌'].map(emoji=><button key={emoji} type="button" disabled={!uid||busy} onClick={()=>react(emoji)} aria-pressed={reactions.some(r=>r.user_id===uid&&r.emoji===emoji)} className={'rounded-full border px-3 py-2 text-xs disabled:opacity-40 '+(reactions.some(r=>r.user_id===uid&&r.emoji===emoji)?'border-[#FF0055] bg-[#FF0055]/20':'border-white/15')}>{emoji} {reactions.filter(r=>r.emoji===emoji).length}</button>)}</div>
      <p className="mt-4 text-xs font-bold text-white/80">Comentarios ({comments.length})</p>
      <div className="mt-2 max-h-72 space-y-3 overflow-y-auto">{comments.map(comment=>{const person=people.find(p=>p.comment_id===comment.id);return <div key={comment.id} className="flex gap-2">{person?.photo_url?<img src={person.photo_url} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover"/>:<div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 text-xs">👤</div>}<div className="min-w-0 flex-1"><p className="text-[11px] font-bold text-white">{person?.display_name||'Alumno'}</p><p className="whitespace-pre-wrap break-words text-xs text-white/65">{comment.body}</p></div>{uid===comment.user_id&&<button type="button" disabled={busy} onClick={()=>deleteComment(comment)} className="text-[10px] text-red-300">Eliminar</button>}</div>})}</div>
      {uid&&<form onSubmit={sendComment} className="mt-3 flex gap-2"><input maxLength={1000} value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Escribí un comentario…" aria-label="Comentario" className="min-w-0 flex-1 rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-xs text-white"/><button disabled={busy||!draft.trim()} className="rounded-xl bg-[#FF0055] px-3 py-2 text-xs font-bold text-white disabled:opacity-40">Enviar</button></form>}
      </div>
      {error && <p role="alert" className="mt-2 text-xs text-amber-200">{error}</p>}
      {!uid && (item.kind==='poll'||item.allow_rsvp) && <p className="mt-2 text-xs text-white/40">Iniciá sesión para participar.</p>}
    </div>
  </article>
}
