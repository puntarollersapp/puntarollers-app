import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const blank = {id:'',title:'',body:'',image_url:'',event_at:'',kind:'news',allow_rsvp:false,published:false,options:''}
const input = 'w-full rounded-xl border border-white/15 bg-black/30 px-3 py-3 text-sm text-white outline-none focus:border-[#FF0055]'

export default function RollerFeedNewsAdmin() {
  const [items,setItems] = useState([])
  const [form,setForm] = useState(blank)
  const [busy,setBusy] = useState(false)
  const [message,setMessage] = useState('')
  const [expanded,setExpanded] = useState(false)

  async function load() {
    const {data,error} = await supabase.from('pr_feed_news').select('*').order('created_at',{ascending:false}).limit(100)
    if(error) {setMessage('No se pudieron cargar las novedades: '+error.message);return}
    setItems(data||[])
  }
  useEffect(()=>{load()},[])
  async function edit(item) {
    setMessage('')
    let options=''
    if(item.kind==='poll') {
      const {data,error}=await supabase.from('pr_feed_news_options').select('label').eq('news_id',item.id).order('sort_order')
      if(error){setMessage(error.message);return}
      options=(data||[]).map(x=>x.label).join('\n')
    }
    setForm({...item,event_at:item.event_at?new Date(item.event_at).toISOString().slice(0,16):'',image_url:item.image_url||'',options})
    setExpanded(true)
  }
  async function save(e) {
    e.preventDefault()
    if(busy)return
    setBusy(true);setMessage('')
    try {
      const labels=form.kind==='poll'?form.options.split('\n').map(s=>s.trim()).filter(Boolean):[]
      if(form.kind==='poll' && labels.length<2)throw Error('Una encuesta necesita al menos dos opciones.')
      if(form.id && form.kind==='poll'){
        const {data:existing,error:existingError}=await supabase.from('pr_feed_news_responses').select('voter_uid').eq('news_id',form.id).limit(1)
        if(existingError)throw Error(existingError.message)
        if(existing?.length){
          const {data:previous,error:optionsError}=await supabase.from('pr_feed_news_options').select('label').eq('news_id',form.id).order('sort_order')
          if(optionsError)throw Error(optionsError.message)
          if(JSON.stringify((previous||[]).map(o=>o.label))!==JSON.stringify(labels))throw Error('No podés modificar las opciones de una encuesta que ya recibió votos.')
        }
      }
      const payload={title:form.title.trim(),body:form.body.trim(),image_url:form.image_url.trim()||null,event_at:form.event_at?new Date(form.event_at).toISOString():null,kind:form.kind,allow_rsvp:form.kind==='event'&&form.allow_rsvp,published:form.published,updated_at:new Date().toISOString()}
      if(!payload.title)throw Error('Escribí un título.')
      const request=form.id?supabase.from('pr_feed_news').update(payload).eq('id',form.id).select('id').single():supabase.from('pr_feed_news').insert(payload).select('id').single()
      const {data,error}=await request
      if(error)throw Error(error.message)
      if(form.kind==='poll'){
        const {error:optionsError}=await supabase.rpc('pr_feed_save_news_poll_options',{p_news_id:data.id,p_labels:labels})
        if(optionsError)throw Error(optionsError.message)
      }
      setMessage('Publicación guardada correctamente.')
      setForm(blank);setExpanded(false);await load()
    } catch(err){setMessage(err.message||'No se pudo guardar.')}
    finally{setBusy(false)}
  }
  async function toggle(item) {
    setBusy(true);setMessage('')
    const {error}=await supabase.from('pr_feed_news').update({published:!item.published,updated_at:new Date().toISOString()}).eq('id',item.id)
    if(error)setMessage(error.message);else await load()
    setBusy(false)
  }
  return <section className="space-y-4 rounded-3xl border border-[#FF0055]/20 bg-white/[.035] p-4 sm:p-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-[#FF0055]">RollerFeed · Administración</p><h2 className="mt-1 text-2xl font-black text-white">Novedades y participación</h2><p className="mt-1 text-xs text-white/50">Noticias, eventos con asistencia y encuestas de la comunidad.</p></div><button type="button" onClick={()=>{setForm(blank);setExpanded(v=>!v)}} className="rounded-xl bg-[#FF0055] px-4 py-3 text-xs font-black text-white">{expanded?'Cerrar':'＋ Crear publicación'}</button></div>
    {expanded&&<form onSubmit={save} className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4">
      <label className="block space-y-1 text-xs text-white/70">Tipo<select className={input} value={form.kind} onChange={e=>setForm({...form,kind:e.target.value})}><option value="news">Novedad</option><option value="event">Evento</option><option value="poll">Encuesta</option></select></label>
      <label className="block space-y-1 text-xs text-white/70">Título<input className={input} required value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label>
      <label className="block space-y-1 text-xs text-white/70">Descripción<textarea className={input} rows={4} value={form.body} onChange={e=>setForm({...form,body:e.target.value})}/></label>
      <label className="block space-y-1 text-xs text-white/70">URL de imagen (opcional)<input className={input} type="url" placeholder="https://..." value={form.image_url} onChange={e=>setForm({...form,image_url:e.target.value})}/></label>
      {form.kind==='event'&&<><label className="block space-y-1 text-xs text-white/70">Fecha y hora<input className={input} type="datetime-local" value={form.event_at} onChange={e=>setForm({...form,event_at:e.target.value})}/></label><label className="flex items-center gap-2 text-xs text-white/80"><input type="checkbox" checked={form.allow_rsvp} onChange={e=>setForm({...form,allow_rsvp:e.target.checked})}/> Permitir confirmar asistencia</label></>}
      {form.kind==='poll'&&<label className="block space-y-1 text-xs text-white/70">Opciones (una por línea)<textarea className={input} rows={4} value={form.options} onChange={e=>setForm({...form,options:e.target.value})} placeholder={'Sí\nNo\nQuizás'}/></label>}
      <label className="flex items-center gap-2 text-xs text-white/80"><input type="checkbox" checked={form.published} onChange={e=>setForm({...form,published:e.target.checked})}/> Publicar inmediatamente</label>
      <button disabled={busy} className="w-full rounded-xl bg-[#FF0055] px-4 py-3 text-xs font-black text-white disabled:opacity-50">{busy?'Guardando…':'Guardar publicación'}</button>
    </form>}
    {message&&<p role="status" className="rounded-xl border border-white/10 p-3 text-xs text-white/75">{message}</p>}
    <div className="space-y-2">{items.length?items.map(item=><article key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 p-3"><div className="min-w-0 flex-1"><p className="text-sm font-bold text-white">{item.title}</p><p className="mt-1 text-[10px] text-white/50">{item.kind==='event'?'Evento':item.kind==='poll'?'Encuesta':'Novedad'} · {item.published?'Publicado':'Borrador'}</p></div><div className="flex gap-2"><button type="button" disabled={busy} onClick={()=>edit(item)} className="rounded-lg border border-white/15 px-3 py-2 text-xs text-white">Editar</button><button type="button" disabled={busy} onClick={()=>toggle(item)} className="rounded-lg border border-[#FF0055]/35 px-3 py-2 text-xs font-bold text-[#FF0055]">{item.published?'Retirar':'Publicar'}</button></div></article>):<p className="text-xs text-white/45">Todavía no hay publicaciones. Creá la primera desde acá.</p>}</div>
  </section>
}
