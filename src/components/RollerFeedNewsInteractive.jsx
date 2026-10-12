import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function NewsInteractive({ item, uid, onImage }) {
  const [options,setOptions]=useState([])
  const [responses,setResponses]=useState([])
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  useEffect(()=>{
    if(item.kind!=='poll' && !(item.kind==='event' && item.allow_rsvp)) return
    let alive=true
    Promise.all([
      item.kind==='poll' ? supabase.from('pr_feed_news_options').select('id,label,sort_order').eq('news_id',item.id).order('sort_order') : Promise.resolve({data:[]}),
      supabase.from('pr_feed_news_responses').select('voter_uid,option_id,attending').eq('news_id',item.id)
    ]).then(([a,b])=>{if(alive){setOptions(a.data||[]);setResponses(b.data||[]);if(a.error||b.error)setError('No se pudieron cargar las participaciones.')}})
    return()=>{alive=false}
  },[item.id,item.kind,item.allow_rsvp])
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
    }
    setBusy(false)
  }
  return <article className="overflow-hidden rounded-[22px] border border-white/10 bg-white/[.035]">
    {item.image_url && <button type="button" onClick={()=>onImage(item.image_url,item.title)} aria-label={'Ampliar imagen de '+item.title} className="flex w-full justify-center bg-black/30 p-2"><img src={item.image_url} alt={item.title} loading="lazy" className="max-h-64 max-w-full rounded-lg object-contain"/></button>}
    <div className="p-4">
      <p className="text-[9px] font-black uppercase tracking-[.15em] text-[#BBFF1F]">{item.kind==='poll'?'Votación':item.kind==='event'?'Evento':'Novedad'}</p>
      <h3 className="mt-1 font-bold text-white">{item.title}</h3>
      {item.body && <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-white/65">{item.body}</p>}
      {item.event_at && <p className="mt-3 text-[11px] font-bold text-[#BBFF1F]">{new Date(item.event_at).toLocaleString('es-UY',{dateStyle:'long',timeStyle:'short'})}</p>}
      {item.kind==='event' && item.allow_rsvp && <div className="mt-4"><button disabled={!uid||busy} onClick={()=>respond(null)} aria-pressed={Boolean(own)} className={`rounded-xl border px-4 py-2 text-xs font-bold disabled:opacity-40 ${own?'border-[#BBFF1F] bg-[#BBFF1F] text-black':'border-[#BBFF1F]/35 text-[#BBFF1F]'}`}>{own?'✓ Asistiré · cancelar':'Asistir'}</button><p className="mt-2 text-xs text-white/50">{responses.length} {responses.length===1?'persona confirmó':'personas confirmaron'} asistencia</p></div>}
      {item.kind==='poll' && <div className="mt-4 space-y-2">{options.map(o=>{const count=responses.filter(r=>r.option_id===o.id).length;return <button key={o.id} type="button" disabled={!uid||busy} onClick={()=>respond(o.id)} className={`w-full rounded-xl border p-3 text-left text-xs disabled:opacity-50 ${own?.option_id===o.id?'border-[#BBFF1F] bg-[#BBFF1F]/10 text-[#BBFF1F]':'border-white/15 bg-black/25 text-white/75'}`}><span className="flex justify-between gap-2"><span>{o.label}</span><span>{count} votos</span></span><span className="mt-2 block h-1 overflow-hidden rounded-full bg-white/10"><span className="block h-full rounded-full bg-[#BBFF1F]/70" style={{width:`${responses.length?count/responses.length*100:0}%`}}/></span></button>})}<p className="text-[11px] text-white/45">{responses.length} votos · {own?'Tu voto quedó registrado':'Elegí una opción para votar'}</p></div>}
      {error && <p role="alert" className="mt-2 text-xs text-amber-200">{error}</p>}
      {!uid && (item.kind==='poll'||item.allow_rsvp) && <p className="mt-2 text-xs text-white/40">Iniciá sesión para participar.</p>}
    </div>
  </article>
}
