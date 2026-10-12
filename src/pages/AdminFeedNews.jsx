import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

export default function AdminFeedNews() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [image, setImage] = useState('')
  const [eventAt, setEventAt] = useState('')
  const [published, setPublished] = useState(false)
  const [busy, setBusy] = useState(false)
  const [editingId, setEditingId] = useState('')
  const [notice, setNotice] = useState('')
  const [loadError, setLoadError] = useState(false)
  const [preview, setPreview] = useState(false)
  const [kind, setKind] = useState('news')
  const [allowRsvp, setAllowRsvp] = useState(false)
  const [options, setOptions] = useState(['',''])
  const [uploading, setUploading] = useState(false)
  async function load() {
    const { data, error } = await supabase.from('pr_feed_news').select('*').order('created_at', { ascending: false })
    setLoadError(Boolean(error))
    if (error) setNotice('No se pudieron cargar las novedades.')
    else { setItems(data || []) }
  }
  useEffect(() => { if (user?.role === 'admin') load() }, [user?.role])
  async function uploadImage(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) { setNotice('Elegí una imagen JPG, PNG o WebP de hasta 5 MB.'); return }
    setUploading(true)
    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
    const path = `${crypto.randomUUID()}.${ext}`
    const result = await supabase.storage.from('pr-feed-news-beta').upload(path,file,{contentType:file.type,upsert:false})
    if (result.error) setNotice('No se pudo subir la imagen. Comprobá los permisos de la cuenta Beta.')
    else { const {data} = supabase.storage.from('pr-feed-news-beta').getPublicUrl(path);setImage(data.publicUrl);setNotice('Imagen subida correctamente.') }
    setUploading(false)
    e.target.value = ''
  }
  async function create(e) {
    e.preventDefault()
    if (busy || uploading || !title.trim()) return
    const labels = options.map(x=>x.trim()).filter(Boolean)
    if (kind === 'poll' && (labels.length < 2 || new Set(labels.map(x=>x.toLowerCase())).size !== labels.length)) { setNotice('La votación necesita al menos dos opciones diferentes.'); return }
    setBusy(true)
    const payload = { title: title.trim(), body: body.trim(), image_url: image.trim() || null, event_at: eventAt ? new Date(eventAt).toISOString() : null, published: kind === 'poll' ? false : published, kind, allow_rsvp: kind === 'event' && allowRsvp }
    const result = editingId
      ? await supabase.from('pr_feed_news').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editingId).select('id').single()
      : await supabase.from('pr_feed_news').insert(payload).select('id').single()
    let error = result.error
    if (!error && kind === 'poll') {
      const newsId = result.data.id
      const oldOptions = editingId ? await supabase.from('pr_feed_news_options').select('id').eq('news_id',newsId) : {data:[]}
      if (oldOptions.error) error = oldOptions.error
      if (!error && oldOptions.data?.length) {
        const used = await supabase.from('pr_feed_news_responses').select('news_id').eq('news_id',newsId).limit(1)
        if (used.error) error = used.error
        else if (used.data?.length) {
          const existing = await supabase.from('pr_feed_news_options').select('label').eq('news_id',newsId).order('sort_order')
          if (existing.error) error = existing.error
          else if (JSON.stringify((existing.data||[]).map(x=>x.label)) !== JSON.stringify(labels)) error = {message:'Esta encuesta ya tiene votos. Podés editar el texto, pero no cambiar sus opciones.'}
          else { if (published) { const pub=await supabase.from('pr_feed_news').update({published:true}).eq('id',newsId);error=pub.error }; if (!error) { setBusy(false);setEditingId('');setKind('news');setOptions(['','']);setTitle('');setBody('');setImage('');setEventAt('');setPublished(false);setNotice('Encuesta actualizada sin alterar los votos.');await load();return } }
        }
        else { const removed = await supabase.from('pr_feed_news_options').delete().eq('news_id',newsId);error = removed.error }
      }
      if (!error) { const inserted = await supabase.from('pr_feed_news_options').insert(labels.map((label,i)=>({news_id:newsId,label,sort_order:i})));error=inserted.error }
      if (!error && published) { const publishedResult=await supabase.from('pr_feed_news').update({published:true}).eq('id',newsId);error=publishedResult.error }
    }
    if (error) setNotice('No se pudo completar la publicación. ' + (error.message || 'Verificá tus permisos.'))
    else { setTitle(''); setBody(''); setImage(''); setEventAt(''); setPublished(false); setEditingId(''); setKind('news'); setAllowRsvp(false); setOptions(['','']); setNotice('Novedad guardada.'); await load() }
    setBusy(false)
  }
  async function edit(item) { setEditingId(item.id); setTitle(item.title || ''); setBody(item.body || ''); setImage(item.image_url || ''); setEventAt(item.event_at ? new Date(new Date(item.event_at).getTime() - new Date(item.event_at).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''); setPublished(Boolean(item.published));setKind(item.kind || 'news');setAllowRsvp(Boolean(item.allow_rsvp)); if(item.kind==='poll'){const {data}=await supabase.from('pr_feed_news_options').select('label').eq('news_id',item.id).order('sort_order');setOptions((data||[]).map(x=>x.label))}else setOptions(['','']); setNotice('Editando novedad.'); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  function cancelEdit() { setEditingId(''); setKind('news'); setAllowRsvp(false); setOptions(['','']); setTitle(''); setBody(''); setImage(''); setEventAt(''); setPublished(false); setNotice('Edición cancelada.') }
  async function toggle(item) {
    const { error } = await supabase.from('pr_feed_news').update({ published: !item.published, updated_at: new Date().toISOString() }).eq('id', item.id)
    if (error) setNotice('No se pudo cambiar el estado de la publicación.')
    else { setNotice('Estado actualizado.'); await load() }
  }
  const publishedCount = items.filter(item => item.published).length
  if (user?.role !== 'admin') return <AppLayout title="Novedades"><p className="p-6 text-white/60">Acceso reservado a administración.</p></AppLayout>
  return <AppLayout title="Novedades · Admin" showBack><div className="pr-page space-y-5 pb-16"><header className="rounded-[28px] border border-[#FF0055]/25 bg-[#0D0303] p-5"><p className="text-[10px] font-bold uppercase tracking-widest text-[#FF0055]">Centro de control</p><h1 className="mt-2 font-display text-4xl text-white">Novedades.</h1><p className="mt-2 text-sm text-white/55">Creá recordatorios, anuncios y eventos para RollerFeed. Solo las publicaciones activas son visibles para los alumnos.</p></header><div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[.025] px-4 py-3"><p className="text-xs text-white/60"><span className="font-bold text-[#BBFF1F]">{publishedCount}</span> publicadas · <span className="font-bold text-white">{items.length - publishedCount}</span> borradores</p><Link to="/app/actividad#rollerfeed-novedades" className="rounded-xl border border-[#BBFF1F]/30 px-3 py-2 text-xs font-bold text-[#BBFF1F]">Ver en RollerFeed ↗</Link></div><form onSubmit={create} className="space-y-3 rounded-[26px] border border-white/10 bg-white/[.025] p-4"><label className="block text-xs text-white/70">Tipo de publicación<select value={kind} onChange={e=>setKind(e.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-[#151515] p-3 text-white"><option value="news">Noticia o anuncio</option><option value="event">Evento o actividad</option><option value="poll">Encuesta / votación</option></select></label><label className="block text-xs text-white/70">Título<input required maxLength={180} value={title} onChange={e=>setTitle(e.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 p-3 text-white" /></label><label className="block text-xs text-white/70">Contenido<textarea value={body} onChange={e=>setBody(e.target.value)} rows={4} className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 p-3 text-white" /></label><label className="block text-xs text-white/70">Subir imagen (JPG, PNG o WebP, máximo 5 MB)<input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadImage} disabled={uploading} className="mt-2 block w-full rounded-xl border border-white/15 bg-black/40 p-3 text-white file:mr-3 file:rounded-lg file:border-0 file:bg-[#BBFF1F] file:px-3 file:py-2 file:font-bold file:text-black" /></label>{uploading && <p role="status" className="text-xs text-[#BBFF1F]">Subiendo imagen…</p>}{image && <img src={image} alt="Vista previa de la imagen" className="mx-auto max-h-60 max-w-full rounded-xl object-contain" />}<label className="block text-xs text-white/70">URL de imagen (opcional)<input type="url" value={image} onChange={e=>setImage(e.target.value)} placeholder="https://…" className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 p-3 text-white" /></label>{kind === 'event' && <label className="flex items-center gap-2 text-sm text-white/70"><input type="checkbox" checked={allowRsvp} onChange={e=>setAllowRsvp(e.target.checked)} /> Habilitar botón «Asistir» para alumnos</label>}{kind === 'poll' && <fieldset className="space-y-2 rounded-xl border border-white/10 p-3"><legend className="px-2 text-xs text-white/70">Opciones de la votación</legend>{options.map((option,i)=><label key={i} className="block text-xs text-white/55">Opción {i+1}<input maxLength={100} value={option} onChange={e=>setOptions(current=>current.map((v,j)=>j===i?e.target.value:v))} className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 p-2 text-white" /></label>)}<button type="button" onClick={()=>setOptions(v=>[...v,''])} className="rounded-lg border border-[#BBFF1F]/30 px-3 py-2 text-xs text-[#BBFF1F]">+ Agregar opción</button>{options.length>2 && <button type="button" onClick={()=>setOptions(v=>v.slice(0,-1))} className="ml-2 rounded-lg border border-white/15 px-3 py-2 text-xs text-white/60">Quitar última</button>}</fieldset>}<fieldset className="rounded-xl border border-white/10 p-3"><legend className="px-2 text-xs text-white/70">Fecha y hora del evento (opcional)</legend><div className="grid grid-cols-2 gap-3"><label className="block text-xs text-white/65">Fecha<input type="date" value={eventAt.slice(0,10)} onChange={e=>setEventAt(e.target.value ? e.target.value+'T'+(eventAt.slice(11,16)||'18:00') : '')} className="mt-2 w-full min-w-0 rounded-xl border border-white/15 bg-black/40 p-2.5 text-white [color-scheme:dark]" /></label><label className="block text-xs text-white/65">Hora<input type="time" value={eventAt.slice(11,16)} disabled={!eventAt} onChange={e=>setEventAt(eventAt.slice(0,10)+'T'+e.target.value)} className="mt-2 w-full min-w-0 rounded-xl border border-white/15 bg-black/40 p-2.5 text-white [color-scheme:dark]" /></label></div><p className="mt-2 text-[11px] text-white/40">Tocá la fecha para abrir el calendario del teléfono.</p></fieldset><label className="flex items-center gap-2 text-sm text-white/70"><input type="checkbox" checked={published} onChange={e=>setPublished(e.target.checked)} /> Publicar ahora</label><button disabled={busy || uploading} className="w-full rounded-xl bg-[#BBFF1F] px-4 py-3 font-bold text-[#0D0303] disabled:opacity-50">{busy?'Guardando…':editingId?'Guardar cambios':'Guardar novedad'}</button><button type="button" onClick={() => setPreview(value => !value)} className="w-full rounded-xl border border-white/15 px-4 py-2.5 text-xs font-bold text-white/70">{preview ? 'Ocultar vista previa' : 'Vista previa de la tarjeta'}</button>{preview && <div className="rounded-[22px] border border-white/10 bg-[#111013] p-4"><p className="text-[10px] font-black uppercase tracking-[.15em] text-[#BBFF1F]">Así se verá en RollerFeed · {published ? 'Publicación' : 'Borrador'}</p><h3 className="mt-2 break-words text-lg font-bold text-white">{title.trim() || 'Título de la novedad'}</h3>{body.trim() && <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-white/65">{body.trim()}</p>}{image.trim() && <p className="mt-2 break-all text-[11px] text-white/40">Imagen: {image.trim()}</p>}{eventAt && <p className="mt-2 text-xs text-[#BBFF1F]">Evento: {new Date(eventAt).toLocaleString('es-UY')}</p>}</div>}{editingId&&<button type="button" onClick={cancelEdit} className="w-full rounded-xl border border-white/15 px-4 py-2.5 text-xs text-white/65">Cancelar edición</button>}</form>{notice&&<p role="status" className="text-xs text-white/70">{notice}</p>}<section className="space-y-3"><h2 className="font-display text-2xl text-white">Publicaciones</h2>{loadError && <div role="alert" className="rounded-xl border border-amber-400/25 p-3 text-sm text-amber-200">No se pudo consultar la lista. <button type="button" onClick={load} className="ml-2 font-bold underline">Reintentar</button></div>}{!loadError && !items.length && <p className="rounded-xl border border-white/10 p-4 text-sm text-white/50">Todavía no hay novedades guardadas.</p>}{items.map(item=><article key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[.03] p-4"><div className="min-w-0"><p className="truncate font-bold text-white">{item.title}</p><p className="mt-1 text-xs text-white/45">{item.published?'Publicada':'Borrador'}</p></div><div className="flex shrink-0 gap-2"><button onClick={()=>edit(item)} className="rounded-xl border border-white/15 px-3 py-2 text-xs font-bold text-white/75">Editar</button><button onClick={()=>toggle(item)} className="rounded-xl border border-[#FF0055]/35 px-3 py-2 text-xs font-bold text-[#FF77A3]">{item.published?'Ocultar':'Publicar'}</button></div></article>)}</section></div></AppLayout>
}
